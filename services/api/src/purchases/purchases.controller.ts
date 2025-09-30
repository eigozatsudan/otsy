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
import { PurchasesService } from './purchases.service';
import {
  CreatePurchaseDto,
  UpdatePurchaseDto,
  PurchaseResponseDto,
  PurchasesQueryDto,
} from './dto/purchase.dto';

@ApiTags('Purchases')
@Controller('groups/:groupId/purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: '購入記録を作成' })
  @ApiResponse({ status: 201, description: '購入記録が正常に作成されました', type: PurchaseResponseDto })
  @ApiResponse({ status: 400, description: '無効な入力データ' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async createPurchase(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.createPurchase(req.user.id, groupId, createPurchaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'グループの購入記録一覧を取得' })
  @ApiResponse({ status: 200, description: '購入記録一覧', type: [PurchaseResponseDto] })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiQuery({ name: 'purchased_by', required: false, type: String })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'min_amount', required: false, type: Number })
  @ApiQuery({ name: 'max_amount', required: false, type: Number })
  async getGroupPurchases(
    @Request() req,
    @Param('groupId') groupId: string,
    @Query() query: PurchasesQueryDto,
  ): Promise<PurchaseResponseDto[]> {
    return this.purchasesService.getGroupPurchases(req.user.id, groupId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'グループの購入統計を取得' })
  @ApiResponse({ status: 200, description: '購入統計' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async getGroupPurchaseStats(@Request() req, @Param('groupId') groupId: string) {
    return this.purchasesService.getGroupPurchaseStats(req.user.id, groupId);
  }

  @Post('receipt-upload-url')
  @ApiOperation({ summary: 'レシート画像アップロード用の署名URLを生成' })
  @ApiResponse({ status: 201, description: 'アップロードURL生成成功' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async generateReceiptUploadUrl(@Request() req, @Param('groupId') groupId: string) {
    return this.purchasesService.generateReceiptUploadUrl(req.user.id, groupId);
  }
}

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PurchaseController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get(':id')
  @ApiOperation({ summary: '購入記録詳細を取得' })
  @ApiResponse({ status: 200, description: '購入記録詳細', type: PurchaseResponseDto })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: '購入記録が見つかりません' })
  async getPurchaseById(@Request() req, @Param('id') purchaseId: string): Promise<PurchaseResponseDto> {
    return this.purchasesService.getPurchaseById(req.user.id, purchaseId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '購入記録を更新' })
  @ApiResponse({ status: 200, description: '購入記録が正常に更新されました', type: PurchaseResponseDto })
  @ApiResponse({ status: 403, description: '購入者本人のみ更新可能です' })
  @ApiResponse({ status: 404, description: '購入記録が見つかりません' })
  async updatePurchase(
    @Request() req,
    @Param('id') purchaseId: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.updatePurchase(req.user.id, purchaseId, updatePurchaseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '購入記録を削除' })
  @ApiResponse({ status: 200, description: '購入記録が正常に削除されました' })
  @ApiResponse({ status: 403, description: '購入者本人のみ削除可能です' })
  @ApiResponse({ status: 404, description: '購入記録が見つかりません' })
  async deletePurchase(@Request() req, @Param('id') purchaseId: string) {
    return this.purchasesService.deletePurchase(req.user.id, purchaseId);
  }
}