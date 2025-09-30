'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { RealTimeProvider, ConnectionStatus } from '@/components/realtime';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: 'todo' | 'purchased' | 'cancelled';
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface RealTimeShoppingListProps {
  groupId: string;
  initialItems: ShoppingItem[];
  currentUserId: string;
}

export default function RealTimeShoppingList({
  groupId,
  initialItems,
  currentUserId,
}: RealTimeShoppingListProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Handle real-time item updates
  const handleItemUpdate = useCallback((itemId: string, updateData: any) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          switch (updateData.action) {
            case 'updated':
              return { ...item, ...updateData.updates };
            case 'status_changed':
              const statusText = updateData.newStatus === 'purchased' ? 'purchased' : 
                               updateData.newStatus === 'cancelled' ? 'cancelled' : 'added back to list';
              announce(`${item.name} was ${statusText}`, 'polite');
              return { ...item, status: updateData.newStatus, updatedAt: updateData.timestamp };
            default:
              return item;
          }
        }
        return item;
      });

      // Handle new items
      if (updateData.action === 'created') {
        announce(`${updateData.item.name} was added to the shopping list`, 'polite');
        return [...updatedItems, updateData.item];
      }

      // Handle deleted items
      if (updateData.action === 'deleted') {
        const deletedItem = prevItems.find(item => item.id === itemId);
        if (deletedItem) {
          announce(`${deletedItem.name} was removed from the shopping list`, 'polite');
        }
        return updatedItems.filter(item => item.id !== itemId);
      }

      return updatedItems;
    });
  }, [announce]);

  // Handle adding new item
  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemCategory.trim()) return;

    setIsAddingItem(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          category: newItemCategory.trim(),
          quantity: 1,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Item will be added via SSE broadcast, so we don't need to update state here
        setNewItemName('');
        setNewItemCategory('');
        announce(`${newItemName} added to shopping list`, 'polite');
      } else {
        throw new Error('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      announce('Failed to add item. Please try again.', 'assertive');
    } finally {
      setIsAddingItem(false);
    }
  };

  // Handle item status change
  const handleStatusChange = async (itemId: string, newStatus: ShoppingItem['status']) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }
      // Status change will be reflected via SSE broadcast
    } catch (error) {
      console.error('Error updating item status:', error);
      announce('Failed to update item status. Please try again.', 'assertive');
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      // Item will be removed via SSE broadcast
    } catch (error) {
      console.error('Error deleting item:', error);
      announce('Failed to delete item. Please try again.', 'assertive');
    }
  };

  const getStatusIcon = (status: ShoppingItem['status']) => {
    switch (status) {
      case 'purchased':
        return (
          <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <RealTimeProvider
      groupId={groupId}
      onItemUpdate={handleItemUpdate}
    >
      <div className="max-w-4xl mx-auto p-fib-4">
        {/* Header with connection status */}
        <div className="flex items-center justify-between mb-fib-6">
          <h1 className="text-mobile-2xl font-bold text-neutral-900">
            Shopping List
          </h1>
          <ConnectionStatus compact />
        </div>

        {/* Add new item form */}
        <div className="bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4 mb-fib-6">
          <h2 className="text-mobile-lg font-semibold text-neutral-900 mb-fib-3">
            Add New Item
          </h2>
          <div className="flex flex-col sm:flex-row gap-fib-3">
            <div className="flex-1">
              <label htmlFor="item-name" className="sr-only">
                Item name
              </label>
              <input
                id="item-name"
                type="text"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isAddingItem}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="item-category" className="sr-only">
                Category
              </label>
              <input
                id="item-category"
                type="text"
                placeholder="Category"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isAddingItem}
              />
            </div>
            <AccessibleButton
              onClick={handleAddItem}
              loading={isAddingItem}
              loadingText="Adding..."
              disabled={!newItemName.trim() || !newItemCategory.trim()}
            >
              Add Item
            </AccessibleButton>
          </div>
        </div>

        {/* Shopping list items grouped by category */}
        <div className="space-y-fib-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4">
              <h3 className="text-mobile-lg font-semibold text-neutral-900 mb-fib-4">
                {category} ({categoryItems.length})
              </h3>
              
              <div className="space-y-fib-2">
                <AnimatePresence>
                  {categoryItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className={clsx(
                        'flex items-center justify-between p-fib-3 rounded-lg border transition-colors',
                        {
                          'bg-success-50 border-success-200': item.status === 'purchased',
                          'bg-error-50 border-error-200': item.status === 'cancelled',
                          'bg-neutral-50 border-neutral-200': item.status === 'todo',
                        }
                      )}
                      initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                      exit={reducedMotion ? {} : { opacity: 0, y: -10 }}
                      transition={reducedMotion ? {} : { duration: 0.2 }}
                      layout={!reducedMotion}
                    >
                      <div className="flex items-center space-x-fib-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className={clsx('text-mobile-sm font-medium', {
                            'line-through text-neutral-500': item.status !== 'todo',
                            'text-neutral-900': item.status === 'todo',
                          })}>
                            {item.name}
                          </h4>
                          <p className="text-mobile-xs text-neutral-600">
                            Quantity: {item.quantity}
                            {item.status !== 'todo' && (
                              <span className="ml-fib-2">
                                • {item.status === 'purchased' ? 'Purchased' : 'Cancelled'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-fib-2">
                        {item.status === 'todo' && (
                          <>
                            <AccessibleButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(item.id, 'purchased')}
                              aria-label={`Mark ${item.name} as purchased`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </AccessibleButton>
                            <AccessibleButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(item.id, 'cancelled')}
                              aria-label={`Cancel ${item.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </AccessibleButton>
                          </>
                        )}
                        
                        {item.status !== 'todo' && (
                          <AccessibleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'todo')}
                            aria-label={`Restore ${item.name} to shopping list`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </AccessibleButton>
                        )}

                        <AccessibleButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label={`Delete ${item.name} from shopping list`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </AccessibleButton>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-fib-8">
            <svg className="w-16 h-16 mx-auto text-neutral-400 mb-fib-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-mobile-lg font-medium text-neutral-900 mb-fib-2">
              No items in your shopping list
            </h3>
            <p className="text-mobile-sm text-neutral-600">
              Add your first item to get started with collaborative shopping!
            </p>
          </div>
        )}
      </div>
    </RealTimeProvider>
  );
}