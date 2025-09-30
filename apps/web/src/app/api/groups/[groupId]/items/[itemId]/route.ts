import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ItemSSEIntegration } from '@/lib/sse/integrations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string; itemId: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, itemId } = params;
    const body = await request.json();

    // Get current item (mock implementation)
    const currentItem = {
      id: itemId,
      groupId,
      name: 'Milk',
      category: 'Dairy',
      quantity: 2,
      notes: 'Organic if available',
      imageUrl: null,
      status: 'todo',
      createdBy: 'user-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    // Validate updates
    const allowedUpdates = ['name', 'category', 'quantity', 'notes', 'imageUrl', 'status'];
    const updates = Object.keys(body).reduce((acc, key) => {
      if (allowedUpdates.includes(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {} as any);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Check for status change
    const oldStatus = currentItem.status;
    const newStatus = updates.status;
    const statusChanged = newStatus && newStatus !== oldStatus;

    // Update item (mock implementation)
    const updatedItem = {
      ...currentItem,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // In a real implementation, update in database here
    // await db.item.update({ where: { id: itemId }, data: updates });

    // Broadcast updates via SSE
    if (statusChanged) {
      // Broadcast status change specifically
      await ItemSSEIntegration.broadcastItemStatusChanged(
        groupId,
        itemId,
        oldStatus,
        newStatus,
        user.id,
        user.id // Exclude the user who made the change
      );
    } else {
      // Broadcast general item update
      await ItemSSEIntegration.broadcastItemUpdated(
        groupId,
        itemId,
        {
          ...updates,
          updatedBy: user.id,
          updatedAt: updatedItem.updatedAt,
        },
        user.id // Exclude the user who made the change
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; itemId: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, itemId } = params;

    // Verify item exists and user has permission (mock implementation)
    const item = {
      id: itemId,
      groupId,
      createdBy: 'user-1',
    };

    // In a real implementation, check if user is group member or item creator
    // const hasPermission = await checkItemDeletePermission(user.id, groupId, itemId);
    // if (!hasPermission) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Delete item from database (mock implementation)
    // await db.item.delete({ where: { id: itemId } });

    // Broadcast item deletion via SSE
    await ItemSSEIntegration.broadcastItemDeleted(
      groupId,
      itemId,
      user.id // Exclude the user who deleted the item
    );

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string; itemId: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, itemId } = params;

    // Get item from database (mock implementation)
    const item = {
      id: itemId,
      groupId,
      name: 'Milk',
      category: 'Dairy',
      quantity: 2,
      notes: 'Organic if available',
      imageUrl: null,
      status: 'todo',
      createdBy: 'user-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      history: [
        {
          action: 'created',
          userId: 'user-1',
          timestamp: '2024-01-15T10:00:00Z',
        },
        {
          action: 'updated',
          userId: 'user-2',
          changes: { quantity: 2 },
          timestamp: '2024-01-15T10:30:00Z',
        },
      ],
    };

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}