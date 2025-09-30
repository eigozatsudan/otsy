// Purchase recording and cost splitting components
export { default as PurchaseRecordModal } from './PurchaseRecordModal';
export { default as CostSplitModal } from './CostSplitModal';
export { default as PurchaseHistory } from './PurchaseHistory';

// Types
export interface PurchaseItem {
  itemId: string;
  itemName: string;
  purchasedQuantity: number;
  actualPrice: number;
}

export interface PurchaseRecord {
  id?: string;
  totalAmount: number;
  items: PurchaseItem[];
  receiptImageUrl?: string;
  notes?: string;
  purchasedAt: string;
  purchasedBy: string;
}

export interface SplitRule {
  memberId: string;
  percentage?: number;
  amount?: number;
  itemQuantities?: Record<string, number>; // itemId -> quantity
}

export interface Settlement {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  status: 'pending' | 'completed';
}

export interface Purchase {
  id: string;
  totalAmount: number;
  items: PurchaseItem[];
  receiptImageUrl?: string;
  notes?: string;
  purchasedBy: string;
  purchasedByName: string;
  purchasedAt: string;
  settlements: Settlement[];
  splitMethod: 'equal' | 'quantity' | 'custom';
}