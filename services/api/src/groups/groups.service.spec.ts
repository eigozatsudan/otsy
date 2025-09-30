import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    group: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    groupMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const userId = 'user-1';
      const createGroupDto = {
        name: 'Test Group',
        description: 'Test Description',
      };

      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        description: 'Test Description',
        invite_code: 'TESTCODE123',
        created_by: userId,
        created_at: new Date(),
      };

      mockPrismaService.group.findUnique.mockResolvedValue(null); // No existing invite code
      mockPrismaService.group.create.mockResolvedValue(mockGroup);
      mockPrismaService.groupMember.create.mockResolvedValue({});
      
      // Mock getGroupById response
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        role: 'owner',
      });
      mockPrismaService.group.findUnique.mockResolvedValue({
        ...mockGroup,
        _count: { members: 1 },
      });

      const result = await service.createGroup(userId, createGroupDto);

      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        invite_code: mockGroup.invite_code,
        created_by: mockGroup.created_by,
        created_at: mockGroup.created_at,
        member_count: 1,
        my_role: 'owner',
      });

      expect(mockPrismaService.group.create).toHaveBeenCalledWith({
        data: {
          name: createGroupDto.name,
          description: createGroupDto.description,
          invite_code: expect.any(String),
          created_by: userId,
        },
      });

      expect(mockPrismaService.groupMember.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          group_id: mockGroup.id,
          role: 'owner',
        },
      });
    });
  });

  describe('joinGroup', () => {
    it('should join group successfully', async () => {
      const userId = 'user-1';
      const joinGroupDto = { invite_code: 'TESTCODE123' };

      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        invite_code: 'TESTCODE123',
      };

      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);
      mockPrismaService.groupMember.findUnique
        .mockResolvedValueOnce(null) // Not already a member
        .mockResolvedValueOnce({ role: 'member' }); // After joining
      mockPrismaService.groupMember.create.mockResolvedValue({});
      mockPrismaService.group.findUnique.mockResolvedValue({
        ...mockGroup,
        _count: { members: 2 },
      });

      const result = await service.joinGroup(userId, joinGroupDto);

      expect(result.id).toBe(mockGroup.id);
      expect(result.my_role).toBe('member');
      expect(mockPrismaService.groupMember.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          group_id: mockGroup.id,
          role: 'member',
        },
      });
    });

    it('should throw NotFoundException for invalid invite code', async () => {
      const userId = 'user-1';
      const joinGroupDto = { invite_code: 'INVALID123' };

      mockPrismaService.group.findUnique.mockResolvedValue(null);

      await expect(service.joinGroup(userId, joinGroupDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already a member', async () => {
      const userId = 'user-1';
      const joinGroupDto = { invite_code: 'TESTCODE123' };

      const mockGroup = {
        id: 'group-1',
        invite_code: 'TESTCODE123',
      };

      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);
      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        user_id: userId,
        group_id: mockGroup.id,
      });

      await expect(service.joinGroup(userId, joinGroupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully as owner', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const updateGroupDto = { name: 'Updated Group Name' };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        role: 'owner',
      });
      mockPrismaService.group.update.mockResolvedValue({
        id: groupId,
        name: 'Updated Group Name',
      });
      mockPrismaService.group.findUnique.mockResolvedValue({
        id: groupId,
        name: 'Updated Group Name',
        _count: { members: 1 },
      });

      const result = await service.updateGroup(userId, groupId, updateGroupDto);

      expect(result.name).toBe('Updated Group Name');
      expect(mockPrismaService.group.update).toHaveBeenCalledWith({
        where: { id: groupId },
        data: updateGroupDto,
      });
    });

    it('should throw ForbiddenException for non-owner', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      const updateGroupDto = { name: 'Updated Group Name' };

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        role: 'member',
      });

      await expect(service.updateGroup(userId, groupId, updateGroupDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveGroup', () => {
    it('should leave group successfully as member', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        role: 'member',
      });
      mockPrismaService.groupMember.delete.mockResolvedValue({});

      const result = await service.leaveGroup(userId, groupId);

      expect(result.message).toBe('Left group successfully');
      expect(mockPrismaService.groupMember.delete).toHaveBeenCalledWith({
        where: {
          user_id_group_id: {
            user_id: userId,
            group_id: groupId,
          },
        },
      });
    });

    it('should transfer ownership when owner leaves', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';

      mockPrismaService.groupMember.findUnique.mockResolvedValue({
        role: 'owner',
      });
      mockPrismaService.groupMember.findFirst.mockResolvedValue({
        user_id: 'user-2',
        group_id: groupId,
      });
      mockPrismaService.groupMember.update.mockResolvedValue({});
      mockPrismaService.groupMember.delete.mockResolvedValue({});

      const result = await service.leaveGroup(userId, groupId);

      expect(result.message).toBe('Left group successfully');
      expect(mockPrismaService.groupMember.update).toHaveBeenCalledWith({
        where: {
          user_id_group_id: {
            user_id: 'user-2',
            group_id: groupId,
          },
        },
        data: { role: 'owner' },
      });
    });
  });

  describe('invite code generation', () => {
    it('should generate unique 12-character invite codes', async () => {
      const userId = 'user-1';
      const createGroupDto = { name: 'Test Group' };

      mockPrismaService.group.findUnique.mockResolvedValue(null); // No collision
      mockPrismaService.group.create.mockResolvedValue({
        id: 'group-1',
        invite_code: expect.any(String),
      });
      mockPrismaService.groupMember.create.mockResolvedValue({});
      mockPrismaService.groupMember.findUnique.mockResolvedValue({ role: 'owner' });
      mockPrismaService.group.findUnique.mockResolvedValue({
        id: 'group-1',
        _count: { members: 1 },
      });

      await service.createGroup(userId, createGroupDto);

      const createCall = mockPrismaService.group.create.mock.calls[0][0];
      const inviteCode = createCall.data.invite_code;

      expect(inviteCode).toHaveLength(12);
      expect(inviteCode).toMatch(/^[A-Z0-9]+$/);
    });
  });
});