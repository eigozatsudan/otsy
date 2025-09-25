import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  PushSubscriptionDto,
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
} from '../chat/dto/chat.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Push subscription management
  @Post('subscribe')
  async subscribe(
    @CurrentUser() user: any,
    @Body() subscription: PushSubscriptionDto,
    @Request() req: any,
  ) {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      ip: req.ip,
    };

    await this.notificationService.subscribeToPushNotifications(
      user.id,
      subscription,
      deviceInfo,
    );

    return {
      success: true,
      message: 'Successfully subscribed to push notifications',
    };
  }

  @Post('unsubscribe')
  async unsubscribe(
    @CurrentUser() user: any,
    @Body() body: { endpoint: string },
  ) {
    await this.notificationService.unsubscribeFromPushNotifications(
      user.id,
      body.endpoint,
    );

    return {
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    };
  }

  // Notification preferences
  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationService.getUserNotificationPreferences(user.id);
  }

  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() preferences: UpdateNotificationPreferencesDto,
  ) {
    await this.notificationService.updateNotificationPreferences(user.id, preferences);
    
    return {
      success: true,
      message: 'Notification preferences updated successfully',
    };
  }

  // Notification history
  @Get('history')
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.notificationService.getNotificationHistory(user.id, pageNum, limitNum);
  }

  // Test notifications (development/testing)
  @Post('test')
  async sendTestNotification(
    @CurrentUser() user: any,
    @Body() body: { 
      title: string; 
      body: string; 
      type?: string;
      data?: Record<string, any>;
    },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test notifications are not available in production');
    }

    await this.notificationService.sendNotification(user.id, {
      user_id: user.id,
      title: body.title,
      body: body.body,
      icon: '/icons/test-notification.png',
      tag: `test-${Date.now()}`,
      data: {
        type: body.type || 'test',
        timestamp: new Date().toISOString(),
        ...body.data,
      },
    });

    return {
      success: true,
      message: 'Test notification sent successfully',
    };
  }

  // Predefined notification triggers
  @Post('order-status')
  async sendOrderStatusNotification(
    @CurrentUser() user: any,
    @Body() body: { order_id: string; status: string; user_id?: string },
  ) {
    // Allow admin to send notifications to other users
    const targetUserId = user.role === 'admin' && body.user_id ? body.user_id : user.id;
    
    await this.notificationService.sendOrderStatusNotification(
      targetUserId,
      body.order_id,
      body.status,
    );

    return {
      success: true,
      message: 'Order status notification sent',
    };
  }

  @Post('payment-update')
  async sendPaymentNotification(
    @CurrentUser() user: any,
    @Body() body: { 
      type: 'authorized' | 'captured' | 'failed'; 
      amount: number;
      user_id?: string;
    },
  ) {
    const targetUserId = user.role === 'admin' && body.user_id ? body.user_id : user.id;
    
    await this.notificationService.sendPaymentNotification(
      targetUserId,
      body.type,
      body.amount,
    );

    return {
      success: true,
      message: 'Payment notification sent',
    };
  }

  // Admin endpoints
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getStats() {
    return this.notificationService.getNotificationStats();
  }

  @Post('admin/broadcast')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async broadcastNotification(
    @Body() body: {
      user_ids?: string[];
      user_roles?: string[];
      notification: Omit<SendNotificationDto, 'user_id'>;
    },
  ) {
    let targetUserIds = body.user_ids || [];

    // If user_roles specified, get users by role
    if (body.user_roles && body.user_roles.length > 0) {
      // This would require a method to get users by role
      // For now, we'll just use the provided user_ids
    }

    if (targetUserIds.length === 0) {
      throw new Error('No target users specified');
    }

    const result = await this.notificationService.sendBulkNotification(
      targetUserIds,
      body.notification as SendNotificationDto,
    );

    return {
      success: true,
      message: `Broadcast notification sent to ${result.sent} users, ${result.failed} failed`,
      sent: result.sent,
      failed: result.failed,
    };
  }

  @Post('admin/send-to-user/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async sendNotificationToUser(
    @Param('userId') userId: string,
    @Body() notification: Omit<SendNotificationDto, 'user_id'>,
  ) {
    await this.notificationService.sendNotification(userId, {
      ...notification,
      user_id: userId,
    });

    return {
      success: true,
      message: `Notification sent to user ${userId}`,
    };
  }

  // System notification endpoints (for internal use)
  @Post('system/new-order')
  @UseGuards(RolesGuard)
  @Roles('system', 'admin')
  async notifyNewOrder(
    @Body() body: { shopper_id: string; order_id: string },
  ) {
    await this.notificationService.sendNewOrderNotification(
      body.shopper_id,
      body.order_id,
    );

    return {
      success: true,
      message: 'New order notification sent to shopper',
    };
  }

  // VAPID public key endpoint (for client-side subscription)
  @Get('vapid-public-key')
  async getVapidPublicKey() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      throw new Error('VAPID public key not configured');
    }

    return {
      publicKey,
    };
  }
}