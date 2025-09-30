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

interface ShoppingItemRowProps {
  item: ShoppingItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: (updates: Partial<ShoppingItem>) => void;
  onDelete: () => void;
  currentUserId: string;
  isDragging?: boolean;
}

export default function ShoppingItemRow({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  currentUserId,
  isDragging = false,
}: ShoppingItemRowProps) {
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
          <div className=\"w-5 h-5 border-2 border-neutral-300 rounded\" />
        );
    }
  };

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high':
        return 'text-error-600';
      case 'medium':
        return 'text-warning-600';
      case 'low':
        return 'text-success-600';
      default:
        return 'text-neutral-600';
    }
  };

  const getRowStatusStyles = () => {
    switch (item.status) {
      case 'purchased':
        return 'bg-success-50 border-success-200';
      case 'cancelled':
        return 'bg-error-50 border-error-200 opacity-75';
      default:
        return 'bg-white border-neutral-200 hover:bg-neutral-50';
    }
  };

  return (
    <motion.div
      className={clsx(
        'relative border rounded-xl p-fib-3 transition-all duration-200',
        getRowStatusStyles(),
        {
          'ring-2 ring-primary-500 ring-offset-2': isSelected,
          'shadow-mobile-md': isDragging,
          'scale-105': isDragging,
        }
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      role=\"article\"
      aria-label={`Shopping item: ${item.name}`}
    >
      <div className=\"flex items-center space-x-fib-3\">
        {/* Drag Handle */}
        <div className=\"flex-shrink-0 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600\">
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 8h16M4 16h16\" />
          </svg>
        </div>

        {/* Selection Checkbox */}
        <div className=\"flex-shrink-0\">
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

        {/* Status Icon */}
        <div className=\"flex-shrink-0\">
          {getStatusIcon()}
        </div>

        {/* Item Image */}
        <div className=\"flex-shrink-0 w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden\">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className=\"w-full h-full object-cover\"
            />
          ) : (
            <div className=\"w-full h-full flex items-center justify-center\">
              <svg className=\"w-5 h-5 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" />
              </svg>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className=\"flex-1 min-w-0\">
          <div className=\"flex items-start justify-between\">
            <div className=\"flex-1 min-w-0\">
              <div className=\"flex items-center space-x-fib-2 mb-fib-1\">
                <h3 className={clsx(
                  'text-mobile-base font-semibold truncate',
                  {
                    'text-neutral-900': item.status !== 'cancelled',
                    'text-neutral-500 line-through': item.status === 'cancelled',
                  }
                )}>
                  {item.name}
                </h3>
                
                {/* Priority Indicator */}
                {item.priority && item.priority !== 'medium' && (
                  <span className={clsx(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    {
                      'bg-error-500': item.priority === 'high',
                      'bg-success-500': item.priority === 'low',
                    }
                  )} />
                )}
              </div>

              <div className=\"flex items-center space-x-fib-3 text-mobile-sm text-neutral-600\">
                <span>{item.quantity} {item.unit || 'pcs'}</span>
                <span>•</span>
                <span>{item.category}</span>
                {(item.estimatedPrice || item.actualPrice) && (
                  <>
                    <span>•</span>
                    <span className={item.actualPrice ? 'text-success-600 font-medium' : ''}>
                      ${(item.actualPrice || item.estimatedPrice)?.toFixed(2)}
                      {item.estimatedPrice && !item.actualPrice && ' (est)'}
                    </span>
                  </>
                )}
              </div>

              {item.notes && (
                <p className=\"text-mobile-sm text-neutral-600 mt-fib-1 line-clamp-1\">
                  {item.notes}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className=\"flex-shrink-0 text-right text-mobile-xs text-neutral-500 ml-fib-3\">
              <div>by {item.addedByName}</div>
              {item.status === 'purchased' && item.purchasedByName && (
                <div className=\"text-success-600 mt-fib-1\">
                  ✓ {item.purchasedByName}
                </div>
              )}
              <div className=\"mt-fib-1\">
                {new Date(item.addedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          className=\"flex-shrink-0 flex items-center space-x-fib-1\"
          initial={reducedMotion ? {} : { opacity: 0, x: 10 }}
          animate={reducedMotion ? {} : { 
            opacity: showActions ? 1 : 0, 
            x: showActions ? 0 : 10 
          }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
          style={{ display: showActions ? 'flex' : 'none' }}
        >
          {item.status === 'todo' && (
            <>
              <AccessibleButton
                variant=\"outline\"
                size=\"sm\"
                onClick={() => handleStatusChange('purchased')}
                ariaLabel={`Mark ${item.name} as purchased`}
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                </svg>
              </AccessibleButton>
              <AccessibleButton
                variant=\"ghost\"
                size=\"sm\"
                onClick={() => handleStatusChange('cancelled')}
                ariaLabel={`Cancel ${item.name}`}
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
                </svg>
              </AccessibleButton>
            </>
          )}
          
          {(item.status === 'purchased' || item.status === 'cancelled') && (
            <AccessibleButton
              variant=\"outline\"
              size=\"sm\"
              onClick={() => handleStatusChange('todo')}
              ariaLabel={`Restore ${item.name} to todo`}
            >
              <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
              </svg>
            </AccessibleButton>
          )}

          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={() => setIsEditing(true)}
            ariaLabel={`Edit ${item.name}`}
          >
            <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z\" />
            </svg>
          </AccessibleButton>

          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={onDelete}
            ariaLabel={`Delete ${item.name}`}
          >
            <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16\" />
            </svg>
          </AccessibleButton>
        </motion.div>
      </div>
    </motion.div>
  );
}