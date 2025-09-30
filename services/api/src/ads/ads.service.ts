import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateAdCreativeDto, 
  UpdateAdCreativeDto, 
  LogAdImpressionDto,
  AdCreativeResponseDto,
  AdDisplayResponseDto,
  AdStatsResponseDto,
  ReportAdDto,
  AdSlot,
  AdStatus
} from './dto/ad.dto';

@Injectable()
export class AdsService {
  private readonly impressionCooldown = 1000 * 60 * 5; // 5 minutes between same ad impressions
  private readonly maxImpressionPerDay = 50; // Maximum impressions per user per day

  constructor(private prisma: PrismaService) {}

  /**
   * Get an ad to display for a specific slot with frequency control
   */
  async getAdForSlot(slot: AdSlot, userId?: string, groupId?: string): Promise<AdDisplayResponseDto | null> {
    // Get active ad creatives for the slot
    const activeAds = await this.prisma.adCreative.findMany({
      where: {
        slot,
        status: AdStatus.ACTIVE,
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'asc' }
      ]
    });

    if (activeAds.length === 0) {
      return null;
    }

    // Check user's impression frequency if userId is provided
    if (userId) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayImpressions = await this.prisma.adImpression.count({
        where: {
          user_id: userId,
          shown_at: {
            gte: todayStart
          }
        }
      });

      // Respect daily impression limit
      if (todayImpressions >= this.maxImpressionPerDay) {
        return null;
      }

      // Get recent impressions to avoid showing same ad too frequently
      const recentImpressions = await this.prisma.adImpression.findMany({
        where: {
          user_id: userId,
          shown_at: {
            gte: new Date(Date.now() - this.impressionCooldown)
          }
        },
        select: { creative_id: true }
      });

      const recentCreativeIds = recentImpressions.map(imp => imp.creative_id);

      // Filter out recently shown ads
      const availableAds = activeAds.filter(ad => !recentCreativeIds.includes(ad.id));
      
