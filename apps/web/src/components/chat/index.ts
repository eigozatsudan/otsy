// Chat and communication components
export { default as GroupChat } from './GroupChat';
export { default as ItemThread } from './ItemThread';
export { default as MentionAutocomplete, useMentions } from './MentionAutocomplete';
export { default as NotificationSystem, useNotificationPermissions } from './NotificationSystem';

// Types
export interface GroupMember {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  mentions?: string[];
  replyToId?: string;
  reactions?: Record<string, string[]>;
  isEdited?: boolean;
  editedAt?: string;
}

export interface Thread {
  id: string;
  itemId?: string;
  itemName?: string;
  title: string;
  messages: Message[];
  participantIds: string[];
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatNotification {
  id: string;
  type: 'message' | 'mention' | 'thread_created' | 'item_updated';
  title: string;
  message: string;
  timestamp: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  threadId?: string;
  threadTitle?: string;
  itemId?: string;
  itemName?: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
}