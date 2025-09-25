import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { OrderMode, ReceiptCheck } from './order.dto';

export class CreateOrderFromLlmDto {
  @IsString()
  session_id: string;

  @IsEnum(OrderMode)
  mode: OrderMode;

  @IsEnum(ReceiptCheck)
  receipt_check: ReceiptCheck;

  @IsOptional()
  @IsString()
  deadline_ts?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  address_json: {
    street: string;
    city: string;
    postal_code: string;
    prefecture: string;
    building?: string;
    instructions?: string;
  };

  @IsOptional()
  @IsBoolean()
  use_llm_estimates?: boolean = true; // Use LLM price estimates as order item price ranges
}