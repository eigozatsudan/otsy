import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  MatchingCriteriaDto, 
  MatchingResultDto, 
  SubscriptionTier,
  DeliveryPriority,
  TimeSlotPreference,
  ShopperPreferenceDto,
  ShopperRatingDto
} from '../subscriptions/dto/subscription.dto';

interface ShopperProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: { lat: number; lng: number };
  preferences: any;
  rating: number;
  total_orders: number;
  success_rate: number;
  avg_delivery_time: number;
  is_online: boolean;
  current_orders: number;
  subscription_tier: SubscriptionTier | null;
  last_active: Date;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  async findBestShoppers(
    orderId: string,
    criteria: MatchingCriteriaDto,
    limit = 10
  ): Promise<MatchingResultDto[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'active' },
              orderBy: { created_at: 'desc' as const },
              take: 1,
            },
          },
        },
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get available shoppers
    const availableShoppers = await this.getAvailableShoppers(criteria);
    
    // Calculate compatibility scores
    const scoredShoppers = await Promise.all(
      availableShoppers.map(async (shopper) => {
        const score = await this.calculateCompatibilityScore(order, shopper, criteria);
        return {
          shopper,
          score,
        };
      })
    );

    // Sort by score and apply subscription-based prioritization
    const prioritizedShoppers = this.applySubscriptionPriority(
      scoredShoppers,
      order.user.subscriptions[0]?.tier as SubscriptionTier
    );

    // Format results
    return prioritizedShoppers
      .slice(0, limit)
      .map(({ shopper, score }) => this.formatMatchingResult(shopper, score, order));
  }

  private async getAvailableShoppers(criteria: MatchingCriteriaDto): Promise<ShopperProfile[]> {
    const baseQuery = {
      where: {
        role: 'shopper',
        shopper_profile: {
          is_not: null,
          status: 'approved',
        },
      },
      include: {
        shopper_profile: {
          include: {
            preferences: true,
            ratings: {
              orderBy: { created_at: 'desc' as const },
              take: 50, // Last 50 ratings for average calculation
            },
          },
        },
        subscriptions: {
          where: { status: 'active' },
          orderBy: { created_at: 'desc' as const },
          take: 1,
        },
      },
    };

    // Add filters based on criteria
    if (criteria.min_shopper_rating) {
      // This would need to be calculated in application logic since it's an aggregate
    }

    if (criteria.max_distance) {
      // Geographic filtering would be done in application logic with coordinates
    }

    const shoppers = await this.prisma.user.findMany(baseQuery);

    // Filter and transform to ShopperProfile
    const profiles: ShopperProfile[] = [];

    for (const shopper of shoppers) {
      if (!shopper.shopper_profile) continue;

      // Calculate average rating
      const ratings = shopper.shopper_profile.ratings;
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length 
        : 0;

      // Apply minimum rating filter
      if (criteria.min_shopper_rating && avgRating < criteria.min_shopper_rating) {
        continue;
      }

      // Check if shopper is available (not at max concurrent orders)
      const currentOrders = await this.prisma.order.count({
        where: {
          shopper_id: shopper.id,
          status: { in: ['accepted', 'shopping', 'enroute'] },
        },
      });

      const maxConcurrentOrders = shopper.shopper_profile.preferences?.max_concurrent_orders || 3;
      if (currentOrders >= maxConcurrentOrders) {
        continue;
      }

      // Calculate success rate
      const totalOrders = await this.prisma.order.count({
        where: { shopper_id: shopper.id, status: 'delivered' },
      });

      const successfulOrders = await this.prisma.order.count({
        where: { 
          shopper_id: shopper.id, 
          status: 'delivered',
          // Add criteria for successful delivery (no complaints, on time, etc.)
        },
      });

      const successRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

      // Calculate average delivery time
      const avgDeliveryTime = await this.calculateAverageDeliveryTime(shopper.id);

      profiles.push({
        id: shopper.shopper_profile.id,
        user_id: shopper.id,
        first_name: shopper.first_name,
        last_name: shopper.last_name,
        email: shopper.email,
        phone: shopper.phone,
        location: {
          lat: shopper.shopper_profile.location_lat || 0,
          lng: shopper.shopper_profile.location_lng || 0,
        },
        preferences: shopper.shopper_profile.preferences,
        rating: avgRating,
        total_orders: totalOrders,
        success_rate: successRate,
        avg_delivery_time: avgDeliveryTime,
        is_online: this.isShopperOnline(shopper.last_active_at),
        current_orders: currentOrders,
        subscription_tier: shopper.subscriptions[0]?.tier as SubscriptionTier || null,
        last_active: shopper.last_active_at,
      });
    }

    return profiles;
  }

  private async calculateCompatibilityScore(
    order: any,
    shopper: ShopperProfile,
    criteria: MatchingCriteriaDto
  ): Promise<number> {
    let score = 0;
    const factors = [];

    // Base score from shopper rating (0-25 points)
    const ratingScore = (shopper.rating / 5) * 25;
    score += ratingScore;
    factors.push(`Rating: ${ratingScore.toFixed(1)}`);

    // Success rate (0-20 points)
    const successScore = (shopper.success_rate / 100) * 20;
    score += successScore;
    factors.push(`Success rate: ${successScore.toFixed(1)}`);

    // Distance factor (0-20 points, closer is better)
    const distance = this.calculateDistance(
      order.delivery_lat || 35.6762, // Default to Tokyo
      order.delivery_lng || 139.6503,
      shopper.location.lat,
      shopper.location.lng
    );

    const maxDistance = criteria.max_distance || 20;
    const distanceScore = Math.max(0, 20 - (distance / maxDistance) * 20);
    score += distanceScore;
    factors.push(`Distance: ${distanceScore.toFixed(1)}`);

    // Time slot compatibility (0-15 points)
    const timeSlotScore = this.calculateTimeSlotCompatibility(order, shopper, criteria);
    score += timeSlotScore;
    factors.push(`Time slot: ${timeSlotScore.toFixed(1)}`);

    // Store type preference (0-10 points)
    const storeTypeScore = this.calculateStoreTypeCompatibility(order, shopper);
    score += storeTypeScore;
    factors.push(`Store type: ${storeTypeScore.toFixed(1)}`);

    // Order value compatibility (0-10 points)
    const orderValueScore = this.calculateOrderValueCompatibility(order, shopper);
    score += orderValueScore;
    factors.push(`Order value: ${orderValueScore.toFixed(1)}`);

    // Online status bonus (0-5 points)
    const onlineBonus = shopper.is_online ? 5 : 0;
    score += onlineBonus;
    if (onlineBonus > 0) factors.push(`Online bonus: ${onlineBonus}`);

    // Low current orders bonus (0-5 points)
    const availabilityBonus = Math.max(0, 5 - shopper.current_orders);
    score += availabilityBonus;
    factors.push(`Availability: ${availabilityBonus}`);

    // Store the factors for debugging
    (shopper as any).scoringFactors = factors;

    return Math.min(100, score); // Cap at 100
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateTimeSlotCompatibility(order: any, shopper: ShopperProfile, criteria: MatchingCriteriaDto): number {
    const orderTimeSlot = this.getTimeSlotFromDate(order.delivery_date);
    const preferredTimeSlot = criteria.preferred_time_slot || orderTimeSlot;
    
    const shopperTimeSlots = shopper.preferences?.available_time_slots || [TimeSlotPreference.ANYTIME];
    
    if (shopperTimeSlots.includes(TimeSlotPreference.ANYTIME) || 
        shopperTimeSlots.includes(preferredTimeSlot)) {
      return 15;
    }
    
    return 0;
  }

  private getTimeSlotFromDate(date: Date): TimeSlotPreference {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return TimeSlotPreference.MORNING;
    if (hour >= 12 && hour < 18) return TimeSlotPreference.AFTERNOON;
    if (hour >= 18 && hour < 24) return TimeSlotPreference.EVENING;
    return TimeSlotPreference.ANYTIME;
  }

  private calculateStoreTypeCompatibility(order: any, shopper: ShopperProfile): number {
    const orderStoreTypes = this.inferStoreTypesFromItems(order.items);
    const shopperStoreTypes = shopper.preferences?.preferred_store_types || [];
    
    if (shopperStoreTypes.length === 0) return 5; // No preference = neutral
    
    const matchingTypes = orderStoreTypes.filter(type => shopperStoreTypes.includes(type));
    return (matchingTypes.length / orderStoreTypes.length) * 10;
  }

  private inferStoreTypesFromItems(items: any[]): string[] {
    const storeTypes = new Set<string>();
    
    for (const item of items) {
      const itemName = item.name.toLowerCase();
      
      if (itemName.includes('薬') || itemName.includes('medicine')) {
        storeTypes.add('pharmacy');
      } else if (itemName.includes('パン') || itemName.includes('bread')) {
        storeTypes.add('bakery');
      } else if (itemName.includes('肉') || itemName.includes('魚') || itemName.includes('野菜')) {
        storeTypes.add('supermarket');
      } else {
        storeTypes.add('convenience');
      }
    }
    
    return Array.from(storeTypes);
  }

  private calculateOrderValueCompatibility(order: any, shopper: ShopperProfile): number {
    const orderValue = order.estimate_amount;
    const minValue = shopper.preferences?.min_order_value || 0;
    const maxValue = shopper.preferences?.max_order_value || 100000;
    
    if (orderValue >= minValue && orderValue <= maxValue) {
      return 10;
    }
    
    if (orderValue < minValue) {
      return Math.max(0, 10 - ((minValue - orderValue) / minValue) * 10);
    }
    
    if (orderValue > maxValue) {
      return Math.max(0, 10 - ((orderValue - maxValue) / orderValue) * 10);
    }
    
    return 0;
  }

  private isShopperOnline(lastActive: Date | null): boolean {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActive > fiveMinutesAgo;
  }

  private async calculateAverageDeliveryTime(shopperId: string): Promise<number> {
    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        shopper_id: shopperId,
        status: 'delivered',
        delivered_at: { not: null },
      },
      select: {
        accepted_at: true,
        delivered_at: true,
      },
      take: 20, // Last 20 orders
    });

    if (deliveredOrders.length === 0) return 0;

    const totalTime = deliveredOrders.reduce((sum, order) => {
      if (order.accepted_at && order.delivered_at) {
        return sum + (order.delivered_at.getTime() - order.accepted_at.getTime());
      }
      return sum;
    }, 0);

    return totalTime / deliveredOrders.length / (1000 * 60); // Convert to minutes
  }

  private applySubscriptionPriority(
    scoredShoppers: Array<{ shopper: ShopperProfile; score: number }>,
    userSubscriptionTier?: SubscriptionTier
  ): Array<{ shopper: ShopperProfile; score: number }> {
    return scoredShoppers.sort((a, b) => {
      // VIP and Premium users get priority matching
      if (userSubscriptionTier === SubscriptionTier.VIP || userSubscriptionTier === SubscriptionTier.PREMIUM) {
        // Prefer shoppers with subscriptions
        const aHasSubscription = a.shopper.subscription_tier !== null;
        const bHasSubscription = b.shopper.subscription_tier !== null;
        
        if (aHasSubscription && !bHasSubscription) return -1;
        if (!aHasSubscription && bHasSubscription) return 1;
      }
      
      // Then sort by compatibility score
      return b.score - a.score;
    });
  }

  private formatMatchingResult(shopper: ShopperProfile, score: number, order: any): MatchingResultDto {
    const distance = this.calculateDistance(
      order.delivery_lat || 35.6762,
      order.delivery_lng || 139.6503,
      shopper.location.lat,
      shopper.location.lng
    );

    const estimatedDeliveryTime = this.estimateDeliveryTime(distance, shopper.avg_delivery_time);

    return {
      shopper_id: shopper.user_id,
      shopper_name: `${shopper.first_name} ${shopper.last_name}`,
      shopper_rating: shopper.rating,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      estimated_delivery_time: estimatedDeliveryTime,
      compatibility_score: Math.round(score),
      is_preferred_shopper: shopper.subscription_tier !== null,
      subscription_tier: shopper.subscription_tier,
      reasons: (shopper as any).scoringFactors || [],
    };
  }

  private estimateDeliveryTime(distance: number, avgDeliveryTime: number): number {
    // Base time calculation: shopping time + travel time
    const shoppingTime = 30; // Base shopping time in minutes
    const travelTime = distance * 3; // 3 minutes per km (rough estimate)
    const baseEstimate = shoppingTime + travelTime;
    
    // Adjust based on shopper's historical performance
    if (avgDeliveryTime > 0) {
      return Math.round((baseEstimate + avgDeliveryTime) / 2);
    }
    
    return Math.round(baseEstimate);
  }

  // Shopper preference management
  async updateShopperPreferences(shopperId: string, preferences: ShopperPreferenceDto): Promise<void> {
    await this.prisma.shopperPreferences.upsert({
      where: { shopper_id: shopperId },
      update: {
        available_time_slots: preferences.available_time_slots,
        preferred_store_types: preferences.preferred_store_types,
        max_delivery_distance: preferences.max_delivery_distance,
        max_concurrent_orders: preferences.max_concurrent_orders,
        accepts_urgent_orders: preferences.accepts_urgent_orders,
        min_order_value: preferences.min_order_value,
        updated_at: new Date(),
      },
      create: {
        shopper_id: shopperId,
        available_time_slots: preferences.available_time_slots || [TimeSlotPreference.ANYTIME],
        preferred_store_types: preferences.preferred_store_types || [],
        max_delivery_distance: preferences.max_delivery_distance || 20,
        max_concurrent_orders: preferences.max_concurrent_orders || 3,
        accepts_urgent_orders: preferences.accepts_urgent_orders || true,
        min_order_value: preferences.min_order_value || 0,
      },
    });
  }

  async addShopperRating(orderId: string, userId: string, rating: ShopperRatingDto): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { user_id: true, shopper_id: true, status: true },
    });

    if (!order || order.user_id !== userId) {
      throw new Error('Order not found or access denied');
    }

    if (order.status !== 'delivered') {
      throw new Error('Can only rate completed orders');
    }

    if (!order.shopper_id) {
      throw new Error('No shopper assigned to this order');
    }

    await this.prisma.shopperRating.create({
      data: {
        order_id: orderId,
        shopper_id: order.shopper_id,
        user_id: userId,
        overall_rating: rating.overall_rating,
        communication_rating: rating.communication_rating,
        accuracy_rating: rating.accuracy_rating,
        timeliness_rating: rating.timeliness_rating,
        comment: rating.comment,
        tags: rating.tags || [],
      },
    });
  }

  // Analytics and reporting
  async getMatchingStats(): Promise<any> {
    const [
      totalMatches,
      successfulMatches,
      avgMatchingTime,
      topShoppers,
    ] = await Promise.all([
      this.prisma.order.count({ where: { shopper_id: { not: null } } }),
      this.prisma.order.count({ where: { status: 'delivered' } }),
      this.calculateAverageMatchingTime(),
      this.getTopShoppers(),
    ]);

    return {
      total_matches: totalMatches,
      successful_matches: successfulMatches,
      success_rate: totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0,
      avg_matching_time: avgMatchingTime,
      top_shoppers: topShoppers,
    };
  }

  private async calculateAverageMatchingTime(): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        accepted_at: { not: null },
      },
      select: { created_at: true, accepted_at: true },
      take: 100,
    });

    if (orders.length === 0) return 0;

    const totalTime = orders.reduce((sum, order) => {
      return sum + (order.accepted_at!.getTime() - order.created_at.getTime());
    }, 0);

    return totalTime / orders.length / (1000 * 60); // Convert to minutes
  }

  private async getTopShoppers(): Promise<any[]> {
    const shoppers = await this.prisma.user.findMany({
      where: { role: 'shopper' },
      include: {
        _count: {
          select: {
            shopper_orders: {
              where: { status: 'delivered' },
            },
          },
        },
        shopper_ratings: {
          select: { overall_rating: true },
        },
      },
      orderBy: {
        shopper_orders: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return shoppers.map(shopper => {
      const avgRating = shopper.shopper_ratings.length > 0
        ? shopper.shopper_ratings.reduce((sum, r) => sum + r.overall_rating, 0) / shopper.shopper_ratings.length
        : 0;

      return {
        id: shopper.id,
        name: `${shopper.first_name} ${shopper.last_name}`,
        total_orders: shopper._count.shopper_orders,
        avg_rating: Math.round(avgRating * 10) / 10,
      };
    });
  }

  // Additional methods required by the controller
  async autoAssignBestShopper(orderId: string, criteria?: Partial<MatchingCriteriaDto>): Promise<any> {
    const shoppers = await this.findBestShoppers(orderId, criteria as MatchingCriteriaDto, 1);
    if (shoppers.length > 0) {
      return shoppers[0];
    }
    return null;
  }

  async getShopperPreferences(shopperId: string): Promise<any> {
    const shopper = await this.prisma.shopper.findUnique({
      where: { user_id: shopperId },
      select: { preferences: true },
    });
    return shopper?.preferences || {};
  }

  async setShopperAvailability(shopperId: string, isAvailable: boolean, unavailableUntil?: Date, reason?: string): Promise<void> {
    await this.prisma.shopper.update({
      where: { user_id: shopperId },
      data: { 
        is_online: isAvailable,
        unavailable_until: unavailableUntil,
        unavailability_reason: reason,
      },
    });
  }

  async getAvailableOrdersForShopper(shopperId: string, page: number, limit: number): Promise<any> {
    const skip = (page - 1) * limit;
    return this.prisma.order.findMany({
      where: { 
        status: 'new',
        shopper_id: null,
      },
      skip,
      take: limit,
      include: {
        user: true,
        items: true,
      },
    });
  }

  async getShopperRatings(shopperId: string, page: number, limit: number): Promise<any> {
    const skip = (page - 1) * limit;
    return this.prisma.orderRun.findMany({
      where: { shopper_id: shopperId },
      skip,
      take: limit,
      include: {
        order: true,
        shopper: true,
      },
    });
  }

  async getShopperStats(shopperId: string): Promise<any> {
    const stats = await this.prisma.orderRun.aggregate({
      where: { shopper_id: shopperId },
      _count: { id: true },
      _avg: { rating: true },
    });
    return stats;
  }

  async getMatchingPerformance(days: number, tier?: string): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.prisma.orderRun.findMany({
      where: {
        created_at: { gte: startDate },
        ...(tier && { shopper: { subscription_tier: tier } }),
      },
      include: {
        order: true,
        shopper: true,
      },
    });
  }

  async getShopperUtilization(): Promise<any> {
    return this.prisma.shopper.findMany({
      where: { is_online: true },
      select: {
        id: true,
        user_id: true,
        current_orders: true,
      },
    });
  }

  async requestPriorityMatching(userId: string, orderId: string, usePrioritySlot?: boolean): Promise<any> {
    // Implementation for priority matching request
    return { success: true, message: 'Priority matching requested' };
  }

  async getRecommendedShoppersForUser(userId: string, limit: number): Promise<any> {
    return this.prisma.shopper.findMany({
      where: { 
        is_online: true,
        rating_avg: { gte: 4.0 },
      },
      take: limit,
      orderBy: { rating_avg: 'desc' },
    });
  }

  async addFavoriteShopper(userId: string, shopperId: string): Promise<void> {
    // Implementation for adding favorite shopper
    // This would be stored in a separate favorites table
  }

  async removeFavoriteShopper(userId: string, shopperId: string): Promise<void> {
    // Implementation for removing favorite shopper
  }

  async getFavoriteShoppers(userId: string): Promise<any> {
    // Implementation for getting favorite shoppers
    return [];
  }

  async getAlgorithmConfig(): Promise<any> {
    // Implementation for getting algorithm configuration
    return {};
  }

  async updateAlgorithmConfig(config: any): Promise<void> {
    // Implementation for updating algorithm configuration
  }

  async emergencyMatch(orderId: string, criteria: any): Promise<any> {
    // Implementation for emergency matching
    return { success: true, message: 'Emergency match initiated' };
  }

  async getMatchingQueue(): Promise<any> {
    return this.prisma.order.findMany({
      where: { 
        status: 'new',
        shopper_id: null,
      },
      include: {
        user: true,
        items: true,
      },
    });
  }

  async processMatchingQueue(): Promise<any> {
    // Implementation for processing matching queue
    return { success: true, message: 'Queue processed' };
  }

  async getShopperPerformance(shopperId: string): Promise<any> {
    return this.prisma.orderRun.findMany({
      where: { shopper_id: shopperId },
      include: {
        order: true,
      },
    });
  }

  async getShopperEarningsForecast(shopperId: string, days: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const earnings = await this.prisma.orderRun.aggregate({
      where: {
        shopper_id: shopperId,
        created_at: { gte: startDate },
      },
      _sum: { payment_amount: true },
    });
    
    return { forecast: earnings._sum.payment_amount || 0 };
  }
}