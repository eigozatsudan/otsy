import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/adminAuth';
import { getUserActivities, suspendUser, getUserById } from '@/lib/admin/users';

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
    const sortBy = searchParams.get('sortBy') || 'risk';
    const filterRisk = searchParams.get('filterRisk');
    const search = searchParams.get('search');

    // Fetch user activities
    const result = await getUserActivities({
      page,
      limit,
      sortBy,
      filterRisk: filterRisk ? parseInt(filterRisk) : undefined,
      search,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activities' },
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
    const { action, userId, reason, duration } = body;

    switch (action) {
      case 'suspend':
        if (!userId || !reason) {
          return NextResponse.json(
            { error: 'User ID and reason are required' },
            { status: 400 }
          );
        }

        // Verify user exists
        const user = await getUserById(userId);
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Suspend user
        await suspendUser(userId, {
          reason,
          duration: duration || null,
          suspendedBy: adminUser.id,
          suspendedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'User suspended successfully',
        });

      case 'unsuspend':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // Unsuspend user
        await suspendUser(userId, null);

        return NextResponse.json({
          success: true,
          message: 'User unsuspended successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json(
      { error: 'Failed to process user action' },
      { status: 500 }
    );
  }
}