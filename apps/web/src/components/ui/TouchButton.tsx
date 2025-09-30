'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface TouchButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export default function TouchButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
}: TouchButtonProps) {
  const baseClasses = clsx(
    // Base styles - ensure touch-friendly minimum size
    'touch-target inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95',
    
    // Size variants with Fibonacci spacing
    {
      'px-fib-2 py-fib-1 text-mobile-sm min-h-[44px]': size === 'sm',
      'px-fib-3 py-fib-2 text-mobile-base min-h-[48px]': size === 'md',
      'px-fib-4 py-fib-3 text-mobile-lg min-h-[56px]': size === 'lg',
      'px-fib-5 py-fib-4 text-mobile-xl min-h-[64px]': size === 'xl',
    },
    
    // Variant styles
    {
      // Primary
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-mobile-sm hover:shadow-mobile-md': 
        variant === 'primary' && !disabled,
      'bg-primary-300 text-primary-100 cursor-not-allowed': 
        variant === 'primary' && disabled,
      
      // Secondary
      'bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500 shadow-mobile-sm hover:shadow-mobile-md': 
        variant === 'secondary' && !disabled,
      'bg-neutral-300 text-neutral-100 cursor-not-allowed': 
        variant === 'secondary' && disabled,
      
      // Outline
      'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500': 
        variant === 'outline' && !disabled,
      'border-2 border-neutral-300 text-neutral-400 cursor-not-allowed': 
        variant === 'outline' && disabled,
      
      // Ghost
      'text-primary-600 hover:bg-primary-50 focus:ring-primary-500': 
        variant === 'ghost' && !disabled,
      'text-neutral-400 cursor-not-allowed': 
        variant === 'ghost' && disabled,
      
      // Danger
      'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-mobile-sm hover:shadow-mobile-md': 
        variant === 'danger' && !disabled,
      'bg-error-300 text-error-100 cursor-not-allowed': 
        variant === 'danger' && disabled,
    },
    
    // Width
    {
      'w-full': fullWidth,
    },
    
    className
  );

  const content = (
    <>
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="mr-fib-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-fib-1">{icon}</span>
      )}
      
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-fib-1">{icon}</span>
      )}
    </>
  );

  return (
    <motion.button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {content}
    </motion.button>
  );
}

// Specialized button variants

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  className?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  variant = 'primary',
  size = 'lg',
  className = '',
}: FloatingActionButtonProps) {
  const sizeClasses = {
    md: 'w-touch-sm h-touch-sm',
    lg: 'w-touch-lg h-touch-lg',
  };

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-mobile-lg hover:shadow-mobile-xl',
    secondary: 'bg-white text-primary-600 hover:bg-neutral-50 shadow-mobile-lg hover:shadow-mobile-xl border border-neutral-200',
  };

  return (
    <motion.button
      className={clsx(
        'fixed bottom-fib-5 right-fib-3 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 z-50',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {icon}
    </motion.button>
  );
}

interface IconButtonProps {
  icon: ReactNode;
  label?: string;
  variant?: 'ghost' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 p-fib-1',
    md: 'w-touch-sm h-touch-sm p-fib-2',
    lg: 'w-touch-lg h-touch-lg p-fib-3',
  };

  const variantClasses = {
    ghost: disabled 
      ? 'text-neutral-400 cursor-not-allowed'
      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
    outline: disabled
      ? 'border border-neutral-300 text-neutral-400 cursor-not-allowed'
      : 'border border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50',
    filled: disabled
      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
      : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200',
  };

  return (
    <motion.button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.15 }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
}

// Common icon components for buttons
export const ButtonIcons = {
  Plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  
  Check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  
  Edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  
  Delete: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  
  Share: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  
  Settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};