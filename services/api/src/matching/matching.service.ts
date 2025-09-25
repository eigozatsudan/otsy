import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscriptions/subscription.service';
import { 
  SubscriptionTier, 
  ShopperPreferenceDto, 
  ShopperRatingDto, 
  MatchingPreferencesDto,
  TimeSlotGuaranteeDto 
} from '../subscriptions/dto/subscription.dto';
import { OrderStatus } from '../orders/dto/order.dto';

interface MatchingScore {
  shopperId: string;
  score: number;
  factors: {
    distance: number;
    rating: number;
    availability: number;
    preference: number;
    subscription: number;
    experience: number;
  };
}

interface ShopperAvailability {
  shopperId: string;
  isAvailable: boolean;
  currentOrders: number;
  maxOrders: number;
  workingHours: boolean;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async findBestShopper(orderId: string): Promise<string | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            subscription: true,
            matching_preferences: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get user's subscription benefits
    const subscription = await this.subscriptionService.getUserSubscription(order.user_id);
    const hasPriorityMatching = subscription.benefits.priority_matching;

    // Get available shoppers
    const availableShoppers = await this.getAvailableShoppers(order);
    
    if (availableShoppers.length === 0) {
      this.logger.warn(`No available shoppers found for order ${orderId}`);
      return null;
    }

    // Calculate matching scores
    const matchingScores = await Promise.all(
      availableShoppers.map(shopper => this.calculateMatchingScore(order, shopper, hasPriorityMatching))
    );

    // Sort by score (highest first)
    matchingScores.sort((a, b) => b.score - a.score);

    // Log matching results
    this.logger.log(`Matching results for order ${orderId}:`, {
      topShoppers: matchingScores.slice(0, 3).map(s => ({
        shopperId: s.shopperId,
        score: s.score,
        factors: s.factors,
      })),
    });

    // Return best match
    const bestMatch = matchingScores[0];
    
    // Create matching record
    await this.prisma.orderMatching.create({
      data: {
        order_id: orderId,
        shopper_id: bestMatch.shopperId,
        matching_score: bestMatch.score,
        matching_factors: bestMatch.factors,
        matched_at: new Date(),
      },
    });

