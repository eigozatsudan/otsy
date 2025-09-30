import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchasesQueryDto } from './dto/purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 購入記録を作成
   */
  async createPurchase(userId: string, groupId: string, createPurchaseDto: CreatePurchaseDto) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    // アイテムがすべて指定されたグループに属するかチェック
    const itemIds = createPurchaseDto.items.map(item => item.item_id);
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        group_id: groupId,
      }
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('Some items do not belong to this group');
    }

    // トランザクションで購入記録と購入アイテムを作成
    const result = await this.prisma.$transaction(async (tx) => {
      // 購入記録を作成
      const purchase = await tx.purchase.create({
        data: {
          group_id: groupId,
          purchased_by: userId,
          total_amount: Math.round(createPurchaseDto.total_amount * 100), // 円を銭に変換
          currency: createPurchaseDto.currency || 'JPY',
          receipt_image_url: createPurchaseDto.receipt_image_url,
          note: createPurchaseDto.note,
        },
      });

      // 購入アイテムを作成
      await tx.purchaseItem.createMany({
        data: createPurchaseDto.items.map(item => ({
          purchase_id: purchase.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price ? Math.round(item.unit_price * 100) : null, // 円を銭に変換
        })),
      });

      // 関連するアイテムのステータスを購入済みに更新
      await tx.item.updateMany({
        where: {
          id: { in: itemIds },
        },
        data: {
          status: 'purchased',
          updated_at: new Date(),
        },
      });

      return purchase;
    });

    return this.getPurchaseById(userId, result.id);
  }

  /**
   * グループの購入記録一覧を取得
   */
  async getGroupPurchases(userId: string, groupId: string, query?: PurchasesQueryDto) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const where: any = {
      group_id: groupId,
    };

    // フィルター条件を追加
    if (query?.purchased_by) {
      where.purchased_by = query.purchased_by;
    }

    if (query?.start_date || query?.end_date) {
      where.purchased_at = {};
      if (query.start_date) {
        where.purchased_at.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        const endDate = new Date(query.end_date);
        endDate.setHours(23, 59, 59, 999); // 終了日の23:59:59まで
        where.purchased_at.lte = endDate;
      }
    }

    if (query?.min_amount || query?.max_amount) {
      where.total_amount = {};
      if (query.min_amount) {
        where.total_amount.gte = Math.round(query.min_amount * 100); // 円を銭に変換
      }
      if (query.max_amount) {
        where.total_amount.lte = Math.round(query.max_amount * 100); // 円を銭に変換
      }
    }

    const purchases = await this.prisma.purchase.findMany({
      where,
      include: {
        purchaser: {
          select: {
            display_name: true,
          }
        },
        purchase_items: {
          include: {
            item: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        purchased_at: 'desc'
      }
    });

    return purchases.map(purchase => ({
      id: purchase.id,
      group_id: purchase.group_id,
      purchased_by: purchase.purchased_by,
      purchaser_name: purchase.purchaser.display_name,
      total_amount: purchase.total_amount / 100, // 銭を円に変換
      currency: purchase.currency,
      receipt_image_url: purchase.receipt_image_url,
      purchased_at: purchase.purchased_at,
      note: purchase.note,
      items: purchase.purchase_items.map(purchaseItem => ({
        item_id: purchaseItem.item_id,
        item_name: purchaseItem.item.name,
        quantity: Number(purchaseItem.quantity),
        unit_price: purchaseItem.unit_price ? purchaseItem.unit_price / 100 : undefined, // 銭を円に変換
      })),
    }));
  }

  /**
   * 購入記録詳細を取得
   */
  async getPurchaseById(userId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        purchaser: {
          select: {
            display_name: true,
          }
        },
        purchase_items: {
          include: {
            item: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, purchase.group_id);

    return {
      id: purchase.id,
      group_id: purchase.group_id,
      purchased_by: purchase.purchased_by,
      purchaser_name: purchase.purchaser.display_name,
      total_amount: purchase.total_amount / 100, // 銭を円に変換
      currency: purchase.currency,
      receipt_image_url: purchase.receipt_image_url,
      purchased_at: purchase.purchased_at,
      note: purchase.note,
      items: purchase.purchase_items.map(purchaseItem => ({
        item_id: purchaseItem.item_id,
        item_name: purchaseItem.item.name,
        quantity: Number(purchaseItem.quantity),
        unit_price: purchaseItem.unit_price ? purchaseItem.unit_price / 100 : undefined, // 銭を円に変換
      })),
    };
  }

  /**
   * 購入記録を更新
   */
  async updatePurchase(userId: string, purchaseId: string, updatePurchaseDto: UpdatePurchaseDto) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId }
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, purchase.group_id);

    // 購入者本人のみ更新可能
    if (purchase.purchased_by !== userId) {
      throw new ForbiddenException('Only the purchaser can update this purchase');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 購入記録を更新
      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          total_amount: updatePurchaseDto.total_amount ? Math.round(updatePurchaseDto.total_amount * 100) : undefined,
          receipt_image_url: updatePurchaseDto.receipt_image_url,
          note: updatePurchaseDto.note,
        },
      });

      // アイテムが指定されている場合は更新
      if (updatePurchaseDto.items) {
        // 既存の購入アイテムを削除
        await tx.purchaseItem.deleteMany({
          where: { purchase_id: purchaseId }
        });

        // 新しい購入アイテムを作成
        if (updatePurchaseDto.items.length > 0) {
          // アイテムがすべて指定されたグループに属するかチェック
          const itemIds = updatePurchaseDto.items.map(item => item.item_id);
          const items = await tx.item.findMany({
            where: {
              id: { in: itemIds },
              group_id: purchase.group_id,
            }
          });

          if (items.length !== itemIds.length) {
            throw new BadRequestException('Some items do not belong to this group');
          }

          await tx.purchaseItem.createMany({
            data: updatePurchaseDto.items.map(item => ({
              purchase_id: purchaseId,
              item_id: item.item_id,
              quantity: item.quantity,
              unit_price: item.unit_price ? Math.round(item.unit_price * 100) : null,
            })),
          });
        }
      }

      return updatedPurchase;
    });

    return this.getPurchaseById(userId, result.id);
  }

  /**
   * 購入記録を削除
   */
  async deletePurchase(userId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        purchase_items: true,
      }
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, purchase.group_id);

    // 購入者本人のみ削除可能
    if (purchase.purchased_by !== userId) {
      throw new ForbiddenException('Only the purchaser can delete this purchase');
    }

    await this.prisma.$transaction(async (tx) => {
      // 購入アイテムを削除
      await tx.purchaseItem.deleteMany({
        where: { purchase_id: purchaseId }
      });

      // 購入記録を削除
      await tx.purchase.delete({
        where: { id: purchaseId }
      });

      // 関連するアイテムのステータスをtodoに戻す
      const itemIds = purchase.purchase_items.map(item => item.item_id);
      if (itemIds.length > 0) {
        await tx.item.updateMany({
          where: {
            id: { in: itemIds },
          },
          data: {
            status: 'todo',
            updated_at: new Date(),
          },
        });
      }
    });

    return { message: 'Purchase deleted successfully' };
  }

  /**
   * グループの購入統計を取得
   */
  async getGroupPurchaseStats(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const [
      totalPurchases,
      totalAmount,
      purchasesByMember,
      recentPurchases
    ] = await Promise.all([
      // 総購入回数
      this.prisma.purchase.count({
        where: { group_id: groupId }
      }),

      // 総購入金額
      this.prisma.purchase.aggregate({
        where: { group_id: groupId },
        _sum: { total_amount: true }
      }),

      // メンバー別購入統計
      this.prisma.purchase.groupBy({
        by: ['purchased_by'],
        where: { group_id: groupId },
        _count: { id: true },
        _sum: { total_amount: true },
      }),

      // 最近の購入（5件）
      this.prisma.purchase.findMany({
        where: { group_id: groupId },
        include: {
          purchaser: {
            select: { display_name: true }
          }
        },
        orderBy: { purchased_at: 'desc' },
        take: 5,
      })
    ]);

    // メンバー情報を取得
    const memberIds = purchasesByMember.map(p => p.purchased_by);
    const members = await this.prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, display_name: true }
    });

    const memberMap = new Map(members.map(m => [m.id, m.display_name]));

    return {
      total_purchases: totalPurchases,
      total_amount: totalAmount._sum.total_amount ? totalAmount._sum.total_amount / 100 : 0,
      purchases_by_member: purchasesByMember.map(p => ({
        user_id: p.purchased_by,
        user_name: memberMap.get(p.purchased_by) || 'Unknown',
        purchase_count: p._count.id,
        total_amount: p._sum.total_amount ? p._sum.total_amount / 100 : 0,
      })),
      recent_purchases: recentPurchases.map(p => ({
        id: p.id,
        purchaser_name: p.purchaser.display_name,
        total_amount: p.total_amount / 100,
        purchased_at: p.purchased_at,
      })),
    };
  }

  /**
   * レシート画像のアップロードURL生成（S3署名URL）
   */
  async generateReceiptUploadUrl(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    // TODO: S3署名URL生成ロジックを実装
    // 現在は仮のURLを返す
    const filename = `receipts/${groupId}/${Date.now()}-${userId}.jpg`;
    
    return {
      upload_url: `https://example-bucket.s3.amazonaws.com/${filename}?signature=example`,
      file_url: `https://example-bucket.s3.amazonaws.com/${filename}`,
      expires_in: 3600, // 1時間
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