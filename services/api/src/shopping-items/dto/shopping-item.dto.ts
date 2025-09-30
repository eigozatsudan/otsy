import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsIn, Length, IsUrl } from 'class-validator';

export class CreateShoppingItemDto {
  @ApiProperty({ description: 'アイテム名', example: '牛乳' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({ description: 'カテゴリ', example: '乳製品・卵', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @ApiProperty({ description: '数量', example: '1L', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  quantity?: string;

  @ApiProperty({ description: 'メモ', example: '低脂肪がいいです', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @ApiProperty({ description: '画像URL', required: false })
  @IsOptional()
  @IsUrl()
  image_url?: string;
}

export class UpdateShoppingItemDto {
  @ApiProperty({ description: 'アイテム名', example: '牛乳', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiProperty({ description: 'カテゴリ', example: '乳製品・卵', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @ApiProperty({ description: '数量', example: '1L', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  quantity?: string;

  @ApiProperty({ description: 'メモ', example: '低脂肪がいいです', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @ApiProperty({ description: '画像URL', required: false })
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiProperty({ description: 'ステータス', example: 'todo', enum: ['todo', 'purchased', 'cancelled'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['todo', 'purchased', 'cancelled'])
  status?: 'todo' | 'purchased' | 'cancelled';
}

export class UpdateItemStatusDto {
  @ApiProperty({ description: 'ステータス', example: 'purchased', enum: ['todo', 'purchased', 'cancelled'] })
  @IsString()
  @IsIn(['todo', 'purchased', 'cancelled'])
  status: 'todo' | 'purchased' | 'cancelled';
}

export class ShoppingItemResponseDto {
  @ApiProperty({ description: 'アイテムID' })
  id: string;

  @ApiProperty({ description: 'グループID' })
  group_id: string;

  @ApiProperty({ description: 'アイテム名' })
  name: string;

  @ApiProperty({ description: 'カテゴリ' })
  category?: string;

  @ApiProperty({ description: '数量' })
  quantity: string;

  @ApiProperty({ description: 'メモ' })
  note?: string;

  @ApiProperty({ description: '画像URL' })
  image_url?: string;

  @ApiProperty({ description: 'ステータス', enum: ['todo', 'purchased', 'cancelled'] })
  status: 'todo' | 'purchased' | 'cancelled';

  @ApiProperty({ description: '作成者ID' })
  created_by: string;

  @ApiProperty({ description: '作成者名' })
  creator_name?: string;

  @ApiProperty({ description: '作成日時' })
  created_at: Date;

  @ApiProperty({ description: '更新日時' })
  updated_at: Date;
}

export class ShoppingItemsQueryDto {
  @ApiProperty({ description: 'ステータスフィルター', enum: ['todo', 'purchased', 'cancelled'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['todo', 'purchased', 'cancelled'])
  status?: 'todo' | 'purchased' | 'cancelled';

  @ApiProperty({ description: 'カテゴリフィルター', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '検索クエリ', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;
}