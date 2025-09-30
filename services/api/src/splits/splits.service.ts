import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateSplitDto, CreateSplitDto } from './dto/split.dto';

@Injectable()
export class SplitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 購入の費用分割を計算
   */
  async calculateSplit(userId: string, purchaseId: string, calculateSplitDto: CalculateSplitDto) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        purchase_items: {
          include: {
            item: true,
          }
        }
      }
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, purchase.group_id);

    // 参加者がすべてグループのメンバーかチェック
    await this.validateParticipants(calculateSplitDto.participant_ids, purchase.group_id);

    // 分割を計算
    const splits = await this.computeSplits(
      purchase,
      calculateSplitDto.rule,
      calculateSplitDto.participant_ids,
      calculateSplitDto.custom_splits
    );

    // ユーザー名を取得
    const users = await this.prisma.user.findMany({
      where: { id: { in: calculateSplitDto.participant_ids } },
      select: { id: true, display_name: true }
    });

    const userMap = new Map(users.map(u => [u.id, u.display_name]));

    return {
      purchase_id: purchaseId,
      total_amount: purchase.total_amount / 100, // 銭を円に変換
      splits: splits.map(split => ({
        user_id: split.user_id,
        user_name: userMap.get(split.user_id) || 'Unknown',
        share_amount: split.share_amount / 100, // 銭を円に変換
        share_percentage: (split.share_amount / purchase.total_amount) * 100,
        rule: split.rule,
      })),
      rule: calculateSplitDto.rule,
      calculated_at: new Date(),
    };
  }

  /**
   * 費用分割を確定・保存
   */
  async createSplit(userId: string, purchaseId: string, createSplitDto: CreateSplitDto) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        purchase_items: {
          include: {
            item: true,
          }
        }
      }
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, purchase.group_id);

    // 参加者がすべてグループのメンバーかチェック
    await this.validateParticipants(createSplitDto.participant_ids, purchase.group_id);

    // 分割を計算
    const splits = await this.computeSplits(
      purchase,
      createSplitDto.rule,
      createSplitDto.participant_ids,
      createSplitDto.custom_splits
    );

    // 既存の分割を削除して新しい分割を保存
    await this.prisma.$transaction(async (tx) => {
      // 既存の分割を削除
      await tx.split.deleteMany({
        where: { purchase_id: purchaseId }
      });

      // 新しい分割を作成
      await tx.split.createMany({
        data: splits.map(split => ({
          purchase_id: purchaseId,
          user_id: split.user_id,
          share_amount: split.share_amount,
          rule: split.rule,
        }))
      });
    });

    return this.getSplitByPurchaseId(userId, purchaseId);
  }

  /**
   * 購入の分割結果を取得
   */
  async getSplitByPurchaseId(userId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        splits: {
          include: {
            user: {
              select: {
                display_name: true,
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

    if (purchase.splits.length === 0) {
      throw new NotFoundException('No splits found for this purchase');
    }

    return {
      purchase_id: purchaseId,
      total_amount: purchase.total_amount / 100,
      splits: purchase.splits.map(split => ({
        user_id: split.user_id,
        user_name: split.user.display_name,
        share_amount: split.share_amount / 100,
        share_percentage: (split.share_amount / purchase.total_amount) * 100,
        rule: split.rule as 'equal' | 'quantity' | 'custom',
      })),
      rule: purchase.splits[0].rule as 'equal' | 'quantity' | 'custom',
      calculated_at: new Date(),
    };
  }

  /**
   * グループの清算サマリーを取得
   */
  async getGroupSettlement(userId: string, groupId: string) {
    // ユーザーがグループのメンバーかチェック
    await this.checkGroupMembership(userId, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // グループの全購入と分割を取得
    const purchases = await this.prisma.purchase.findMany({
      where: { group_id: groupId },
      include: {
        splits: {
          include: {
            user: {
              select: {
                display_name: true,
              }
            }
          }
        }
      }
    });

    // 各ユーザーの支払い額と負担額を計算
    const userBalances = new Map<string, { paid: number; owes: number; name: string }>();

    for (const purchase of purchases) {
      // 支払い額を記録
      const purchaser = purchase.purchased_by;
      if (!userBalances.has(purchaser)) {
        userBalances.set(purchaser, { paid: 0, owes: 0, name: '' });
      }
      userBalances.get(purchaser)!.paid += purchase.total_amount;

      // 分割負担額を記録
      for (const split of purchase.splits) {
        if (!userBalances.has(split.user_id)) {
          userBalances.set(split.user_id, { paid: 0, owes: 0, name: split.user.display_name });
        }
        const balance = userBalances.get(split.user_id)!;
        balance.owes += split.share_amount;
        balance.name = split.user.display_name;
      }
    }

    // 清算を計算（誰が誰にいくら払うか）
    const settlements = this.calculateSettlements(userBalances);

    const totalSpent = purchases.reduce((sum, p) => sum + p.total_amount, 0);
    const memberCount = userBalances.size;

    return {
      group_id: groupId,
      group_name: group.name,
      settlements: settlements.map(s => ({
        debtor_id: s.debtor_id,
        debtor_name: s.debtor_name,
        creditor_id: s.creditor_id,
        creditor_name: s.creditor_name,
        amount: s.amount / 100, // 銭を円に変換
      })),
      total_spent: totalSpent / 100,
      average_per_person: memberCount > 0 ? totalSpent / memberCount / 100 : 0,
      calculated_at: new Date(),
    };
  }

  /**
   * 分割を計算する内部メソッド
   */
  private async computeSplits(
    purchase: any,
    rule: 'equal' | 'quantity' | 'custom',
    participantIds: string[],
    customSplits?: { user_id: string; percentage: number }[]
  ) {
    const totalAmount = purchase.total_amount;

    switch (rule) {
      case 'equal':
        return this.calculateEqualSplit(totalAmount, participantIds);

      case 'quantity':
        return this.calculateQuantitySplit(totalAmount, participantIds, purchase.purchase_items);

      case 'custom':
        if (!customSplits || customSplits.length === 0) {
          throw new BadRequestException('Custom splits are required for custom rule');
        }
        return this.calculateCustomSplit(totalAmount, customSplits);

      default:
        throw new BadRequestException('Invalid split rule');
    }
  }

  /**
   * 均等分割を計算
   */
  private calculateEqualSplit(totalAmount: number, participantIds: string[]) {
    const memberCount = participantIds.length;
    const baseAmount = Math.floor(totalAmount / memberCount);
    const remainder = totalAmount % memberCount;

    // 余りは上位ID順に+1円ずつ配分
    const sortedIds = [...participantIds].sort();

    return sortedIds.map((userId, index) => ({
      user_id: userId,
      share_amount: baseAmount + (index < remainder ? 1 : 0),
      rule: 'equal' as const,
    }));
  }

  /**
   * 数量比例分割を計算
   */
  private calculateQuantitySplit(totalAmount: number, participantIds: string[], purchaseItems: any[]) {
    // 各参加者の数量合計を計算
    const userQuantities = new Map<string, number>();
    
    // 初期化
    participantIds.forEach(id => userQuantities.set(id, 0));

    // 購入アイテムから数量を集計（簡単化のため、全員が全アイテムを等分と仮定）
    const totalQuantity = purchaseItems.reduce((sum, item) => sum + Number(item.quantity), 0);
    const quantityPerPerson = totalQuantity / participantIds.length;

    participantIds.forEach(id => userQuantities.set(id, quantityPerPerson));

    const totalUserQuantity = Array.from(userQuantities.values()).reduce((sum, qty) => sum + qty, 0);

    if (totalUserQuantity === 0) {
      // 数量が0の場合は均等分割にフォールバック
      return this.calculateEqualSplit(totalAmount, participantIds);
    }

    // 比例配分を計算
    const splits = participantIds.map(userId => {
      const userQuantity = userQuantities.get(userId) || 0;
      const shareRatio = userQuantity / totalUserQuantity;
      const shareAmount = Math.round(totalAmount * shareRatio);

      return {
        user_id: userId,
        share_amount: shareAmount,
        rule: 'quantity' as const,
      };
    });

    // 端数調整
    const totalCalculated = splits.reduce((sum, split) => sum + split.share_amount, 0);
    const difference = totalAmount - totalCalculated;

    if (difference !== 0) {
      // 差額を最初の参加者に調整
      splits[0].share_amount += difference;
    }

    return splits;
  }

  /**
   * カスタム分割を計算
   */
  private calculateCustomSplit(totalAmount: number, customSplits: { user_id: string; percentage: number }[]) {
    // パーセンテージの合計をチェック
    const totalPercentage = customSplits.reduce((sum, split) => sum + split.percentage, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException('Custom split percentages must sum to 100%');
    }

    const splits = customSplits.map(customSplit => {
      const shareAmount = Math.round(totalAmount * (customSplit.percentage / 100));
      return {
        user_id: customSplit.user_id,
        share_amount: shareAmount,
        rule: 'custom' as const,
      };
    });

    // 端数調整
    const totalCalculated = splits.reduce((sum, split) => sum + split.share_amount, 0);
    const difference = totalAmount - totalCalculated;

    if (difference !== 0) {
      // 差額を最初の参加者に調整
      splits[0].share_amount += difference;
    }

    return splits;
  }

  /**
   * 清算を計算（誰が誰にいくら払うか）
   */
  private calculateSettlements(userBalances: Map<string, { paid: number; owes: number; name: string }>) {
    const settlements = [];
    const balances = new Map<string, { balance: number; name: string }>();

    // 各ユーザーの純残高を計算（支払い額 - 負担額）
    for (const [userId, data] of userBalances) {
      balances.set(userId, {
        balance: data.paid - data.owes,
        name: data.name,
      });
    }

    // 債権者（プラス残高）と債務者（マイナス残高）に分ける
    const creditors = Array.from(balances.entries())
      .filter(([_, data]) => data.balance > 0)
      .sort((a, b) => b[1].balance - a[1].balance);

    const debtors = Array.from(balances.entries())
      .filter(([_, data]) => data.balance < 0)
      .map(([userId, data]) => [userId, { balance: -data.balance, name: data.name }])
      .sort((a, b) => (b[1] as any).balance - (a[1] as any).balance);

    // 清算を計算
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const [creditorId, creditorData] = creditors[creditorIndex];
      const [debtorId, debtorData] = debtors[debtorIndex] as [string, { balance: number; name: string }];

      const settlementAmount = Math.min(creditorData.balance, debtorData.balance);

      if (settlementAmount > 0) {
        settlements.push({
          debtor_id: debtorId,
          debtor_name: debtorData.name,
          creditor_id: creditorId,
          creditor_name: creditorData.name,
          amount: settlementAmount,
        });

        creditorData.balance -= settlementAmount;
        debtorData.balance -= settlementAmount;
      }

      if (creditorData.balance === 0) {
        creditorIndex++;
      }
      if (debtorData.balance === 0) {
        debtorIndex++;
      }
    }

    return settlements;
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

  /**
   * 参加者がすべてグループのメンバーかチェック
   */
  private async validateParticipants(participantIds: string[], groupId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        user_id: { in: participantIds },
        group_id: groupId,
      }
    });

    if (memberships.length !== participantIds.length) {
      throw new BadRequestException('Some participants are not members of this group');
    }
  }
}