'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useSSE, SSEMessage } from '@/hooks/useSSE';
import { useAnnouncer } from '@/hooks/useAccessibility';

interface RealTimeContextValue {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: SSEMessage | null;
  reconnect: () => void;
  disconnect: () => void;
}

const RealTimeContext = createContext<RealTimeContextValue | null>(null);

interface RealTimeProviderProps {
  groupId: string | null;
  children: React.ReactNode;
  onItemUpdate?: (itemId: string, data: any) => void;
  onPurchaseUpdate?: (purchaseId: string, data: any) => void;
  onNewMessage?: (messageId: string, data: any) => void;
  onMemberUpdate?: (data: any) => void;
}

export function RealTimeProvider({
  groupId,
  children,
  onItemUpdate,
  onPurchaseUpdate,
  onNewMessage,
  onMemberUpdate,
}: RealTimeProviderProps) {
  const { announce } = useAnnouncer();

  const handleMessage = useCallback((message: SSEMessage) => {
    // Log all messages for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Real-time message received:', message);
    }
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    if (connected) {
      announce('Real-time updates connected', 'polite');
    } else {
      announce('Real-time updates disconnected', 'assertive');
    }
  }, [announce]);

  const sseState = useSSE(groupId, {
    onMessage: handleMessage,
    onItemUpdate,
    onPurchaseUpdate,
    onNewMessage,
    onMemberUpdate,
    onConnectionChange: handleConnectionChange,
    announceUpdates: true,
  });

  const contextValue: RealTimeContextValue = {
    connected: sseState.connected,
    connecting: sseState.connecting,
    error: sseState.error,
    lastMessage: sseState.lastMessage,
    reconnect: sseState.reconnect,
    disconnect: sseState.disconnect,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime(): RealTimeContextValue {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}