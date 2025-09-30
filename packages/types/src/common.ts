// Common type definitions for Otsukai DX Pivot
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export type Role = 'user' | 'admin';

export type ItemStatus = 'todo' | 'purchased' | 'cancelled';

export type GroupRole = 'owner' | 'member';

export type SplitRule = 'equal' | 'quantity' | 'custom';

export type AdSlot = 'list_top' | 'detail_bottom';