      if (availableAds.length === 0) {
        // If all ads were recently shown, use the oldest impression
        const oldestImpression = await this.prisma.adImpression.findFirst({
          where: {
            user_id: userId,
            creative_id: { in: activeAds.map(ad => ad.id) }
          },
          orderBy: { shown_at: 'asc' }
        });

        if (oldestImpression) {
          const selectedAd = activeAds.find(ad => ad.id === oldestImpression.creative_id);
          if (selectedAd) {
            return this.formatAdForDisplay(selectedAd);
          }
        }
      } else {
        // Select ad based on weighted priority
        const selectedAd = this.selectAdByPriority(availableAds);
        return this.formatAdForDisplay(selectedAd);
      }
    }

    // If no userId provided or no suitable ad found, select by priority
    const selectedAd = this.selectAdByPriority(activeAds);
    return this.formatAdForDisplay(selectedAd);
  }

  /**
   * Log an ad impression with minimal tracking
   */
  async logImpression(logImpressionDto: LogAdImpressionDto, userId?: string): Promise<void> {
    // Verify the creative exists and is active
    const creative = await this.prisma.adCreative.findUnique({
      where: { id: logImpressionDto.creative_id }
    });

    if (!creative || creative.status !== AdStatus.ACTIVE) {
      throw new BadRequestException('Invalid or inactive ad creative');
    }

    // Log impression with minimal data for privacy
    await this.prisma.adImpression.create({
      data: {
        creative_id: logImpressionDto.creative_id,
        slot: logImpressionDto.slot,
        user_id: userId || null, // Optional for privacy
        group_id: logImpressionDto.group_id || null, // Optional for privacy
      }
    });
  }

  /**
   * Create a new ad creative (admin only)
   */
  async createAdCreative(createAdDto: CreateAdCreativeDto): Promise<AdCreativeResponseDto> {
    const adCreative = await this.prisma.adCreative.create({
      data: {
        title: createAdDto.title,
        description: createAdDto.description,
        image_url: createAdDto.image_url,
        click_url: createAdDto.click_url,
        slot: createAdDto.slot,
        priority: createAdDto.priority,
        status: AdStatus.ACTIVE,
      }
    });

    return this.formatAdCreativeResponse(adCreative);
  }

  /**
   * Update an ad creative (admin only)
   */
  async updateAdCreative(id: string, updateAdDto: UpdateAdCreativeDto): Promise<AdCreativeResponseDto> {
    const existingAd = await this.prisma.adCreative.findUnique({
      where: { id }
    });

    if (!existingAd) {
      throw new NotFoundException('Ad creative not found');
    }

    const updatedAd = await this.prisma.adCreative.update({
      where: { id },
      data: {
        ...(updateAdDto.title && { title: updateAdDto.title }),
        ...(updateAdDto.description && { description: updateAdDto.description }),
        ...(updateAdDto.image_url && { image_url: updateAdDto.image_url }),
        ...(updateAdDto.click_url && { click_url: updateAdDto.click_url }),
        ...(updateAdDto.priority !== undefined && { priority: updateAdDto.priority }),
        ...(updateAdDto.status && { status: updateAdDto.status }),
      }
    });

    return this.formatAdCreativeResponse(updatedAd);
  }

  /**
   * Get all ad creatives (admin only)
   */
  async getAllAdCreatives(): Promise<AdCreativeResponseDto[]> {
    const adCreatives = await this.prisma.adCreative.findMany({
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { created_at: 'desc' }
      ]
    });

    return adCreatives.map(ad => this.formatAdCreativeResponse(ad));
  }

  /**
   * Get ad creative by ID (admin only)
   */
  async getAdCreativeById(id: string): Promise<AdCreativeResponseDto> {
    const adCreative = await this.prisma.adCreative.findUnique({
      where: { id }
    });

    if (!adCreative) {
      throw new NotFoundException('Ad creative not found');
    }

    return this.formatAdCreativeResponse(adCreative);
  }

  /**
   * Delete an ad creative (admin only)
   */
  async deleteAdCreative(id: string): Promise<void> {
    const existingAd = await this.prisma.adCreative.findUnique({
      where: { id }
    });

    if (!existingAd) {
      throw new NotFoundException('Ad creative not found');
    }

    await this.prisma.adCreative.delete({
      where: { id }
    });
  }

  /**
   * Get advertising statistics (admin only)
   */
  async getAdStats(): Promise<AdStatsResponseDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalImpressions,
      impressionsToday,
      impressionsWeek,
      impressionsMonth,
      activeCreatives,
      topAds
    ] = await Promise.all([
      this.prisma.adImpression.count(),
      this.prisma.adImpression.count({
        where: { shown_at: { gte: todayStart } }
      }),
      this.prisma.adImpression.count({
        where: { shown_at: { gte: weekStart } }
      }),
      this.prisma.adImpression.count({
        where: { shown_at: { gte: monthStart } }
      }),
      this.prisma.adCreative.count({
        where: { status: AdStatus.ACTIVE }
      }),
      this.prisma.adImpression.groupBy({
        by: ['creative_id'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })
    ]);

    // Get creative details for top ads
    const topAdDetails = await Promise.all(
      topAds.map(async (ad) => {
        const creative = await this.prisma.adCreative.findUnique({
          where: { id: ad.creative_id },
          select: { title: true, slot: true }
        });
        return {
          creative_id: ad.creative_id,
          title: creative?.title || 'Unknown',
          impressions: ad._count.id,
          slot: creative?.slot || 'unknown'
        };
      })
    );

    return {
      total_impressions: totalImpressions,
      impressions_today: impressionsToday,
      impressions_week: impressionsWeek,
      impressions_month: impressionsMonth,
      active_creatives: activeCreatives,
      top_ads: topAdDetails
    };
  }

  /**
   * Report inappropriate ad content
   */
  async reportAd(reportAdDto: ReportAdDto, userId: string): Promise<{ message: string }> {
    // Verify the creative exists
    const creative = await this.prisma.adCreative.findUnique({
      where: { id: reportAdDto.creative_id }
    });

    if (!creative) {
      throw new NotFoundException('Ad creative not found');
    }

    // Log the report (in a real system, you'd have a separate reports table)
    // For now, we'll just log it and return success
    console.log('Ad Report:', {
      creative_id: reportAdDto.creative_id,
      reported_by: userId,
      reason: reportAdDto.reason,
      details: reportAdDto.details,
      timestamp: new Date()
    });

    return { message: 'Ad report submitted successfully. Our team will review it shortly.' };
  }

  /**
   * Select ad by weighted priority
   */
  private selectAdByPriority(ads: any[]): any {
    if (ads.length === 1) {
      return ads[0];
    }

    // Calculate total weight
    const totalWeight = ads.reduce((sum, ad) => sum + ad.priority, 0);
    
    // Generate random number
    let random = Math.random() * totalWeight;
    
    // Select ad based on weighted probability
    for (const ad of ads) {
      random -= ad.priority;
      if (random <= 0) {
        return ad;
      }
    }
    
    // Fallback to first ad
    return ads[0];
  }

  /**
   * Format ad for display response
   */
  private formatAdForDisplay(ad: any): AdDisplayResponseDto {
    return {
      creative_id: ad.id,
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      click_url: ad.click_url,
      slot: ad.slot,
    };
  }

  /**
   * Format ad creative response
   */
  private formatAdCreativeResponse(ad: any): AdCreativeResponseDto {
    return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      click_url: ad.click_url,
      slot: ad.slot,
      priority: ad.priority,
      status: ad.status,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
    };
  }
}