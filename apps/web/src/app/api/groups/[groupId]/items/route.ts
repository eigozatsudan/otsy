import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ItemSSEIntegration } from '@/lib/sse/integrations';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params;
    const body = await request.json();

    // Validate request body
    const { name, category, quantity, notes, imageUrl } = body;
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Create item in database (mock implementation)
    const newItem = {
      id: `item-${Date.now()}`,
      groupId,
      name,
      category,
      quantity: quantity || 1,
      notes: notes || '',
      imageUrl: imageUrl || null,
      status: 'todo',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, save to database here
    // await db.item.create({ data: newItem });

    // Broadcast item creation to group members via SSE
    await ItemSSEIntegration.broadcastItemCreated(
      groupId,
      newItem,
      user.id // Exclude the creator from the broadcast
    );

    return NextResponse.json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Mock items data (in real implementation, fetch from database)
    const mockItems = [
      {
        id: 'item-1',
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
      },
      {
        id: 'item-2',
        groupId,
        name: 'Bread',
        category: 'Bakery',
        quantity: 1,
        notes: 'Whole wheat',
        imageUrl: null,
        status: 'purchased',
        createdBy: 'user-2',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T11:15:00Z',
      },
    ];

    // Filter items based on query parameters
    let filteredItems = mockItems;
    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }
    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    return NextResponse.json({
      success: true,
      data: filteredItems,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}