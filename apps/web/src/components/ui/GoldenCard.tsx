'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface GoldenCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  ratio?: 'golden' | 'golden-inverse' | 'silver' | 'silver-inverse' | 'square';
  interactive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function GoldenCard({
  children,
  className = '',
  variant = 'default',
  ratio = 'golden',
  interactive = false,
  onClick,
  disabled = false,
}: GoldenCardProps) {
  const baseClasses = clsx(
    'relative overflow-hidden rounded-xl transition-all duration-150',
    {
      // Aspect ratios
      'aspect-golden': ratio === 'golden',
      'aspect-golden-inverse': ratio === 'golden-inverse',
      'aspect-silver': ratio === 'silver',
      'aspect-silver-inverse': ratio === 'silver-inverse',
      'aspect-square': ratio === 'square',
      
      // Variants
      'bg-white border border-neutral-200 shadow-mobile-sm': variant === 'default',
      'bg-white border border-neutral-200 shadow-mobile-md': variant === 'elevated',
      'bg-transparent border-2 border-neutral-300': variant === 'outlined',
      'bg-neutral-100 border border-neutral-200': variant === 'filled',
      
      // Interactive states
      'cursor-pointer hover:shadow-mobile-lg hover:scale-[1.02] active:scale-[0.98]': 
        interactive && !disabled,
      'cursor-not-allowed opacity-60': disabled,
    },
    className
  );

  const content = (
    <div className="relative h-full w-full p-fib-3 flex flex-col">
      {children}
    </div>
  );

  if (interactive && !disabled) {
    return (
      <motion.div
        className={baseClasses}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
}

// Specialized card components using golden ratio principles

interface ShoppingItemCardProps {
  title: string;
  category?: string;
  quantity?: number;
  status?: 'todo' | 'purchased' | 'cancelled';
  image?: string;
  notes?: string;
  purchasedBy?: string;
  onClick?: () => void;
}

export function ShoppingItemCard({
  title,
  category,
  quantity = 1,
  status = 'todo',
  image,
  notes,
  purchasedBy,
  onClick,
}: ShoppingItemCardProps) {
  const statusColors = {
    todo: 'bg-neutral-100 text-neutral-700',
    purchased: 'bg-success-100 text-success-700',
    cancelled: 'bg-error-100 text-error-700',
  };

  const statusIcons = {
    todo: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    purchased: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    cancelled: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <GoldenCard
      ratio="golden-inverse"
      variant="default"
      interactive
      onClick={onClick}
      className="group"
    >
      <div className="flex items-start space-x-fib-2 h-full">
        {/* Item image or placeholder */}
        <div className="flex-shrink-0 w-golden-sm h-golden-sm bg-neutral-200 rounded-lg overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <h3 className="text-mobile-base font-medium text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                {title}
              </h3>
              <span className={`ml-fib-1 px-fib-1 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1 ${statusColors[status]}`}>
                {statusIcons[status]}
                <span className="capitalize">{status}</span>
              </span>
            </div>
            
            {category && (
              <p className="text-mobile-sm text-neutral-500 mt-1">
                {category}
              </p>
            )}
            
            {notes && (
              <p className="text-mobile-sm text-neutral-600 mt-fib-1 line-clamp-2">
                {notes}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-fib-2">
            <div className="flex items-center space-x-fib-2">
              <span className="text-mobile-sm font-medium text-neutral-700">
                Qty: {quantity}
              </span>
              {purchasedBy && (
                <span className="text-mobile-xs text-neutral-500">
                  by {purchasedBy}
                </span>
              )}
            </div>
            
            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </GoldenCard>
  );
}

interface GroupCardProps {
  name: string;
  description?: string;
  memberCount: number;
  recentActivity?: string;
  unreadCount?: number;
  onClick?: () => void;
}

export function GroupCard({
  name,
  description,
  memberCount,
  recentActivity,
  unreadCount = 0,
  onClick,
}: GroupCardProps) {
  return (
    <GoldenCard
      ratio="silver"
      variant="default"
      interactive
      onClick={onClick}
      className="group"
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-mobile-lg font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
              {name}
            </h3>
            {unreadCount > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold px-fib-1 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-mobile-sm text-neutral-600 mt-fib-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="space-y-fib-1">
          {recentActivity && (
            <p className="text-mobile-xs text-neutral-500 line-clamp-1">
              {recentActivity}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-fib-1">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-mobile-sm text-neutral-600">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            
            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </GoldenCard>
  );
}