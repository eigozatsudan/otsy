import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShoppingItemDto, UpdateShoppingItemDto, UpdateItemStatusDto, ShoppingItemsQueryDto } from './dto/shopping-item.dto';

@Injectable()
export class ShoppingItemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * グループのアイテム一覧を取得
   */
  async getGroupItems(userId: string, groupId: string, query?: ShoppingItemsQueryDto) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const where: any = {
      group_id: groupId,
    };

    // フィルター条件を追加
    if (query?.status) {
      where.status = query.status;
    }

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { note: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        creator: {
          select: {
            display_name: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // todo items first
        { created_at: 'desc' }
      ]
    });

    return items.map(item => ({
      id: item.id,
      group_id: item.group_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      note: item.note,
      image_url: item.image_url,
      status: item.status as 'todo' | 'purchased' | 'cancelled',
      created_by: item.created_by,
      creator_name: item.creator.display_name,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  /**
   * アイテムを作成
   */
  async createItem(userId: string, groupId: string, createItemDto: CreateShoppingItemDto) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const item = await this.prisma.item.create({
      data: {
        group_id: groupId,
        name: createItemDto.name,
        category: createItemDto.category,
        quantity: createItemDto.quantity || '1',
        note: createItemDto.note,
        image_url: createItemDto.image_url,
        status: 'todo',
        created_by: userId,
      },
      include: {
        creator: {
          select: {
            display_name: true,
          }
        }
      }
    });

    return {
      id: item.id,
      group_id: item.group_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      note: item.note,
      image_url: item.image_url,
      status: item.status as 'todo' | 'purchased' | 'cancelled',
      created_by: item.created_by,
      creator_name: item.creator.display_name,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  /**
   * アイテムを取得
   */
  async getItemById(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: {
        creator: {
          select: {
            display_name: true,
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, item.group_id);

    return {
      id: item.id,
      group_id: item.group_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      note: item.note,
      image_url: item.image_url,
      status: item.status as 'todo' | 'purchased' | 'cancelled',
      created_by: item.created_by,
      creator_name: item.creator.display_name,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  /**
   * アイテムを更新
   */
  async updateItem(userId: string, itemId: string, updateItemDto: UpdateShoppingItemDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, item.group_id);

    const updatedItem = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        ...updateItemDto,
        updated_at: new Date(),
      },
      include: {
        creator: {
          select: {
            display_name: true,
          }
        }
      }
    });

    return {
      id: updatedItem.id,
      group_id: updatedItem.group_id,
      name: updatedItem.name,
      category: updatedItem.category,
      quantity: updatedItem.quantity,
      note: updatedItem.note,
      image_url: updatedItem.image_url,
      status: updatedItem.status as 'todo' | 'purchased' | 'cancelled',
      created_by: updatedItem.created_by,
      creator_name: updatedItem.creator.display_name,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at,
    };
  }

  /**
   * アイテムのステータスを更新
   */
  async updateItemStatus(userId: string, itemId: string, updateStatusDto: UpdateItemStatusDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, item.group_id);

    const updatedItem = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        status: updateStatusDto.status,
        updated_at: new Date(),
      },
      include: {
        creator: {
          select: {
            display_name: true,
          }
        }
      }
    });

    return {
      id: updatedItem.id,
      group_id: updatedItem.group_id,
      name: updatedItem.name,
      category: updatedItem.category,
      quantity: updatedItem.quantity,
      note: updatedItem.note,
      image_url: updatedItem.image_url,
      status: updatedItem.status as 'todo' | 'purchased' | 'cancelled',
      created_by: updatedItem.created_by,
      creator_name: updatedItem.creator.display_name,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at,
    };
  }

  /**
   * アイテムを削除
   */
  async deleteItem(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, item.group_id);

    await this.prisma.item.delete({
      where: { id: itemId }
    });

    return { message: 'Item deleted successfully' };
  }

  /**
   * グループのカテゴリ一覧を取得
   */
  async getGroupCategories(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const categories = await this.prisma.item.findMany({
      where: {
        group_id: groupId,
        category: { not: null }
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });

    return categories
      .filter(item => item.category)
      .map(item => item.category);
  }

  /**
   * アイテムの履歴を取得（購入済み・キャンセル済み）
   */
  async getItemHistory(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const items = await this.prisma.item.findMany({
      where: {
        group_id: groupId,
        status: { in: ['purchased', 'cancelled'] }
      },
      include: {
        creator: {
          select: {
            display_name: true,
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 50 // 最新50件
    });

    return items.map(item => ({
      id: item.id,
      group_id: item.group_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      note: item.note,
      image_url: item.image_url,
      status: item.status as 'todo' | 'purchased' | 'cancelled',
      created_by: item.created_by,
      creator_name: item.creator.display_name,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  /**
   * 複数アイテムのステータスを一括更新
   */
  async bulkUpdateStatus(userId: string, groupId: string, itemIds: string[], status: 'todo' | 'purchased' | 'cancelled') {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    // アイテムがすべて指定されたグループに属するかチェック
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        group_id: groupId,
      }
    });

    if (items.length !== itemIds.length) {
      throw new NotFoundException('Some items not found or do not belong to the group');
    }

    await this.prisma.item.updateMany({
      where: {
        id: { in: itemIds },
        group_id: groupId,
      },
      data: {
        status,
        updated_at: new Date(),
      }
    });

    return { 
      message: `${itemIds.length} items updated successfully`,
      updated_count: itemIds.length 
    };
  }

  /**
   * グループメンバーシップをチェック
   */
  private async checkGroupMembership(userId: string, groupId: string) {
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
}