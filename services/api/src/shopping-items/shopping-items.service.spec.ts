import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ShoppingItemsService } from './shopping-items.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ShoppingItemsService', () => {
  let service: ShoppingItemsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    groupMember: {
      findUnique: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingItemsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ShoppingItemsService>(ShoppingItemsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGroupItems', () => {
    it('should return group items for authorized user', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      const mockItems = [
        {
          id: 'item-1',
          group_id: groupId,
          name: 'Milk',
          category: 'Dairy',
          quantity: '1L',
          note: 'Low fat',
          image_url: null,
          status: 'todo',
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          creator: { display_name: 'Test User' },
        },
      ];

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue(mockItems);

      const result = await service.getGroupItems(userId, groupId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'item-1',
        name: 'Milk',
        category: 'Dairy',
        status: 'todo',
        creator_name: 'Test User',
      });

      expect(mockPrismaService.groupMember.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_group_id: {
            user_id: userId,
            group_id: groupId,
          },
        },
      });
    });

    it('should throw ForbiddenException for non-member', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.getGroupItems(userId, groupId)).rejects.toThrow(ForbiddenException);
    });

    it('should filter items by status', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const query = { status: 'purchased' as const };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue([]);

      await service.getGroupItems(userId, groupId, query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          group_id: groupId,
          status: 'purchased',
        },
        include: {
          creator: {
            select: {
              display_name: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { created_at: 'desc' },
        ],
      });
    });

    it('should filter items by search query', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const query = { search: 'milk' };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue([]);

      await service.getGroupItems(userId, groupId, query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          group_id: groupId,
          OR: [
            { name: { contains: 'milk', mode: 'insensitive' } },
            { note: { contains: 'milk', mode: 'insensitive' } },
          ],
        },
        include: {
          creator: {
            select: {
              display_name: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { created_at: 'desc' },
        ],
      });
    });
  });

  describe('createItem', () => {
    it('should create item successfully', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const createItemDto = {
        name: 'Milk',
        category: 'Dairy',
        quantity: '1L',
        note: 'Low fat',
      };

      const mockCreatedItem = {
        id: 'item-1',
        group_id: groupId,
        name: 'Milk',
        category: 'Dairy',
        quantity: '1L',
        note: 'Low fat',
        image_url: null,
        status: 'todo',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
        creator: { display_name: 'Test User' },
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.create.mockResolvedValue(mockCreatedItem);

      const result = await service.createItem(userId, groupId, createItemDto);

      expect(result).toMatchObject({
        id: 'item-1',
        name: 'Milk',
        category: 'Dairy',
        quantity: '1L',
        status: 'todo',
        creator_name: 'Test User',
      });

      expect(mockPrismaService.item.create).toHaveBeenCalledWith({
        data: {
          group_id: groupId,
          name: 'Milk',
          category: 'Dairy',
          quantity: '1L',
          note: 'Low fat',
          image_url: undefined,
          status: 'todo',
          created_by: userId,
        },
        include: {
          creator: {
            select: {
              display_name: true,
            },
          },
        },
      });
    });

    it('should throw ForbiddenException for non-member', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const createItemDto = { name: 'Milk' };

      mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.createItem(userId, groupId, createItemDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateItemStatus', () => {
    it('should update item status successfully', async () => {
      const userId = 'user-1';
      const itemId = 'item-1';
      const groupId = 'group-1';
      const updateStatusDto = { status: 'purchased' as const };

      const mockItem = {
        id: itemId,
        group_id: groupId,
        status: 'todo',
      };

      const mockUpdatedItem = {
        ...mockItem,
        status: 'purchased',
        updated_at: new Date(),
        creator: { display_name: 'Test User' },
      };

      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.update.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateItemStatus(userId, itemId, updateStatusDto);

      expect(result.status).toBe('purchased');
      expect(mockPrismaService.item.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: {
          status: 'purchased',
          updated_at: expect.any(Date),
        },
        include: {
          creator: {
            select: {
              display_name: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException for non-existent item', async () => {
      const userId = 'user-1';
      const itemId = 'non-existent';
      const updateStatusDto = { status: 'purchased' as const };

      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.updateItemStatus(userId, itemId, updateStatusDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple items status successfully', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const itemIds = ['item-1', 'item-2'];
      const status = 'purchased';

      const mockItems = [
        { id: 'item-1', group_id: groupId },
        { id: 'item-2', group_id: groupId },
      ];

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.item.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkUpdateStatus(userId, groupId, itemIds, status);

      expect(result).toEqual({
        message: '2 items updated successfully',
        updated_count: 2,
      });

      expect(mockPrismaService.item.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: itemIds },
          group_id: groupId,
        },
        data: {
          status: 'purchased',
          updated_at: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if some items not found', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const itemIds = ['item-1', 'item-2'];
      const status = 'purchased';

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue([
        { id: 'item-1', group_id: groupId },
      ]); // Only one item found

      await expect(service.bulkUpdateStatus(userId, groupId, itemIds, status)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGroupCategories', () => {
    it('should return unique categories for group', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      const mockCategories = [
        { category: 'Dairy' },
        { category: 'Meat' },
        { category: 'Vegetables' },
      ];

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: groupId,
      });
      mockPrismaService.item.findMany.mockResolvedValue(mockCategories);

      const result = await service.getGroupCategories(userId, groupId);

      expect(result).toEqual(['Dairy', 'Meat', 'Vegetables']);
      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          group_id: groupId,
          category: { not: null },
        },
        select: {
          category: true,
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc',
        },
      });
    });
  });
});