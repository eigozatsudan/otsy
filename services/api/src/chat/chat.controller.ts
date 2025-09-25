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
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { NotificationService } from '../notifications/notification.service';
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
} from './dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
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
    const hasAccess = 
      chat.user_id === user.id || 
      chat.shopper_id === user.id ||
      user.role === 'admin';

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
    const hasAccess = 
      chat.user_id === user.id || 
      chat.shopper_id === user.id ||
      user.role === 'admin';

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
}