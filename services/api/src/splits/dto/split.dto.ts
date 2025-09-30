import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsIn, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomSplitDto {
  @ApiProperty({ description: 'ユーザーID' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: '分担割合（%）', example: 50, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class CalculateSplitDto {
  @ApiProperty({ description: '分割ルール', example: 'equal', enum: ['equal', 'quantity', 'custom'] })
  @IsString()
  @IsIn(['equal', 'quantity', 'custom'])
  rule: 'equal' | 'quantity' | 'custom';

  @ApiProperty({ description: '参加者のユーザーID一覧', type: [String] })
  @IsArray()
  @IsString({ each: true })
  participant_ids: string[];

  @ApiProperty({ description: 'カスタム分割設定', type: [CustomSplitDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomSplitDto)
  custom_splits?: CustomSplitDto[];
}

export class CreateSplitDto {
  @ApiProperty({ description: '分割ルール', example: 'equal', enum: ['equal', 'quantity', 'custom'] })
  @IsString()
  @IsIn(['equal', 'quantity', 'custom'])
  rule: 'equal' | 'quantity' | 'custom';

  @ApiProperty({ description: '参加者のユーザーID一覧', type: [String] })
  @IsArray()
  @IsString({ each: true })
  participant_ids: string[];

  @ApiProperty({ description: 'カスタム分割設定', type: [CustomSplitDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomSplitDto)
  custom_splits?: CustomSplitDto[];
}

export class SplitResultDto {
  @ApiProperty({ description: 'ユーザーID' })
  user_id: string;

  @ApiProperty({ description: 'ユーザー名' })
  user_name: string;

  @ApiProperty({ description: '分担金額（円）' })
  share_amount: number;

  @ApiProperty({ description: '分担割合（%）' })
  share_percentage: number;

  @ApiProperty({ description: '分割ルール' })
  rule: 'equal' | 'quantity' | 'custom';
}

export class SplitCalculationResponseDto {
  @ApiProperty({ description: '購入ID' })
  purchase_id: string;

  @ApiProperty({ description: '合計金額（円）' })
  total_amount: number;

  @ApiProperty({ description: '分割結果', type: [SplitResultDto] })
  splits: SplitResultDto[];

  @ApiProperty({ description: '分割ルール' })
  rule: 'equal' | 'quantity' | 'custom';

  @ApiProperty({ description: '計算日時' })
  calculated_at: Date;
}

export class SettlementSummaryDto {
  @ApiProperty({ description: '債務者ID' })
  debtor_id: string;

  @ApiProperty({ description: '債務者名' })
  debtor_name: string;

  @ApiProperty({ description: '債権者ID' })
  creditor_id: string;

  @ApiProperty({ description: '債権者名' })
  creditor_name: string;

  @ApiProperty({ description: '金額（円）' })
  amount: number;
}

export class GroupSettlementResponseDto {
  @ApiProperty({ description: 'グループID' })
  group_id: string;

  @ApiProperty({ description: 'グループ名' })
  group_name: string;

  @ApiProperty({ description: '清算サマリー', type: [SettlementSummaryDto] })
  settlements: SettlementSummaryDto[];

  @ApiProperty({ description: '総購入金額（円）' })
  total_spent: number;

  @ApiProperty({ description: '一人当たり平均金額（円）' })
  average_per_person: number;

  @ApiProperty({ description: '計算日時' })
  calculated_at: Date;
}