import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  ServiceCreditDto,
  UseServiceCreditDto,
} from './dto/subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // User subscription management
  @Post()
  @UseGuards(RolesGuard)
  @Roles('user')
  async createSubscription(
    @CurrentUser() user: any,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(user.id, createDto);
  }

  @Get('my-subscription')
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionService.getUserSubscription(user.id);
  }

  @Put('my-subscription')
  async updateMySubscription(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updateSubscription(user.id, updateDto);
  }

  @Delete('my-subscription')
  async cancelMySubscription(
    @CurrentUser() user: any,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionService.cancelSubscription(user.id, body.reason);
  }

  // Service credits management
  @Get('service-credits')
  async getMyServiceCredits(@CurrentUser() user: any) {
    return this.subscriptionService.getUserServiceCredits(user.id);
  }

  @Post('service-credits/use')
  async useServiceCredits(
    @CurrentUser() user: any,
    @Body() useDto: UseServiceCreditDto,
  ) {
    return this.subscriptionService.useServiceCredit(user.id, useDto);
  }

  // Subscription benefits validation
  @Get('benefits/check/:feature')
  async checkFeatureAccess(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
  ) {
    const hasAccess = await this.subscriptionService.canUserAccessFeature(
      user.id,
      feature as any,
    );
    
    return { feature, has_access: hasAccess };
  }

  @Get('benefits/limit/:benefit')
  async getBenefitLimit(
    @CurrentUser() user: any,
    @Param('benefit') benefit: string,
  ) {
    const limit = await this.subscriptionService.getUserBenefitLimit(
      user.id,
      benefit as any,
    );
    
    return { benefit, limit };
  }

  @Get('concurrent-orders/check')
  async checkConcurrentOrderLimit(@CurrentUser() user: any) {
    return this.subscriptionService.checkConcurrentOrderLimit(user.id);
  }

  // Subscription tiers information
  @Get('tiers')
  async getSubscriptionTiers() {
    return {
      tiers: [
        {
          tier: 'free',
          name: 'Free',
          price: 0,
          benefits: {
            priority_matching: false,
            guaranteed_time_slots: 0,
            free_deliveries: 0,
            premium_shoppers: false,
            dedicated_support: false,
            service_credits_multiplier: 1.0,
            max_concurrent_orders: 1,
            early_access_features: false,
          },
        },
        {
          tier: 'basic',
          name: 'Basic',
          price: 980,
          benefits: {
            priority_matching: true,
            guaranteed_time_slots: 4,
            free_deliveries: 2,
            premium_shoppers: false,
            dedicated_support: false,
            service_credits_multiplier: 1.2,
            max_concurrent_orders: 2,
            early_access_features: false,
          },
        },
        {
          tier: 'premium',
          name: 'Premium',
          price: 1980,
          benefits: {
            priority_matching: true,
            guaranteed_time_slots: 12,
            free_deliveries: 5,
            premium_shoppers: true,
            dedicated_support: true,
            service_credits_multiplier: 1.5,
            max_concurrent_orders: 3,
            early_access_features: true,
          },
        },
        {
          tier: 'vip',
          name: 'VIP',
          price: 3980,
          benefits: {
            priority_matching: true,
            guaranteed_time_slots: 24,
            free_deliveries: 10,
            premium_shoppers: true,
            dedicated_support: true,
            service_credits_multiplier: 2.0,
            max_concurrent_orders: 5,
            early_access_features: true,
          },
        },
      ],
    };
  }

  // Admin endpoints
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats();
  }

  @Post('admin/service-credits/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async addServiceCreditToUser(
    @Param('userId') userId: string,
    @Body() creditDto: ServiceCreditDto,
  ) {
    return this.subscriptionService.addServiceCredit(userId, creditDto);
  }

  @Get('admin/users/:userId/subscription')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUserSubscriptionAdmin(@Param('userId') userId: string) {
    return this.subscriptionService.getUserSubscription(userId);
  }

  @Put('admin/users/:userId/subscription')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateUserSubscriptionAdmin(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updateSubscription(userId, updateDto);
  }

  @Get('admin/users/:userId/service-credits')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUserServiceCreditsAdmin(@Param('userId') userId: string) {
    return this.subscriptionService.getUserServiceCredits(userId);
  }

  // SLA violation handling
  @Post('admin/sla-violation')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async handleSLAViolation(
    @Body() body: {
      order_id: string;
      violation_type: string;
      compensation_amount: number;
    },
  ) {
    return this.subscriptionService.handleSLAViolation(
      body.order_id,
      body.violation_type,
      body.compensation_amount,
    );
  }

  // Subscription history and analytics
  @Get('admin/analytics/revenue')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getRevenueAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    // TODO: Implement revenue analytics
    return {
      message: 'Revenue analytics endpoint - to be implemented',
      start_date: startDate,
      end_date: endDate,
    };
  }

  @Get('admin/analytics/churn')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getChurnAnalytics() {
    // TODO: Implement churn analytics
    return {
      message: 'Churn analytics endpoint - to be implemented',
    };
  }

  // Subscription lifecycle webhooks (for payment processing)
  @Post('webhooks/billing')
  async handleBillingWebhook(@Body() payload: any) {
    // TODO: Implement billing webhook handling
    // This would handle subscription renewals, payment failures, etc.
    return { received: true };
  }
}