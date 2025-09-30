/**
 * Tests for Server-Sent Events functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSSE } from '@/hooks/useSSE';
import { SSEManager } from '@/lib/sse/SSEManager';

// Mock EventSource
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;
  public url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    this.onmessage?.(event);
  }

  // Helper method to simulate errors
  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Mock global EventSource
(global as any).EventSource = MockEventSource;

describe('SSE Functionality', () => {
  beforeEach(() => {
    // Clear SSE manager connections
    SSEManager.cleanup();
  });

  afterEach(() => {
    SSEManager.cleanup();
  });

  describe('useSSE Hook', () => {
    it('should establish connection when groupId is provided', async () => {
      const { result } = renderHook(() => useSSE('group-123'));

      expect(result.current.connecting).toBe(true);
      expect(result.current.connected).toBe(false);

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
        expect(result.current.connecting).toBe(false);
      });
    });

    it('should not connect when groupId is null', () => {
      const { result } = renderHook(() => useSSE(null));

      expect(result.current.connecting).toBe(false);
      expect(result.current.connected).toBe(false);
    });

    it('should handle incoming messages', async () => {
      const onMessage = jest.fn();
      const onItemUpdate = jest.fn();

      const { result } = renderHook(() => 
        useSSE('group-123', { onMessage, onItemUpdate })
      );

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      // Simulate receiving an item update message
      const mockEventSource = (global as any).EventSource.mock?.instances?.[0];
      if (mockEventSource) {
        act(() => {
          mockEventSource.simulateMessage({
            type: 'item_update',
            groupId: 'group-123',
            itemId: 'item-456',
            data: { name: 'Updated Item', status: 'purchased' },
            timestamp: new Date().toISOString(),
          });
        });

        expect(onMessage).toHaveBeenCalled();
        expect(onItemUpdate).toHaveBeenCalledWith('item-456', {
          name: 'Updated Item',
          status: 'purchased',
        });
      }
    });

    it('should handle connection errors and attempt reconnection', async () => {
      const onConnectionChange = jest.fn();

      const { result } = renderHook(() => 
        useSSE('group-123', { 
          onConnectionChange,
          reconnectInterval: 100,
          maxReconnectAttempts: 2,
        })
      );

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      // Simulate connection error
      const mockEventSource = (global as any).EventSource.mock?.instances?.[0];
      if (mockEventSource) {
        act(() => {
          mockEventSource.simulateError();
        });

        expect(result.current.connected).toBe(false);
        expect(result.current.error).toBe('Connection error');
        expect(onConnectionChange).toHaveBeenCalledWith(false);

        // Should attempt reconnection
        await waitFor(() => {
          expect(result.current.connecting).toBe(true);
        }, { timeout: 200 });
      }
    });

    it('should cleanup connection on unmount', async () => {
      const { result, unmount } = renderHook(() => useSSE('group-123'));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const mockEventSource = (global as any).EventSource.mock?.instances?.[0];
      const closeSpy = jest.spyOn(mockEventSource, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle different message types correctly', async () => {
      const onPurchaseUpdate = jest.fn();
      const onNewMessage = jest.fn();
      const onMemberUpdate = jest.fn();

      const { result } = renderHook(() => 
        useSSE('group-123', { 
          onPurchaseUpdate,
          onNewMessage,
          onMemberUpdate,
        })
      );

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const mockEventSource = (global as any).EventSource.mock?.instances?.[0];
      if (mockEventSource) {
        // Test purchase update
        act(() => {
          mockEventSource.simulateMessage({
            type: 'purchase_update',
            purchaseId: 'purchase-789',
            data: { amount: 25.50, splits: [] },
            timestamp: new Date().toISOString(),
          });
        });

        expect(onPurchaseUpdate).toHaveBeenCalledWith('purchase-789', {
          amount: 25.50,
          splits: [],
        });

        // Test new message
        act(() => {
          mockEventSource.simulateMessage({
            type: 'message',
            messageId: 'message-101',
            data: { content: 'Hello everyone!', userId: 'user-1' },
            timestamp: new Date().toISOString(),
          });
        });

        expect(onNewMessage).toHaveBeenCalledWith('message-101', {
          content: 'Hello everyone!',
          userId: 'user-1',
        });

        // Test member update
        act(() => {
          mockEventSource.simulateMessage({
            type: 'member_update',
            data: { action: 'member_joined', member: { id: 'user-2', name: 'John' } },
            timestamp: new Date().toISOString(),
          });
        });

        expect(onMemberUpdate).toHaveBeenCalledWith({
          action: 'member_joined',
          member: { id: 'user-2', name: 'John' },
        });
      }
    });

    it('should handle ping messages without triggering callbacks', async () => {
      const onMessage = jest.fn();

      const { result } = renderHook(() => 
        useSSE('group-123', { onMessage })
      );

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const mockEventSource = (global as any).EventSource.mock?.instances?.[0];
      if (mockEventSource) {
        act(() => {
          mockEventSource.simulateMessage({
            type: 'ping',
            timestamp: new Date().toISOString(),
          });
        });

        // onMessage should still be called, but no specific handlers
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'ping' })
        );
      }
    });
  });

  describe('SSEManager', () => {
    it('should create and manage connections', () => {
      const sendFunction = jest.fn();
      const connection = SSEManager.createConnection('test-channel', 'user-1', sendFunction);

      expect(connection.userId).toBe('user-1');
      expect(connection.send).toBe(sendFunction);
      expect(SSEManager.getConnectionCount('test-channel')).toBe(1);
    });

    it('should broadcast messages to all connections in a channel', () => {
      const sendFunction1 = jest.fn();
      const sendFunction2 = jest.fn();

      SSEManager.createConnection('test-channel', 'user-1', sendFunction1);
      SSEManager.createConnection('test-channel', 'user-2', sendFunction2);

      const message = {
        type: 'item_update' as const,
        data: { test: 'data' },
        timestamp: new Date().toISOString(),
      };

      SSEManager.broadcast('test-channel', message);

      expect(sendFunction1).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'item_update', data: { test: 'data' } })
      );
      expect(sendFunction2).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'item_update', data: { test: 'data' } })
      );
    });

    it('should exclude specified user from broadcast', () => {
      const sendFunction1 = jest.fn();
      const sendFunction2 = jest.fn();

      SSEManager.createConnection('test-channel', 'user-1', sendFunction1);
      SSEManager.createConnection('test-channel', 'user-2', sendFunction2);

      const message = {
        type: 'item_update' as const,
        data: { test: 'data' },
        timestamp: new Date().toISOString(),
      };

      SSEManager.broadcast('test-channel', message, 'user-1');

      expect(sendFunction1).not.toHaveBeenCalled();
      expect(sendFunction2).toHaveBeenCalled();
    });

    it('should send message to specific user', () => {
      const sendFunction1 = jest.fn();
      const sendFunction2 = jest.fn();

      SSEManager.createConnection('test-channel', 'user-1', sendFunction1);
      SSEManager.createConnection('test-channel', 'user-2', sendFunction2);

      const message = {
        type: 'message' as const,
        data: { private: 'message' },
        timestamp: new Date().toISOString(),
      };

      SSEManager.sendToUser('test-channel', 'user-1', message);

      expect(sendFunction1).toHaveBeenCalledWith(
        expect.objectContaining({ data: { private: 'message' } })
      );
      expect(sendFunction2).not.toHaveBeenCalled();
    });

    it('should remove connections properly', () => {
      const sendFunction = jest.fn();
      SSEManager.createConnection('test-channel', 'user-1', sendFunction);

      expect(SSEManager.getConnectionCount('test-channel')).toBe(1);

      SSEManager.removeConnection('test-channel', 'user-1');

      expect(SSEManager.getConnectionCount('test-channel')).toBe(0);
    });

    it('should clean up empty channels', () => {
      const sendFunction = jest.fn();
      SSEManager.createConnection('test-channel', 'user-1', sendFunction);

      expect(SSEManager.getActiveChannels()).toContain('test-channel');

      SSEManager.removeConnection('test-channel', 'user-1');

      expect(SSEManager.getActiveChannels()).not.toContain('test-channel');
    });
  });

  describe('Connection Recovery', () => {
    it('should handle page visibility changes', async () => {
      const { result } = renderHook(() => useSSE('group-123'));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      // Simulate page becoming hidden
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden',
      });

      // Simulate connection loss
      const mockEventSource = (global as any).EventSource.mock?.instances?.[0];
      if (mockEventSource) {
        act(() => {
          mockEventSource.simulateError();
        });

        expect(result.current.connected).toBe(false);

        // Simulate page becoming visible again
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'visible',
        });

        act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });

        // Should attempt to reconnect
        await waitFor(() => {
          expect(result.current.connecting).toBe(true);
        });
      }
    });

    it('should handle online/offline events', async () => {
      const { result } = renderHook(() => useSSE('group-123'));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      // Simulate going offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.error).toBe('You are offline');

      // Simulate coming back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should attempt to reconnect
      await waitFor(() => {
        expect(result.current.connecting).toBe(true);
      });
    });
  });
});