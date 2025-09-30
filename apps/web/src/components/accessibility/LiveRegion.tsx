'use client';

import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  busy?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * LiveRegion component for announcing dynamic content changes to screen readers
 */
export default function LiveRegion({
  message,
  priority = 'polite',
  atomic = true,
  relevant = 'text',
  busy = false,
  className = '',
  children,
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const previousMessageRef = useRef<string>('');

  useEffect(() => {
    if (!regionRef.current) return;

    // Only announce if message has changed
    if (message !== previousMessageRef.current) {
      // Clear the region first to ensure screen readers pick up the change
      regionRef.current.textContent = '';
      
      // Set the new message after a brief delay
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 10);

      previousMessageRef.current = message;
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      className={clsx(
        'sr-only', // Screen reader only - visually hidden but accessible
        className
      )}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-busy={busy}
      role="status"
    >
      {children}
    </div>
  );
}

/**
 * Hook for managing live region announcements
 */
export function useLiveAnnouncements() {
  const [announcement, setAnnouncement] = React.useState<{
    message: string;
    priority: 'polite' | 'assertive';
    id: number;
  } | null>(null);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({
      message,
      priority,
      id: Date.now(), // Use timestamp as unique ID
    });

    // Clear announcement after 5 seconds
    setTimeout(() => {
      setAnnouncement(null);
    }, 5000);
  }, []);

  const LiveRegionComponent = React.useMemo(() => {
    if (!announcement) return null;

    return (
      <LiveRegion
        key={announcement.id}
        message={announcement.message}
        priority={announcement.priority}
      />
    );
  }, [announcement]);

  return {
    announce,
    LiveRegionComponent,
  };
}