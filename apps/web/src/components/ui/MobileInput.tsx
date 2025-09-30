'use client';

import React, { ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface MobileInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  action?: ReactNode;
  fullWidth?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  type = 'text',
  disabled = false,
  error,
  helperText,
  required = false,
  icon,
  iconPosition = 'left',
  action,
  fullWidth = true,
  autoComplete,
  autoFocus = false,
  maxLength,
  className = '',
}, ref) => {
  const inputClasses = clsx(
    // Base styles with touch-friendly sizing
    'block w-full px-fib-3 py-fib-3 text-mobile-base bg-white border rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder-neutral-400',
    
    // Icon spacing
    {
      'pl-12': icon && iconPosition === 'left',
      'pr-12': icon && iconPosition === 'right' || action,
    },
    
    // State styles
    {
      'border-neutral-300 focus:border-primary-500 focus:ring-primary-500': !error && !disabled,
      'border-error-300 focus:border-error-500 focus:ring-error-500 bg-error-50': error && !disabled,
      'border-neutral-200 bg-neutral-100 text-neutral-500 cursor-not-allowed': disabled,
    },
    
    // Width
    {
      'w-full': fullWidth,
    },
    
    className
  );

  return (
    <div className={clsx('relative', { 'w-full': fullWidth })}>
      {/* Label */}
      {label && (
        <label className="block text-mobile-sm font-medium text-neutral-700 mb-fib-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-fib-3 flex items-center pointer-events-none">
            <div className="text-neutral-400">
              {icon}
            </div>
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={inputClasses}
          // Mobile optimizations
          inputMode={type === 'number' ? 'numeric' : type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'text'}
          autoCapitalize={type === 'email' || type === 'url' ? 'none' : 'sentences'}
          autoCorrect={type === 'email' || type === 'url' || type === 'password' ? 'off' : 'on'}
          spellCheck={type === 'email' || type === 'url' || type === 'password' ? false : true}
        />

        {/* Right icon or action */}
        {((icon && iconPosition === 'right') || action) && (
          <div className="absolute inset-y-0 right-0 pr-fib-3 flex items-center">
            {action || (
              <div className="text-neutral-400">
                {icon}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-fib-1 text-mobile-sm text-error-600 flex items-center space-x-1"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </motion.p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-fib-1 text-mobile-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

export default MobileInput;

// Specialized input components

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
}: SearchInputProps) {
  return (
    <MobileInput
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      iconPosition="left"
      action={
        value && (
          <button
            onClick={onClear}
            className="text-neutral-400 hover:text-neutral-600 transition-colors touch-target p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )
      }
      className={className}
    />
  );
}

interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  maxLength?: number;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MobileTextArea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  maxLength,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
}: TextAreaProps) {
  const textareaClasses = clsx(
    'block w-full px-fib-3 py-fib-3 text-mobile-base bg-white border rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder-neutral-400 resize-none',
    {
      'border-neutral-300 focus:border-primary-500 focus:ring-primary-500': !error && !disabled,
      'border-error-300 focus:border-error-500 focus:ring-error-500 bg-error-50': error && !disabled,
      'border-neutral-200 bg-neutral-100 text-neutral-500 cursor-not-allowed': disabled,
    },
    className
  );

  return (
    <div className="relative w-full">
      {/* Label */}
      {label && (
        <label className="block text-mobile-sm font-medium text-neutral-700 mb-fib-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className={textareaClasses}
      />

      {/* Character count */}
      {maxLength && (
        <div className="mt-fib-1 text-right">
          <span className={clsx(
            'text-mobile-xs',
            {
              'text-neutral-500': !value || value.length < maxLength * 0.8,
              'text-warning-600': value && value.length >= maxLength * 0.8 && value.length < maxLength,
              'text-error-600': value && value.length >= maxLength,
            }
          )}>
            {value?.length || 0}/{maxLength}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-fib-1 text-mobile-sm text-error-600 flex items-center space-x-1"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </motion.p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-fib-1 text-mobile-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}