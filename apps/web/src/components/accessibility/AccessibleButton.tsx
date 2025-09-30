'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useAccessibility } from '@/hooks/useAccessibility';

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const { focusVisible, reducedMotion } = useAccessibility();

    const baseClasses = clsx(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transition-colors',
      {
        'duration-150': !reducedMotion,
        'duration-0': reducedMotion,
        'w-full': fullWidth,
      }
    );

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500',
      outline: 'border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 focus:ring-primary-500',
      ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-primary-500',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    };

    const sizeClasses = {
      xs: 'px-fib-2 py-fib-1 text-mobile-xs min-h-[32px]',
      sm: 'px-fib-3 py-fib-2 text-mobile-sm min-h-[36px]',
      md: 'px-fib-4 py-fib-2 text-mobile-base min-h-[44px]',
      lg: 'px-fib-5 py-fib-3 text-mobile-lg min-h-[48px]',
      xl: 'px-fib-6 py-fib-4 text-mobile-xl min-h-[52px]',
    };

    const focusClasses = focusVisible ? 'ring-2 ring-offset-2' : '';

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          focusClasses,
          className
        )}
        aria-disabled={isDisabled}
        aria-describedby={loading ? 'loading-status' : undefined}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-fib-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
        )}
        
        {!loading && leftIcon && (
          <span className="mr-fib-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="ml-fib-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
        
        {loading && (
          <span id="loading-status" className="sr-only">
            Loading, please wait
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;