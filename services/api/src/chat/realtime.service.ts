import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MessageResponseDto } from './dto/message.dto';

export interface RealtimeEvent {
  type: 'message' | 'typing' | 'user_joined' | 'user_left' | 'mention';
  groupId: string;
  itemId?: string;
  userId: string;
  data: any;
}

@Injectable()
export class RealtimeService {
  private eventSubject = new Subject<RealtimeEvent>();

  /**
   * Subscribe to real-time events for a specific group
   */
  subscribeToGroup(groupId: string, userId: string) {
    return this.eventSubject.asObservable().pipe(
      filter(event => 
        event.groupId === groupId && 
        event.userId !== userId // Don't send events back to the sender
      )
    );
  }

  /**
   * Subscribe to real-time events for a specific item thread
   */
  subscribeToItemThread(groupId: string, itemId: string, userId: string) {
    return this.eventSubject.asObservable().pipe(
      filter(event => 
        event.groupId === groupId && 
        event.itemId === itemId &&
        event.userId !== userId
      )
    );
  }

  /**
   * Subscribe to mention notifications for a user
   */
  subscribeToMentions(userId: string) {
    return this.eventSubject.asObservable().pipe(
      filter(event => 
        event.type === 'mention' && 
        event.data.mentionedUserId === userId
      )
    );
  }

  /**
   * Broadcast a new message to group members
   */
  broadcastMessage(message: MessageResponseDto, authorId: string) {
    this.eventSubject.next({
      type: 'message',
      groupId: message.group_id,
      itemId: message.item_id,
      userId: authorId,
      data: message
    });
  }

  /**
   * Broadcast typing indicator
   */
  broadcastTyping(groupId: string, itemId: string | undefined, userId: string, userName: string, isTyping: boolean) {
    this.eventSubject.next({
      type: 'typing',
      groupId,
      itemId,
      userId,
      data: {
        user_name: userName,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast user joined group
   */
  broadcastUserJoined(groupId: string, userId: string, userName: string) {
    this.eventSubject.next({
      type: 'user_joined',
      groupId,
      userId,
      data: {
        user_name: userName,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast user left group
   */
  broadcastUserLeft(groupId: string, userId: string, userName: string) {
    this.eventSubject.next({
      type: 'user_left',
      groupId,
      userId,
      data: {
        user_name: userName,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast mention notification
   */
  broadcastMention(groupId: string, itemId: string | undefined, mentionedUserId: string, message: MessageResponseDto) {
    this.eventSubject.next({
      type: 'mention',
      groupId,
      itemId,
      userId: message.author_id,
      data: {
        mentionedUserId,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }
}