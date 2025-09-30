/**
 * Server-Sent Events Manager for real-time updates
 */

export interface SSEConnection {
  userId: string;
  send: (data: any) => void;
  lastPing: number;
}

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

class SSEManagerClass {
  private connections: Map<string, Map<string, SSEConnection>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start ping interval to keep connections alive
    this.startPingInterval();
  }

  /**
   * Create a new SSE connection
   */
  createConnection(
    channel: string,
    userId: string,
    sendFunction: (data: any) => void
  ): SSEConnection {
    if (!this.connections.has(channel)) {
      this.connections.set(channel, new Map());
    }

    const connection: SSEConnection = {
      userId,
      send: sendFunction,
      lastPing: Date.now(),
    };

    this.connections.get(channel)!.set(userId, connection);

    console.log(`SSE connection created for user ${userId} on channel ${channel}`);
    return connection;
  }

  /**
   * Remove an SSE connection
   */
  removeConnection(channel: string, userId: string): void {
    const channelConnections = this.connections.get(channel);
    if (channelConnections) {
      channelConnections.delete(userId);
      
      // Clean up empty channels
      if (channelConnections.size === 0) {
        this.connections.delete(channel);
      }
    }

    console.log(`SSE connection removed for user ${userId} on channel ${channel}`);
  }

  /**
   * Broadcast message to all connections in a channel
   */
  broadcast(channel: string, message: SSEMessage, excludeUserId?: string): void {
    const channelConnections = this.connections.get(channel);
    if (!channelConnections) return;

    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    channelConnections.forEach((connection, userId) => {
      if (excludeUserId && userId === excludeUserId) return;

      try {
        connection.send(messageWithTimestamp);
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
        // Remove failed connection
        this.removeConnection(channel, userId);
      }
    });

    console.log(`Broadcasted message to ${channelConnections.size} connections on channel ${channel}`);
  }

  /**
   * Send message to specific user in a channel
   */
  sendToUser(channel: string, userId: string, message: SSEMessage): void {
    const channelConnections = this.connections.get(channel);
    if (!channelConnections) return;

    const connection = channelConnections.get(userId);
    if (!connection) return;

    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    try {
      connection.send(messageWithTimestamp);
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);
      this.removeConnection(channel, userId);
    }
  }

  /**
   * Get active connections count for a channel
   */
  getConnectionCount(channel: string): number {
    const channelConnections = this.connections.get(channel);
    return channelConnections ? channelConnections.size : 0;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval(): void {
    if (this.pingInterval) return;

    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const pingMessage: SSEMessage = {
        type: 'ping',
        timestamp: new Date().toISOString(),
      };

      this.connections.forEach((channelConnections, channel) => {
        channelConnections.forEach((connection, userId) => {
          // Remove stale connections (no ping response in 60 seconds)
          if (now - connection.lastPing > 60000) {
            this.removeConnection(channel, userId);
            return;
          }

          try {
            connection.send(pingMessage);
          } catch (error) {
            console.error(`Ping failed for user ${userId}:`, error);
            this.removeConnection(channel, userId);
          }
        });
      });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Update last ping time for a connection
   */
  updatePing(channel: string, userId: string): void {
    const channelConnections = this.connections.get(channel);
    if (!channelConnections) return;

    const connection = channelConnections.get(userId);
    if (connection) {
      connection.lastPing = Date.now();
    }
  }

  /**
   * Clean up all connections
   */
  cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.connections.clear();
  }
}

// Singleton instance
export const SSEManager = new SSEManagerClass();

// Helper functions for common operations

/**
 * Broadcast item update to group members
 */
export function broadcastItemUpdate(
  groupId: string,
  itemId: string,
  updateData: any,
  excludeUserId?: string
): void {
  const message: SSEMessage = {
    type: 'item_update',
    groupId,
    itemId,
    data: updateData,
    timestamp: new Date().toISOString(),
  };

  SSEManager.broadcast(`group:${groupId}`, message, excludeUserId);
}

/**
 * Broadcast purchase update to group members
 */
export function broadcastPurchaseUpdate(
  groupId: string,
  purchaseId: string,
  updateData: any,
  excludeUserId?: string
): void {
  const message: SSEMessage = {
    type: 'purchase_update',
    groupId,
    purchaseId,
    data: updateData,
    timestamp: new Date().toISOString(),
  };

  SSEManager.broadcast(`group:${groupId}`, message, excludeUserId);
}

/**
 * Broadcast new message to group members
 */
export function broadcastMessage(
  groupId: string,
  messageId: string,
  messageData: any,
  excludeUserId?: string
): void {
  const message: SSEMessage = {
    type: 'message',
    groupId,
    messageId,
    data: messageData,
    timestamp: new Date().toISOString(),
  };

  SSEManager.broadcast(`group:${groupId}`, message, excludeUserId);
}

/**
 * Broadcast member update to group members
 */
export function broadcastMemberUpdate(
  groupId: string,
  updateData: any,
  excludeUserId?: string
): void {
  const message: SSEMessage = {
    type: 'member_update',
    groupId,
    data: updateData,
    timestamp: new Date().toISOString(),
  };

  SSEManager.broadcast(`group:${groupId}`, message, excludeUserId);
}