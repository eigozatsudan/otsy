import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto,
  SubscriptionTier, 
  SubscriptionStatus,
  SubscriptionBenefits,
  ServiceCreditDto,
  UseServiceCreditDto,
  ServiceCreditReason 
} from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Subscription tier benefits configuration
  private readonly tierBenefits: Record<SubscriptionTier, SubscriptionBenefits> = {
    [SubscriptionTier.FREE]: {
      priority_matching: false,
      guaranteed_time_slots: 0,
      free_deliveries: 0,
      premium_shoppers: false,
      dedicated_support: false,
      service_credits_multiplier: 1.0,
      max_concurrent_orders: 1,
      early_access_features: false,
    },
    [SubscriptionTier.BASIC]: {
      priority_matching: true,
      guaranteed_time_slots: 4,
      free_deliveries: 2,
      premium_shoppers: false,
      dedicated_support: false,
      service_credits_multiplier: 1.2,
      max_concurrent_orders: 2,
      early_access_features: false,
    },
    [SubscriptionTier.PREMIUM]: {
      priority_matching: true,
      guaranteed_time_slots: 12,
      free_deliveries: 5,
      premium_shoppers: true,
      dedicated_support: true,
      service_credits_multiplier: 1.5,
      max_concurrent_orders: 3,
      early_access_features: true,
    },
    [SubscriptionTier.VIP]: {
      priority_matching: true,
      guaranteed_time_slots: 24,
      free_deliveries: 10,
      premium_shoppers: true,
      dedicated_support: true,
      service_credits_multiplier: 2.0,
      max_concurrent_orders: 5,
      early_access_features: true,
    },
  };

  private readonly tierPricing: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.BASIC]: 980,
    [SubscriptionTier.PREMIUM]: 1980,
    [SubscriptionTier.VIP]: 3980,
  };

  async createSubscription(userId: string, createDto: CreateSubscriptionDto) {
    // Check if user already has an active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    const startDate = createDto.start_date ? new Date(createDto.start_date) : new Date();
    const endDate = createDto.tier === SubscriptionTier.FREE 
      ? null 
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const subscription = await this.prisma.subscription.create({
      data: {
        user_id: userId,
        tier: createDto.tier,
        status: SubscriptionStatus.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        next_billing_date: endDate,
        monthly_fee: this.tierPricing[createDto.tier],
        benefits: this.tierBenefits[createDto.tier],
      },
    });

    // Initialize service credits for new subscribers
    if (createDto.tier !== SubscriptionTier.FREE) {
      await this.addServiceCredit(userId, {
        amount: 500, // Welcome bonus
        reason: ServiceCreditReason.COMPENSATION,
        description: 'Welcome bonus for new subscription',
      });
    }

    // Create audit log
    await this.prisma.subscriptionAuditLog.create({
      data: {
        subscription_id: subscription.id,
        action: 'subscription_created',
        actor_id: userId,
        actor_role: 'user',
        payload: {
          tier: createDto.tier,
          monthly_fee: this.tierPricing[createDto.tier],
        },
      },
    });

    return this.formatSubscriptionResponse(subscription);
  }

  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      // Return default free subscription
      return {
        id: null,
        user_id: userId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        start_date: new Date(),
        end_date: null,
        next_billing_date: null,
        monthly_fee: 0,
        benefits: this.tierBenefits[SubscriptionTier.FREE],
        created_at: new Date(),
        updated_at: new Date(),
      };
    }

    return this.formatSubscriptionResponse(subscription);
  }

  async updateSubscription(userId: string, updateDto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const updateData: any = {};

    if (updateDto.tier && updateDto.tier !== subscription.tier) {
      updateData.tier = updateDto.tier;
      updateData.monthly_fee = this.tierPricing[updateDto.tier];
      updateData.benefits = this.tierBenefits[updateDto.tier];
      
      // If upgrading, apply immediately. If downgrading, apply at next billing cycle
      if (this.isUpgrade(subscription.tier as SubscriptionTier, updateDto.tier)) {
        updateData.updated_at = new Date();
      }
    }

    if (updateDto.status) {
      updateData.status = updateDto.status;
      
      if (updateDto.status === SubscriptionStatus.CANCELLED) {
        updateData.end_date = new Date();
        updateData.cancellation_reason = updateDto.cancellation_reason;
      }
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    // Create audit log
    await this.prisma.subscriptionAuditLog.create({
      data: {
        subscription_id: subscription.id,
        action: 'subscription_updated',
        actor_id: userId,
        actor_role: 'user',
        payload: updateDto,
      },
    });

    return this.formatSubscriptionResponse(updatedSubscription);
  }

  async cancelSubscription(userId: string, reason?: string) {
    return this.updateSubscription(userId, {
      status: SubscriptionStatus.CANCELLED,
      cancellation_reason: reason,
    });
  }

  // Service Credits Management
  async addServiceCredit(userId: string, creditDto: ServiceCreditDto) {
    const subscription = await this.getUserSubscription(userId);
    const multiplier = subscription.benefits.service_credits_multiplier;
    const finalAmount = Math.round(creditDto.amount * multiplier);

    const serviceCredit = await this.prisma.serviceCredit.create({
      data: {
        user_id: userId,
        amount: finalAmount,
        original_amount: creditDto.amount,
        reason: creditDto.reason,
        description: creditDto.description,
        order_id: creditDto.order_id,
        expires_at: creditDto.expires_at ? new Date(creditDto.expires_at) : 
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
      },
    });

    // Create audit log
    await this.prisma.serviceCreditAuditLog.create({
      data: {
        service_credit_id: serviceCredit.id,
        action: 'credit_added',
        actor_id: 'system',
        actor_role: 'system',
        payload: {
          amount: finalAmount,
          reason: creditDto.reason,
          multiplier,
        },
      },
    });

    return serviceCredit;
  }

  async useServiceCredit(userId: string, useDto: UseServiceCreditDto) {
    // Get available credits
    const availableCredits = await this.prisma.serviceCredit.findMany({
      where: {
        user_id: userId,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'asc' }, // Use oldest credits first
    });

    const totalAvailable = availableCredits.reduce((sum, credit) => sum + credit.amount, 0);

    if (totalAvailable < useDto.amount) {
      throw new BadRequestException('Insufficient service credits');
    }

    let remainingAmount = useDto.amount;
    const usedCredits = [];

    for (const credit of availableCredits) {
      if (remainingAmount <= 0) break;

      const useAmount = Math.min(credit.amount, remainingAmount);
      
      await this.prisma.serviceCredit.update({
        where: { id: credit.id },
        data: {
          used_at: new Date(),
          used_amount: useAmount,
          used_for_order_id: useDto.order_id,
        },
      });

      usedCredits.push({ id: credit.id, amount: useAmount });
      remainingAmount -= useAmount;
    }

    // Create audit log
    await this.prisma.serviceCreditAuditLog.create({
      data: {
        service_credit_id: usedCredits[0]?.id || null,
        action: 'credit_used',
        actor_id: userId,
        actor_role: 'user',
        payload: {
          order_id: useDto.order_id,
          amount_used: useDto.amount,
          credits_used: usedCredits,
        },
      },
    });

    return {
      amount_used: useDto.amount,
      credits_used: usedCredits,
      remaining_balance: totalAvailable - useDto.amount,
    };
  }

  async getUserServiceCredits(userId: string) {
    const [credits, totalBalance] = await Promise.all([
      this.prisma.serviceCredit.findMany({
        where: {
          user_id: userId,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.serviceCredit.aggregate({
        where: {
          user_id: userId,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      credits,
      total_balance: totalBalance._sum.amount || 0,
    };
  }

  // Subscription Benefits Validation
  async canUserAccessFeature(userId: string, feature: keyof SubscriptionBenefits): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.benefits[feature] as boolean;
  }

  async getUserBenefitLimit(userId: string, benefit: keyof SubscriptionBenefits): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.benefits[benefit] as number;
  }

  async checkConcurrentOrderLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.benefits.max_concurrent_orders;

    const currentOrders = await this.prisma.order.count({
      where: {
        user_id: userId,
        status: { in: ['NEW', 'ACCEPTED', 'SHOPPING', 'RECEIPT_PENDING'] },
      },
    });

    return {
      allowed: currentOrders < limit,
      current: currentOrders,
      limit,
    };
  }

  // SLA Violation Handling
  async handleSLAViolation(orderId: string, violationType: string, compensationAmount: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Add service credit as compensation
    await this.addServiceCredit(order.user_id, {
      amount: compensationAmount,
      reason: ServiceCreditReason.SLA_VIOLATION,
      description: `SLA violation compensation: ${violationType}`,
      order_id: orderId,
    });

    // Create SLA violation record
    await this.prisma.slaViolation.create({
      data: {
        order_id: orderId,
        user_id: order.user_id,
        violation_type: violationType,
        compensation_amount: compensationAmount,
        detected_at: new Date(),
      },
    });

    return {
      violation_type: violationType,
      compensation_amount: compensationAmount,
      order_id: orderId,
    };
  }

  // Helper methods
  private isUpgrade(currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean {
    const tierOrder = [SubscriptionTier.FREE, SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.VIP];
    return tierOrder.indexOf(newTier) > tierOrder.indexOf(currentTier);
  }

  private formatSubscriptionResponse(subscription: any) {
    return {
      id: subscription.id,
      user_id: subscription.user_id,
      tier: subscription.tier,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      next_billing_date: subscription.next_billing_date,
      monthly_fee: subscription.monthly_fee,
      benefits: subscription.benefits || this.tierBenefits[subscription.tier],
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
    };
  }

  // Admin methods
  async getSubscriptionStats() {
    const [
      totalSubscribers,
      subscribersByTier,
      monthlyRevenue,
      serviceCreditStats,
    ] = await Promise.all([
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.subscription.groupBy({
        by: ['tier'],
        where: { status: SubscriptionStatus.ACTIVE },
        _count: { id: true },
      }),
      this.prisma.subscription.aggregate({
        where: { 
          status: SubscriptionStatus.ACTIVE,
          tier: { not: SubscriptionTier.FREE },
        },
        _sum: { monthly_fee: true },
      }),
      this.prisma.serviceCredit.aggregate({
        where: {
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const tierCounts = subscribersByTier.reduce((acc, item) => {
      acc[item.tier] = item._count.id;
      return acc;
    }, {} as Record<SubscriptionTier, number>);

    return {
      total_subscribers: totalSubscribers,
      subscribers_by_tier: tierCounts,
      monthly_revenue: monthlyRevenue._sum.monthly_fee || 0,
      service_credits_issued: serviceCreditStats._sum.amount || 0,
      service_credits_count: serviceCreditStats._count.id || 0,
    };
  }
}