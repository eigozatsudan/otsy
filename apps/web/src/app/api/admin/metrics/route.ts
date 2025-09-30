import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/adminAuth';
import { getSystemMetrics } from '@/lib/admin/metrics';

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
    const timeRange = searchParams.get('timeRange') || '24h';

    // Fetch system metrics
    const metrics = await getSystemMetrics(timeRange);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
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
    const { action, target } = body;

    switch (action) {
      case 'refresh_metrics':
        // Trigger metrics refresh
        const refreshedMetrics = await getSystemMetrics('24h', true);
        return NextResponse.json({
          success: true,
          data: refreshedMetrics,
        });

      case 'export_metrics':
        // Generate metrics export
        const exportData = await getSystemMetrics(target.timeRange || '24h');
        return NextResponse.json({
          success: true,
          data: {
            exportUrl: `/api/admin/export/metrics?timeRange=${target.timeRange}`,
            generatedAt: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin metrics action error:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics action' },
      { status: 500 }
    );
  }
}