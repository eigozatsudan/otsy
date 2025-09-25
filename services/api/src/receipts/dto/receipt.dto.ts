import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReceiptStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
}

export class ReceiptItemDto {
  @IsString()
  name: string;

  @IsString()
  qty: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SubmitReceiptDto {
  @IsString()
  order_id: string;

  @IsString()
  image_url: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items?: ReceiptItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  total_amount?: number;

  @IsOptional()
  @IsString()
  store_name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewReceiptDto {
  @IsEnum(ReceiptStatus)
  status: ReceiptStatus;

  @IsOptional()
  @IsString()
  review_notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  corrected_items?: ReceiptItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  corrected_total?: number;
}

export class ReceiptResponseDto {
  id: string;
  order_id: string;
  shopper_id: string;
  image_url: string;
  status: ReceiptStatus;
  total_amount?: number;
  store_name?: string;
  items?: ReceiptItemDto[];
  review_notes?: string;
  submitted_at: Date;
  reviewed_at?: Date;
  reviewer_id?: string;
}

export class GetReceiptUploadUrlDto {
  @IsString()
  order_id: string;

  @IsOptional()
  @IsString()
  file_extension?: string = 'jpg';
}