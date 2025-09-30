import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/adminAuth';
import { getSecurityAlerts, resolveAlert, createAlert } from '@/lib/admin/alerts';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await verifyAdminAccess(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved');

    // Fetch security alerts
    const result = await getSecurityAlerts({
      page,
      limit,
      severity: severity as any,
      type: type as any,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Admin alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await verifyAdminAccess(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, alertId, type, severity, title, description, userId, groupId } = body;

    switch (action) {
      case 'resolve':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }

        // Resolve alert
        await resolveAlert(alertId, {
          resolvedBy: adminUser.id,
          resolvedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully',
        });

      case 'create':
        if (!type || !severity || !title || !description) {
          return NextResponse.json(
            { error: 'Type, severity, title, and description are required' },
            { status: 400 }
          );
        }

        // Create new alert
        const newAlert = await createAlert({
          type,
          severity,
          title,
          description,
          userId,
          groupId,
          createdBy: adminUser.id,
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: newAlert,
          message: 'Alert created successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin alert action error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}