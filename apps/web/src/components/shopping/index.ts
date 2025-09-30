// Shopping list components
export { default as ShoppingList } from './ShoppingList';
export { default as ShoppingItemCard } from './ShoppingItemCard';
export { default as ShoppingItemRow } from './ShoppingItemRow';
export { default as AddItemModal } from './AddItemModal';

// Ad components
export { default as AdSlot } from '../ads/AdSlot';

// Types
export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  status: 'todo' | 'purchased' | 'cancelled';
  addedBy: string;
  addedByName: string;
  addedAt: string;
  purchasedBy?: string;
  purchasedByName?: string;
  purchasedAt?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface NewShoppingItem {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  priority?: 'low' | 'medium' | 'high';
}