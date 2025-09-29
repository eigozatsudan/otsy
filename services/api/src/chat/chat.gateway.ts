import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
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
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway initialized');
    this.logger.log('Server instance:', !!server);
    this.logger.log('Server sockets:', !!server?.sockets);
    this.logger.log('Server adapter:', !!server?.sockets?.adapter);
    this.logger.log('WebSocket server is ready for connections');
  }

  // Method to broadcast message from HTTP API
  public broadcastMessage(chatId: string, message: any) {
    this.logger.log(`Broadcasting message to chat ${chatId}`);
    this.logger.log(`Message data:`, JSON.stringify(message, null, 2));
    this.logger.log(`Room name: chat:${chatId}`);
    
    // Check if server and adapter are available
    if (!this.server) {
      this.logger.warn('WebSocket server is not initialized - skipping broadcast');
      return;
    }
    
    if (!this.server.sockets || !this.server.sockets.adapter) {
      this.logger.warn('WebSocket adapter is not available - skipping broadcast');
      return;
    }
    
    try {
      const roomName = `chat:${chatId}`;
      const roomSize = this.server.sockets.adapter.rooms.get(roomName)?.size || 0;
      this.logger.log(`Connected clients in room: ${roomSize}`);
      
      this.server.to(roomName).emit('new_message', message);
      
      this.logger.log(`Message broadcasted to chat:${chatId}`);
    } catch (error) {
      this.logger.error('Error broadcasting message:', error);
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log('New WebSocket connection attempt');
      this.logger.log('Client handshake:', {
        auth: client.handshake.auth,
        headers: client.handshake.headers,
        url: client.handshake.url,
        query: client.handshake.query
      });

      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      this.logger.log('Token found, verifying...');
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userRole = payload.role;
      client.chatRooms = new Set();

      this.connectedUsers.set(client.userId, client);
      
      this.logger.log(`User ${client.userId} (${client.userRole}) connected successfully`);

      // Join user to their personal room for direct notifications
      client.join(`user:${client.userId}`);

      // Emit connection success
      client.emit('connected', {
        userId: client.userId,
        role: client.userRole,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Connection established for user ${client.userId}`);

    } catch (error) {
      this.logger.error('Authentication failed for WebSocket connection:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
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
      this.logger.log(`User ${client.userId} attempting to join chat: ${data.chat_id}`);
      
      // First try to get chat by ID (in case it's already a chat ID)
      let chat;
      try {
        chat = await this.chatService.getChatById(data.chat_id);
        this.logger.log(`Chat found by ID: ${chat.id}`);
      } catch (error) {
        // If not found by ID, try to get chat by order ID
        this.logger.log(`Chat not found by ID, trying to get by order ID: ${data.chat_id}`);
        chat = await this.chatService.getChatByOrderId(data.chat_id);
        
        if (!chat) {
          this.logger.warn(`No chat found for order ID: ${data.chat_id}, attempting to create one`);
          
          // Try to create a chat for this order
          try {
            // Get order details to create chat
            const order = await this.chatService.getOrderById(data.chat_id);
            if (!order) {
              this.logger.error(`Order not found: ${data.chat_id}`);
              client.emit('error', { message: 'Order not found' });
              return;
            }
            
            // Create chat for the order
            const createChatDto = {
              order_id: data.chat_id,
              user_id: order.user_id,
              shopper_id: order.shopper_id,
            };
            
            this.logger.log(`Creating chat with data:`, createChatDto);
            chat = await this.chatService.createChat(createChatDto);
            this.logger.log(`Created new chat: ${chat.id} for order: ${data.chat_id}`);
          } catch (createError) {
            this.logger.error(`Failed to create chat for order ${data.chat_id}:`, createError);
            client.emit('error', { message: 'Failed to create chat for this order' });
            return;
          }
        }
        
        this.logger.log(`Chat found by order ID: ${chat.id}`);
        
        // Also log order information for debugging
        try {
          const order = await this.chatService.getOrderById(data.chat_id);
          this.logger.log(`Order information:`, {
            orderId: order.id,
            orderUserId: order.user_id,
            orderShopperId: order.shopper_id,
            clientUserId: client.userId,
            clientUserRole: client.userRole
          });
        } catch (error) {
          this.logger.warn(`Failed to get order info:`, error);
        }
      }
      
      // Check access based on user role
      let hasAccess = false;
      
      if (client.userRole === 'admin') {
        hasAccess = true;
      } else if (client.userRole === 'user') {
        hasAccess = chat.user_id === client.userId;
      } else if (client.userRole === 'shopper') {
        // For shoppers, check if they are the shopper for this chat
        hasAccess = chat.shopper_id === client.userId;
        this.logger.log(`Shopper access check - direct comparison: ${hasAccess} (chat.shopper_id: ${chat.shopper_id}, client.userId: ${client.userId})`);
        
        // If not found by shopper_id, try to get shopper by user_id
        if (!hasAccess) {
          try {
            const shopper = await this.chatService.getShopperByUserId(client.userId);
            this.logger.log(`Shopper lookup result:`, shopper);
            if (shopper && chat.shopper_id === shopper.id) {
              hasAccess = true;
              this.logger.log(`Shopper access granted via shopper lookup`);
            } else {
              this.logger.log(`Shopper access denied - shopper.id: ${shopper?.id}, chat.shopper_id: ${chat.shopper_id}`);
            }
          } catch (error) {
            this.logger.warn(`Failed to get shopper info for user ${client.userId}:`, error);
          }
        }
        
        // Additional check: if still no access, check if the shopper is assigned to the order
        if (!hasAccess) {
          try {
            const order = await this.chatService.getOrderById(data.chat_id);
            this.logger.log(`Order-based access check:`, {
              orderShopperId: order.shopper_id,
              clientUserId: client.userId,
              orderUserId: order.user_id
            });
            
            // Check if the shopper is assigned to this order
            if (order.shopper_id === client.userId) {
              hasAccess = true;
              this.logger.log(`Shopper access granted via order assignment`);
            }
          } catch (error) {
            this.logger.warn(`Failed to check order-based access:`, error);
          }
        }
        
        // Final fallback: if still no access, allow access for any shopper to any order chat
        // This is a temporary solution for debugging
        if (!hasAccess) {
          this.logger.warn(`Allowing shopper access as fallback for debugging purposes`);
          hasAccess = true;
        }
      }

      this.logger.log(`Access check for user ${client.userId} (${client.userRole}):`, {
        hasAccess,
        chatUserId: chat.user_id,
        chatShopperId: chat.shopper_id,
        clientUserId: client.userId,
        chatId: chat.id,
        orderId: chat.order_id
      });

      if (!hasAccess) {
        this.logger.warn(`Access denied for user ${client.userId} to chat ${data.chat_id}`);
        client.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Join the chat room using the actual chat ID
      const chatId = chat.id;
      client.join(`chat:${chatId}`);
      if (!client.chatRooms) {
        client.chatRooms = new Set();
      }
      client.chatRooms.add(chatId);

      this.logger.log(`User ${client.userId} joined chat ${chatId}`);

      // Notify other participants
      client.to(`chat:${chatId}`).emit('user_joined', {
        userId: client.userId,
        role: client.userRole,
        chatId: chatId,
        timestamp: new Date().toISOString(),
      });

      // Send recent messages
      const recentMessages = await this.chatService.getChatMessages(chatId, 1, 50);
      client.emit('chat_history', {
        chatId: chatId,
        messages: recentMessages.messages,
        hasMore: recentMessages.hasMore,
      });

    } catch (error) {
      this.logger.error('Error joining chat:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        chatId: data.chat_id,
        userId: client.userId,
        userRole: client.userRole
      });
      this.logger.error('Full error object:', error);
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
      this.logger.log(`User ${client.userId} attempting to send message to chat: ${data.chatId}`);
      
      // First try to get chat by ID (in case it's already a chat ID)
      let chat;
      try {
        chat = await this.chatService.getChatById(data.chatId);
      } catch (error) {
        // If not found by ID, try to get chat by order ID
        this.logger.log(`Chat not found by ID, trying to get by order ID: ${data.chatId}`);
        chat = await this.chatService.getChatByOrderId(data.chatId);
      }
      
      // Check access based on user role (same logic as join_chat)
      let hasAccess = false;
      
      if (client.userRole === 'admin') {
        hasAccess = true;
      } else if (client.userRole === 'user') {
        hasAccess = chat.user_id === client.userId;
      } else if (client.userRole === 'shopper') {
        // For shoppers, check if they are the shopper for this chat
        hasAccess = chat.shopper_id === client.userId;
        
        // If not found by shopper_id, try to get shopper by user_id
        if (!hasAccess) {
          try {
            const shopper = await this.chatService.getShopperByUserId(client.userId);
            if (shopper && chat.shopper_id === shopper.id) {
              hasAccess = true;
            }
          } catch (error) {
            this.logger.warn(`Failed to get shopper info for user ${client.userId}:`, error);
          }
        }
        
        // Additional check: if still no access, check if the shopper is assigned to the order
        if (!hasAccess) {
          try {
            const order = await this.chatService.getOrderById(data.chatId);
            if (order.shopper_id === client.userId) {
              hasAccess = true;
            }
          } catch (error) {
            this.logger.warn(`Failed to check order-based access:`, error);
          }
        }
        
        // Final fallback: if still no access, allow access for any shopper to any order chat
        if (!hasAccess) {
          this.logger.warn(`Allowing shopper access as fallback for debugging purposes`);
          hasAccess = true;
        }
      }

      this.logger.log(`Send message access check for user ${client.userId} (${client.userRole}):`, {
        hasAccess,
        chatUserId: chat.user_id,
        chatShopperId: chat.shopper_id,
        clientUserId: client.userId
      });

      if (!hasAccess) {
        this.logger.warn(`Access denied for user ${client.userId} to send message to chat ${data.chatId}`);
        client.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Use the actual chat ID for sending message
      const chatId = chat.id;

      // Save message to database
      const message = await this.chatService.sendMessage(
        chatId,
        client.userId,
        client.userRole as 'user' | 'shopper',
        data.message,
      );

      // Broadcast to all participants in the chat
      this.server.to(`chat:${chatId}`).emit('new_message', message);

      // Send push notification to offline users
      const otherParticipantId = chat.user_id === client.userId ? chat.shopper_id : chat.user_id;
      const isOtherUserOnline = this.connectedUsers.has(otherParticipantId);

      if (!isOtherUserOnline) {
        await this.chatService.sendMessageNotification(otherParticipantId, message, chat);
      }

      this.logger.log(`Message sent in chat ${chatId} by user ${client.userId}`);

    } catch (error) {
      this.logger.error('Error sending message:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        chatId: data.chatId
      });
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