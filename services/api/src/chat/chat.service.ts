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
        shopper: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== createChatDto.user_id || order.shopper_id !== createChatDto.shopper_id) {
      throw new BadRequestException('Invalid participants for this order');
    }

    const chat = await this.prisma.chat.create({
      data: {
        order_id: createChatDto.order_id,
        user_id: createChatDto.user_id,
        shopper_id: createChatDto.shopper_id,
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
        `Chat created for order ${order.id}. ${order.user.first_name} and ${order.shopper?.first_name} can now communicate.`,
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
        shopper: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
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
        shopper: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async getUserChats(userId: string, page = 1, limit = 20): Promise<{ chats: ChatResponseDto[]; total: number }> {
    const offset = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where: {
          OR: [
            { user_id: userId },
            { shopper_id: userId },
          ],
        },
        include: {
          order: { select: { id: true, status: true, estimate_amount: true } },
          user: { select: { id: true, first_name: true, last_name: true } },
          shopper: { select: { id: true, first_name: true, last_name: true } },
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              sender: { select: { id: true, first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { updated_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.chat.count({
        where: {
          OR: [
            { user_id: userId },
            { shopper_id: userId },
          ],
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
    senderRole: 'user' | 'shopper',
    messageDto: SendMessageDto,
  ): Promise<ChatMessageResponseDto> {
    // Verify chat exists and user has access
    const chat = await this.getChatById(chatId);
    
    const hasAccess = chat.user_id === senderId || chat.shopper_id === senderId;
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this chat');
    }

    if (chat.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Cannot send message to closed chat');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        chat_id: chatId,
        sender_id: senderId,
        sender_role: senderRole,
        content: messageDto.content,
        type: messageDto.type,
        attachment_url: messageDto.attachment_url,
        attachment_type: messageDto.attachment_type,
        metadata: messageDto.metadata,
      },
      include: {
        sender: { select: { id: true, first_name: true, last_name: true } },
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
    const message = await this.prisma.chatMessage.create({
      data: {
        chat_id: chatId,
        sender_id: 'system',
        sender_role: 'system',
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
          sender: { select: { id: true, first_name: true, last_name: true } },
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
      : `${chat.user_id === message.sender_id ? chat.user.first_name : chat.shopper.first_name}`;

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
      shopper_id: chat.shopper_id,
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
      content: message.content,
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