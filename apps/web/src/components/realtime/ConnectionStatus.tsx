'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useRealTime } from './RealTimeProvider';
import { useAccessibility } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface ConnectionStatusProps {
  className?: string;
  showReconnectButton?: boolean;
  compact?: boolean;
}

export default function ConnectionStatus({
  className = '',
  showReconnectButton = true,
  compact = false,
}: ConnectionStatusProps) {
  const { connected, connecting, error, reconnect } = useRealTime();
  const { reducedMotion } = useAccessibility();

  const getStatusIcon = () => {
    if (connecting) {
      return (
        <motion.svg
          className="w-4 h-4 text-warning-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={reducedMotion ? {} : { duration: 1, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </motion.svg>
      );
    }

    if (connected) {
      return (
        <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (connecting) return 'Connecting...';
    if (connected) return 'Real-time updates active';
    if (error) return `Connection error: ${error}`;
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (connecting) return 'text-warning-700 bg-warning-50 border-warning-200';
    if (connected) return 'text-success-700 bg-success-50 border-success-200';
    return 'text-error-700 bg-error-50 border-error-200';
  };

  if (compact) {
    return (
      <div className={clsx('flex items-center space-x-fib-1', className)}>
        {getStatusIcon()}
        <span className="sr-only">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {(!connected || error) && (
        <motion.div
          className={clsx(
            'flex items-center justify-between p-fib-3 rounded-lg border',
            getStatusColor(),
            className
          )}
          initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          exit={reducedMotion ? {} : { opacity: 0, y: -10 }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center space-x-fib-2">
            {getStatusIcon()}
            <div>
              <p className="text-mobile-sm font-medium">
                {getStatusText()}
              </p>
              {error && (
                <p className="text-mobile-xs mt-fib-1 opacity-75">
                  Real-time updates are temporarily unavailable
                </p>
              )}
            </div>
          </div>

          {showReconnectButton && !connecting && (
            <AccessibleButton
              variant="outline"
              size="sm"
              onClick={reconnect}
              className="ml-fib-3"
            >
              <svg className="w-4 h-4 mr-fib-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reconnect
            </AccessibleButton>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact connection indicator for headers/toolbars
 */
export function ConnectionIndicator({ className = '' }: { className?: string }) {
  const { connected, connecting, error } = useRealTime();

  const getIndicatorClass = () => {
    if (connecting) return 'bg-warning-500';
    if (connected) return 'bg-success-500';
    return 'bg-error-500';
  };

  const getTooltipText = () => {
    if (connecting) return 'Connecting to real-time updates...';
    if (connected) return 'Real-time updates active';
    if (error) return `Connection error: ${error}`;
    return 'Real-time updates disconnected';
  };

  return (
    <div
      className={clsx('relative', className)}
      title={getTooltipText()}
      role="status"
      aria-label={getTooltipText()}
    >
      <div
        className={clsx(
          'w-2 h-2 rounded-full',
          getIndicatorClass(),
          {
            'animate-pulse': connecting,
          }
        )}
      />
      {connected && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full animate-ping opacity-75" />
      )}
    </div>
  );
}