import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { 
  CreateChatDto, 
  SendMessageDto, 
  ChatResponseDto, 
  ChatMessageResponseDto,
  MessageType,
  ChatStatus 
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createChat(createChatDto: CreateChatDto): Promise<ChatResponseDto> {
    // Check if chat already exists for this order
    const existingChat = await this.prisma.chat.findFirst({
      where: { order_id: createChatDto.order_id },
    });

    if (existingChat) {
      return this.formatChatResponse(existingChat);
    }

    // Verify order exists and participants are valid
    const order = await this.prisma.order.findUnique({
      where: { id: createChatDto.order_id },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Note: shopper functionality has been removed in the pivot

    // Validate user_id matches
    if (order.user_id !== createChatDto.user_id) {
      throw new BadRequestException('Invalid user for this order');
    }
    
    // Shopper functionality has been removed in the pivot

    const chat = await this.prisma.chat.create({
      data: {
        order_id: createChatDto.order_id,
        user_id: createChatDto.user_id,
        // Shopper functionality removed
        status: ChatStatus.ACTIVE,
      },
    });

    // Send initial system message
    if (createChatDto.initial_message) {
      await this.sendSystemMessage(
        chat.id,
        createChatDto.initial_message,
        { type: 'chat_created' }
      );
    } else {
      await this.sendSystemMessage(
        chat.id,
        `Chat created for order ${order.id}. ${order.user.first_name} can now communicate with support.`,
        { type: 'chat_created' }
      );
    }

    return this.formatChatResponse(chat);
  }

  async getChatById(chatId: string): Promise<any> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        order: {
          select: { id: true, status: true, estimate_amount: true },
        },
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        // Shopper functionality removed
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async getChatByOrderId(orderId: string): Promise<any> {
    return this.prisma.chat.findFirst({
      where: { order_id: orderId },
      include: {
        order: { select: { id: true, status: true } },
        user: { select: { id: true, first_name: true, last_name: true } },
        // Shopper functionality removed
      },
    });
  }

  async getOrderById(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        user_id: true,
        // Shopper functionality removed
        status: true,
      },
    });

    if (!order) {
      return null;
    }

    return {
      ...order,
      // Shopper functionality removed
    };
  }




  async getUserChats(userId: string, page = 1, limit = 20): Promise<{ chats: ChatResponseDto[]; total: number }> {
    const offset = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where: {
          user_id: userId,
        },
        include: {
          order: { select: { id: true, status: true, estimate_amount: true } },
          user: { select: { id: true, first_name: true, last_name: true } },
          // Shopper functionality removed
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              user: { select: { id: true, first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { updated_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.chat.count({
        where: {
          user_id: userId,
        },
      }),
    ]);

    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.getUnreadMessageCount(chat.id, userId);
        return {
          ...this.formatChatResponse(chat),
          last_message: chat.messages[0] ? this.formatMessageResponse(chat.messages[0]) : undefined,
          unread_count: unreadCount,
        };
      })
    );

    return { chats: formattedChats, total };
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    senderRole: 'user',
    messageDto: SendMessageDto,
  ): Promise<ChatMessageResponseDto> {
    // Verify chat exists and user has access
    const chat = await this.getChatById(chatId);
    
    let hasAccess = chat.user_id === senderId;
    
    // Shopper functionality has been removed
    
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this chat');
    }

    if (chat.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Cannot send message to closed chat');
    }

    console.log('sendMessage - senderId:', senderId, 'senderRole:', senderRole);

    // Determine the correct sender_id based on role
    let actualSenderId = senderId;
    // Shopper functionality has been removed in the pivot

    // Create message with proper sender_id
    const message = await this.prisma.chatMessage.create({
      data: {
        order_id: chat.order_id,
        chat_id: chatId,
        sender: senderRole,
        sender_id: actualSenderId, // Use correct sender ID
        sender_role: senderRole,
        text: messageDto.content, // Use text field as it's required
        content: messageDto.content,
        type: messageDto.type,
        attachment_url: messageDto.attachment_url,
        attachment_type: messageDto.attachment_type,
        metadata: messageDto.metadata,
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    // Update chat's last activity
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updated_at: new Date() },
    });

    return this.formatMessageResponse(message);
  }

  async sendSystemMessage(
    chatId: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<ChatMessageResponseDto> {
    // Get chat to find order_id
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { order_id: true },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        order_id: chat.order_id,
        chat_id: chatId,
        sender: 'system',
        sender_id: null, // Set to null to avoid foreign key constraint issues
        sender_role: 'system',
        text: content, // Use text field as it's required
        content,
        type: MessageType.SYSTEM,
        metadata,
      },
    });

    return this.formatMessageResponse(message);
  }

  async getChatMessages(
    chatId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: ChatMessageResponseDto[]; hasMore: boolean; total: number }> {
    const offset = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { chat_id: chatId },
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.chatMessage.count({
        where: { chat_id: chatId },
      }),
    ]);

    return {
      messages: messages.reverse().map(this.formatMessageResponse),
      hasMore: offset + limit < total,
      total,
    };
  }

  async markMessagesAsRead(userId: string, messageIds: string[]): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        sender_id: { not: userId }, // Don't mark own messages as read
        read_at: null,
      },
      data: {
        read_at: new Date(),
      },
    });
  }

  async getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: {
        chat_id: chatId,
        sender_id: { not: userId },
        read_at: null,
      },
    });
  }

  async getUnreadMessages(chatId: string, userId: string): Promise<any[]> {
    return this.prisma.chatMessage.findMany({
      where: {
        chat_id: chatId,
        sender_id: { not: userId },
        read_at: null,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async closeChat(chatId: string, closedBy: string): Promise<void> {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { 
        status: ChatStatus.CLOSED,
        updated_at: new Date(),
      },
    });

    // Send system message
    await this.sendSystemMessage(
      chatId,
      'Chat has been closed',
      { closedBy, timestamp: new Date().toISOString() }
    );
  }

  async archiveChat(chatId: string): Promise<void> {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { 
        status: ChatStatus.ARCHIVED,
        updated_at: new Date(),
      },
    });
  }

  // Notification methods
  async sendMessageNotification(
    recipientId: string,
    message: ChatMessageResponseDto,
    chat: any,
  ): Promise<void> {
    const senderName = message.sender_role === 'system' 
      ? 'System'
      : chat.user.first_name;

    await this.notificationService.sendNotification(recipientId, {
      user_id: recipientId,
      title: `New message from ${senderName}`,
      body: message.type === MessageType.TEXT 
        ? message.content 
        : message.type === MessageType.IMAGE 
          ? '📷 Image' 
          : 'New message',
      icon: '/icons/chat-notification.png',
      tag: `chat-${chat.id}`,
      data: {
        type: 'chat_message',
        chatId: chat.id,
        messageId: message.id,
        orderId: chat.order_id,
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply.png',
        },
        {
          action: 'view_order',
          title: 'View Order',
          icon: '/icons/order.png',
        },
      ],
    });
  }

  async sendOrderUpdateNotification(userId: string, update: any): Promise<void> {
    await this.notificationService.sendNotification(userId, {
      user_id: userId,
      title: 'Order Update',
      body: `Your order status has been updated to: ${update.status}`,
      icon: '/icons/order-update.png',
      tag: `order-${update.orderId}`,
      data: {
        type: 'order_update',
        orderId: update.orderId,
        status: update.status,
      },
      actions: [
        {
          action: 'view_order',
          title: 'View Order',
          icon: '/icons/order.png',
        },
      ],
    });
  }

  // Helper methods
  private formatChatResponse(chat: any): ChatResponseDto {
    return {
      id: chat.id,
      order_id: chat.order_id,
      user_id: chat.user_id,
      // Shopper functionality removed
      status: chat.status,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    };
  }

  private formatMessageResponse(message: any): ChatMessageResponseDto {
    return {
      id: message.id,
      chat_id: message.chat_id,
      sender_id: message.sender_id,
      sender_role: message.sender_role,
      content: message.content || message.text, // Use text field as fallback
      type: message.type,
      attachment_url: message.attachment_url,
      attachment_type: message.attachment_type,
      metadata: message.metadata,
      created_at: message.created_at,
      read_at: message.read_at,
    };
  }

  // Admin methods
  async getChatStats(): Promise<any> {
    const [
      totalChats,
      activeChats,
      closedChats,
      totalMessages,
      avgMessagesPerChat,
    ] = await Promise.all([
      this.prisma.chat.count(),
      this.prisma.chat.count({ where: { status: ChatStatus.ACTIVE } }),
      this.prisma.chat.count({ where: { status: ChatStatus.CLOSED } }),
      this.prisma.chatMessage.count(),
      this.prisma.chatMessage.groupBy({
        by: ['chat_id'],
        _count: { id: true },
      }).then(results => {
        const total = results.reduce((sum, chat) => sum + chat._count.id, 0);
        return results.length > 0 ? total / results.length : 0;
      }),
    ]);

    return {
      total_chats: totalChats,
      active_chats: activeChats,
      closed_chats: closedChats,
      total_messages: totalMessages,
      avg_messages_per_chat: Math.round(avgMessagesPerChat * 100) / 100,
    };
  }
}
