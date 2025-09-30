import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, JoinGroupDto, UpdateMemberRoleDto } from './dto/group.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 12文字の英数字招待コードを生成
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const bytes = randomBytes(12);
    
    for (let i = 0; i < 12; i++) {
      result += chars[bytes[i] % chars.length];
    }
    
    return result;
  }

  /**
   * ユニークな招待コードを生成（重複チェック付き）
   */
  private async generateUniqueInviteCode(): Promise<string> {
    let inviteCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      inviteCode = this.generateInviteCode();
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique invite code');
      }
      
      const existing = await this.prisma.group.findUnique({
        where: { invite_code: inviteCode }
      });
      
      if (!existing) {
        break;
      }
    } while (true);

    return inviteCode;
  }

  /**
   * グループを作成
   */
  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    const inviteCode = await this.generateUniqueInviteCode();

    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        description: createGroupDto.description,
        invite_code: inviteCode,
        created_by: userId,
      },
    });

    // 作成者をオーナーとしてグループに追加
    await this.prisma.groupMember.create({
      data: {
        user_id: userId,
        group_id: group.id,
        role: 'owner',
      },
    });

    return this.getGroupById(userId, group.id);
  }

  /**
   * ユーザーのグループ一覧を取得
   */
  async getUserGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { user_id: userId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      },
      orderBy: {
        joined_at: 'desc'
      }
    });

    return memberships.map(membership => ({
      id: membership.group.id,
      name: membership.group.name,
      description: membership.group.description,
      invite_code: membership.group.invite_code,
      created_by: membership.group.created_by,
      created_at: membership.group.created_at,
      member_count: membership.group._count.members,
      my_role: membership.role as 'owner' | 'member',
    }));
  }

  /**
   * グループ詳細を取得
   */
  async getGroupById(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: groupId,
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      invite_code: group.invite_code,
      created_by: group.created_by,
      created_at: group.created_at,
      member_count: group._count.members,
      my_role: membership.role as 'owner' | 'member',
    };
  }

  /**
   * グループを更新
   */
  async updateGroup(userId: string, groupId: string, updateGroupDto: UpdateGroupDto) {
    // オーナー権限をチェック
    await this.checkOwnerPermission(userId, groupId);

    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: updateGroupDto,
    });

    return this.getGroupById(userId, group.id);
  }

  /**
   * 招待コードでグループに参加
   */
  async joinGroup(userId: string, joinGroupDto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { invite_code: joinGroupDto.invite_code }
    });

    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    // 既にメンバーかチェック
    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: group.id,
        }
      }
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this group');
    }

    // グループに参加
    await this.prisma.groupMember.create({
      data: {
        user_id: userId,
        group_id: group.id,
        role: 'member',
      },
    });

    return this.getGroupById(userId, group.id);
  }

  /**
   * グループメンバー一覧を取得
   */
  async getGroupMembers(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkMemberPermission(userId, groupId);

    const members = await this.prisma.groupMember.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // owner first
        { joined_at: 'asc' }
      ]
    });

    return members.map(member => ({
      user_id: member.user_id,
      display_name: member.user.display_name,
      avatar_url: member.user.avatar_url,
      role: member.role as 'owner' | 'member',
      joined_at: member.joined_at,
    }));
  }

  /**
   * メンバーの役割を更新
   */
  async updateMemberRole(userId: string, groupId: string, targetUserId: string, updateMemberRoleDto: UpdateMemberRoleDto) {
    // オーナー権限をチェック
    await this.checkOwnerPermission(userId, groupId);

    // 自分自身の役割は変更できない
    if (userId === targetUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    // ターゲットユーザーがグループのメンバーかチェック
    const targetMembership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: targetUserId,
          group_id: groupId,
        }
      }
    });

    if (!targetMembership) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.prisma.groupMember.update({
      where: {
        user_id_group_id: {
          user_id: targetUserId,
          group_id: groupId,
        }
      },
      data: {
        role: updateMemberRoleDto.role,
      },
    });

    return { message: 'Member role updated successfully' };
  }

  /**
   * グループからメンバーを削除
   */
  async removeMember(userId: string, groupId: string, targetUserId: string) {
    // オーナー権限をチェック
    await this.checkOwnerPermission(userId, groupId);

    // 自分自身は削除できない
    if (userId === targetUserId) {
      throw new ForbiddenException('Cannot remove yourself from the group');
    }

    // ターゲットユーザーがグループのメンバーかチェック
    const targetMembership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: targetUserId,
          group_id: groupId,
        }
      }
    });

    if (!targetMembership) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.prisma.groupMember.delete({
      where: {
        user_id_group_id: {
          user_id: targetUserId,
          group_id: groupId,
        }
      }
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * グループから退出
   */
  async leaveGroup(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: groupId,
        }
      }
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    // オーナーが退出する場合、他のメンバーに所有権を移譲
    if (membership.role === 'owner') {
      await this.transferOwnership(groupId, userId);
    }

    await this.prisma.groupMember.delete({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: groupId,
        }
      }
    });

    return { message: 'Left group successfully' };
  }

  /**
   * 招待コード情報を取得
   */
  async getInviteInfo(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkMemberPermission(userId, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { invite_code: true, name: true }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${group.invite_code}`;

    return {
      invite_code: group.invite_code,
      invite_url: inviteUrl,
      qr_data: inviteUrl,
    };
  }

  /**
   * 新しい招待コードを生成
   */
  async regenerateInviteCode(userId: string, groupId: string) {
    // オーナー権限をチェック
    await this.checkOwnerPermission(userId, groupId);

    const newInviteCode = await this.generateUniqueInviteCode();

    await this.prisma.group.update({
      where: { id: groupId },
      data: { invite_code: newInviteCode },
    });

    return this.getInviteInfo(userId, groupId);
  }

  /**
   * オーナー権限をチェック
   */
  private async checkOwnerPermission(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: groupId,
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (membership.role !== 'owner') {
      throw new ForbiddenException('Only group owners can perform this action');
    }
  }

  /**
   * メンバー権限をチェック
   */
  private async checkMemberPermission(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: groupId,
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  /**
   * 所有権を移譲（最も古いメンバーに）
   */
  private async transferOwnership(groupId: string, currentOwnerId: string) {
    const oldestMember = await this.prisma.groupMember.findFirst({
      where: {
        group_id: groupId,
        user_id: { not: currentOwnerId },
      },
      orderBy: { joined_at: 'asc' },
    });

    if (oldestMember) {
      await this.prisma.groupMember.update({
        where: {
          user_id_group_id: {
            user_id: oldestMember.user_id,
            group_id: groupId,
          }
        },
        data: { role: 'owner' },
      });
    }
    // 他にメンバーがいない場合、グループは削除される（カスケード削除）
  }
}