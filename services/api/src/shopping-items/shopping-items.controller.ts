import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShoppingItemsService } from './shopping-items.service';
import {
  CreateShoppingItemDto,
  UpdateShoppingItemDto,
  UpdateItemStatusDto,
  ShoppingItemResponseDto,
  ShoppingItemsQueryDto,
} from './dto/shopping-item.dto';

@ApiTags('Shopping Items')
@Controller('groups/:groupId/items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ShoppingItemsController {
  constructor(private readonly shoppingItemsService: ShoppingItemsService) {}

  @Get()
  @ApiOperation({ summary: 'グループのアイテム一覧を取得' })
  @ApiResponse({ status: 200, description: 'アイテム一覧', type: [ShoppingItemResponseDto] })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  @ApiQuery({ name: 'status', required: false, enum: ['todo', 'purchased', 'cancelled'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getGroupItems(
    @Request() req,
    @Param('groupId') groupId: string,
    @Query() query: ShoppingItemsQueryDto,
  ): Promise<ShoppingItemResponseDto[]> {
    return this.shoppingItemsService.getGroupItems(req.user.id, groupId, query);
  }

  @Post()
  @ApiOperation({ summary: 'アイテムを作成' })
  @ApiResponse({ status: 201, description: 'アイテムが正常に作成されました', type: ShoppingItemResponseDto })
  @ApiResponse({ status: 400, description: '無効な入力データ' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async createItem(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createItemDto: CreateShoppingItemDto,
  ): Promise<ShoppingItemResponseDto> {
    return this.shoppingItemsService.createItem(req.user.id, groupId, createItemDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'グループのカテゴリ一覧を取得' })
  @ApiResponse({ status: 200, description: 'カテゴリ一覧', type: [String] })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async getGroupCategories(@Request() req, @Param('groupId') groupId: string): Promise<string[]> {
    return this.shoppingItemsService.getGroupCategories(req.user.id, groupId);
  }

  @Get('history')
  @ApiOperation({ summary: 'アイテムの履歴を取得（購入済み・キャンセル済み）' })
  @ApiResponse({ status: 200, description: 'アイテム履歴', type: [ShoppingItemResponseDto] })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async getItemHistory(@Request() req, @Param('groupId') groupId: string): Promise<ShoppingItemResponseDto[]> {
    return this.shoppingItemsService.getItemHistory(req.user.id, groupId);
  }

  @Post('bulk-status')
  @ApiOperation({ summary: '複数アイテムのステータスを一括更新' })
  @ApiResponse({ status: 200, description: 'アイテムが正常に更新されました' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: '一部のアイテムが見つかりません' })
  async bulkUpdateStatus(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() body: { item_ids: string[]; status: 'todo' | 'purchased' | 'cancelled' },
  ) {
    return this.shoppingItemsService.bulkUpdateStatus(req.user.id, groupId, body.item_ids, body.status);
  }
}

@ApiTags('Shopping Items')
@Controller('items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ShoppingItemController {
  constructor(private readonly shoppingItemsService: ShoppingItemsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'アイテム詳細を取得' })
  @ApiResponse({ status: 200, description: 'アイテム詳細', type: ShoppingItemResponseDto })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'アイテムが見つかりません' })
  async getItemById(@Request() req, @Param('id') itemId: string): Promise<ShoppingItemResponseDto> {
    return this.shoppingItemsService.getItemById(req.user.id, itemId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'アイテムを更新' })
  @ApiResponse({ status: 200, description: 'アイテムが正常に更新されました', type: ShoppingItemResponseDto })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'アイテムが見つかりません' })
  async updateItem(
    @Request() req,
    @Param('id') itemId: string,
    @Body() updateItemDto: UpdateShoppingItemDto,
  ): Promise<ShoppingItemResponseDto> {
    return this.shoppingItemsService.updateItem(req.user.id, itemId, updateItemDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'アイテムのステータスを更新' })
  @ApiResponse({ status: 200, description: 'ステータスが正常に更新されました', type: ShoppingItemResponseDto })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'アイテムが見つかりません' })
  async updateItemStatus(
    @Request() req,
    @Param('id') itemId: string,
    @Body() updateStatusDto: UpdateItemStatusDto,
  ): Promise<ShoppingItemResponseDto> {
    return this.shoppingItemsService.updateItemStatus(req.user.id, itemId, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'アイテムを削除' })
  @ApiResponse({ status: 200, description: 'アイテムが正常に削除されました' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'アイテムが見つかりません' })
  async deleteItem(@Request() req, @Param('id') itemId: string) {
    return this.shoppingItemsService.deleteItem(req.user.id, itemId);
  }
}