'use client';

import React, { useEffect } from 'react';
import { initAppAccessibility } from '@/lib/accessibility';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  useEffect(() => {
    // Initialize accessibility features when the app loads
    initAppAccessibility();
  }, []);

  return (
    <>
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Live region for screen reader announcements */}
      <div
        id="accessibility-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Main content wrapper */}
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}