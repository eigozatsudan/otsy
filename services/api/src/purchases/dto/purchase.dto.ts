import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsUrl, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
    @ApiProperty({ description: 'アイテムID' })
    @IsString()
    item_id: string;

    @ApiProperty({ description: '購入数量', example: 2 })
    @IsNumber()
    @Min(0.01)
    quantity: number;

    @ApiProperty({ description: '単価（円）', example: 150, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    unit_price?: number;
}

export class CreatePurchaseDto {
    @ApiProperty({ description: '合計金額（円）', example: 1500 })
    @IsNumber()
    @Min(0)
    total_amount: number;

    @ApiProperty({ description: '通貨', example: 'JPY', required: false })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiProperty({ description: 'レシート画像URL', required: false })
    @IsOptional()
    @IsUrl()
    receipt_image_url?: string;

    @ApiProperty({ description: 'メモ', required: false })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ description: '購入アイテム一覧', type: [PurchaseItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseItemDto)
    items: PurchaseItemDto[];
}

export class UpdatePurchaseDto {
    @ApiProperty({ description: '合計金額（円）', example: 1500, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    total_amount?: number;

    @ApiProperty({ description: 'レシート画像URL', required: false })
    @IsOptional()
    @IsUrl()
    receipt_image_url?: string;

    @ApiProperty({ description: 'メモ', required: false })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ description: '購入アイテム一覧', type: [PurchaseItemDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseItemDto)
    items?: PurchaseItemDto[];
}

export class PurchaseItemResponseDto {
    @ApiProperty({ description: 'アイテムID' })
    item_id: string;

    @ApiProperty({ description: 'アイテム名' })
    item_name: string;

    @ApiProperty({ description: '購入数量' })
    quantity: number;

    @ApiProperty({ description: '単価（円）' })
    unit_price?: number;
}

export class PurchaseResponseDto {
    @ApiProperty({ description: '購入ID' })
    id: string;

    @ApiProperty({ description: 'グループID' })
    group_id: string;

    @ApiProperty({ description: '購入者ID' })
    purchased_by: string;

    @ApiProperty({ description: '購入者名' })
    purchaser_name: string;

    @ApiProperty({ description: '合計金額（円）' })
    total_amount: number;

    @ApiProperty({ description: '通貨' })
    currency: string;

    @ApiProperty({ description: 'レシート画像URL' })
    receipt_image_url?: string;

    @ApiProperty({ description: '購入日時' })
    purchased_at: Date;

    @ApiProperty({ description: 'メモ' })
    note?: string;

    @ApiProperty({ description: '購入アイテム一覧', type: [PurchaseItemResponseDto] })
    items: PurchaseItemResponseDto[];
}

export class PurchasesQueryDto {
    @ApiProperty({ description: '購入者ID', required: false })
    @IsOptional()
    @IsString()
    purchased_by?: string;

    @ApiProperty({ description: '開始日（YYYY-MM-DD）', required: false })
    @IsOptional()
    @IsString()
    start_date?: string;

    @ApiProperty({ description: '終了日（YYYY-MM-DD）', required: false })
    @IsOptional()
    @IsString()
    end_date?: string;

    @ApiProperty({ description: '最小金額（円）', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    min_amount?: number;

    @ApiProperty({ description: '最大金額（円）', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    max_amount?: number;
}