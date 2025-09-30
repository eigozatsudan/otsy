'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnouncer } from './useAccessibility';

export interface SSEMessage {
  type: 'item_update' | 'purchase_update' | 'message' | 'member_update' | 'connection' | 'ping';
  groupId?: string;
  itemId?: string;
  purchaseId?: string;
  messageId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
  message?: string;
}

export interface SSEConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: SSEMessage | null;
  connectionCount: number;
}

export interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onItemUpdate?: (itemId: string, data: any) => void;
  onPurchaseUpdate?: (purchaseId: string, data: any) => void;
  onNewMessage?: (messageId: string, data: any) => void;
  onMemberUpdate?: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  announceUpdates?: boolean;
}

/**
 * Hook for managing Server-Sent Events connection to a group
 */
export function useSSE(groupId: string | null, options: UseSSEOptions = {}) {
  const {
    onMessage,
    onItemUpdate,
    onPurchaseUpdate,
    onNewMessage,
    onMemberUpdate,
    onConnectionChange,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    announceUpdates = true,
  } = options;

  const { announce } = useAnnouncer();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const [state, setState] = useState<SSEConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    connectionCount: 0,
  });

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!groupId || !mountedRef.current) return;

    cleanup();

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const eventSource = new EventSource(`/api/sse/group/${groupId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;

        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }));

        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);

        if (announceUpdates) {
          announce('Connected to real-time updates', 'polite');
        }
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message: SSEMessage = JSON.parse(event.data);

          setState(prev => ({
            ...prev,
            lastMessage: message,
          }));

          // Handle different message types
          switch (message.type) {
            case 'item_update':
              if (message.itemId && message.data) {
                onItemUpdate?.(message.itemId, message.data);
                if (announceUpdates) {
                  announce(`Shopping list item updated`, 'polite');
                }
              }
              break;

            case 'purchase_update':
              if (message.purchaseId && message.data) {
                onPurchaseUpdate?.(message.purchaseId, message.data);
                if (announceUpdates) {
                  announce(`Purchase information updated`, 'polite');
                }
              }
              break;

            case 'message':
              if (message.messageId && message.data) {
                onNewMessage?.(message.messageId, message.data);
                if (announceUpdates && message.data.content) {
                  announce(`New message: ${message.data.content.slice(0, 50)}`, 'polite');
                }
              }
              break;

            case 'member_update':
              if (message.data) {
                onMemberUpdate?.(message.data);
                if (announceUpdates) {
                  announce(`Group membership updated`, 'polite');
                }
              }
              break;

            case 'connection':
              // Connection established message
              break;

            case 'ping':
              // Keep-alive ping, no action needed
              break;

            default:
              console.warn('Unknown SSE message type:', message.type);
          }

          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;

        console.error('SSE connection error:', error);

        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'Connection error',
        }));

        onConnectionChange?.(false);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          if (announceUpdates) {
            announce(`Connection lost, attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`, 'assertive');
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        } else {
          setState(prev => ({
            ...prev,
            error: 'Maximum reconnection attempts reached',
          }));

          if (announceUpdates) {
            announce('Connection lost. Please refresh the page to reconnect.', 'assertive');
          }
        }
      };
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: 'Failed to establish connection',
      }));
    }
  }, [
    groupId,
    onMessage,
    onItemUpdate,
    onPurchaseUpdate,
    onNewMessage,
    onMemberUpdate,
    onConnectionChange,
    reconnectInterval,
    maxReconnectAttempts,
    announceUpdates,
    announce,
    cleanup,
  ]);

  const disconnect = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null,
    }));
    onConnectionChange?.(false);
  }, [cleanup, onConnectionChange]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Connect when groupId changes
  useEffect(() => {
    if (groupId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [groupId, connect, disconnect, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && groupId && !state.connected && !state.connecting) {
        // Reconnect when page becomes visible
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [groupId, state.connected, state.connecting, reconnect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (groupId && !state.connected && !state.connecting) {
        reconnect();
      }
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        error: 'You are offline',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [groupId, state.connected, state.connecting, reconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
  };
}

/**
 * Hook for managing multiple SSE connections
 */
export function useMultipleSSE(
  connections: Array<{ groupId: string; options?: UseSSEOptions }>
) {
  const [states, setStates] = useState<Record<string, SSEConnectionState>>({});

  const sseHooks = connections.map(({ groupId, options }) => {
    const sseState = useSSE(groupId, {
      ...options,
      onConnectionChange: (connected) => {
        setStates(prev => ({
          ...prev,
          [groupId]: { ...prev[groupId], connected },
        }));
        options?.onConnectionChange?.(connected);
      },
    });

    // Update state
    useEffect(() => {
      setStates(prev => ({
        ...prev,
        [groupId]: sseState,
      }));
    }, [groupId, sseState]);

    return { groupId, ...sseState };
  });

  const connectAll = useCallback(() => {
    sseHooks.forEach(hook => hook.connect());
  }, [sseHooks]);

  const disconnectAll = useCallback(() => {
    sseHooks.forEach(hook => hook.disconnect());
  }, [sseHooks]);

  const reconnectAll = useCallback(() => {
    sseHooks.forEach(hook => hook.reconnect());
  }, [sseHooks]);

  return {
    connections: sseHooks,
    states,
    connectAll,
    disconnectAll,
    reconnectAll,
  };
}