import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum ServiceCreditReason {
  DELIVERY_DELAY = 'delivery_delay',
  QUALITY_ISSUE = 'quality_issue',
  SHOPPER_CANCELLATION = 'shopper_cancellation',
  SYSTEM_ERROR = 'system_error',
  SLA_VIOLATION = 'sla_violation',
  COMPENSATION = 'compensation',
}

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @IsOptional()
  @IsString()
  promo_code?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;
}

export class SubscriptionResponseDto {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  start_date: Date;
  end_date?: Date;
  next_billing_date?: Date;
  monthly_fee: number;
  benefits: SubscriptionBenefits;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionBenefits {
  priority_matching: boolean;
  guaranteed_time_slots: number; // hours per month
  free_deliveries: number; // per month
  premium_shoppers: boolean;
  dedicated_support: boolean;
  service_credits_multiplier: number;
  max_concurrent_orders: number;
  early_access_features: boolean;
}

export class ServiceCreditDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(ServiceCreditReason)
  reason: ServiceCreditReason;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}

export class UseServiceCreditDto {
  @IsString()
  order_id: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

export class ShopperPreferenceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  max_distance_km?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  max_concurrent_orders?: number;

  @IsOptional()
  @IsString({ each: true })
  preferred_store_chains?: string[];

  @IsOptional()
  @IsString({ each: true })
  excluded_categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(500)
  min_order_value?: number;

  @IsOptional()
  @IsBoolean()
  accepts_premium_orders?: boolean;

  @IsOptional()
  @IsBoolean()
  accepts_bulk_orders?: boolean;

  @IsOptional()
  working_hours?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
}

export class ShopperRatingDto {
  @IsString()
  order_id: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  would_recommend?: boolean;

  @IsOptional()
  rating_categories?: {
    communication: number;
    item_quality: number;
    timeliness: number;
    professionalism: number;
  };
}

export class MatchingPreferencesDto {
  @IsOptional()
  @IsBoolean()
  prefer_rated_shoppers?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  min_shopper_rating?: number;

  @IsOptional()
  @IsString({ each: true })
  preferred_shopper_ids?: string[];

  @IsOptional()
  @IsString({ each: true })
  blocked_shopper_ids?: string[];

  @IsOptional()
  @IsBoolean()
  allow_new_shoppers?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  max_matching_time_minutes?: number;
}

export class TimeSlotGuaranteeDto {
  @IsDateString()
  requested_date: string;

  @IsString()
  time_slot: string; // e.g., "09:00-11:00"

  @IsOptional()
  @IsString()
  special_instructions?: string;
}

export class SubscriptionStatsDto {
  total_subscribers: number;
  subscribers_by_tier: Record<SubscriptionTier, number>;
  monthly_revenue: number;
  churn_rate: number;
  average_subscription_duration: number;
  service_credits_issued: number;
  service_credits_used: number;
}