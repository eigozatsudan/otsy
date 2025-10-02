import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateUserDto {
  phone?: string;
  subscription_tier?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        subscription_tier: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id); // This will throw if user doesn't exist

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        phone: true,
        subscription_tier: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        subscription_tier: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);
    
    const purchaseCount = await this.prisma.purchase.count({
      where: { purchased_by: id },
    });

    // Since there's no status field in Purchase model, we'll count all purchases as completed
    const completedPurchases = purchaseCount;

    return {
      ...user,
      stats: {
        total_orders: purchaseCount,
        completed_orders: completedPurchases,
      },
    };
  }
}