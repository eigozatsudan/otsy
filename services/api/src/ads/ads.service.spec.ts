import { Test, TestingModule } from '@nestjs/testing';
import { AdsService } from './ads.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdSlot, AdStatus } from './dto/ad.dto';

describe('AdsService', () => {
  let service: AdsService;
  let prisma: any;

  const mockAdCreative = {
    id: 'ad1',
    title: 'Fresh Organic Vegetables',
    description: 'Get 20% off on all organic vegetables this week!',
    image_url: 'https://example.com/ad-image.jpg',
    click_url: 'https://example.com/vegetables',
    slot: AdSlot.LIST_TOP,
    priority: 5,
    status: AdStatus.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      adCreative: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      adImpression: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
    prisma = module.get(PrismaService);
  });

  describe('getAdForSlot', () => {
    it('should return an ad for the specified slot', async () => {
      prisma.adCreative.findMany.mockResolvedValue([mockAdCreative]);
      prisma.adImpression.count.mockResolvedValue(0);
      prisma.adImpression.findMany.mockResolvedValue([]);

      const result = await service.getAdForSlot(AdSlot.LIST_TOP, 'user1');

      expect(result).toBeDefined();
      expect(result?.creative_id).toBe('ad1');
      expect(result?.title).toBe('Fresh Organic Vegetables');
      expect(result?.slot).toBe(AdSlot.LIST_TOP);
    });

    it('should return null when no active ads available', async () => {
      prisma.adCreative.findMany.mockResolvedValue([]);

      const result = await service.getAdForSlot(AdSlot.LIST_TOP);

      expect(result).toBeNull();
    });

    it('should respect daily impression limit', async () => {
      prisma.adCreative.findMany.mockResolvedValue([mockAdCreative]);
      prisma.adImpression.count.mockResolvedValue(50); // At daily limit

      const result = await service.getAdForSlot(AdSlot.LIST_TOP, 'user1');

      expect(result).toBeNull();
    });

    it('should avoid recently shown ads', async () => {
      const ad1 = { ...mockAdCreative, id: 'ad1' };
      const ad2 = { ...mockAdCreative, id: 'ad2', title: 'Different Ad' };
      
      prisma.adCreative.findMany.mockResolvedValue([ad1, ad2]);
      prisma.adImpression.count.mockResolvedValue(0);
      prisma.adImpression.findMany.mockResolvedValue([
        { creative_id: 'ad1' } // ad1 was recently shown
      ]);

      const result = await service.getAdForSlot(AdSlot.LIST_TOP, 'user1');

      expect(result?.creative_id).toBe('ad2'); // Should select ad2 instead
    });

    it('should work without user ID (anonymous)', async () => {
      prisma.adCreative.findMany.mockResolvedValue([mockAdCreative]);

      const result = await service.getAdForSlot(AdSlot.LIST_TOP);

      expect(result).toBeDefined();
      expect(result?.creative_id).toBe('ad1');
    });

    it('should select ad by priority weight', async () => {
      const lowPriorityAd = { ...mockAdCreative, id: 'ad1', priority: 1 };
      const highPriorityAd = { ...mockAdCreative, id: 'ad2', priority: 10 };
      
      prisma.adCreative.findMany.mockResolvedValue([lowPriorityAd, highPriorityAd]);
      prisma.adImpression.count.mockResolvedValue(0);
      prisma.adImpression.findMany.mockResolvedValue([]);

      // Mock Math.random to always return 0.9 (should select high priority ad)
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const result = await service.getAdForSlot(AdSlot.LIST_TOP, 'user1');

      expect(result?.creative_id).toBe('ad2');

      jest.restoreAllMocks();
    });
  });

  describe('logImpression', () => {
    const logImpressionDto = {
      creative_id: 'ad1',
      slot: AdSlot.LIST_TOP,
      group_id: 'group1',
    };

    it('should log impression successfully', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(mockAdCreative);
      prisma.adImpression.create.mockResolvedValue({});

      await service.logImpression(logImpressionDto, 'user1');

      expect(prisma.adImpression.create).toHaveBeenCalledWith({
        data: {
          creative_id: 'ad1',
          slot: AdSlot.LIST_TOP,
          user_id: 'user1',
          group_id: 'group1',
        }
      });
    });

    it('should log impression without user ID for privacy', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(mockAdCreative);
      prisma.adImpression.create.mockResolvedValue({});

      await service.logImpression(logImpressionDto);

      expect(prisma.adImpression.create).toHaveBeenCalledWith({
        data: {
          creative_id: 'ad1',
          slot: AdSlot.LIST_TOP,
          user_id: null,
          group_id: 'group1',
        }
      });
    });

    it('should throw error for invalid creative', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(null);

      await expect(
        service.logImpression(logImpressionDto, 'user1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for inactive creative', async () => {
      const inactiveAd = { ...mockAdCreative, status: AdStatus.PAUSED };
      prisma.adCreative.findUnique.mockResolvedValue(inactiveAd);

      await expect(
        service.logImpression(logImpressionDto, 'user1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createAdCreative', () => {
    const createAdDto = {
      title: 'New Ad',
      description: 'New ad description',
      image_url: 'https://example.com/new-ad.jpg',
      click_url: 'https://example.com/new-product',
      slot: AdSlot.DETAIL_BOTTOM,
      priority: 7,
    };

    it('should create ad creative successfully', async () => {
      const createdAd = { ...mockAdCreative, ...createAdDto, id: 'new-ad' };
      prisma.adCreative.create.mockResolvedValue(createdAd);

      const result = await service.createAdCreative(createAdDto);

      expect(result.title).toBe('New Ad');
      expect(result.slot).toBe(AdSlot.DETAIL_BOTTOM);
      expect(result.priority).toBe(7);
      expect(result.status).toBe(AdStatus.ACTIVE);
    });
  });

  describe('updateAdCreative', () => {
    const updateAdDto = {
      title: 'Updated Ad Title',
      priority: 8,
      status: AdStatus.PAUSED,
    };

    it('should update ad creative successfully', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(mockAdCreative);
      const updatedAd = { ...mockAdCreative, ...updateAdDto };
      prisma.adCreative.update.mockResolvedValue(updatedAd);

      const result = await service.updateAdCreative('ad1', updateAdDto);

      expect(result.title).toBe('Updated Ad Title');
      expect(result.priority).toBe(8);
      expect(result.status).toBe(AdStatus.PAUSED);
    });

    it('should throw error when ad not found', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAdCreative('nonexistent', updateAdDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllAdCreatives', () => {
    it('should return all ad creatives', async () => {
      const adCreatives = [mockAdCreative, { ...mockAdCreative, id: 'ad2' }];
      prisma.adCreative.findMany.mockResolvedValue(adCreatives);

      const result = await service.getAllAdCreatives();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ad1');
    });
  });

  describe('getAdCreativeById', () => {
    it('should return ad creative by ID', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(mockAdCreative);

      const result = await service.getAdCreativeById('ad1');

      expect(result.id).toBe('ad1');
      expect(result.title).toBe('Fresh Organic Vegetables');
    });

    it('should throw error when ad not found', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(null);

      await expect(
        service.getAdCreativeById('nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAdCreative', () => {
    it('should delete ad creative successfully', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(mockAdCreative);
      prisma.adCreative.delete.mockResolvedValue(mockAdCreative);

      await service.deleteAdCreative('ad1');

      expect(prisma.adCreative.delete).toHaveBeenCalledWith({
        where: { id: 'ad1' }
      });
    });

    it('should throw error when ad not found', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAdCreative('nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdStats', () => {
    it('should return advertising statistics', async () => {
      prisma.adImpression.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(50)   // today
        .mockResolvedValueOnce(200)  // week
        .mockResolvedValueOnce(800); // month
      
      prisma.adCreative.count.mockResolvedValue(5);
      prisma.adImpression.groupBy.mockResolvedValue([
        { creative_id: 'ad1', _count: { id: 100 } },
        { creative_id: 'ad2', _count: { id: 80 } },
      ]);
      
      prisma.adCreative.findUnique
        .mockResolvedValueOnce({ title: 'Ad 1', slot: 'list_top' })
        .mockResolvedValueOnce({ title: 'Ad 2', slot: 'detail_bottom' });

      const result = await service.getAdStats();

      expect(result.total_impressions).toBe(1000);
      expect(result.impressions_today).toBe(50);
      expect(result.impressions_week).toBe(200);
      expect(result.impressions_month).toBe(800);
      expect(result.active_creatives).toBe(5);
      expect(result.top_ads).toHaveLength(2);
      expect(result.top_ads[0].impressions).toBe(100);
    });
  });

  describe('reportAd', () => {
    const reportAdDto = {
      creative_id: 'ad1',
      reason: 'Inappropriate content',
      details: 'Contains offensive material',
    };

    it('should report ad successfully', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(mockAdCreative);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.reportAd(reportAdDto, 'user1');

      expect(result.message).toContain('Ad report submitted successfully');
      expect(consoleSpy).toHaveBeenCalledWith('Ad Report:', expect.any(Object));

      consoleSpy.mockRestore();
    });

    it('should throw error when ad not found', async () => {
      prisma.adCreative.findUnique.mockResolvedValue(null);

      await expect(
        service.reportAd(reportAdDto, 'user1')
      ).rejects.toThrow(NotFoundException);
    });
  });
});