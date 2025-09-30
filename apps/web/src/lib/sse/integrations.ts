/**
 * SSE integration utilities for existing API endpoints
 */

import { 
  broadcastItemUpdate, 
  broadcastPurchaseUpdate, 
  broadcastMessage, 
  broadcastMemberUpdate 
} from './SSEManager';

/**
 * Integration with shopping list items API
 */
export class ItemSSEIntegration {
  /**
   * Broadcast item creation
   */
  static async broadcastItemCreated(groupId: string, item: any, excludeUserId?: string) {
    broadcastItemUpdate(groupId, item.id, {
      action: 'created',
      item,
    }, excludeUserId);
  }

  /**
   * Broadcast item update
   */
  static async broadcastItemUpdated(groupId: string, itemId: string, updates: any, excludeUserId?: string) {
    broadcastItemUpdate(groupId, itemId, {
      action: 'updated',
      updates,
    }, excludeUserId);
  }

  /**
   * Broadcast item status change
   */
  static async broadcastItemStatusChanged(
    groupId: string, 
    itemId: string, 
    oldStatus: string, 
    newStatus: string, 
    userId: string,
    excludeUserId?: string
  ) {
    broadcastItemUpdate(groupId, itemId, {
      action: 'status_changed',
      oldStatus,
      newStatus,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast item deletion
   */
  static async broadcastItemDeleted(groupId: string, itemId: string, excludeUserId?: string) {
    broadcastItemUpdate(groupId, itemId, {
      action: 'deleted',
    }, excludeUserId);
  }

  /**
   * Broadcast bulk item operations
   */
  static async broadcastBulkItemUpdate(
    groupId: string, 
    itemIds: string[], 
    operation: string, 
    data: any,
    excludeUserId?: string
  ) {
    broadcastItemUpdate(groupId, 'bulk', {
      action: 'bulk_update',
      operation,
      itemIds,
      data,
    }, excludeUserId);
  }
}

/**
 * Integration with purchases API
 */
export class PurchaseSSEIntegration {
  /**
   * Broadcast purchase creation
   */
  static async broadcastPurchaseCreated(groupId: string, purchase: any, excludeUserId?: string) {
    broadcastPurchaseUpdate(groupId, purchase.id, {
      action: 'created',
      purchase,
    }, excludeUserId);
  }

  /**
   * Broadcast purchase update
   */
  static async broadcastPurchaseUpdated(
    groupId: string, 
    purchaseId: string, 
    updates: any, 
    excludeUserId?: string
  ) {
    broadcastPurchaseUpdate(groupId, purchaseId, {
      action: 'updated',
      updates,
    }, excludeUserId);
  }

  /**
   * Broadcast split calculation update
   */
  static async broadcastSplitCalculated(
    groupId: string, 
    purchaseId: string, 
    splits: any[], 
    excludeUserId?: string
  ) {
    broadcastPurchaseUpdate(groupId, purchaseId, {
      action: 'split_calculated',
      splits,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast purchase deletion
   */
  static async broadcastPurchaseDeleted(groupId: string, purchaseId: string, excludeUserId?: string) {
    broadcastPurchaseUpdate(groupId, purchaseId, {
      action: 'deleted',
    }, excludeUserId);
  }

  /**
   * Broadcast receipt upload
   */
  static async broadcastReceiptUploaded(
    groupId: string, 
    purchaseId: string, 
    receiptUrl: string, 
    excludeUserId?: string
  ) {
    broadcastPurchaseUpdate(groupId, purchaseId, {
      action: 'receipt_uploaded',
      receiptUrl,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }
}

/**
 * Integration with chat/messaging API
 */
export class MessageSSEIntegration {
  /**
   * Broadcast new message
   */
  static async broadcastNewMessage(groupId: string, message: any, excludeUserId?: string) {
    broadcastMessage(groupId, message.id, {
      action: 'new_message',
      message,
    }, excludeUserId);
  }

  /**
   * Broadcast message update
   */
  static async broadcastMessageUpdated(
    groupId: string, 
    messageId: string, 
    updates: any, 
    excludeUserId?: string
  ) {
    broadcastMessage(groupId, messageId, {
      action: 'updated',
      updates,
    }, excludeUserId);
  }

  /**
   * Broadcast message deletion
   */
  static async broadcastMessageDeleted(groupId: string, messageId: string, excludeUserId?: string) {
    broadcastMessage(groupId, messageId, {
      action: 'deleted',
    }, excludeUserId);
  }

  /**
   * Broadcast typing indicator
   */
  static async broadcastTyping(
    groupId: string, 
    userId: string, 
    userName: string, 
    isTyping: boolean,
    itemId?: string
  ) {
    broadcastMessage(groupId, 'typing', {
      action: 'typing',
      userId,
      userName,
      isTyping,
      itemId,
      timestamp: new Date().toISOString(),
    }, userId); // Exclude the typing user
  }

  /**
   * Broadcast @mention notification
   */
  static async broadcastMention(
    groupId: string, 
    messageId: string, 
    mentionedUserId: string, 
    mentionerName: string,
    messageContent: string
  ) {
    broadcastMessage(groupId, messageId, {
      action: 'mention',
      mentionedUserId,
      mentionerName,
      messageContent: messageContent.slice(0, 100), // Truncate for notification
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Integration with group membership API
 */
export class MemberSSEIntegration {
  /**
   * Broadcast member joined
   */
  static async broadcastMemberJoined(groupId: string, member: any, excludeUserId?: string) {
    broadcastMemberUpdate(groupId, {
      action: 'member_joined',
      member,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast member left
   */
  static async broadcastMemberLeft(groupId: string, memberId: string, memberName: string, excludeUserId?: string) {
    broadcastMemberUpdate(groupId, {
      action: 'member_left',
      memberId,
      memberName,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast member role change
   */
  static async broadcastMemberRoleChanged(
    groupId: string, 
    memberId: string, 
    oldRole: string, 
    newRole: string,
    excludeUserId?: string
  ) {
    broadcastMemberUpdate(groupId, {
      action: 'role_changed',
      memberId,
      oldRole,
      newRole,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast group settings update
   */
  static async broadcastGroupSettingsUpdated(groupId: string, settings: any, excludeUserId?: string) {
    broadcastMemberUpdate(groupId, {
      action: 'settings_updated',
      settings,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast group name/description change
   */
  static async broadcastGroupInfoUpdated(
    groupId: string, 
    updates: { name?: string; description?: string },
    excludeUserId?: string
  ) {
    broadcastMemberUpdate(groupId, {
      action: 'info_updated',
      updates,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }

  /**
   * Broadcast member activity status
   */
  static async broadcastMemberActivity(
    groupId: string, 
    userId: string, 
    activity: 'online' | 'offline' | 'away',
    excludeUserId?: string
  ) {
    broadcastMemberUpdate(groupId, {
      action: 'activity_status',
      userId,
      activity,
      timestamp: new Date().toISOString(),
    }, excludeUserId);
  }
}

/**
 * Utility functions for common SSE operations
 */
export class SSEUtils {
  /**
   * Broadcast system notification to group
   */
  static async broadcastSystemNotification(
    groupId: string, 
    notification: {
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
    }
  ) {
    broadcastMemberUpdate(groupId, {
      action: 'system_notification',
      notification: {
        ...notification,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast maintenance notification
   */
  static async broadcastMaintenanceNotification(
    groupId: string,
    maintenance: {
      scheduled: boolean;
      startTime: string;
      duration: number;
      message: string;
    }
  ) {
    broadcastMemberUpdate(groupId, {
      action: 'maintenance_notification',
      maintenance,
    });
  }

  /**
   * Get connection statistics for a group
   */
  static getGroupConnectionStats(groupId: string) {
    const { SSEManager } = require('./SSEManager');
    return {
      connectionCount: SSEManager.getConnectionCount(`group:${groupId}`),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Broadcast to multiple groups
   */
  static async broadcastToMultipleGroups(
    groupIds: string[],
    messageType: 'item_update' | 'purchase_update' | 'message' | 'member_update',
    data: any,
    excludeUserId?: string
  ) {
    const promises = groupIds.map(groupId => {
      switch (messageType) {
        case 'item_update':
          return broadcastItemUpdate(groupId, data.itemId || 'unknown', data, excludeUserId);
        case 'purchase_update':
          return broadcastPurchaseUpdate(groupId, data.purchaseId || 'unknown', data, excludeUserId);
        case 'message':
          return broadcastMessage(groupId, data.messageId || 'unknown', data, excludeUserId);
        case 'member_update':
          return broadcastMemberUpdate(groupId, data, excludeUserId);
      }
    });

    await Promise.all(promises);
  }
}