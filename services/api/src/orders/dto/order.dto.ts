import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, IsBoolean, IsDateString, Min, Max, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum OrderStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  SHOPPING = 'shopping',
  AWAIT_RECEIPT_OK = 'await_receipt_ok',
  ENROUTE = 'enroute',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderMode {
  APPROVE = 'approve',
  DELEGATE = 'delegate',
}

export enum ReceiptCheck {
  REQUIRED = 'required',
  AUTO = 'auto',
}

export enum RunStatus {
  ACCEPTED = 'accepted',
  ARRIVED_STORE = 'arrived_store',
  PURCHASED = 'purchased',
  AWAIT_RECEIPT_OK = 'await_receipt_ok',
  ENROUTE = 'enroute',
  DELIVERED = 'delivered',
}

export class AddressDto {
  @IsString()
  postal_code: string;

  @IsString()
  prefecture: string;

  @IsString()
  city: string;

  @IsString()
  address_line: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  delivery_notes?: string;
}

export class CreateOrderItemDto {
  @IsString()
  name: string;

  @IsString()
  qty: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  price_min?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  price_max?: number;

  @IsOptional()
  @IsBoolean()
  allow_subs?: boolean = true;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @IsEnum(OrderMode)
  mode: OrderMode;

  @IsEnum(ReceiptCheck)
  receipt_check: ReceiptCheck;

  @IsOptional()
  @IsDateString()
  deadline_ts?: string;

  @IsInt()
  @Min(100) // Minimum 100 JPY
  @Max(100000) // Maximum 100,000 JPY
  estimate_amount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address_json: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(RunStatus)
  status: RunStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
  };
}

export class ApproveOrderDto {
  @IsEnum(['ok', 'ng'])
  decision: 'ok' | 'ng';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AcceptOrderDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  estimated_completion?: string;
}

export class OrderApprovalDto {
  @IsEnum(['ok', 'ng'])
  decision: 'ok' | 'ng';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class OrderFilterDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  shopper_id?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class OrderResponseDto {
  id: string;
  user_id: string;
  shopper_id?: string;
  status: OrderStatus;
  mode: OrderMode;
  receipt_check: ReceiptCheck;
  estimate_amount: number;
  auth_amount?: number;
  deadline_ts?: Date;
  priority?: number;
  address_json: object;
  items: OrderItemResponseDto[];
  created_at: Date;
  updated_at: Date;
  user?: {
    id: string;
    email: string;
    phone?: string;
  };
  shopper?: {
    id: string;
    email: string;
    phone: string;
    rating_avg?: number;
  };
}

export class OrderItemResponseDto {
  id: string;
  name: string;
  qty: string;
  price_min?: number;
  price_max?: number;
  allow_subs: boolean;
  note?: string;
}