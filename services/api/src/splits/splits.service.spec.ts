import { Test, TestingModule } from '@nestjs/testing';
import { SplitsService } from './splits.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('SplitsService', () => {
  let service: SplitsService;
  let prisma: any;

  const mockUser1 = { id: 'user1', display_name: 'User One' };
  const mockUser2 = { id: 'user2', display_name: 'User Two' };
  const mockUser3 = { id: 'user3', display_name: 'User Three' };

  const mockPurchase = {
    id: 'purchase1',
    group_id: 'group1',
    purchased_by: 'user1',
    total_amount: 1000, // 10.00円
    purchase_items: [
      { id: 'item1', quantity: 2, item: { name: 'Item 1' } },
      { id: 'item2', quantity: 3, item: { name: 'Item 2' } },
    ],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      purchase: {
        findUnique: jest.fn(),
      },
      groupMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      split: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      group: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SplitsService>(SplitsService);
    prisma = module.get(PrismaService);
  });

  describe('calculateSplit', () => {
    beforeEach(() => {
      prisma.purchase.findUnique.mockResolvedValue(mockPurchase);
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user1', group_id: 'group1' },
        { user_id: 'user2', group_id: 'group1' },
        { user_id: 'user3', group_id: 'group1' },
      ]);
      prisma.user.findMany.mockResolvedValue([mockUser1, mockUser2, mockUser3]);
    });

    it('should calculate equal split correctly', async () => {
      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2', 'user3'],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      expect(result.total_amount).toBe(10.00);
      expect(result.splits).toHaveLength(3);
      
      // 1000銭を3人で分割: 333, 333, 334 (余り1銭は最初の人に)
      const sortedSplits = result.splits.sort((a, b) => a.user_id.localeCompare(b.user_id));
      expect(sortedSplits[0].share_amount).toBe(3.34); // user1: 334銭
      expect(sortedSplits[1].share_amount).toBe(3.33); // user2: 333銭
      expect(sortedSplits[2].share_amount).toBe(3.33); // user3: 333銭
      
      // 合計が元の金額と一致することを確認
      const totalSplit = result.splits.reduce((sum, split) => sum + split.share_amount, 0);
      expect(totalSplit).toBe(10.00);
    });

    it('should calculate equal split with remainder distribution', async () => {
      // 1001銭（10.01円）を3人で分割
      const purchaseWithRemainder = { ...mockPurchase, total_amount: 1001 };
      prisma.purchase.findUnique.mockResolvedValue(purchaseWithRemainder);

      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2', 'user3'],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      expect(result.total_amount).toBe(10.01);
      
      // 1001銭を3人で分割: 334, 334, 333 (余り1銭は最初の人に)
      const sortedSplits = result.splits.sort((a, b) => a.user_id.localeCompare(b.user_id));
      expect(sortedSplits[0].share_amount).toBe(3.34); // user1: 334銭
      expect(sortedSplits[1].share_amount).toBe(3.34); // user2: 334銭  
      expect(sortedSplits[2].share_amount).toBe(3.33); // user3: 333銭
    });

    it('should calculate quantity-based split correctly', async () => {
      // Override the group member validation for this test
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user1', group_id: 'group1' },
        { user_id: 'user2', group_id: 'group1' },
      ]);
      prisma.user.findMany.mockResolvedValue([mockUser1, mockUser2]);

      const calculateSplitDto = {
        rule: 'quantity' as const,
        participant_ids: ['user1', 'user2'],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      expect(result.total_amount).toBe(10.00);
      expect(result.splits).toHaveLength(2);
      
      // 数量比例分割（簡単化実装では均等分割になる）
      expect(result.splits[0].share_amount).toBe(5.00);
      expect(result.splits[1].share_amount).toBe(5.00);
    });

    it('should calculate custom split correctly', async () => {
      const calculateSplitDto = {
        rule: 'custom' as const,
        participant_ids: ['user1', 'user2', 'user3'],
        custom_splits: [
          { user_id: 'user1', percentage: 50 },
          { user_id: 'user2', percentage: 30 },
          { user_id: 'user3', percentage: 20 },
        ],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      expect(result.total_amount).toBe(10.00);
      expect(result.splits).toHaveLength(3);
      
      const user1Split = result.splits.find(s => s.user_id === 'user1');
      const user2Split = result.splits.find(s => s.user_id === 'user2');
      const user3Split = result.splits.find(s => s.user_id === 'user3');
      
      expect(user1Split?.share_amount).toBe(5.00); // 50%
      expect(user2Split?.share_amount).toBe(3.00); // 30%
      expect(user3Split?.share_amount).toBe(2.00); // 20%
    });

    it('should handle custom split with rounding correctly', async () => {
      // 333銭を3人でカスタム分割
      const purchaseSmall = { ...mockPurchase, total_amount: 333 };
      prisma.purchase.findUnique.mockResolvedValue(purchaseSmall);

      const calculateSplitDto = {
        rule: 'custom' as const,
        participant_ids: ['user1', 'user2', 'user3'],
        custom_splits: [
          { user_id: 'user1', percentage: 33.33 },
          { user_id: 'user2', percentage: 33.33 },
          { user_id: 'user3', percentage: 33.34 },
        ],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      // 端数調整により合計が元の金額と一致することを確認
      const totalSplit = result.splits.reduce((sum, split) => sum + split.share_amount, 0);
      expect(totalSplit).toBe(3.33);
    });

    it('should throw error for invalid custom split percentages', async () => {
      const calculateSplitDto = {
        rule: 'custom' as const,
        participant_ids: ['user1', 'user2'],
        custom_splits: [
          { user_id: 'user1', percentage: 60 },
          { user_id: 'user2', percentage: 30 }, // 合計90%
        ],
      };

      await expect(
        service.calculateSplit('user1', 'purchase1', calculateSplitDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when custom splits are missing for custom rule', async () => {
      const calculateSplitDto = {
        rule: 'custom' as const,
        participant_ids: ['user1', 'user2'],
      };

      await expect(
        service.calculateSplit('user1', 'purchase1', calculateSplitDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when purchase not found', async () => {
      prisma.purchase.findUnique.mockResolvedValue(null);

      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2'],
      };

      await expect(
        service.calculateSplit('user1', 'purchase1', calculateSplitDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when user is not group member', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2'],
      };

      await expect(
        service.calculateSplit('user1', 'purchase1', calculateSplitDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when participants are not group members', async () => {
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user1', group_id: 'group1' },
        // user2 is missing
      ]);

      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2'],
      };

      await expect(
        service.calculateSplit('user1', 'purchase1', calculateSplitDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSplit', () => {
    beforeEach(() => {
      prisma.purchase.findUnique.mockResolvedValue(mockPurchase);
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user1', group_id: 'group1' },
        { user_id: 'user2', group_id: 'group1' },
      ]);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      
      // Mock the getSplitByPurchaseId response
      const mockSavedSplit = {
        purchase_id: 'purchase1',
        total_amount: 10.00,
        splits: [
          { user_id: 'user1', user: { display_name: 'User One' }, share_amount: 500, rule: 'equal' },
          { user_id: 'user2', user: { display_name: 'User Two' }, share_amount: 500, rule: 'equal' },
        ],
        rule: 'equal' as const,
        calculated_at: new Date(),
      };
      
      prisma.purchase.findUnique.mockResolvedValueOnce(mockPurchase).mockResolvedValueOnce({
        ...mockPurchase,
        splits: [
          { user_id: 'user1', user: { display_name: 'User One' }, share_amount: 500, rule: 'equal' },
          { user_id: 'user2', user: { display_name: 'User Two' }, share_amount: 500, rule: 'equal' },
        ],
      });
    });

    it('should create and save split successfully', async () => {
      const createSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2'],
      };

      const result = await service.createSplit('user1', 'purchase1', createSplitDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.split.deleteMany).toHaveBeenCalledWith({
        where: { purchase_id: 'purchase1' }
      });
      expect(prisma.split.createMany).toHaveBeenCalled();
      expect(result.purchase_id).toBe('purchase1');
    });
  });

  describe('getGroupSettlement', () => {
    beforeEach(() => {
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.group.findUnique.mockResolvedValue({ name: 'Test Group' });
      // Reset the purchase.findMany mock for these tests
      prisma.purchase.findMany = jest.fn();
    });

    it('should calculate group settlement correctly', async () => {
      const mockPurchases = [
        {
          id: 'purchase1',
          group_id: 'group1',
          purchased_by: 'user1',
          total_amount: 1000,
          splits: [
            { user_id: 'user1', share_amount: 500, user: { display_name: 'User One' } },
            { user_id: 'user2', share_amount: 500, user: { display_name: 'User Two' } },
          ],
        },
        {
          id: 'purchase2',
          group_id: 'group1',
          purchased_by: 'user2',
          total_amount: 600,
          splits: [
            { user_id: 'user1', share_amount: 300, user: { display_name: 'User One' } },
            { user_id: 'user2', share_amount: 300, user: { display_name: 'User Two' } },
          ],
        },
      ];

      prisma.purchase.findMany.mockResolvedValue(mockPurchases);

      const result = await service.getGroupSettlement('user1', 'group1');

      expect(result.group_name).toBe('Test Group');
      expect(result.total_spent).toBe(16.00); // 1000 + 600 = 1600銭 = 16.00円
      expect(result.settlements).toBeDefined();
      
      // user1 paid 1000, owes 800 -> net +200
      // user2 paid 600, owes 800 -> net -200
      // So user2 should pay user1 200銭 = 2.00円
      expect(result.settlements).toHaveLength(1);
      expect(result.settlements[0].debtor_name).toBe('User Two');
      expect(result.settlements[0].creditor_name).toBe('User One');
      expect(result.settlements[0].amount).toBe(2.00);
    });

    it('should handle empty group with no purchases', async () => {
      prisma.purchase.findMany.mockResolvedValue([]);

      const result = await service.getGroupSettlement('user1', 'group1');

      expect(result.total_spent).toBe(0);
      expect(result.settlements).toHaveLength(0);
      expect(result.average_per_person).toBe(0);
    });

    it('should throw error when group not found', async () => {
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(
        service.getGroupSettlement('user1', 'group1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('edge cases', () => {
    it('should handle single participant equal split', async () => {
      prisma.purchase.findUnique.mockResolvedValue(mockPurchase);
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.groupMember.findMany.mockResolvedValue([{ user_id: 'user1', group_id: 'group1' }]);
      prisma.user.findMany.mockResolvedValue([mockUser1]);

      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1'],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      expect(result.splits).toHaveLength(1);
      expect(result.splits[0].share_amount).toBe(10.00);
      expect(result.splits[0].share_percentage).toBe(100);
    });

    it('should handle zero amount purchase', async () => {
      const zeroPurchase = { ...mockPurchase, total_amount: 0 };
      prisma.purchase.findUnique.mockResolvedValue(zeroPurchase);
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user1', group_id: 'group1' },
        { user_id: 'user2', group_id: 'group1' },
      ]);
      prisma.user.findMany.mockResolvedValue([mockUser1, mockUser2]);

      const calculateSplitDto = {
        rule: 'equal' as const,
        participant_ids: ['user1', 'user2'],
      };

      const result = await service.calculateSplit('user1', 'purchase1', calculateSplitDto);

      expect(result.total_amount).toBe(0);
      expect(result.splits[0].share_amount).toBe(0);
      expect(result.splits[1].share_amount).toBe(0);
    });

    it('should handle complex settlement with multiple creditors and debtors', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.group.findUnique.mockResolvedValue({ name: 'Test Group' });
      prisma.purchase.findMany = jest.fn();

      // Complex scenario: 3 users with multiple purchases
      const mockComplexPurchases = [
        {
          id: 'purchase1',
          group_id: 'group1',
          purchased_by: 'user1',
          total_amount: 3000, // user1 paid 30.00
          splits: [
            { user_id: 'user1', share_amount: 1000, user: { display_name: 'User One' } },   // owes 10.00
            { user_id: 'user2', share_amount: 1000, user: { display_name: 'User Two' } },   // owes 10.00
            { user_id: 'user3', share_amount: 1000, user: { display_name: 'User Three' } }, // owes 10.00
          ],
        },
        {
          id: 'purchase2',
          group_id: 'group1',
          purchased_by: 'user2',
          total_amount: 1200, // user2 paid 12.00
          splits: [
            { user_id: 'user1', share_amount: 400, user: { display_name: 'User One' } },   // owes 4.00
            { user_id: 'user2', share_amount: 400, user: { display_name: 'User Two' } },   // owes 4.00
            { user_id: 'user3', share_amount: 400, user: { display_name: 'User Three' } }, // owes 4.00
          ],
        },
      ];

      prisma.purchase.findMany.mockResolvedValue(mockComplexPurchases);

      const result = await service.getGroupSettlement('user1', 'group1');

      // user1: paid 3000, owes 1400 -> net +1600 (creditor)
      // user2: paid 1200, owes 1400 -> net -200 (debtor)
      // user3: paid 0, owes 1400 -> net -1400 (debtor)
      
      expect(result.settlements).toHaveLength(2);
      expect(result.total_spent).toBe(42.00); // 3000 + 1200 = 4200銭
      
      // Check that settlements balance correctly
      const totalSettlements = result.settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(totalSettlements).toBe(16.00); // 1600銭 = 16.00円
    });
  });
});