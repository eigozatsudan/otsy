/**
 * Real-time components and utilities
 * 
 * This module provides Server-Sent Events (SSE) based real-time updates including:
 * - Real-time item status updates
 * - Live purchase notifications
 * - Instant message delivery
 * - Member activity updates
 * - Connection management and recovery
 */

// Hooks
export { useSSE, useMultipleSSE } from '@/hooks/useSSE';
export type { SSEMessage, SSEConnectionState, UseSSEOptions } from '@/hooks/useSSE';

// Components
export { RealTimeProvider, useRealTime } from './RealTimeProvider';
export { default as ConnectionStatus, ConnectionIndicator } from './ConnectionStatus';

// SSE Manager and utilities
export { SSEManager } from '@/lib/sse/SSEManager';
export type { SSEConnection, SSEMessage as SSEManagerMessage } from '@/lib/sse/SSEManager';

// Integration utilities
export {
  ItemSSEIntegration,
  PurchaseSSEIntegration,
  MessageSSEIntegration,
  MemberSSEIntegration,
  SSEUtils,
} from '@/lib/sse/integrations';

// Helper functions for common operations
export {
  broadcastItemUpdate,
  broadcastPurchaseUpdate,
  broadcastMessage,
  broadcastMemberUpdate,
} from '@/lib/sse/SSEManager';