    return bestMatch.shopperId;
  }

  private async getAvailableShoppers(order: any): Promise<any[]> {
    const currentTime = new Date();
    const dayOfWeek = currentTime.toLocaleLowerCase().slice(0, 3); // mon, tue, etc.

    // Base query for active shoppers
    const shoppers = await this.prisma.user.findMany({
      where: {
        role: 'shopper',
        status: 'active',
        shopper_profile: {
          is_not: null,
        },
      },
      include: {
        shopper_profile: true,
        shopper_preferences: true,
        shopper_ratings: {
          orderBy: { created_at: 'desc' },
          take: 50, // Recent ratings for average calculation
        },
        orders_as_shopper: {
          where: {
            status: { in: ['ACCEPTED', 'SHOPPING', 'RECEIPT_PENDING'] },
          },
        },
      },
    });

    // Filter by availability
    const availableShoppers = [];

    for (const shopper of shoppers) {
      const availability = await this.checkShopperAvailability(shopper, order, currentTime);
      
      if (availability.isAvailable) {
        availableShoppers.push({
          ...shopper,
          availability,
        });
      }
    }

    return availableShoppers;
  }

  private async checkShopperAvailability(
    shopper: any, 
    order: any, 
    currentTime: Date
  ): Promise<ShopperAvailability> {
    const preferences = shopper.shopper_preferences;
    const currentOrders = shopper.orders_as_shopper.length;
    const maxOrders = preferences?.max_concurrent_orders || 3;

    // Check concurrent order limit
    if (currentOrders >= maxOrders) {
      return {
        shopperId: shopper.id,
        isAvailable: false,
        currentOrders,
        maxOrders,
        workingHours: false,
      };
    }

    // Check working hours
    const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingHours = preferences?.working_hours?.[dayOfWeek];
    
    let isInWorkingHours = true;
    if (workingHours) {
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      isInWorkingHours = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    }

    // Check distance (if location data available)
    const maxDistance = preferences?.max_distance_km || 50;
    // TODO: Implement actual distance calculation based on order delivery address

    // Check order value preference
    const minOrderValue = preferences?.min_order_value || 0;
    const orderValue = order.estimate_amount;
    
    if (orderValue < minOrderValue) {
      return {
        shopperId: shopper.id,
        isAvailable: false,
        currentOrders,
        maxOrders,
        workingHours: isInWorkingHours,
      };
    }

    return {
      shopperId: shopper.id,
      isAvailable: isInWorkingHours,
      currentOrders,
      maxOrders,
      workingHours: isInWorkingHours,
    };
  }

  private async calculateMatchingScore(
    order: any, 
    shopper: any, 
    hasPriorityMatching: boolean
  ): Promise<MatchingScore> {
    const factors = {
      distance: 0,
      rating: 0,
      availability: 0,
      preference: 0,
      subscription: 0,
      experience: 0,
    };

    // Distance factor (0-25 points)
    // TODO: Implement actual distance calculation
    factors.distance = 20; // Placeholder

    // Rating factor (0-25 points)
    const ratings = shopper.shopper_ratings;
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
      factors.rating = (avgRating / 5) * 25;
    } else {
      factors.rating = 15; // Default for new shoppers
    }

    // Availability factor (0-20 points)
    const availability = shopper.availability;
    const availabilityRatio = 1 - (availability.currentOrders / availability.maxOrders);
    factors.availability = availabilityRatio * 20;

    // Preference factor (0-15 points)
    factors.preference = await this.calculatePreferenceScore(order, shopper);

    // Subscription factor (0-10 points)
    if (hasPriorityMatching) {
      const shopperSubscription = await this.subscriptionService.getUserSubscription(shopper.id);
      if (shopperSubscription.benefits.premium_shoppers) {
        factors.subscription = 10;
      } else {
        factors.subscription = 5;
      }
    }

    // Experience factor (0-5 points)
    const completedOrders = await this.prisma.order.count({
      where: {
        shopper_id: shopper.id,
        status: OrderStatus.DELIVERED,
      },
    });
    factors.experience = Math.min(completedOrders / 10, 1) * 5;

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);

    return {
      shopperId: shopper.id,
      score: totalScore,
      factors,
    };
  }

  private async calculatePreferenceScore(order: any, shopper: any): Promise<number> {
    const preferences = shopper.shopper_preferences;
    let score = 10; // Base score

    if (!preferences) return score;

    // Check excluded categories
    if (preferences.excluded_categories?.length > 0) {
      const orderCategories = order.items.map((item: any) => item.category).filter(Boolean);
      const hasExcludedCategory = orderCategories.some((cat: string) => 
        preferences.excluded_categories.includes(cat)
      );
      
      if (hasExcludedCategory) {
        score -= 5;
      }
    }

    // Check preferred store chains
    if (preferences.preferred_store_chains?.length > 0) {
      // TODO: Implement store chain matching based on order items
      score += 2;
    }

    // Check premium order acceptance
    if (order.estimate_amount > 5000 && !preferences.accepts_premium_orders) {
      score -= 3;
    }

    // Check bulk order acceptance
    const itemCount = order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    if (itemCount > 10 && !preferences.accepts_bulk_orders) {
      score -= 3;
    }

    return Math.max(score, 0);
  }

  // Shopper Preference Management
  async updateShopperPreferences(shopperId: string, preferences: ShopperPreferenceDto) {
    const existingPreferences = await this.prisma.shopperPreferences.findUnique({
      where: { shopper_id: shopperId },
    });

    if (existingPreferences) {
      return this.prisma.shopperPreferences.update({
        where: { shopper_id: shopperId },
        data: {
          ...preferences,
          updated_at: new Date(),
        },
      });
    } else {
      return this.prisma.shopperPreferences.create({
        data: {
          shopper_id: shopperId,
          ...preferences,
        },
      });
    }
  }

  async getShopperPreferences(shopperId: string) {
    return this.prisma.shopperPreferences.findUnique({
      where: { shopper_id: shopperId },
    });
  }

  // Rating System
  async rateShopperPerformance(userId: string, ratingDto: ShopperRatingDto) {
    // Verify user can rate this order
    const order = await this.prisma.order.findUnique({
      where: { id: ratingDto.order_id },
    });

    if (!order || order.user_id !== userId) {
      throw new Error('Not authorized to rate this order');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new Error('Can only rate completed orders');
    }

    // Check if already rated
    const existingRating = await this.prisma.shopperRating.findFirst({
      where: {
        order_id: ratingDto.order_id,
        user_id: userId,
      },
    });

    if (existingRating) {
      throw new Error('Order already rated');
    }

    const rating = await this.prisma.shopperRating.create({
      data: {
        order_id: ratingDto.order_id,
        user_id: userId,
        shopper_id: order.shopper_id!,
        rating: ratingDto.rating,
        comment: ratingDto.comment,
        would_recommend: ratingDto.would_recommend,
        rating_categories: ratingDto.rating_categories,
      },
    });

    // Update shopper's average rating
    await this.updateShopperAverageRating(order.shopper_id!);

    return rating;
  }

  private async updateShopperAverageRating(shopperId: string) {
    const ratings = await this.prisma.shopperRating.findMany({
      where: { shopper_id: shopperId },
    });

    if (ratings.length === 0) return;

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const totalRatings = ratings.length;

    await this.prisma.shopperProfile.update({
      where: { user_id: shopperId },
      data: {
        average_rating: avgRating,
        total_ratings: totalRatings,
      },
    });
  }

  // Time Slot Guarantees
  async requestTimeSlotGuarantee(userId: string, guaranteeDto: TimeSlotGuaranteeDto) {
    const subscription = await this.subscriptionService.getUserSubscription(userId);
    
    if (!subscription.benefits.guaranteed_time_slots) {
      throw new Error('Time slot guarantees not available for your subscription tier');
    }

    // Check monthly usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usedSlots = await this.prisma.timeSlotGuarantee.count({
      where: {
        user_id: userId,
        created_at: { gte: currentMonth },
        status: { in: ['ACTIVE', 'FULFILLED'] },
      },
    });

    if (usedSlots >= subscription.benefits.guaranteed_time_slots) {
      throw new Error('Monthly time slot guarantee limit exceeded');
    }

    const guarantee = await this.prisma.timeSlotGuarantee.create({
      data: {
        user_id: userId,
        requested_date: new Date(guaranteeDto.requested_date),
        time_slot: guaranteeDto.time_slot,
        special_instructions: guaranteeDto.special_instructions,
        status: 'ACTIVE',
      },
    });

    return guarantee;
  }

  async getMatchingStats() {
    const [
      totalMatches,
      successfulMatches,
      avgMatchingTime,
      topShoppers,
    ] = await Promise.all([
      this.prisma.orderMatching.count(),
      this.prisma.orderMatching.count({
        where: {
          order: { status: OrderStatus.DELIVERED },
        },
      }),
      this.prisma.orderMatching.aggregate({
        _avg: { matching_score: true },
      }),
      this.prisma.shopperRating.groupBy({
        by: ['shopper_id'],
        _avg: { rating: true },
        _count: { id: true },
        orderBy: { _avg: { rating: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total_matches: totalMatches,
      successful_matches: successfulMatches,
      success_rate: totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0,
      avg_matching_score: avgMatchingTime._avg.matching_score || 0,
      top_shoppers: topShoppers,
    };
  }
}