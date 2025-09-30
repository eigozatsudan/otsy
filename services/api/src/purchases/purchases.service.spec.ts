import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    groupMember: {
      findUnique: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    purchase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    purchaseItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPurchase', () => {
    it('should create purchase successfully', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const createPurchaseDto = {
        total_amount: 1500,
        currency: 'JPY',
        note: 'Grocery shopping',
        items: [
          { item_id: 'item-1', quantity: 2, unit_price: 150 },
          { item_id: 'item-2', quantity: 1, unit_price: 1200 },
        ],
      };

      const mockItems = [
        { id: 'item-1', group_id: groupId },
        { id: 'item-2', group_id: groupId },
      ];

      const mockPurchase = {
        id: 'purchase-1',
        group_id: groupId,
        purchased_by: userId,
        total_amount: 150000, // 1500 * 100
        currency: 'JPY',
        note: 'Grocery shopping',
        purchased_at: new Date(),
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          purchase: {
            create: jest.fn().mockResolvedValue(mockPurchase),
          },
          purchaseItem: {
            createMany: jest.fn(),
          },
          item: {
            updateMany: jest.fn(),
          },
        });
      });

      // Mock getPurchaseById
      const mockDetailedPurchase = {
        ...mockPurchase,
        purchaser: { display_name: 'Test User' },
        purchase_items: [
          {
            item_id: 'item-1',
            quantity: 2,
            unit_price: 15000,
            item: { name: 'Milk' },
          },
        ],
      };
      mockPrismaService.purchase.findUnique.mockResolvedValue(mockDetailedPurchase);

      const result = await service.createPurchase(userId, groupId, createPurchaseDto);

      expect(result).toMatchObject({
        id: 'purchase-1',
        total_amount: 1500,
        currency: 'JPY',
        note: 'Grocery shopping',
      });

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['item-1', 'item-2'] },
          group_id: groupId,
        },
      });
    });

    it('should throw BadRequestException if items do not belong to group', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const createPurchaseDto = {
        total_amount: 1500,
        items: [
          { item_id: 'item-1', quantity: 2 },
          { item_id: 'item-2', quantity: 1 },
        ],
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue([
        { id: 'item-1', group_id: groupId },
      ]); // Only one item found

      await expect(service.createPurchase(userId, groupId, createPurchaseDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException for non-member', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const createPurchaseDto = {
        total_amount: 1500,
        items: [],
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.createPurchase(userId, groupId, createPurchaseDto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getGroupPurchases', () => {
    it('should return group purchases for authorized user', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      const mockPurchases = [
        {
          id: 'purchase-1',
          group_id: groupId,
          purchased_by: userId,
          total_amount: 150000, // 1500 * 100
          currency: 'JPY',
          purchased_at: new Date(),
          note: 'Test purchase',
          purchaser: { display_name: 'Test User' },
          purchase_items: [
            {
              item_id: 'item-1',
              quantity: 2,
              unit_price: 15000,
              item: { name: 'Milk' },
            },
          ],
        },
      ];

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.purchase.findMany.mockResolvedValue(mockPurchases);

      const result = await service.getGroupPurchases(userId, groupId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'purchase-1',
        total_amount: 1500, // Converted back to yen
        currency: 'JPY',
        purchaser_name: 'Test User',
      });
      expect(result[0].items[0]).toMatchObject({
        item_id: 'item-1',
        item_name: 'Milk',
        quantity: 2,
        unit_price: 150, // Converted back to yen
      });
    });

    it('should filter purchases by date range', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const query = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.purchase.findMany.mockResolvedValue([]);

      await service.getGroupPurchases(userId, groupId, query);

      expect(mockPrismaService.purchase.findMany).toHaveBeenCalledWith({
        where: {
          group_id: groupId,
          purchased_at: {
            gte: new Date('2024-01-01'),
            lte: expect.any(Date), // End date with time set to 23:59:59
          },
        },
        include: expect.any(Object),
        orderBy: { purchased_at: 'desc' },
      });
    });

    it('should filter purchases by amount range', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const query = {
        min_amount: 100,
        max_amount: 2000,
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.purchase.findMany.mockResolvedValue([]);

      await service.getGroupPurchases(userId, groupId, query);

      expect(mockPrismaService.purchase.findMany).toHaveBeenCalledWith({
        where: {
          group_id: groupId,
          total_amount: {
            gte: 10000, // 100 * 100
            lte: 200000, // 2000 * 100
          },
        },
        include: expect.any(Object),
        orderBy: { purchased_at: 'desc' },
      });
    });
  });

  describe('updatePurchase', () => {
    it('should update purchase successfully by purchaser', async () => {
      const userId = 'user-1';
      const purchaseId = 'purchase-1';
      const groupId = 'group-1';
      const updatePurchaseDto = {
        total_amount: 2000,
        note: 'Updated note',
      };

      const mockPurchase = {
        id: purchaseId,
        group_id: groupId,
        purchased_by: userId,
      };

      const mockUpdatedPurchase = {
        ...mockPurchase,
        total_amount: 200000,
        note: 'Updated note',
      };

      mockPrismaService.purchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          purchase: {
            update: jest.fn().mockResolvedValue(mockUpdatedPurchase),
          },
        });
      });

      // Mock getPurchaseById for return value
      const mockDetailedPurchase = {
        ...mockUpdatedPurchase,
        purchaser: { display_name: 'Test User' },
        purchase_items: [],
      };
      mockPrismaService.purchase.findUnique.mockResolvedValueOnce(mockDetailedPurchase);

      const result = await service.updatePurchase(userId, purchaseId, updatePurchaseDto);

      expect(result.total_amount).toBe(2000);
      expect(result.note).toBe('Updated note');
    });

    it('should throw ForbiddenException if not purchaser', async () => {
      const userId = 'user-1';
      const purchaseId = 'purchase-1';
      const groupId = 'group-1';
      const updatePurchaseDto = { total_amount: 2000 };

      const mockPurchase = {
        id: purchaseId,
        group_id: groupId,
        purchased_by: 'other-user',
      };

      mockPrismaService.purchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });

      await expect(service.updatePurchase(userId, purchaseId, updatePurchaseDto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('deletePurchase', () => {
    it('should delete purchase successfully by purchaser', async () => {
      const userId = 'user-1';
      const purchaseId = 'purchase-1';
      const groupId = 'group-1';

      const mockPurchase = {
        id: purchaseId,
        group_id: groupId,
        purchased_by: userId,
        purchase_items: [
          { item_id: 'item-1' },
          { item_id: 'item-2' },
        ],
      };

      mockPrismaService.purchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          purchaseItem: {
            deleteMany: jest.fn(),
          },
          purchase: {
            delete: jest.fn(),
          },
          item: {
            updateMany: jest.fn(),
          },
        });
      });

      const result = await service.deletePurchase(userId, purchaseId);

      expect(result.message).toBe('Purchase deleted successfully');
    });

    it('should throw ForbiddenException if not purchaser', async () => {
      const userId = 'user-1';
      const purchaseId = 'purchase-1';
      const groupId = 'group-1';

      const mockPurchase = {
        id: purchaseId,
        group_id: groupId,
        purchased_by: 'other-user',
        purchase_items: [],
      };

      mockPrismaService.purchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });

      await expect(service.deletePurchase(userId, purchaseId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getGroupPurchaseStats', () => {
    it('should return purchase statistics for group', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });

      mockPrismaService.purchase.count.mockResolvedValue(10);
      mockPrismaService.purchase.aggregate.mockResolvedValue({
        _sum: { total_amount: 500000 }, // 5000 yen in cents
      });
      mockPrismaService.purchase.groupBy.mockResolvedValue([
        {
          purchased_by: 'user-1',
          _count: { id: 5 },
          _sum: { total_amount: 300000 },
        },
        {
          purchased_by: 'user-2',
          _count: { id: 5 },
          _sum: { total_amount: 200000 },
        },
      ]);
      mockPrismaService.purchase.findMany.mockResolvedValue([
        {
          id: 'purchase-1',
          total_amount: 150000,
          purchased_at: new Date(),
          purchaser: { display_name: 'User One' },
        },
      ]);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', display_name: 'User One' },
        { id: 'user-2', display_name: 'User Two' },
      ]);

      const result = await service.getGroupPurchaseStats(userId, groupId);

      expect(result).toMatchObject({
        total_purchases: 10,
        total_amount: 5000, // Converted back to yen
        purchases_by_member: [
          {
            user_id: 'user-1',
            user_name: 'User One',
            purchase_count: 5,
            total_amount: 3000,
          },
          {
            user_id: 'user-2',
            user_name: 'User Two',
            purchase_count: 5,
            total_amount: 2000,
          },
        ],
        recent_purchases: [
          {
            id: 'purchase-1',
            purchaser_name: 'User One',
            total_amount: 1500,
          },
        ],
      });
    });
  });
});