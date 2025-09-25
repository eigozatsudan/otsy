// Common type definitions
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export type Role = 'user' | 'shopper' | 'admin';

export type OrderStatus = 'new' | 'accepted' | 'shopping' | 'await_receipt_ok' | 'enroute' | 'delivered' | 'cancelled';

export type Mode = 'approve' | 'delegate';

export type ReceiptCheck = 'required' | 'auto';

export type KycStatus = 'pending' | 'approved' | 'needs_review' | 'rejected';

export type RiskTier = 'L0' | 'L1' | 'L2' | 'L-1';

export type ShopperStatus = 'active' | 'suspended';

export interface Address {
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  building?: string;
  delivery_notes?: string;
}