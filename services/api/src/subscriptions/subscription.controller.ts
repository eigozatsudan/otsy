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
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
  ServiceCreditDto,
} from './dto/subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Subscription management
  @Post()
  @UseGuards(RolesGuard)
  @Roles('user')
  async createSubscription(
    @CurrentUser() user: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(user.id, createSubscriptionDto);
  }

  @Get('my-subscription')
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionService.getSubscription(user.id);
  }

  @Put('my-subscription')
  async updateMySubscription(
    @CurrentUser() user: any,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updateSubscription(user.id, updateSubscriptionDto);
  }

  @Post('upgrade')
  @UseGuards(RolesGuard)
  @Roles('user')
  async upgradeSubscription(
    @CurrentUser() user: any,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.upgradeSubscription(user.id, upgradeDto);
  }

  @Post('cancel')
  async cancelSubscription(
    @CurrentUser() user: any,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    await this.subscriptionService.cancelSubscription(user.id, cancelDto);
    return { success: true, message: 'Subscription cancelled successfully' };
  }

  // Usage and billing
  @Get('usage')
  async getSubscriptionUsage(@CurrentUser() user: any) {
    return this.subscriptionService.getSubscriptionUsage(user.id);
  }

  @Get('service-credits')
  async getServiceCredits(@CurrentUser() user: any) {
    // Get available service credits
    const credits = await this.subscriptionService.getServiceCredits(user.id);
    return credits;
  }

  // Tier information
  @Get('tiers')
  async getSubscriptionTiers() {
    return this.subscriptionService.getTierConfigs();
  }

  @Get('tiers/:tier')
  async getSubscriptionTier(@Param('tier') tier: string) {
    const configs = await this.subscriptionService.getTierConfigs();
    return configs[tier] || null;
  }

  // Admin endpoints
  @Post('admin/service-credits/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async addServiceCredit(
    @Param('userId') userId: string,
    @Body() creditDto: ServiceCreditDto,
  ) {
    return this.subscriptionService.addServiceCredit(userId, creditDto);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats();
  }

  @Get('admin/subscriptions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tier') tier?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.subscriptionService.getAllSubscriptions({
      page: pageNum,
      limit: limitNum,
      tier,
      status,
    });
  }

  @Get('admin/subscriptions/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getSubscriptionById(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  @Post('admin/process-renewals')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async processRenewals() {
    await this.subscriptionService.processSubscriptionRenewals();
    return { success: true, message: 'Subscription renewals processed' };
  }

  // Subscription benefits validation
  @Get('validate-benefits/:orderId')
  async validateSubscriptionBenefits(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.subscriptionService.validateSubscriptionBenefits(user.id, orderId);
  }

  @Post('apply-benefits/:orderId')
  async applySubscriptionBenefits(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() body: { use_service_credits?: number },
  ) {
    return this.subscriptionService.applySubscriptionBenefits(
      user.id,
      orderId,
      body.use_service_credits,
    );
  }

  // Subscription analytics for users
  @Get('analytics/usage-history')
  async getUsageHistory(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.subscriptionService.getUsageHistory(user.id, monthsNum);
  }

  @Get('analytics/savings')
  async getSavingsAnalytics(@CurrentUser() user: any) {
    return this.subscriptionService.getSavingsAnalytics(user.id);
  }

  // Subscription recommendations
  @Get('recommendations')
  async getSubscriptionRecommendations(@CurrentUser() user: any) {
    return this.subscriptionService.getSubscriptionRecommendations(user.id);
  }

  // Subscription pause/resume (for premium features)
  @Post('pause')
  @UseGuards(RolesGuard)
  @Roles('user')
  async pauseSubscription(
    @CurrentUser() user: any,
    @Body() body: { reason?: string; resume_date?: string },
  ) {
    return this.subscriptionService.pauseSubscription(
      user.id,
      body.reason,
      body.resume_date ? new Date(body.resume_date) : undefined,
    );
  }

  @Post('resume')
  @UseGuards(RolesGuard)
  @Roles('user')
  async resumeSubscription(@CurrentUser() user: any) {
    return this.subscriptionService.resumeSubscription(user.id);
  }

  // Gift subscriptions
  @Post('gift')
  @UseGuards(RolesGuard)
  @Roles('user')
  async giftSubscription(
    @CurrentUser() user: any,
    @Body() body: {
      recipient_email: string;
      tier: string;
      duration_months: number;
      message?: string;
    },
  ) {
    return this.subscriptionService.giftSubscription(
      user.id,
      body.recipient_email,
      body.tier,
      body.duration_months,
      body.message,
    );
  }

  // Subscription referrals
  @Get('referral-code')
  async getReferralCode(@CurrentUser() user: any) {
    return this.subscriptionService.getReferralCode(user.id);
  }

  @Post('apply-referral')
  async applyReferralCode(
    @CurrentUser() user: any,
    @Body() body: { referral_code: string },
  ) {
    return this.subscriptionService.applyReferralCode(user.id, body.referral_code);
  }

  @Get('referral-stats')
  async getReferralStats(@CurrentUser() user: any) {
    return this.subscriptionService.getReferralStats(user.id);
  }
}