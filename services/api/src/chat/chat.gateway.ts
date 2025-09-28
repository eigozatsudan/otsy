import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { 
  SendMessageDto, 
  JoinChatDto, 
  LeaveChatDto, 
  TypingIndicatorDto 
} from './dto/chat.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  chatRooms?: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://user.otsukai.app', 'https://shopper.otsukai.app', 'https://admin.otsukai.app']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  // Method to broadcast message from HTTP API
  public broadcastMessage(chatId: string, message: any) {
    this.logger.log(`Broadcasting message to chat ${chatId}`);
    this.server.to(`chat:${chatId}`).emit('new_message', message);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userRole = payload.role;
      client.chatRooms = new Set();

      this.connectedUsers.set(client.userId, client);
      
      this.logger.log(`User ${client.userId} (${client.userRole}) connected`);

      // Join user to their personal room for direct notifications
      client.join(`user:${client.userId}`);

      // Emit connection success
      client.emit('connected', {
        userId: client.userId,
        role: client.userRole,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Authentication failed for WebSocket connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinChatDto,
  ) {
    try {
      // Verify user has access to this chat
      const chat = await this.chatService.getChatById(data.chat_id);
      
      const hasAccess = 
        chat.user_id === client.userId || 
        chat.shopper_id === client.userId ||
        client.userRole === 'admin';

      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Join the chat room
      client.join(`chat:${data.chat_id}`);
      client.chatRooms?.add(data.chat_id);

      this.logger.log(`User ${client.userId} joined chat ${data.chat_id}`);

      // Notify other participants
      client.to(`chat:${data.chat_id}`).emit('user_joined', {
        userId: client.userId,
        role: client.userRole,
        chatId: data.chat_id,
        timestamp: new Date().toISOString(),
      });

      // Send recent messages
      const recentMessages = await this.chatService.getChatMessages(data.chat_id, 1, 50);
      client.emit('chat_history', {
        chatId: data.chat_id,
        messages: recentMessages.messages,
        hasMore: recentMessages.hasMore,
      });

    } catch (error) {
      this.logger.error('Error joining chat:', error);
      client.emit('error', { message: 'Failed to join chat' });
    }
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LeaveChatDto,
  ) {
    client.leave(`chat:${data.chat_id}`);
    client.chatRooms?.delete(data.chat_id);

    this.logger.log(`User ${client.userId} left chat ${data.chat_id}`);

    // Notify other participants
    client.to(`chat:${data.chat_id}`).emit('user_left', {
      userId: client.userId,
      role: client.userRole,
      chatId: data.chat_id,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; message: SendMessageDto },
  ) {
    try {
      // Verify user has access to this chat
      const chat = await this.chatService.getChatById(data.chatId);
      
      const hasAccess = 
        chat.user_id === client.userId || 
        chat.shopper_id === client.userId;

      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Save message to database
      const message = await this.chatService.sendMessage(
        data.chatId,
        client.userId,
        client.userRole as 'user' | 'shopper',
        data.message,
      );

      // Broadcast to all participants in the chat
      this.server.to(`chat:${data.chatId}`).emit('new_message', message);

      // Send push notification to offline users
      const otherParticipantId = chat.user_id === client.userId ? chat.shopper_id : chat.user_id;
      const isOtherUserOnline = this.connectedUsers.has(otherParticipantId);

      if (!isOtherUserOnline) {
        await this.chatService.sendMessageNotification(otherParticipantId, message, chat);
      }

      this.logger.log(`Message sent in chat ${data.chatId} by user ${client.userId}`);

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing_indicator')
  async handleTypingIndicator(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    // Broadcast typing indicator to other participants (excluding sender)
    client.to(`chat:${data.chat_id}`).emit('typing_indicator', {
      userId: client.userId,
      role: client.userRole,
      chatId: data.chat_id,
      action: data.action,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ) {
    try {
      await this.chatService.markMessagesAsRead(client.userId, data.messageIds);

      // Notify other participants about read status
      client.to(`chat:${data.chatId}`).emit('messages_read', {
        userId: client.userId,
        chatId: data.chatId,
        messageIds: data.messageIds,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  // Server-side methods for sending notifications
  async notifyOrderUpdate(orderId: string, update: any) {
    // Get chat associated with the order
    const chat = await this.chatService.getChatByOrderId(orderId);
    if (!chat) return;

    // Send system message
    const systemMessage = await this.chatService.sendSystemMessage(
      chat.id,
      `Order status updated: ${update.status}`,
      { orderUpdate: update }
    );

    // Broadcast to chat participants
    this.server.to(`chat:${chat.id}`).emit('order_update', {
      orderId,
      update,
      message: systemMessage,
    });

    // Send push notifications
    await Promise.all([
      this.chatService.sendOrderUpdateNotification(chat.user_id, update),
      this.chatService.sendOrderUpdateNotification(chat.shopper_id, update),
    ]);
  }

  async notifyReceiptShared(chatId: string, receiptUrl: string, sharedBy: string) {
    const systemMessage = await this.chatService.sendSystemMessage(
      chatId,
      'Receipt has been shared',
      { receiptUrl, sharedBy }
    );

    this.server.to(`chat:${chatId}`).emit('receipt_shared', {
      chatId,
      receiptUrl,
      sharedBy,
      message: systemMessage,
    });
  }

  // Get online users for a chat
  async getOnlineUsers(chatId: string): Promise<string[]> {
    const room = this.server.sockets.adapter.rooms.get(`chat:${chatId}`);
    if (!room) return [];

    const onlineUsers: string[] = [];
    for (const socketId of room) {
      const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        onlineUsers.push(socket.userId);
      }
    }

    return onlineUsers;
  }

  // Send direct notification to user
  async sendDirectNotification(userId: string, notification: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
      return true;
    }
    return false;
  }
}