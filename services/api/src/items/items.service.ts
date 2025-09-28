import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemCategoryDto, UpdateItemCategoryDto } from './dto/item-category.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  // Category methods
  async createCategory(createCategoryDto: CreateItemCategoryDto) {
    return this.prisma.itemCategory.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    return this.prisma.itemCategory.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        items: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
          include: {
            category: true,
          },
        },
      },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.itemCategory.findUnique({
      where: { id },
      include: {
        items: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateItemCategoryDto) {
    const category = await this.prisma.itemCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.itemCategory.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        items: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.itemCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete by setting is_active to false
    return this.prisma.itemCategory.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // Item methods
  async createItem(createItemDto: CreateItemDto) {
    // Verify category exists
    const category = await this.prisma.itemCategory.findUnique({
      where: { id: createItemDto.category_id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.item.create({
      data: createItemDto,
      include: {
        category: true,
      },
    });
  }

  async findAllItems() {
    return this.prisma.item.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        category: true,
      },
    });
  }

  async findItemsByCategory(categoryId: string) {
    return this.prisma.item.findMany({
      where: {
        category_id: categoryId,
        is_active: true,
      },
      orderBy: { sort_order: 'asc' },
      include: {
        category: true,
      },
    });
  }

  async findItemById(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async updateItem(id: string, updateItemDto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // If category_id is being updated, verify the new category exists
    if (updateItemDto.category_id) {
      const category = await this.prisma.itemCategory.findUnique({
        where: { id: updateItemDto.category_id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.item.update({
      where: { id },
      data: updateItemDto,
      include: {
        category: true,
      },
    });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Soft delete by setting is_active to false
    return this.prisma.item.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // Search items
  async searchItems(query: string) {
    return this.prisma.item.findMany({
      where: {
        is_active: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { sort_order: 'asc' },
      include: {
        category: true,
      },
    });
  }
}
