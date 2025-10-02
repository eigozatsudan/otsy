import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { 
  PushSubscriptionDto, 
  SendNotificationDto, 
  UpdateNotificationPreferencesDto 
} from '../chat/dto/chat.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:support@otsy.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured. Push notifications will not work.');
      return;
    }

    try {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.logger.log('Web Push initialized with VAPID keys');
    } catch (error) {
      this.logger.error('Failed to initialize Web Push with VAPID keys:', error.message);
      this.logger.warn('Push notifications will not work due to invalid VAPID keys.');
    }
  }

  async subscribeToPushNotifications(
    userId: string,
    subscription: PushSubscriptionDto,
    deviceInfo?: { userAgent?: string; platform?: string },
  ): Promise<void> {
    try {
      // Check if subscription already exists
      const existingSubscription = await this.prisma.pushSubscription.findFirst({
        where: {
          user_id: userId,
          endpoint: subscription.endpoint,
        },
      });

      if (existingSubscription) {
        // Update existing subscription
        await this.prisma.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            device_info: deviceInfo,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new subscription
        await this.prisma.pushSubscription.create({
          data: {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            device_info: deviceInfo,
          },
        });
      }

      this.logger.log(`Push subscription registered for user ${userId}`);
    } catch (error) {
      this.logger.error('Error registering push subscription:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: {
        user_id: userId,
        endpoint,
      },
    });

    this.logger.log(`Push subscription removed for user ${userId}`);
  }

  async sendNotification(userId: string, notification: SendNotificationDto): Promise<void> {
    try {
      // Get user's notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      
      // Check if user wants this type of notification
      if (!this.shouldSendNotification(notification, preferences)) {
        this.logger.debug(`Notification skipped due to user preferences: ${userId}`);
        return;
      }

      // Get user's push subscriptions
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { user_id: userId },
      });

      if (subscriptions.length === 0) {
        this.logger.debug(`No push subscriptions found for user ${userId}`);
        return;
      }

      // Prepare notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/default-notification.png',
        badge: notification.badge || '/icons/badge.png',
        tag: notification.tag,
        data: notification.data,
        actions: notification.actions,
        timestamp: Date.now(),
        requireInteraction: false,
        silent: false,
      });

      // Send to all user's devices
      const sendPromises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
            {
              TTL: 24 * 60 * 60, // 24 hours
              urgency: 'normal',
            }
          );

          this.logger.debug(`Notification sent to device: ${subscription.endpoint.slice(-10)}...`);
        } catch (error) {
          this.logger.error(`Failed to send notification to device:`, error);
          
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.prisma.pushSubscription.delete({
              where: { id: subscription.id },
            });
            this.logger.log(`Removed invalid push subscription: ${subscription.id}`);
          }
        }
      });

      await Promise.allSettled(sendPromises);

      // Log notification in database
      await this.prisma.notificationLog.create({
        data: {
          user_id: userId,
          title: notification.title,
          body: notification.body,
          type: this.getNotificationType(notification),
          payload: notification.data,
          sent_at: new Date(),
        },
      });

      this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendBulkNotification(
    userIds: string[],
    notification: SendNotificationDto,
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const sendPromises = userIds.map(async (userId) => {
      try {
        await this.sendNotification(userId, { ...notification, user_id: userId });
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send notification to user ${userId}:`, error);
        failed++;
      }
    });

    await Promise.allSettled(sendPromises);

    this.logger.log(`Bulk notification sent: ${sent} successful, ${failed} failed`);
    return { sent, failed };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: UpdateNotificationPreferencesDto,
  ): Promise<void> {
    await this.prisma.notificationPreferences.upsert({
      where: { user_id: userId },
      update: {
        order_updates: preferences.order_updates,
        chat_messages: preferences.chat_messages,
        promotional: preferences.promotional,
        system_alerts: preferences.system_alerts,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        order_updates: preferences.order_updates ?? true,
        chat_messages: preferences.chat_messages ?? true,
        promotional: preferences.promotional ?? false,
        system_alerts: preferences.system_alerts ?? true,
      },
    });

    this.logger.log(`Notification preferences updated for user ${userId}`);
  }

  async getUserNotificationPreferences(userId: string): Promise<any> {
    const preferences = await this.prisma.notificationPreferences.findUnique({
      where: { user_id: userId },
    });

    // Return default preferences if none exist
    return preferences || {
      order_updates: true,
      chat_messages: true,
      promotional: false,
      system_alerts: true,
    };
  }

  async getNotificationHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { user_id: userId },
        orderBy: { sent_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.notificationLog.count({
        where: { user_id: userId },
      }),
    ]);

    return { notifications, total };
  }

  // Predefined notification templates
  async sendOrderStatusNotification(userId: string, orderId: string, status: string): Promise<void> {
    const statusMessages = {
      accepted: 'Your order has been accepted',
      shopping: 'Your order is being processed',
      receipt_pending: 'A receipt has been submitted for review',
      completed: 'Your order has been completed',
      cancelled: 'Your order has been cancelled',
    };

    await this.sendNotification(userId, {
      user_id: userId,
      title: 'Order Update',
      body: statusMessages[status] || `Order status updated: ${status}`,
      icon: '/icons/order-update.png',
      tag: `order-${orderId}`,
      data: {
        type: 'order_update',
        orderId,
        status,
      },
      actions: [
        {
          action: 'view_order',
          title: 'View Order',
          icon: '/icons/view.png',
        },
      ],
    });
  }

  async sendNewOrderNotification(userId: string, orderId: string): Promise<void> {
    await this.sendNotification(userId, {
      user_id: userId,
      title: 'Order Update',
      body: 'Your order status has been updated',
      icon: '/icons/new-order.png',
      tag: `new-order-${orderId}`,
      data: {
        type: 'new_order',
        orderId,
      },
      actions: [
        {
          action: 'view_order',
          title: 'View Order',
          icon: '/icons/view.png',
        },
        {
          action: 'accept_order',
          title: 'Accept',
          icon: '/icons/accept.png',
        },
      ],
    });
  }

  async sendPaymentNotification(userId: string, type: 'authorized' | 'captured' | 'failed', amount: number): Promise<void> {
    const messages = {
      authorized: `Payment of ¥${amount} has been authorized`,
      captured: `Payment of ¥${amount} has been processed`,
      failed: `Payment of ¥${amount} failed. Please update your payment method`,
    };

    await this.sendNotification(userId, {
      user_id: userId,
      title: 'Payment Update',
      body: messages[type],
      icon: '/icons/payment.png',
      tag: `payment-${type}`,
      data: {
        type: 'payment_update',
        paymentType: type,
        amount,
      },
    });
  }

  // Helper methods
  private shouldSendNotification(notification: SendNotificationDto, preferences: any): boolean {
    // Determine notification type and check preferences
    const notificationType = this.getNotificationType(notification);
    
    switch (notificationType) {
      case 'order_update':
        return preferences.order_updates;
      case 'chat_message':
        return preferences.chat_messages;
      case 'promotional':
        return preferences.promotional;
      case 'system_alert':
        return preferences.system_alerts;
      default:
        return true; // Send by default for unknown types
    }
  }

  private getNotificationType(notification: SendNotificationDto): string {
    if (notification.data?.type) {
      return notification.data.type;
    }
    
    // Infer type from title or content
    if (notification.title.toLowerCase().includes('order')) {
      return 'order_update';
    }
    if (notification.title.toLowerCase().includes('message')) {
      return 'chat_message';
    }
    if (notification.title.toLowerCase().includes('promotion') || notification.title.toLowerCase().includes('offer')) {
      return 'promotional';
    }
    
    return 'system_alert';
  }

  // Admin methods
  async getNotificationStats(): Promise<any> {
    const [
      totalNotifications,
      notificationsToday,
      activeSubscriptions,
      notificationsByType,
    ] = await Promise.all([
      this.prisma.notificationLog.count(),
      this.prisma.notificationLog.count({
        where: {
          sent_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.pushSubscription.count(),
      this.prisma.notificationLog.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
    ]);

    return {
      total_notifications: totalNotifications,
      notifications_today: notificationsToday,
      active_subscriptions: activeSubscriptions,
      notifications_by_type: notificationsByType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {}),
    };
  }
}