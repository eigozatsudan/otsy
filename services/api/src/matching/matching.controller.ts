import {
  Controller,
  Get,
  Post,
  Put,
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
  ShopperPreferenceDto,
  ShopperRatingDto,
  MatchingPreferencesDto,
  TimeSlotGuaranteeDto,
} from '../subscriptions/dto/subscription.dto';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // Shopper preference management
  @Get('shopper/preferences')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getMyPreferences(@CurrentUser() user: any) {
    return this.matchingService.getShopperPreferences(user.id);
  }

  @Put('shopper/preferences')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async updateMyPreferences(
    @CurrentUser() user: any,
    @Body() preferences: ShopperPreferenceDto,
  ) {
    return this.matchingService.updateShopperPreferences(user.id, preferences);
  }

  // Rating system
  @Post('ratings')
  @UseGuards(RolesGuard)
  @Roles('user')
  async rateShopper(
    @CurrentUser() user: any,
    @Body() ratingDto: ShopperRatingDto,
  ) {
    return this.matchingService.rateShopperPerformance(user.id, ratingDto);
  }

  @Get('ratings/my-ratings')
  @UseGuards(RolesGuard)
  @Roles('user')
  async getMyRatings(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // TODO: Implement user's rating history
    return {
      message: 'User rating history - to be implemented',
      page: page || 1,
      limit: limit || 20,
    };
  }

  @Get('ratings/shopper/:shopperId')
  async getShopperRatings(
    @Param('shopperId') shopperId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // TODO: Implement shopper rating display
    return {
      message: 'Shopper rating display - to be implemented',
      shopper_id: shopperId,
      page: page || 1,
      limit: limit || 20,
    };
  }

  // Time slot guarantees
  @Post('time-slot-guarantee')
  @UseGuards(RolesGuard)
  @Roles('user')
  async requestTimeSlotGuarantee(
    @CurrentUser() user: any,
    @Body() guaranteeDto: TimeSlotGuaranteeDto,
  ) {
    return this.matchingService.requestTimeSlotGuarantee(user.id, guaranteeDto);
  }

  @Get('time-slot-guarantees')
  @UseGuards(RolesGuard)
  @Roles('user')
  async getMyTimeSlotGuarantees(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    // TODO: Implement user's time slot guarantee history
    return {
      message: 'Time slot guarantee history - to be implemented',
      status,
    };
  }

  // Matching preferences (for users)
  @Get('user/preferences')
  @UseGuards(RolesGuard)
  @Roles('user')
  async getMyMatchingPreferences(@CurrentUser() user: any) {
    // TODO: Implement user matching preferences
    return {
      message: 'User matching preferences - to be implemented',
    };
  }

  @Put('user/preferences')
  @UseGuards(RolesGuard)
  @Roles('user')
  async updateMyMatchingPreferences(
    @CurrentUser() user: any,
    @Body() preferences: MatchingPreferencesDto,
  ) {
    // TODO: Implement user matching preferences update
    return {
      message: 'User matching preferences update - to be implemented',
      preferences,
    };
  }

  // Shopper discovery and search
  @Get('shoppers/search')
  @UseGuards(RolesGuard)
  @Roles('user')
  async searchShoppers(
    @Query('location') location?: string,
    @Query('rating') minRating?: string,
    @Query('availability') availability?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // TODO: Implement shopper search functionality
    return {
      message: 'Shopper search - to be implemented',
      filters: {
        location,
        min_rating: minRating,
        availability,
      },
      page: page || 1,
      limit: limit || 20,
    };
  }

  @Get('shoppers/:shopperId/profile')
  async getShopperProfile(@Param('shopperId') shopperId: string) {
    // TODO: Implement shopper profile display
    return {
      message: 'Shopper profile display - to be implemented',
      shopper_id: shopperId,
    };
  }

  // Manual matching (admin only)
  @Post('admin/manual-match')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async manualMatch(
    @Body() body: { order_id: string; shopper_id: string; reason?: string },
  ) {
    // TODO: Implement manual matching for admin
    return {
      message: 'Manual matching - to be implemented',
      order_id: body.order_id,
      shopper_id: body.shopper_id,
      reason: body.reason,
    };
  }

  @Post('admin/find-match/:orderId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findMatchForOrder(@Param('orderId') orderId: string) {
    const shopperId = await this.matchingService.findBestShopper(orderId);
    
    return {
      order_id: orderId,
      matched_shopper_id: shopperId,
      success: !!shopperId,
    };
  }

  // Matching analytics and stats
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getMatchingStats() {
    return this.matchingService.getMatchingStats();
  }

  @Get('admin/analytics/matching-performance')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getMatchingPerformanceAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    // TODO: Implement matching performance analytics
    return {
      message: 'Matching performance analytics - to be implemented',
      start_date: startDate,
      end_date: endDate,
    };
  }

  @Get('admin/analytics/shopper-performance')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getShopperPerformanceAnalytics(
    @Query('shopper_id') shopperId?: string,
    @Query('period') period?: string,
  ) {
    // TODO: Implement shopper performance analytics
    return {
      message: 'Shopper performance analytics - to be implemented',
      shopper_id: shopperId,
      period: period || 'month',
    };
  }

  // Matching algorithm testing and optimization
  @Post('admin/test-matching')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async testMatchingAlgorithm(
    @Body() body: {
      order_id: string;
      algorithm_version?: string;
      dry_run?: boolean;
    },
  ) {
    // TODO: Implement matching algorithm testing
    return {
      message: 'Matching algorithm testing - to be implemented',
      order_id: body.order_id,
      algorithm_version: body.algorithm_version || 'current',
      dry_run: body.dry_run || true,
    };
  }

  // Shopper availability management
  @Get('shopper/availability')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getMyAvailability(@CurrentUser() user: any) {
    // TODO: Implement shopper availability display
    return {
      message: 'Shopper availability display - to be implemented',
      shopper_id: user.id,
    };
  }

  @Put('shopper/availability')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async updateMyAvailability(
    @CurrentUser() user: any,
    @Body() body: { is_available: boolean; reason?: string },
  ) {
    // TODO: Implement shopper availability update
    return {
      message: 'Shopper availability update - to be implemented',
      shopper_id: user.id,
      is_available: body.is_available,
      reason: body.reason,
    };
  }

  // Matching notifications and alerts
  @Get('notifications/matching-opportunities')
  @UseGuards(RolesGuard)
  @Roles('shopper')
  async getMatchingOpportunities(
    @CurrentUser() user: any,
    @Query('radius') radius?: string,
  ) {
    // TODO: Implement matching opportunity notifications
    return {
      message: 'Matching opportunity notifications - to be implemented',
      shopper_id: user.id,
      radius: radius || '10km',
    };
  }
}