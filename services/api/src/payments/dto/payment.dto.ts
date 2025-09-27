import { IsString, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class CreatePaymentIntentDto {
  @IsString()
  order_id: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(100) // Minimum 100 JPY
  amount: number;

  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;
}

export class AuthorizePaymentDto {
  @IsString()
  order_id: string;

  @IsOptional()
  @IsString()
  payment_method_id?: string;
}

export class CapturePaymentDto {
  @IsString()
  payment_id: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  amount?: number; // If different from authorized amount

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefundPaymentDto {
  @IsString()
  payment_id: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  amount?: number; // If null, full refund

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  refund_application_fee?: string;
}

export class PaymentResponseDto {
  id: string;
  order_id: string;
  stripe_pi: string;
  status: PaymentStatus;
  amount: number;
  captured_amount?: number;
  refunded_amount?: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
  client_secret?: string;
}

export class StripeWebhookDto {
  @IsString()
  type: string;

  data: {
    object: any;
  };
}