import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { RealtimeService } from './realtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: any;
  let realtimeService: any;

  const mockUser = { id: 'user1', display_name: 'User One' };
  const mockGroup = { id: 'group1', name: 'Test Group', created_by: 'user1' };
  const mockItem = { id: 'item1', name: 'Test Item', group_id: 'group1' };

  beforeEach(async () => {
    const mockPrismaService = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        groupBy: jest.fn(),
      },
      groupMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      item: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockRealtimeService = {
      broadcastMessage: jest.fn(),
      broadcastMention: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtimeService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get(PrismaService);
    realtimeService = module.get(RealtimeService);
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
    });

    it('should send a general group message successfully', async () => {
      const createMessageDto = {
        body: 'Hello everyone!',
      };

      const mockMessage = {
        id: 'msg1',
        group_id: 'group1',
        item_id: null,
        author_id: 'user1',
        body: 'Hello everyone!',
        image_url: null,
        created_at: new Date(),
        author: { display_name: 'User One' },
        item: null,
      };

      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.sendMessage('user1', 'group1', createMessageDto);

      expect(result.body).toBe('Hello everyone!');
      expect(result.group_id).toBe('group1');
      expect(result.item_id).toBeNull();
      expect(result.author_name).toBe('User One');
      expect(realtimeService.broadcastMessage).toHaveBeenCalledWith(result, 'user1');
    });

    it('should send an item thread message successfully', async () => {
      const createMessageDto = {
        body: 'Should we get the organic version?',
        item_id: 'item1',
      };

      prisma.item.findUnique.mockResolvedValue(mockItem);

      const mockMessage = {
        id: 'msg2',
        group_id: 'group1',
        item_id: 'item1',
        author_id: 'user1',
        body: 'Should we get the organic version?',
        image_url: null,
        created_at: new Date(),
        author: { display_name: 'User One' },
        item: { name: 'Test Item' },
      };

      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.sendMessage('user1', 'group1', createMessageDto);

      expect(result.body).toBe('Should we get the organic version?');
      expect(result.item_id).toBe('item1');
      expect(result.item_name).toBe('Test Item');
      expect(realtimeService.broadcastMessage).toHaveBeenCalledWith(result, 'user1');
    });

    it('should process @mentions and broadcast mention notifications', async () => {
      const createMessageDto = {
        body: 'Hey @Alice, what do you think about this?',
      };

      const mockMessage = {
        id: 'msg3',
        group_id: 'group1',
        item_id: null,
        author_id: 'user1',
        body: 'Hey @Alice, what do you think about this?',
        image_url: null,
        created_at: new Date(),
        author: { display_name: 'User One' },
        item: null,
      };

      prisma.message.create.mockResolvedValue(mockMessage);
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user2', user: { id: 'user2', display_name: 'Alice' } },
      ]);

      const result = await service.sendMessage('user1', 'group1', createMessageDto);

      expect(realtimeService.broadcastMention).toHaveBeenCalledWith(
        'group1',
        undefined,
        'user2',
        expect.objectContaining({ body: 'Hey @Alice, what do you think about this?' })
      );
    });

    it('should throw error when user is not a group member', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      const createMessageDto = {
        body: 'Hello everyone!',
      };

      await expect(
        service.sendMessage('user1', 'group1', createMessageDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when item does not exist', async () => {
      prisma.item.findUnique.mockResolvedValue(null);

      const createMessageDto = {
        body: 'About this item...',
        item_id: 'nonexistent',
      };

      await expect(
        service.sendMessage('user1', 'group1', createMessageDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when item belongs to different group', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item1',
        group_id: 'different-group',
        name: 'Test Item',
      });

      const createMessageDto = {
        body: 'About this item...',
        item_id: 'item1',
      };

      await expect(
        service.sendMessage('user1', 'group1', createMessageDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGroupMessages', () => {
    beforeEach(() => {
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
    });

    it('should retrieve group messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          group_id: 'group1',
          item_id: null,
          author_id: 'user1',
          body: 'Hello!',
          image_url: null,
          created_at: new Date('2024-01-01T10:00:00Z'),
          author: { display_name: 'User One' },
        },
        {
          id: 'msg2',
          group_id: 'group1',
          item_id: null,
          author_id: 'user2',
          body: 'Hi there!',
          image_url: null,
          created_at: new Date('2024-01-01T10:01:00Z'),
          author: { display_name: 'User Two' },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages.reverse()); // Simulate DESC order
      prisma.message.count.mockResolvedValue(2);

      const result = await service.getGroupMessages('user1', 'group1', 1, 50);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].body).toBe('Hello!');
      expect(result.messages[1].body).toBe('Hi there!');
      expect(result.total).toBe(2);
      expect(result.has_more).toBe(false);
      expect(result.page).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      prisma.message.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(100);

      const result = await service.getGroupMessages('user1', 'group1', 2, 50);

      expect(result.has_more).toBe(false); // 50 + 50 = 100, no more
      expect(result.page).toBe(2);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { group_id: 'group1', item_id: null },
        include: { author: { select: { display_name: true } } },
        orderBy: { created_at: 'desc' },
        skip: 50,
        take: 50,
      });
    });
  });

  describe('getItemThread', () => {
    beforeEach(() => {
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
      prisma.item.findUnique.mockResolvedValue(mockItem);
    });

    it('should retrieve item thread messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          group_id: 'group1',
          item_id: 'item1',
          author_id: 'user1',
          body: 'What brand should we get?',
          image_url: null,
          created_at: new Date(),
          author: { display_name: 'User One' },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages.reverse());
      prisma.message.count.mockResolvedValue(1);

      const result = await service.getItemThread('user1', 'group1', 'item1', 1, 50);

      expect(result.item_id).toBe('item1');
      expect(result.item_name).toBe('Test Item');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].body).toBe('What brand should we get?');
      expect(result.total).toBe(1);
    });

    it('should throw error when item not found', async () => {
      prisma.item.findUnique.mockResolvedValue(null);

      await expect(
        service.getItemThread('user1', 'group1', 'nonexistent', 1, 50)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchMessages', () => {
    beforeEach(() => {
      prisma.groupMember.findUnique.mockResolvedValue({ user_id: 'user1', group_id: 'group1' });
    });

    it('should search messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          group_id: 'group1',
          item_id: null,
          author_id: 'user1',
          body: 'Let\'s buy organic milk',
          image_url: null,
          created_at: new Date(),
          author: { display_name: 'User One' },
          item: null,
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages);
      prisma.message.count.mockResolvedValue(1);

      const result = await service.searchMessages('user1', 'group1', 'organic', undefined, 1, 20);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].body).toContain('organic');
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          group_id: 'group1',
          body: { contains: 'organic', mode: 'insensitive' },
        },
        include: {
          author: { select: { display_name: true } },
          item: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should search within specific item thread', async () => {
      prisma.message.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(0);

      await service.searchMessages('user1', 'group1', 'organic', 'item1', 1, 20);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          group_id: 'group1',
          item_id: 'item1',
          body: { contains: 'organic', mode: 'insensitive' },
        },
        include: {
          author: { select: { display_name: true } },
          item: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('deleteMessage', () => {
    it('should allow author to delete their own message', async () => {
      const mockMessage = {
        id: 'msg1',
        author_id: 'user1',
        group: { created_by: 'user2' },
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.message.delete.mockResolvedValue(mockMessage);

      await service.deleteMessage('user1', 'msg1');

      expect(prisma.message.delete).toHaveBeenCalledWith({ where: { id: 'msg1' } });
    });

    it('should allow group creator to delete any message', async () => {
      const mockMessage = {
        id: 'msg1',
        author_id: 'user2',
        group: { created_by: 'user1' },
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.message.delete.mockResolvedValue(mockMessage);

      await service.deleteMessage('user1', 'msg1');

      expect(prisma.message.delete).toHaveBeenCalledWith({ where: { id: 'msg1' } });
    });

    it('should throw error when user cannot delete message', async () => {
      const mockMessage = {
        id: 'msg1',
        author_id: 'user2',
        group: { created_by: 'user3' },
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage);

      await expect(
        service.deleteMessage('user1', 'msg1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when message not found', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteMessage('user1', 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('processMentions', () => {
    it('should extract and resolve @mentions correctly', async () => {
      const messageBody = 'Hey @Alice and @Bob, what do you think?';
      
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user2', user: { id: 'user2', display_name: 'Alice' } },
        { user_id: 'user3', user: { id: 'user3', display_name: 'Bob' } },
        { user_id: 'user4', user: { id: 'user4', display_name: 'Charlie' } },
      ]);

      const result = await service.processMentions('group1', messageBody);

      expect(result).toEqual(['user2', 'user3']);
    });

    it('should handle case-insensitive mentions', async () => {
      const messageBody = 'Hey @alice, are you there?';
      
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user2', user: { id: 'user2', display_name: 'Alice' } },
      ]);

      const result = await service.processMentions('group1', messageBody);

      expect(result).toEqual(['user2']);
    });

    it('should return empty array when no mentions found', async () => {
      const messageBody = 'Hello everyone!';
      
      const result = await service.processMentions('group1', messageBody);

      expect(result).toEqual([]);
    });

    it('should ignore mentions of non-existent users', async () => {
      const messageBody = 'Hey @NonExistent, are you there?';
      
      prisma.groupMember.findMany.mockResolvedValue([
        { user_id: 'user2', user: { id: 'user2', display_name: 'Alice' } },
      ]);

      const result = await service.processMentions('group1', messageBody);

      expect(result).toEqual([]);
    });
  });
});