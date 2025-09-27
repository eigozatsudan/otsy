import { IsString, IsEnum, IsOptional, IsArray, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderMode, ReceiptCheck } from './order.dto';

export class CreateOrderFromLlmDto {
  @IsString()
  session_id: string;

  @IsEnum(OrderMode)
  mode: OrderMode;

  @IsEnum(ReceiptCheck)
  receipt_check: ReceiptCheck;

  @IsOptional()
  @IsDateString()
  deadline_ts?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  address_json: {
    postal_code: string;
    prefecture: string;
    city: string;
    address_line: string;
    building?: string;
    delivery_notes?: string;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selected_item_names?: string[];
}

export class VoiceToOrderDto {
  @IsString()
  voice_input: string;

  @IsEnum(OrderMode)
  mode: OrderMode;

  @IsEnum(ReceiptCheck)
  receipt_check: ReceiptCheck;

  @IsOptional()
  @IsDateString()
  deadline_ts?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  address_json: {
    postal_code: string;
    prefecture: string;
    city: string;
    address_line: string;
    building?: string;
    delivery_notes?: string;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existing_items?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietary_restrictions?: string[];

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  budget_level?: number;
}