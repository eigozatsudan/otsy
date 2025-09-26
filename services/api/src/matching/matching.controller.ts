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
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  MatchingCriteriaDto,
  ShopperPreferenceDto,
  ShopperRatingDto,
} from '../subscriptions/dto/subscription.dto';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // Order matching
  @Post('find-shoppers')
  @UseGuards(RolesGuard)
  @Roles('user', 'admin')
  async findShoppersForOrder(
    @Body() criteria: MatchingCriteriaDto,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.matchingService.findBestShoppers(criteria.order_id, criteria, limitNum);
  }

  @Post('auto-assign/:orderId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'system')
  async autoAssignShopper(
    @Param('orderId') orderId: string,
    @Body() criteria?: Partial<MatchingCriteriaDto>,
  ) {
    return this.matchingService.autoAssignBestShopper(orderId, criteria);
  }

  // Shopper preferences
  @Get('shopper/preferences')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getShopperPreferences(@CurrentUser() user: any) {
    return this.matchingService.getShopperPreferences(user.id);
  }

  @Put('shopper/preferences')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async updateShopperPreferences(
    @CurrentUser() user: any,
    @Body() preferences: ShopperPreferenceDto,
  ) {
    await this.matchingService.updateShopperPreferences(user.id, preferences);
    return { success: true, message: 'Preferences updated successfully' };
  }

  // Shopper availability
  @Post('shopper/set-availability')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async setShopperAvailability(
    @CurrentUser() user: any,
    @Body() body: { 
      is_available: boolean; 
      unavailable_until?: string;
      reason?: string;
    },
  ) {
    return this.matchingService.setShopperAvailability(
      user.id,
      body.is_available,
      body.unavailable_until ? new Date(body.unavailable_until) : undefined,
      body.reason,
    );
  }

  @Get('shopper/available-orders')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getAvailableOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.matchingService.getAvailableOrdersForShopper(user.id, pageNum, limitNum);
  }

  // Rating system
  @Post('rate-shopper/:orderId')
  @UseGuards(RolesGuard)
  @Roles('user')
  async rateShopperForOrder(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() rating: ShopperRatingDto,
  ) {
    await this.matchingService.addShopperRating(orderId, user.id, rating);
    return { success: true, message: 'Rating submitted successfully' };
  }

  @Get('shopper/:shopperId/ratings')
  async getShopperRatings(
    @Param('shopperId') shopperId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return this.matchingService.getShopperRatings(shopperId, pageNum, limitNum);
  }

  @Get('shopper/:shopperId/stats')
  async getShopperStats(@Param('shopperId') shopperId: string) {
    return this.matchingService.getShopperStats(shopperId);
  }

  // Matching analytics
  @Get('analytics/performance')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getMatchingPerformance(
    @Query('days') days?: string,
    @Query('tier') tier?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.matchingService.getMatchingPerformance(daysNum, tier);
  }

  @Get('analytics/shopper-utilization')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getShopperUtilization() {
    return this.matchingService.getShopperUtilization();
  }

  @Get('analytics/matching-stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getMatchingStats() {
    return this.matchingService.getMatchingStats();
  }

  // Priority matching for subscribers
  @Post('priority-match/:orderId')
  @UseGuards(RolesGuard)
  @Roles('user')
  async requestPriorityMatching(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() body: { use_priority_slot?: boolean },
  ) {
    return this.matchingService.requestPriorityMatching(
      user.id,
      orderId,
      body.use_priority_slot,
    );
  }

  // Shopper recommendations for users
  @Get('recommended-shoppers')
  @UseGuards(RolesGuard)
  @Roles('user')
  async getRecommendedShoppers(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.matchingService.getRecommendedShoppersForUser(user.id, limitNum);
  }

  @Post('favorite-shopper/:shopperId')
  @UseGuards(RolesGuard)
  @Roles('user')
  async addFavoriteShopper(
    @CurrentUser() user: any,
    @Param('shopperId') shopperId: string,
  ) {
    return this.matchingService.addFavoriteShopper(user.id, shopperId);
  }

  @Delete('favorite-shopper/:shopperId')
  @UseGuards(RolesGuard)
  @Roles('user')
  async removeFavoriteShopper(
    @CurrentUser() user: any,
    @Param('shopperId') shopperId: string,
  ) {
    return this.matchingService.removeFavoriteShopper(user.id, shopperId);
  }

  @Get('favorite-shoppers')
  @UseGuards(RolesGuard)
  @Roles('user')
  async getFavoriteShoppers(@CurrentUser() user: any) {
    return this.matchingService.getFavoriteShoppers(user.id);
  }

  // Matching algorithm tuning (admin)
  @Get('admin/algorithm-config')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAlgorithmConfig() {
    return this.matchingService.getAlgorithmConfig();
  }

  @Put('admin/algorithm-config')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateAlgorithmConfig(
    @Body() config: {
      rating_weight?: number;
      distance_weight?: number;
      success_rate_weight?: number;
      availability_weight?: number;
      subscription_boost?: number;
    },
  ) {
    return this.matchingService.updateAlgorithmConfig(config);
  }

  // Emergency matching
  @Post('emergency-match/:orderId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async emergencyMatch(
    @Param('orderId') orderId: string,
    @Body() body: { 
      expand_radius?: number;
      ignore_preferences?: boolean;
      urgent_bonus?: number;
    },
  ) {
    return this.matchingService.emergencyMatch(orderId, {
      expandRadius: body.expand_radius,
      ignorePreferences: body.ignore_preferences,
      urgentBonus: body.urgent_bonus,
    });
  }

  // Matching queue management
  @Get('admin/matching-queue')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getMatchingQueue() {
    return this.matchingService.getMatchingQueue();
  }

  @Post('admin/process-queue')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async processMatchingQueue() {
    return this.matchingService.processMatchingQueue();
  }

  // Shopper performance tracking
  @Get('shopper/my-performance')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getMyPerformance(@CurrentUser() user: any) {
    return this.matchingService.getShopperPerformance(user.id);
  }

  @Get('shopper/earnings-forecast')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getEarningsForecast(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.matchingService.getShopperEarningsForecast(user.id, daysNum);
  }
}