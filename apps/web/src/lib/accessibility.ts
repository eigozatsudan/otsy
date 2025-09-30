/**
 * Global accessibility initialization and utilities
 */

import { initializeAccessibility, ScreenReaderUtils } from '@/utils/accessibility';

/**
 * Initialize accessibility features for the application
 */
export function initAppAccessibility(): void {
  // Initialize core accessibility utilities
  initializeAccessibility();
  
  // Initialize screen reader announcer
  ScreenReaderUtils.init();
  
  // Add skip link to page
  addSkipLink();
  
  // Set up global keyboard navigation
  setupGlobalKeyboardNavigation();
  
  // Set up focus management
  setupFocusManagement();
  
  // Add accessibility event listeners
  setupAccessibilityEventListeners();
  
  // Validate color contrast in development
  if (process.env.NODE_ENV === 'development') {
    validatePageContrast();
  }
}

/**
 * Add skip link for keyboard navigation
 */
function addSkipLink(): void {
  if (typeof document === 'undefined') return;
  
  // Check if skip link already exists
  if (document.getElementById('skip-to-main')) return;
  
  const skipLink = document.createElement('a');
  skipLink.id = 'skip-to-main';
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  
  // Insert at the beginning of the body
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Handle skip link click
  skipLink.addEventListener('click', (event) => {
    event.preventDefault();
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/**
 * Set up global keyboard navigation patterns
 */
function setupGlobalKeyboardNavigation(): void {
  if (typeof document === 'undefined') return;
  
  document.addEventListener('keydown', (event) => {
    // Handle global keyboard shortcuts
    switch (event.key) {
      case 'Escape':
        // Close any open modals or dropdowns
        const openModals = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
        if (openModals.length > 0) {
          const lastModal = openModals[openModals.length - 1] as HTMLElement;
          const closeButton = lastModal.querySelector('[aria-label*="close" i], [aria-label*="dismiss" i]') as HTMLElement;
          closeButton?.click();
        }
        break;
        
      case 'F6':
        // Cycle through page landmarks
        event.preventDefault();
        cycleThroughLandmarks(event.shiftKey);
        break;
        
      case '/':
        // Focus search input (if available)
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const searchInput = document.querySelector('input[type="search"], input[aria-label*="search" i]') as HTMLElement;
          searchInput?.focus();
        }
        break;
    }
  });
}

/**
 * Cycle through page landmarks (F6 functionality)
 */
function cycleThroughLandmarks(reverse: boolean = false): void {
  const landmarks = Array.from(document.querySelectorAll(
    'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]'
  )) as HTMLElement[];
  
  if (landmarks.length === 0) return;
  
  const currentFocus = document.activeElement as HTMLElement;
  let currentIndex = landmarks.findIndex(landmark => 
    landmark === currentFocus || landmark.contains(currentFocus)
  );
  
  if (currentIndex === -1) {
    currentIndex = reverse ? landmarks.length - 1 : 0;
  } else {
    currentIndex = reverse 
      ? (currentIndex - 1 + landmarks.length) % landmarks.length
      : (currentIndex + 1) % landmarks.length;
  }
  
  const targetLandmark = landmarks[currentIndex];
  
  // Make landmark focusable if it isn't already
  if (!targetLandmark.hasAttribute('tabindex')) {
    targetLandmark.setAttribute('tabindex', '-1');
  }
  
  targetLandmark.focus();
  
  // Announce landmark to screen readers
  const landmarkName = getLandmarkName(targetLandmark);
  ScreenReaderUtils.announce(`Navigated to ${landmarkName}`, 'polite');
}

/**
 * Get human-readable landmark name
 */
function getLandmarkName(element: HTMLElement): string {
  const role = element.getAttribute('role') || element.tagName.toLowerCase();
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  
  if (ariaLabel) return ariaLabel;
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }
  
  // Default landmark names
  const landmarkNames: Record<string, string> = {
    'header': 'page header',
    'banner': 'page header',
    'nav': 'navigation',
    'navigation': 'navigation',
    'main': 'main content',
    'aside': 'sidebar',
    'complementary': 'sidebar',
    'footer': 'page footer',
    'contentinfo': 'page footer',
  };
  
  return landmarkNames[role] || role;
}

/**
 * Set up focus management
 */
function setupFocusManagement(): void {
  if (typeof document === 'undefined') return;
  
  // Track focus for debugging in development
  if (process.env.NODE_ENV === 'development') {
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      console.debug('Focus moved to:', target, {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        ariaLabel: target.getAttribute('aria-label'),
        textContent: target.textContent?.slice(0, 50),
      });
    });
  }
  
  // Ensure focus is visible when using keyboard
  let isUsingKeyboard = false;
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      isUsingKeyboard = true;
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false;
    document.body.classList.remove('keyboard-navigation');
  });
  
  // Ensure focusable elements are properly marked
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          validateFocusableElements(element);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Validate focusable elements have proper accessibility attributes
 */
