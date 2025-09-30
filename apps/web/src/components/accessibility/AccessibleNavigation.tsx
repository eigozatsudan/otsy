'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAccessibility, useKeyboardNavigation, useAnnouncer } from '@/hooks/useAccessibility';

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  children?: NavigationItem[];
}

interface AccessibleNavigationProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'tabs' | 'pills' | 'sidebar' | 'breadcrumb';
  className?: string;
  ariaLabel?: string;
}

export default function AccessibleNavigation({
  items,
  orientation = 'horizontal',
  variant = 'tabs',
  className = '',
  ariaLabel = 'Navigation',
}: AccessibleNavigationProps) {
  const pathname = usePathname();
  const { focusVisible, reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const navRef = useRef<HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Enable keyboard navigation
  useKeyboardNavigation(navRef, {
    orientation,
    wrap: true,
  });

  const isActive = (item: NavigationItem): boolean => {
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + '/');
    }
    return false;
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        announce(`Collapsed ${items.find(item => item.id === itemId)?.label}`, 'polite');
      } else {
        newSet.add(itemId);
        announce(`Expanded ${items.find(item => item.id === itemId)?.label}`, 'polite');
      }
      return newSet;
    });
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return;
    
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    } else if (item.onClick) {
      item.onClick();
      announce(`Activated ${item.label}`, 'polite');
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'tabs':
        return {
          container: 'border-b border-neutral-200',
          list: orientation === 'horizontal' ? 'flex space-x-fib-4' : 'flex flex-col space-y-fib-1',
          item: 'relative',
          link: clsx(
            'inline-flex items-center px-fib-3 py-fib-2 border-b-2 font-medium text-mobile-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'transition-colors',
            {
              'duration-150': !reducedMotion,
              'duration-0': reducedMotion,
            }
          ),
          active: 'border-primary-500 text-primary-600',
          inactive: 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300',
          disabled: 'opacity-50 cursor-not-allowed',
        };
      
      case 'pills':
        return {
          container: '',
          list: orientation === 'horizontal' ? 'flex space-x-fib-2' : 'flex flex-col space-y-fib-1',
          item: '',
          link: clsx(
            'inline-flex items-center px-fib-3 py-fib-2 rounded-lg font-medium text-mobile-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'transition-colors',
            {
              'duration-150': !reducedMotion,
              'duration-0': reducedMotion,
            }
          ),
          active: 'bg-primary-100 text-primary-700',
          inactive: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
          disabled: 'opacity-50 cursor-not-allowed',
        };
      
      case 'sidebar':
        return {
          container: '',
          list: 'flex flex-col space-y-fib-1',
          item: '',
          link: clsx(
            'flex items-center px-fib-3 py-fib-2 rounded-lg font-medium text-mobile-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'transition-colors',
            {
              'duration-150': !reducedMotion,
              'duration-0': reducedMotion,
            }
          ),
          active: 'bg-primary-100 text-primary-700',
          inactive: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
          disabled: 'opacity-50 cursor-not-allowed',
        };
      
      case 'breadcrumb':
        return {
          container: '',
          list: 'flex items-center space-x-fib-2',
          item: 'flex items-center',
          link: clsx(
            'text-mobile-sm font-medium',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
            'transition-colors',
            {
              'duration-150': !reducedMotion,
              'duration-0': reducedMotion,
            }
          ),
          active: 'text-neutral-900',
          inactive: 'text-primary-600 hover:text-primary-700',
          disabled: 'opacity-50 cursor-not-allowed',
        };
      
      default:
        return {
          container: '',
          list: '',
          item: '',
          link: '',
          active: '',
          inactive: '',
          disabled: '',
        };
    }
  };

  const classes = getVariantClasses();

  const renderItem = (item: NavigationItem, level: number = 0) => {
    const active = isActive(item);
    const expanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const linkClasses = clsx(
      classes.link,
      {
        [classes.active]: active,
        [classes.inactive]: !active && !item.disabled,
        [classes.disabled]: item.disabled,
        'ring-2 ring-primary-500': focusVisible,
      }
    );

    const content = (
      <>
        {item.icon && (
          <span className="mr-fib-2 flex-shrink-0" aria-hidden="true">
            {item.icon}
          </span>
        )}
        
        <span className="flex-1">{item.label}</span>
        
        {item.badge && (
          <span 
            className="ml-fib-2 px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium"
            aria-label={`${item.badge} items`}
          >
            {item.badge}
          </span>
        )}
        
        {hasChildren && (
          <span className="ml-fib-2 flex-shrink-0" aria-hidden="true">
            <svg
              className={clsx('w-4 h-4 transition-transform', {
                'rotate-90': expanded,
                'duration-150': !reducedMotion,
                'duration-0': reducedMotion,
              })}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </>
    );

    const commonProps = {
      className: linkClasses,
      'aria-current': active ? 'page' : undefined,
      'aria-disabled': item.disabled,
      'aria-expanded': hasChildren ? expanded : undefined,
      style: { paddingLeft: `${level * 16 + 12}px` },
    };

    let element: React.ReactNode;

    if (item.href && !item.disabled) {
      element = (
        <Link href={item.href} {...commonProps}>
          {content}
        </Link>
      );
    } else {
      element = (
        <button
          type="button"
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          {...commonProps}
        >
          {content}
        </button>
      );
    }

    return (
      <li key={item.id} className={classes.item}>
        {element}
        
        {/* Render children if expanded */}
        {hasChildren && expanded && (
          <ul className="mt-fib-1" role="group" aria-labelledby={`nav-${item.id}`}>
            {item.children!.map(child => renderItem(child, level + 1))}
          </ul>
        )}
        
        {/* Breadcrumb separator */}
        {variant === 'breadcrumb' && (
          <span className="ml-fib-2 text-neutral-400" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </li>
    );
  };

  return (
    <nav
      ref={navRef}
      className={clsx(classes.container, className)}
      aria-label={ariaLabel}
      role="navigation"
    >
      <ul className={classes.list} role={variant === 'tabs' ? 'tablist' : 'list'}>
        {items.map(item => renderItem(item))}
      </ul>
    </nav>
  );
}