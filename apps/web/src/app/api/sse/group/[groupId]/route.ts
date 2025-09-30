import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SSEManager } from '@/lib/sse/SSEManager';

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { groupId } = params;

    // Verify user has access to this group
    const hasAccess = await verifyGroupAccess(user.id, groupId);
    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Set up SSE connection
        const connection = SSEManager.createConnection(
          `group:${groupId}`,
          user.id,
          (data) => {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          }
        );

        // Send initial connection message
        const initialMessage = {
          type: 'connection',
          timestamp: new Date().toISOString(),
          message: 'Connected to group updates',
        };
        
        const message = `data: ${JSON.stringify(initialMessage)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));

        // Handle connection cleanup
        request.signal.addEventListener('abort', () => {
          SSEManager.removeConnection(`group:${groupId}`, user.id);
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function verifyGroupAccess(userId: string, groupId: string): Promise<boolean> {
  try {
    // In a real implementation, this would check the database
    // For now, we'll assume access is granted
    return true;
  } catch (error) {
    console.error('Error verifying group access:', error);
    return false;
  }
}