function validateFocusableElements(container: HTMLElement): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  focusableElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    
    // Check for accessible name
    const hasAccessibleName = 
      htmlElement.getAttribute('aria-label') ||
      htmlElement.getAttribute('aria-labelledby') ||
      htmlElement.textContent?.trim() ||
      (htmlElement.tagName === 'INPUT' && htmlElement.getAttribute('placeholder'));
    
    if (!hasAccessibleName) {
      console.warn('Focusable element lacks accessible name:', htmlElement);
    }
    
    // Check touch target size
    const rect = htmlElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
      console.warn('Touch target too small (minimum 44x44px):', htmlElement, `${rect.width}x${rect.height}px`);
    }
  });
}

/**
 * Set up accessibility event listeners
 */
function setupAccessibilityEventListeners(): void {
  if (typeof document === 'undefined') return;
  
  // Listen for preference changes
  const mediaQueries = [
    { query: '(prefers-reduced-motion: reduce)', property: 'reducedMotion' },
    { query: '(prefers-contrast: high)', property: 'highContrast' },
    { query: '(prefers-color-scheme: dark)', property: 'darkMode' },
  ];
  
  mediaQueries.forEach(({ query, property }) => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = () => {
      document.body.classList.toggle(`prefers-${property.toLowerCase()}`, mediaQuery.matches);
      
      // Announce preference changes
      if (mediaQuery.matches) {
        ScreenReaderUtils.announce(`${property} mode enabled`, 'polite');
      }
    };
    
    // Set initial state
    handleChange();
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
  });
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Announce when page becomes visible (useful for screen reader users)
      ScreenReaderUtils.announce('Page is now visible', 'polite');
    }
  });
}

/**
 * Validate color contrast on the page (development only)
 */
function validatePageContrast(): void {
  if (typeof document === 'undefined' || process.env.NODE_ENV !== 'development') return;
  
  // Delay to allow styles to load
  setTimeout(() => {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    
    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      
      // Skip if no text content
      if (!htmlElement.textContent?.trim()) return;
      
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip if transparent background
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') return;
      
      try {
        // Simple RGB to hex conversion for basic validation
        const foreground = rgbToHex(color);
        const background = rgbToHex(backgroundColor);
        
        if (foreground && background) {
          const { getContrastRatio, meetsWCAGAA } = require('@/utils/accessibility');
          const ratio = getContrastRatio(foreground, background);
          
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
          
          if (!meetsWCAGAA(foreground, background, isLargeText)) {
            console.warn(`Low contrast ratio detected:`, {
              element: htmlElement,
              ratio: ratio.toFixed(2),
              required: isLargeText ? '3:1' : '4.5:1',
              colors: { foreground, background },
            });
          }
        }
      } catch (error) {
        // Skip elements with unparseable colors
      }
    });
  }, 1000);
}

/**
 * Simple RGB to hex conversion
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Accessibility debugging utilities for development
 */
export const AccessibilityDebug = {
  /**
   * Highlight all focusable elements on the page
   */
  highlightFocusableElements(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.outline = '2px solid red';
      htmlElement.style.outlineOffset = '2px';
    });
    
    console.log(`Highlighted ${focusableElements.length} focusable elements`);
  },
  
  /**
   * Remove focus highlights
   */
  removeFocusHighlights(): void {
    const elements = document.querySelectorAll('[style*="outline"]');
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.outline = '';
      htmlElement.style.outlineOffset = '';
    });
  },
  
  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation(): void {
    console.log('Testing keyboard navigation...');
    
    const focusableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];
    
    let currentIndex = 0;
    
    const testNext = () => {
      if (currentIndex < focusableElements.length) {
        const element = focusableElements[currentIndex];
        element.focus();
        console.log(`Focused element ${currentIndex + 1}/${focusableElements.length}:`, element);
        currentIndex++;
        setTimeout(testNext, 1000);
      } else {
        console.log('Keyboard navigation test complete');
      }
    };
    
    testNext();
  },
  
  /**
   * Run accessibility audit
   */
  async runAccessibilityAudit(): Promise<void> {
    const { quickAccessibilityCheck } = await import('@/utils/accessibilityTesting');
    quickAccessibilityCheck();
  },
};

// Make debug utilities available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).AccessibilityDebug = AccessibilityDebug;
}