import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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

export enum TimeSlotPreference {
  MORNING = 'morning',     // 6:00-12:00
  AFTERNOON = 'afternoon', // 12:00-18:00
  EVENING = 'evening',     // 18:00-24:00
  ANYTIME = 'anytime',
}

export enum DeliveryPriority {
  STANDARD = 'standard',   // 24-48 hours
  EXPRESS = 'express',     // 12-24 hours
  URGENT = 'urgent',       // 2-12 hours
  IMMEDIATE = 'immediate', // Within 2 hours
}

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TimeSlotPreference, { each: true })
  preferred_time_slots?: TimeSlotPreference[];

  @IsOptional()
  @IsEnum(DeliveryPriority)
  default_priority?: DeliveryPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_store_types?: string[]; // 'supermarket', 'convenience', 'pharmacy', etc.

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  max_delivery_distance?: number; // km

  @IsOptional()
  @IsBoolean()
  auto_accept_orders?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TimeSlotPreference, { each: true })
  preferred_time_slots?: TimeSlotPreference[];

  @IsOptional()
  @IsEnum(DeliveryPriority)
  default_priority?: DeliveryPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_store_types?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  max_delivery_distance?: number;

  @IsOptional()
  @IsBoolean()
  auto_accept_orders?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class SubscriptionResponseDto {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  preferred_time_slots: TimeSlotPreference[];
  default_priority: DeliveryPriority;
  preferred_store_types: string[];
  max_delivery_distance: number;
  auto_accept_orders: boolean;
  orders_this_period: number;
  orders_limit: number;
  priority_orders_used: number;
  priority_orders_limit: number;
  service_credits: number;
  created_at: Date;
  updated_at: Date;
}

// Shopper preference DTOs
export class ShopperPreferenceDto {
  @IsOptional()
  @IsArray()
  @IsEnum(TimeSlotPreference, { each: true })
  available_time_slots?: TimeSlotPreference[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_store_types?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  max_delivery_distance?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  max_concurrent_orders?: number;

  @IsOptional()
  @IsBoolean()
  accepts_urgent_orders?: boolean;

  @IsOptional()
  @IsBoolean()
  accepts_large_orders?: boolean; // Orders > 20 items

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  min_order_value?: number; // Minimum order value in JPY

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  max_order_value?: number; // Maximum order value in JPY
}

export class ShopperRatingDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  overall_rating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  communication_rating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  accuracy_rating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  timeliness_rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]; // 'friendly', 'fast', 'accurate', 'communicative', etc.
}

// Matching algorithm DTOs
export class MatchingCriteriaDto {
  @IsString()
  order_id: string;

  @IsOptional()
  @IsEnum(DeliveryPriority)
  priority?: DeliveryPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_distance?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_store_types?: string[];

  @IsOptional()
  @IsEnum(TimeSlotPreference)
  preferred_time_slot?: TimeSlotPreference;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  min_shopper_rating?: number;

  @IsOptional()
  @IsBoolean()
  subscriber_only?: boolean;
}

export class MatchingResultDto {
  shopper_id: string;
  shopper_name: string;
  shopper_rating: number;
  distance: number;
  estimated_delivery_time: number; // minutes
  compatibility_score: number; // 0-100
  is_preferred_shopper: boolean;
  subscription_tier: SubscriptionTier | null;
  reasons: string[]; // Why this shopper was matched
}

export class ServiceCreditDto {
  @IsString()
  reason: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ServiceCreditResponseDto {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  description?: string;
  order_id?: string;
  created_at: Date;
  expires_at?: Date;
  used_at?: Date;
}

// Subscription tier configuration
export interface SubscriptionTierConfig {
  name: string;
  price_monthly: number;
  price_yearly: number;
  orders_per_month: number;
  priority_orders_per_month: number;
  delivery_fee_discount: number; // percentage
  priority_matching: boolean;
  guaranteed_time_slots: boolean;
  dedicated_support: boolean;
  service_credits_on_delay: number;
  max_concurrent_orders: number;
  features: string[];
}

export class SubscriptionUsageDto {
  orders_this_period: number;
  orders_limit: number;
  priority_orders_used: number;
  priority_orders_limit: number;
  service_credits_balance: number;
  next_billing_date: Date;
  days_until_renewal: number;
}

export class UpgradeSubscriptionDto {
  @IsEnum(SubscriptionTier)
  new_tier: SubscriptionTier;

  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @IsOptional()
  @IsBoolean()
  prorate?: boolean;
}

export class CancelSubscriptionDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  cancel_immediately?: boolean; // If false, cancel at period end
}