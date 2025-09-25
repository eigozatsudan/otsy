import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateShopperDto {
  phone?: string;
  status?: 'active' | 'suspended';
}

export interface UpdateShopperStatusDto {
  status: 'active' | 'suspended';
  kyc_status?: 'pending' | 'approved' | 'needs_review' | 'rejected';
  risk_tier?: 'L0' | 'L1' | 'L2' | 'L-1';
}

@Injectable()
export class ShoppersService {
  constructor(private prisma: PrismaService) { }

  async findOne(id: string) {
    const shopper = await this.prisma.shopper.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        kyc_status: true,
        risk_tier: true,
        rating_avg: true,
        rating_count: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    return shopper;
  }

  async findByEmail(email: string) {
    return this.prisma.shopper.findUnique({
      where: { email },
    });
  }

  async updateProfile(id: string, updateShopperDto: UpdateShopperDto) {
    const shopper = await this.findOne(id); // This will throw if shopper doesn't exist

    return this.prisma.shopper.update({
      where: { id },
      data: updateShopperDto,
      select: {
        id: true,
        email: true,
        phone: true,
        kyc_status: true,
        risk_tier: true,
        rating_avg: true,
        rating_count: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findAll() {
    return this.prisma.shopper.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        kyc_status: true,
        risk_tier: true,
        rating_avg: true,
        rating_count: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateStatus(adminId: string, shopperId: string, updateStatusDto: UpdateShopperStatusDto) {
    const shopper = await this.findOne(shopperId); // This will throw if shopper doesn't exist

    const updatedShopper = await this.prisma.shopper.update({
      where: { id: shopperId },
      data: {
        status: updateStatusDto.status,
        kyc_status: updateStatusDto.kyc_status || shopper.kyc_status,
        risk_tier: updateStatusDto.risk_tier || shopper.risk_tier,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        kyc_status: true,
        risk_tier: true,
        rating_avg: true,
        rating_count: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Create audit log
    await this.prisma.orderAuditLog.create({
      data: {
        order_id: '00000000-0000-0000-0000-000000000000', // Placeholder for shopper actions
        actor_id: adminId,
        actor_role: 'admin',
        action: 'shopper_status_updated',
        payload: {
          shopper_id: shopperId,
          old_status: shopper.status,
          new_status: updateStatusDto.status,
          kyc_status: updateStatusDto.kyc_status,
          risk_tier: updateStatusDto.risk_tier,
        },
      },
    });

    return updatedShopper;
  }

  async getShopperStats(id: string) {
    const shopper = await this.findOne(id);

    const orderCount = await this.prisma.order.count({
      where: { shopper_id: id },
    });

    const completedOrders = await this.prisma.order.count({
      where: {
        shopper_id: id,
        status: 'delivered',
      },
    });

    const avgRating = await this.prisma.shopper.findUnique({
      where: { id },
      select: { rating_avg: true, rating_count: true },
    });

    return {
      ...shopper,
      stats: {
        total_orders: orderCount,
        completed_orders: completedOrders,
        rating_avg: avgRating?.rating_avg,
        rating_count: avgRating?.rating_count,
      },
    };
  }

  async canAcceptOrders(shopperId: string): Promise<boolean> {
    const shopper = await this.findOne(shopperId);

    return (
      shopper.status === 'active' &&
      shopper.kyc_status === 'approved' &&
      shopper.risk_tier !== 'L-1'
    );
  }
}