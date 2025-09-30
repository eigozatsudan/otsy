'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface ShoppingItem {
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

interface ShoppingItemCardProps {
  item: ShoppingItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: (updates: Partial<ShoppingItem>) => void;
  onDelete: () => void;
  currentUserId: string;
  width: number;
  height: number;
}

export default function ShoppingItemCard({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  currentUserId,
  width,
  height,
}: ShoppingItemCardProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = (newStatus: ShoppingItem['status']) => {
    onUpdate({ 
      status: newStatus,
      ...(newStatus === 'purchased' && {
        purchasedBy: currentUserId,
        purchasedAt: new Date().toISOString(),
      }),
    });
    
    const statusText = newStatus === 'purchased' ? 'marked as purchased' : 
                     newStatus === 'cancelled' ? 'cancelled' : 'marked as todo';
    announce(`${item.name} ${statusText}`, 'polite');
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'purchased':
        return (
          <svg className=\"w-5 h-5 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className=\"w-5 h-5 text-error-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
          </svg>
        );
      default:
        return (
          <svg className=\"w-5 h-5 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
          </svg>
        );
    }
  };

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high':
        return 'bg-error-100 text-error-700 border-error-200';
      case 'medium':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'low':
        return 'bg-success-100 text-success-700 border-success-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getCardStatusStyles = () => {
    switch (item.status) {
      case 'purchased':
        return 'border-success-200 bg-success-50/50';
      case 'cancelled':
        return 'border-error-200 bg-error-50/50 opacity-75';
      default:
        return 'border-neutral-200 bg-white hover:border-neutral-300';
    }
  };

  return (
    <motion.div
      className={clsx(
        'relative border-2 rounded-xl transition-all duration-200 overflow-hidden group',
        getCardStatusStyles(),
        {
          'ring-2 ring-primary-500 ring-offset-2': isSelected,
          'shadow-mobile-md': showActions,
        }
      )}
      style={{ width, height }}
      whileHover={reducedMotion ? {} : { y: -2 }}
      transition={reducedMotion ? {} : { duration: 0.2 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      role=\"article\"
      aria-label={`Shopping item: ${item.name}`}
    >
      {/* Selection Checkbox */}
      <div className=\"absolute top-fib-2 left-fib-2 z-10\">
        <label className=\"flex items-center cursor-pointer\">
          <input
            type=\"checkbox\"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className=\"sr-only\"
            aria-label={`Select ${item.name}`}
          />
          <div className={clsx(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            {
              'bg-primary-500 border-primary-500': isSelected,
              'bg-white border-neutral-300 hover:border-primary-400': !isSelected,
            }
          )}>
            {isSelected && (
              <svg className=\"w-3 h-3 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={3} d=\"M5 13l4 4L19 7\" />
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* Priority Badge */}
      {item.priority && item.priority !== 'medium' && (
        <div className=\"absolute top-fib-2 right-fib-2 z-10\">
          <span className={clsx(
            'px-fib-1 py-0.5 rounded-full text-xs font-medium border',
            getPriorityColor()
          )}>
            {item.priority}
          </span>
        </div>
      )}

      {/* Item Image */}
      <div className=\"relative h-2/5 bg-neutral-100 overflow-hidden\">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className=\"w-full h-full object-cover\"
          />
        ) : (
          <div className=\"w-full h-full flex items-center justify-center\">
            <svg className=\"w-8 h-8 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" />
            </svg>
          </div>
        )}
        
        {/* Status Overlay */}
        <div className=\"absolute bottom-fib-1 left-fib-1\">
          <div className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center',
            {
              'bg-success-500': item.status === 'purchased',
              'bg-error-500': item.status === 'cancelled',
              'bg-neutral-400': item.status === 'todo',
            }
          )}>
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Item Content */}
      <div className=\"p-fib-3 h-3/5 flex flex-col\">
        {/* Item Name and Quantity */}
        <div className=\"flex-1\">
          <h3 className=\"text-mobile-sm font-semibold text-neutral-900 mb-fib-1 line-clamp-2\">
            {item.name}
          </h3>
          
          <div className=\"flex items-center justify-between mb-fib-2\">
            <span className=\"text-mobile-xs text-neutral-600\">
              {item.quantity} {item.unit || 'pcs'}
            </span>
            <span className=\"text-mobile-xs text-neutral-500\">
              {item.category}
            </span>
          </div>

          {/* Notes */}
          {item.notes && (
            <p className=\"text-mobile-xs text-neutral-600 line-clamp-2 mb-fib-2\">
              {item.notes}
            </p>
          )}

          {/* Price Information */}
          {(item.estimatedPrice || item.actualPrice) && (
            <div className=\"flex items-center justify-between text-mobile-xs mb-fib-2\">
              {item.estimatedPrice && (
                <span className=\"text-neutral-500\">
                  Est: ${item.estimatedPrice.toFixed(2)}
                </span>
              )}
              {item.actualPrice && (
                <span className=\"text-success-600 font-medium\">
                  ${item.actualPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className=\"flex items-center justify-between text-mobile-xs text-neutral-500 mt-auto\">
          <span>
            by {item.addedByName}
          </span>
          {item.status === 'purchased' && item.purchasedByName && (
            <span className=\"text-success-600\">
              ✓ {item.purchasedByName}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div
          className=\"absolute inset-x-0 bottom-0 bg-white border-t border-neutral-200 p-fib-2\"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={reducedMotion ? {} : { 
            opacity: showActions ? 1 : 0, 
            y: showActions ? 0 : 20 
          }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
          style={{ display: showActions ? 'block' : 'none' }}
        >
          <div className=\"flex space-x-fib-1\">
            {item.status === 'todo' && (
              <>
                <AccessibleButton
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => handleStatusChange('purchased')}
                  className=\"flex-1 text-xs\"
                >
                  <svg className=\"w-3 h-3 mr-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                  </svg>
                  Buy
                </AccessibleButton>
                <AccessibleButton
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => handleStatusChange('cancelled')}
                  className=\"flex-1 text-xs\"
                >
                  <svg className=\"w-3 h-3 mr-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
                  </svg>
                  Cancel
                </AccessibleButton>
              </>
            )}
            
            {item.status === 'purchased' && (
              <AccessibleButton
                variant=\"outline\"
                size=\"sm\"
                onClick={() => handleStatusChange('todo')}
                className=\"flex-1 text-xs\"
              >
                <svg className=\"w-3 h-3 mr-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
                </svg>
                Undo
              </AccessibleButton>
            )}
            
            {item.status === 'cancelled' && (
              <AccessibleButton
                variant=\"outline\"
                size=\"sm\"
                onClick={() => handleStatusChange('todo')}
                className=\"flex-1 text-xs\"
              >
                <svg className=\"w-3 h-3 mr-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
                </svg>
                Restore
              </AccessibleButton>
            )}

            <AccessibleButton
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => setIsEditing(true)}
              ariaLabel={`Edit ${item.name}`}
              className=\"px-fib-1\"
            >
              <svg className=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z\" />
              </svg>
            </AccessibleButton>
          </div>
        </motion.div>
      </div>

      {/* Strikethrough for cancelled items */}
      {item.status === 'cancelled' && (
        <div className=\"absolute inset-0 flex items-center justify-center pointer-events-none\">
          <div className=\"w-full h-0.5 bg-error-400 transform rotate-12\" />
        </div>
      )}
    </motion.div>
  );
}