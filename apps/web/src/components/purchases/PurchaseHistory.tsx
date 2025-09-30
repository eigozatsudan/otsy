'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface PurchaseItem {
  itemId: string;
  itemName: string;
  purchasedQuantity: number;
  actualPrice: number;
}

interface Settlement {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  status: 'pending' | 'completed';
}

interface Purchase {
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

interface PurchaseHistoryProps {
  purchases: Purchase[];
  currentUserId: string;
  onViewReceipt: (receiptUrl: string) => void;
  onEditSplit: (purchase: Purchase) => void;
  onMarkSettled: (purchaseId: string, settlementIndex: number) => void;
  className?: string;
}

export default function PurchaseHistory({
  purchases,
  currentUserId,
  onViewReceipt,
  onEditSplit,
  onMarkSettled,
  className = '',
}: PurchaseHistoryProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [filter, setFilter] = useState<'all' | 'my-purchases' | 'pending-settlements'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  // Filter purchases
  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'my-purchases') {
      return purchase.purchasedBy === currentUserId;
    }
    if (filter === 'pending-settlements') {
      return purchase.settlements.some(s => 
        s.status === 'pending' && (s.fromMemberId === currentUserId || s.toMemberId === currentUserId)
      );
    }
    return true;
  });

  // Sort purchases
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
    }
    return b.totalAmount - a.totalAmount;
  });

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    announce(`Filtered to show ${newFilter.replace('-', ' ')}`, 'polite');
  };

  const handleExpandToggle = (purchaseId: string) => {
    const newExpanded = expandedPurchase === purchaseId ? null : purchaseId;
    setExpandedPurchase(newExpanded);
    
    if (newExpanded) {
      announce('Purchase details expanded', 'polite');
    } else {
      announce('Purchase details collapsed', 'polite');
    }
  };

  const getSplitMethodLabel = (method: Purchase['splitMethod']) => {
    switch (method) {
      case 'equal': return 'Equal Split';
      case 'quantity': return 'Quantity-Based';
      case 'custom': return 'Custom Split';
      default: return 'Unknown';
    }
  };

  const getMySettlements = (purchase: Purchase) => {
    return purchase.settlements.filter(s => 
      s.fromMemberId === currentUserId || s.toMemberId === currentUserId
    );
  };

  const getTotalOwed = () => {
    return purchases.reduce((total, purchase) => {
      const mySettlements = purchase.settlements.filter(s => 
        s.fromMemberId === currentUserId && s.status === 'pending'
      );
      return total + mySettlements.reduce((sum, s) => sum + s.amount, 0);
    }, 0);
  };

  const getTotalOwedToMe = () => {
    return purchases.reduce((total, purchase) => {
      const mySettlements = purchase.settlements.filter(s => 
        s.toMemberId === currentUserId && s.status === 'pending'
      );
      return total + mySettlements.reduce((sum, s) => sum + s.amount, 0);
    }, 0);
  };

  return (
    <div className={clsx('bg-white rounded-xl shadow-mobile-sm border border-neutral-200', className)}>
      {/* Header */}
      <div className=\"p-fib-4 border-b border-neutral-100\">
        <div className=\"flex items-center justify-between mb-fib-3\">
          <h2 className=\"text-mobile-lg font-bold text-neutral-900\">
            Purchase History
          </h2>
          <span className=\"text-mobile-sm text-neutral-500\">
            {sortedPurchases.length} {sortedPurchases.length === 1 ? 'purchase' : 'purchases'}
          </span>
        </div>

        {/* Summary Cards */}
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-fib-3 mb-fib-4\">
          <div className=\"bg-success-50 rounded-lg p-fib-3 border border-success-200\">
            <div className=\"text-mobile-sm font-medium text-success-700 mb-fib-1\">
              Owed to Me
            </div>
            <div className=\"text-mobile-lg font-bold text-success-900\">
              ${getTotalOwedToMe().toFixed(2)}
            </div>
          </div>
          
          <div className=\"bg-warning-50 rounded-lg p-fib-3 border border-warning-200\">
            <div className=\"text-mobile-sm font-medium text-warning-700 mb-fib-1\">
              I Owe
            </div>
            <div className=\"text-mobile-lg font-bold text-warning-900\">
              ${getTotalOwed().toFixed(2)}
            </div>
          </div>
          
          <div className=\"bg-primary-50 rounded-lg p-fib-3 border border-primary-200\">
            <div className=\"text-mobile-sm font-medium text-primary-700 mb-fib-1\">
              Total Spent
            </div>
            <div className=\"text-mobile-lg font-bold text-primary-900\">
              ${purchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className=\"flex flex-col sm:flex-row gap-fib-3\">
          {/* Filter Tabs */}
          <div className=\"flex space-x-fib-1\">
            {[
              { id: 'all', label: 'All Purchases' },
              { id: 'my-purchases', label: 'My Purchases' },
              { id: 'pending-settlements', label: 'Pending' },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => handleFilterChange(filterOption.id as typeof filter)}
                className={clsx(
                  'px-fib-2 py-fib-1 rounded-lg text-mobile-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                  {
                    'bg-primary-100 text-primary-700': filter === filterOption.id,
                    'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50': filter !== filterOption.id,
                  }
                )}
                role=\"tab\"
                aria-selected={filter === filterOption.id}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
            aria-label=\"Sort purchases\"
          >
            <option value=\"date\">Sort by Date</option>
            <option value=\"amount\">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Purchase List */}
      <div className=\"max-h-96 overflow-y-auto\">
        {sortedPurchases.length === 0 ? (
          <div className=\"text-center py-fib-8\">
            <div className=\"w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-fib-3\">
              <svg className=\"w-8 h-8 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z\" />
              </svg>
            </div>
            <h3 className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
              {filter === 'all' ? 'No purchases yet' : 
               filter === 'my-purchases' ? 'No purchases by you' :
               'No pending settlements'}
            </h3>
            <p className=\"text-mobile-sm text-neutral-500\">
              {filter === 'all' ? 'Purchase history will appear here as group members record their shopping trips.' :
               filter === 'my-purchases' ? 'Your purchase history will appear here when you record purchases.' :
               'Pending settlements will appear here when cost splits are created.'}
            </p>
          </div>
        ) : (
          <div className=\"p-fib-4 space-y-fib-3\">
            {sortedPurchases.map((purchase) => {
              const isExpanded = expandedPurchase === purchase.id;
              const mySettlements = getMySettlements(purchase);
              
              return (
                <motion.div
                  key={purchase.id}
                  className=\"border border-neutral-200 rounded-xl overflow-hidden\"
                  layout={!reducedMotion}
                  transition={reducedMotion ? {} : { duration: 0.2 }}
                >
                  {/* Purchase Header */}
                  <div
                    className=\"p-fib-4 cursor-pointer hover:bg-neutral-50 transition-colors\"
                    onClick={() => handleExpandToggle(purchase.id)}
                    role=\"button\"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleExpandToggle(purchase.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-label={`Purchase by ${purchase.purchasedByName} for $${purchase.totalAmount.toFixed(2)}`}
                  >
                    <div className=\"flex items-center justify-between\">
                      <div className=\"flex-1 min-w-0\">
                        <div className=\"flex items-center space-x-fib-2 mb-fib-1\">
                          <h3 className=\"text-mobile-base font-semibold text-neutral-900\">
                            ${purchase.totalAmount.toFixed(2)}
                          </h3>
                          <span className=\"text-mobile-sm text-neutral-600\">
                            by {purchase.purchasedByName}
                            {purchase.purchasedBy === currentUserId && (
                              <span className=\"ml-fib-1 text-primary-600 font-medium\">(You)</span>
                            )}
                          </span>
                        </div>
                        
                        <div className=\"flex items-center space-x-fib-3 text-mobile-sm text-neutral-500\">
                          <span>{new Date(purchase.purchasedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{purchase.items.length} {purchase.items.length === 1 ? 'item' : 'items'}</span>
                          <span>•</span>
                          <span>{getSplitMethodLabel(purchase.splitMethod)}</span>
                        </div>
                        
                        {/* Settlement Status */}
                        {mySettlements.length > 0 && (
                          <div className=\"mt-fib-2 flex flex-wrap gap-fib-1\">
                            {mySettlements.map((settlement, index) => (
                              <span
                                key={index}
                                className={clsx(
                                  'inline-flex items-center px-fib-1 py-0.5 rounded-full text-xs font-medium',
                                  {
                                    'bg-warning-100 text-warning-800': settlement.status === 'pending' && settlement.fromMemberId === currentUserId,
                                    'bg-success-100 text-success-800': settlement.status === 'pending' && settlement.toMemberId === currentUserId,
                                    'bg-neutral-100 text-neutral-800': settlement.status === 'completed',
                                  }
                                )}
                              >
                                {settlement.fromMemberId === currentUserId 
                                  ? `You owe ${settlement.toMemberName} $${settlement.amount.toFixed(2)}`
                                  : `${settlement.fromMemberName} owes you $${settlement.amount.toFixed(2)}`
                                }
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand Icon */}
                      <motion.div
                        animate={reducedMotion ? {} : { rotate: isExpanded ? 180 : 0 }}
                        transition={reducedMotion ? {} : { duration: 0.2 }}
                        className=\"flex-shrink-0 ml-fib-2\"
                      >
                        <svg className=\"w-5 h-5 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 9l-7 7-7-7\" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={reducedMotion ? {} : { opacity: 0, height: 0 }}
                        animate={reducedMotion ? {} : { opacity: 1, height: 'auto' }}
                        exit={reducedMotion ? {} : { opacity: 0, height: 0 }}
                        transition={reducedMotion ? {} : { duration: 0.2 }}
                        className=\"border-t border-neutral-200\"
                      >
                        <div className=\"p-fib-4 space-y-fib-4\">
                          {/* Items */}
                          <div>
                            <h4 className=\"text-mobile-sm font-semibold text-neutral-900 mb-fib-2\">
                              Items Purchased
                            </h4>
                            <div className=\"space-y-fib-1\">
                              {purchase.items.map((item) => (
                                <div key={item.itemId} className=\"flex items-center justify-between text-mobile-sm\">
                                  <span className=\"text-neutral-700\">
                                    {item.itemName} × {item.purchasedQuantity}
                                  </span>
                                  <span className=\"font-medium\">${item.actualPrice.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Settlements */}
                          {purchase.settlements.length > 0 && (
                            <div>
                              <h4 className=\"text-mobile-sm font-semibold text-neutral-900 mb-fib-2\">
                                Cost Split
                              </h4>
                              <div className=\"space-y-fib-2\">
                                {purchase.settlements.map((settlement, index) => (
                                  <div key={index} className=\"flex items-center justify-between p-fib-2 bg-neutral-50 rounded-lg\">
                                    <div className=\"text-mobile-sm\">
                                      <span className=\"font-medium\">{settlement.fromMemberName}</span>
                                      <span className=\"text-neutral-600 mx-fib-1\">owes</span>
                                      <span className=\"font-medium\">{settlement.toMemberName}</span>
                                    </div>
                                    <div className=\"flex items-center space-x-fib-2\">
                                      <span className=\"text-mobile-sm font-medium\">
                                        ${settlement.amount.toFixed(2)}
                                      </span>
                                      {settlement.status === 'pending' && (settlement.fromMemberId === currentUserId || settlement.toMemberId === currentUserId) && (
                                        <AccessibleButton
                                          variant=\"outline\"
                                          size=\"sm\"
                                          onClick={() => onMarkSettled(purchase.id, index)}
                                        >
                                          Mark Settled
                                        </AccessibleButton>
                                      )}
                                      {settlement.status === 'completed' && (
                                        <span className=\"text-xs text-success-600 font-medium\">✓ Settled</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {purchase.notes && (
                            <div>
                              <h4 className=\"text-mobile-sm font-semibold text-neutral-900 mb-fib-2\">
                                Notes
                              </h4>
                              <p className=\"text-mobile-sm text-neutral-700\">{purchase.notes}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className=\"flex items-center space-x-fib-2 pt-fib-2 border-t border-neutral-100\">
                            {purchase.receiptImageUrl && (
                              <AccessibleButton
                                variant=\"outline\"
                                size=\"sm\"
                                onClick={() => onViewReceipt(purchase.receiptImageUrl!)}
                              >
                                <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" />
                                </svg>
                                View Receipt
                              </AccessibleButton>
                            )}
                            
                            <AccessibleButton
                              variant=\"outline\"
                              size=\"sm\"
                              onClick={() => onEditSplit(purchase)}
                            >
                              <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z\" />
                              </svg>
                              Edit Split
                            </AccessibleButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}