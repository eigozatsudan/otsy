import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { NotificationService } from '../notifications/notification.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateChatDto,
  SendMessageDto,
  MarkAsReadDto,
  PushSubscriptionDto,
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
  MessageType,
} from './dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // Chat management endpoints
  @Post()
  @UseGuards(RolesGuard)
  @Roles('user', 'shopper', 'admin')
  async createChat(@CurrentUser() user: any, @Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(createChatDto);
  }

  @Get('my-chats')
  async getMyChats(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.chatService.getUserChats(user.id, pageNum, limitNum);
  }

  @Get(':id')
  async getChatById(@CurrentUser() user: any, @Param('id') id: string) {
    const chat = await this.chatService.getChatById(id);
    
    // Check if user has access to this chat
    let hasAccess = 
      chat.user_id === user.id || 
      user.role === 'admin';

    // If user is a shopper, check if they are the shopper for this chat
    if (!hasAccess && user.role === 'shopper') {
      const shopper = await this.chatService.getShopperById(user.id);
      if (shopper && chat.shopper_id === shopper.user_id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return chat;
  }

  @Get(':id/messages')
  async getChatMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Verify access to chat
    const chat = await this.chatService.getChatById(id);
    let hasAccess = 
      chat.user_id === user.id || 
      user.role === 'admin';

    // If user is a shopper, check if they are the shopper for this chat
    if (!hasAccess && user.role === 'shopper') {
      const shopper = await this.chatService.getShopperById(user.id);
      if (shopper && chat.shopper_id === shopper.user_id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    
    return this.chatService.getChatMessages(id, pageNum, limitNum);
  }

  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() messageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      id,
      user.id,
      user.role as 'user' | 'shopper',
      messageDto,
    );
  }

  @Put(':id/messages/read')
  async markMessagesAsRead(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    return this.chatService.markMessagesAsRead(user.id, markAsReadDto.message_ids);
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles('admin', 'user', 'shopper')
  async closeChat(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.closeChat(id, user.id);
  }

  @Get(':id/unread-count')
  async getUnreadCount(@CurrentUser() user: any, @Param('id') id: string) {
    const count = await this.chatService.getUnreadMessageCount(id, user.id);
    return { unread_count: count };
  }

  // Push notification endpoints
  @Post('notifications/subscribe')
  async subscribeToPushNotifications(
    @CurrentUser() user: any,
    @Body() subscription: PushSubscriptionDto,
    @Request() req: any,
  ) {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
    };

    await this.notificationService.subscribeToPushNotifications(
      user.id,
      subscription,
      deviceInfo,
    );

    return { success: true, message: 'Subscribed to push notifications' };
  }

  @Post('notifications/unsubscribe')
  async unsubscribeFromPushNotifications(
    @CurrentUser() user: any,
    @Body() body: { endpoint: string },
  ) {
    await this.notificationService.unsubscribeFromPushNotifications(
      user.id,
      body.endpoint,
    );

    return { success: true, message: 'Unsubscribed from push notifications' };
  }

  @Get('notifications/preferences')
  async getNotificationPreferences(@CurrentUser() user: any) {
    return this.notificationService.getUserNotificationPreferences(user.id);
  }

  @Put('notifications/preferences')
  async updateNotificationPreferences(
    @CurrentUser() user: any,
    @Body() preferences: UpdateNotificationPreferencesDto,
  ) {
    await this.notificationService.updateNotificationPreferences(user.id, preferences);
    return { success: true, message: 'Notification preferences updated' };
  }

  @Get('notifications/history')
  async getNotificationHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.notificationService.getNotificationHistory(user.id, pageNum, limitNum);
  }

  // Test notification endpoint (development only)
  @Post('notifications/test')
  async sendTestNotification(
    @CurrentUser() user: any,
    @Body() notification: { title: string; body: string },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test notifications not available in production');
    }

    await this.notificationService.sendNotification(user.id, {
      user_id: user.id,
      title: notification.title,
      body: notification.body,
      icon: '/icons/test.png',
      tag: 'test-notification',
      data: { type: 'test' },
    });

    return { success: true, message: 'Test notification sent' };
  }

  // Admin endpoints
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getChatStats() {
    return this.chatService.getChatStats();
  }

  @Get('admin/notifications/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getNotificationStats() {
    return this.notificationService.getNotificationStats();
  }

  @Post('admin/notifications/broadcast')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async broadcastNotification(
    @Body() body: { user_ids: string[]; notification: SendNotificationDto },
  ) {
    const result = await this.notificationService.sendBulkNotification(
      body.user_ids,
      body.notification,
    );

    return {
      success: true,
      message: `Notification sent to ${result.sent} users, ${result.failed} failed`,
      ...result,
    };
  }

  // Order integration endpoints
  @Get('order/:orderId')
  async getChatByOrderId(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const chat = await this.chatService.getChatByOrderId(orderId);
    
    if (!chat) {
      return null;
    }

    // Check access
    const hasAccess = 
      chat.user_id === user.id || 
      chat.shopper_id === user.id ||
      user.role === 'admin';

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return chat;
  }

  @Post('order/:orderId/create')
  async createChatForOrder(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() body: { shopper_id?: string; initial_message?: string },
  ) {
    // This would typically be called automatically when an order is accepted
    // For manual creation, we need to verify the order details
    
    return this.chatService.createChat({
      order_id: orderId,
      user_id: user.id,
      shopper_id: body.shopper_id || user.id, // Fallback for testing
      initial_message: body.initial_message,
    });
  }

  // Convenience endpoints for order-based operations
  @Get('orders/:orderId/messages')
  async getOrderMessages(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      // First get the chat for this order
      const chat = await this.chatService.getChatByOrderId(orderId);
      
      if (!chat) {
        // Return empty messages array if no chat exists
        return { messages: [], hasMore: false, total: 0 };
      }

      // Check access
      let hasAccess = 
        chat.user_id === user.id || 
        user.role === 'admin';

      // If user is a shopper, check if they are the shopper for this chat
      if (!hasAccess && user.role === 'shopper') {
        const shopper = await this.chatService.getShopperById(user.id);
        if (shopper && chat.shopper_id === shopper.user_id) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 50;
      
      console.log('Getting messages for chat:', {
        chatId: chat.id,
        page: pageNum,
        limit: limitNum
      });
      
      const result = await this.chatService.getChatMessages(chat.id, pageNum, limitNum);
      console.log('Messages result:', {
        messageCount: result.messages.length,
        hasMore: result.hasMore,
        total: result.total
      });
      
      return result;
    } catch (error) {
      console.error('Error getting order messages:', error);
      // Return empty messages array on any error
      return { messages: [], hasMore: false, total: 0 };
    }
  }

  @Post('orders/:orderId/messages')
  @UseInterceptors(FilesInterceptor('attachments'))
  async sendOrderMessage(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() body: any,
    @UploadedFiles() files: any[],
    @Request() req: any,
  ) {
    try {
      // First get the chat for this order
      let chat = await this.chatService.getChatByOrderId(orderId);
      
      if (!chat) {
        // Create a new chat for this order if it doesn't exist
        console.log(`Creating new chat for order ${orderId}`);
        const messageContent = body.message || body.content || '';
        
        // Get order details to find the correct participants
        const order = await this.chatService.getOrderById(orderId);
        if (!order) {
          throw new Error('Order not found');
        }
        
        // Use the shopper_id from order (which is already converted to user_id by getOrderById)
        let validShopperId = order.shopper_id;
        if (validShopperId) {
          const shopperExists = await this.chatService.checkShopperExists(validShopperId);
          if (!shopperExists) {
            console.log(`Shopper ${validShopperId} does not exist, setting shopper_id to null`);
            validShopperId = null;
          }
        }
        
        chat = await this.chatService.createChat({
          order_id: orderId,
          user_id: order.user_id,
          shopper_id: validShopperId,
          initial_message: messageContent,
        });
      }

      // Check access
      console.log('Access check:', {
        chatUserId: chat.user_id,
        chatShopperId: chat.shopper_id,
        currentUserId: user.id,
        userRole: user.role,
        orderId: orderId
      });
      
      // For shoppers, we need to check if the current user is the shopper's user_id
      let hasAccess = 
        chat.user_id === user.id || 
        user.role === 'admin';

      // If user is a shopper, check if they are the shopper for this chat
      if (!hasAccess && user.role === 'shopper') {
        // Get the shopper record by shopper ID to find the user_id
        const shopper = await this.chatService.getShopperById(user.id);
        console.log('Shopper lookup result:', {
          userId: user.id,
          shopper: shopper,
          chatShopperId: chat.shopper_id
        });
        
        if (shopper && chat.shopper_id === shopper.user_id) {
          hasAccess = true;
          console.log('Shopper access granted');
        }
      }

      console.log('Access result:', hasAccess);

      if (!hasAccess) {
        console.error('Access denied for user:', {
          userId: user.id,
          userRole: user.role,
          chatUserId: chat.user_id,
          chatShopperId: chat.shopper_id
        });
        throw new Error('Access denied');
      }

      // Create proper message DTO
      const messageDto: SendMessageDto = {
        content: body.message || body.content || '',
        type: MessageType.TEXT,
        attachment_url: body.attachment_url,
        attachment_type: body.attachment_type,
        metadata: body.metadata,
      };

      console.log('Controller received body:', body);
      console.log('Created messageDto:', messageDto);

      console.log('About to call chatService.sendMessage with:', {
        chatId: chat.id,
        senderId: user.id,
        senderRole: user.role,
        messageDto: messageDto
      });

      const message = await this.chatService.sendMessage(
        chat.id,
        user.id,
        user.role as 'user' | 'shopper',
        messageDto,
      );

      console.log('chatService.sendMessage returned:', message);

      // Broadcast message via WebSocket
      console.log('About to broadcast message via WebSocket:', {
        chatId: chat.id,
        messageId: message.id,
        messageContent: message.content
      });
      
      try {
        this.chatGateway.broadcastMessage(chat.id, message);
        console.log('Message broadcasted successfully');
      } catch (error) {
        console.error('Error broadcasting message via WebSocket:', error);
        // Don't fail the entire request if WebSocket broadcast fails
      }

      return message;
    } catch (error) {
      console.error('Error sending order message:', error);
      throw error;
    }
  }

  @Post('orders/:orderId/mark-read')
  async markOrderMessagesAsRead(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    try {
      // First get the chat for this order
      const chat = await this.chatService.getChatByOrderId(orderId);
      
      if (!chat) {
        // Return success if no chat exists (nothing to mark as read)
        return { success: true, marked_count: 0 };
      }

      // Check access
      let hasAccess = 
        chat.user_id === user.id || 
        user.role === 'admin';

      if (!hasAccess && user.role === 'shopper') {
        const shopper = await this.chatService.getShopperById(user.id);
        if (shopper && chat.shopper_id === shopper.user_id) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get all unread messages for this chat
      const unreadMessages = await this.chatService.getUnreadMessages(chat.id, user.id);
      const messageIds = unreadMessages.map(msg => msg.id);
      
      if (messageIds.length > 0) {
        await this.chatService.markMessagesAsRead(user.id, messageIds);
      }

      return { success: true, marked_count: messageIds.length };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Return success even if there's an error to prevent frontend issues
      return { success: true, marked_count: 0 };
    }
  }
}