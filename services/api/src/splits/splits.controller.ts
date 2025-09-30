import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SplitsService } from './splits.service';
import { CalculateSplitDto, CreateSplitDto, SplitCalculationResponseDto, GroupSettlementResponseDto } from './dto/split.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('splits')
@Controller('splits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Post('purchases/:purchaseId/calculate')
  @ApiOperation({ summary: '購入の費用分割を計算' })
  @ApiResponse({ status: 200, description: '分割計算結果', type: SplitCalculationResponseDto })
  @ApiResponse({ status: 404, description: '購入が見つかりません' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async calculateSplit(
    @Request() req: any,
    @Param('purchaseId') purchaseId: string,
    @Body() calculateSplitDto: CalculateSplitDto,
  ): Promise<SplitCalculationResponseDto> {
    return this.splitsService.calculateSplit(req.user.id, purchaseId, calculateSplitDto);
  }

  @Post('purchases/:purchaseId')
  @ApiOperation({ summary: '費用分割を確定・保存' })
  @ApiResponse({ status: 201, description: '分割が保存されました', type: SplitCalculationResponseDto })
  @ApiResponse({ status: 404, description: '購入が見つかりません' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async createSplit(
    @Request() req: any,
    @Param('purchaseId') purchaseId: string,
    @Body() createSplitDto: CreateSplitDto,
  ): Promise<SplitCalculationResponseDto> {
    return this.splitsService.createSplit(req.user.id, purchaseId, createSplitDto);
  }

  @Get('purchases/:purchaseId')
  @ApiOperation({ summary: '購入の分割結果を取得' })
  @ApiResponse({ status: 200, description: '分割結果', type: SplitCalculationResponseDto })
  @ApiResponse({ status: 404, description: '購入または分割が見つかりません' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async getSplitByPurchaseId(
    @Request() req: any,
    @Param('purchaseId') purchaseId: string,
  ): Promise<SplitCalculationResponseDto> {
    return this.splitsService.getSplitByPurchaseId(req.user.id, purchaseId);
  }

  @Get('groups/:groupId/settlement')
  @ApiOperation({ summary: 'グループの清算サマリーを取得' })
  @ApiResponse({ status: 200, description: '清算サマリー', type: GroupSettlementResponseDto })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  async getGroupSettlement(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ): Promise<GroupSettlementResponseDto> {
    return this.splitsService.getGroupSettlement(req.user.id, groupId);
  }
}