/**
 * Accessibility utility functions for WCAG compliance and inclusive design
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 guidelines
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Please use hex colors (e.g., #ffffff)');
  }
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Generate accessible color palette with proper contrast ratios
 */
export function generateAccessiblePalette(baseColor: string): {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;
  onPrimaryLight: string;
  onPrimaryDark: string;
} {
  // This is a simplified implementation
  // In a real application, you'd want more sophisticated color manipulation
  const rgb = hexToRgb(baseColor);
  if (!rgb) throw new Error('Invalid base color');
  
  // Generate variations
  const primaryLight = `#${Math.min(255, rgb.r + 40).toString(16).padStart(2, '0')}${Math.min(255, rgb.g + 40).toString(16).padStart(2, '0')}${Math.min(255, rgb.b + 40).toString(16).padStart(2, '0')}`;
  const primaryDark = `#${Math.max(0, rgb.r - 40).toString(16).padStart(2, '0')}${Math.max(0, rgb.g - 40).toString(16).padStart(2, '0')}${Math.max(0, rgb.b - 40).toString(16).padStart(2, '0')}`;
  
  // Determine text colors based on contrast
  const onPrimary = meetsWCAGAA('#ffffff', baseColor) ? '#ffffff' : '#000000';
  const onPrimaryLight = meetsWCAGAA('#ffffff', primaryLight) ? '#ffffff' : '#000000';
  const onPrimaryDark = meetsWCAGAA('#ffffff', primaryDark) ? '#ffffff' : '#000000';
  
  return {
    primary: baseColor,
    primaryLight,
    primaryDark,
    onPrimary,
    onPrimaryLight,
    onPrimaryDark,
  };
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  
  /**
   * Save current focus and set new focus
   */
  static saveFocus(newFocusElement?: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    
    if (newFocusElement) {
      newFocusElement.focus();
    }
  }
  
  /**
   * Restore previously saved focus
   */
  static restoreFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }
  
  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }
  
  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    // Focus first element
    firstElement.focus();
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  private static announcer: HTMLElement | null = null;
  
  /**
   * Initialize screen reader announcer
   */
  static init(): void {
    if (this.announcer || typeof document === 'undefined') return;
    
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.position = 'absolute';
    this.announcer.style.left = '-10000px';
    this.announcer.style.width = '1px';
    this.announcer.style.height = '1px';
    this.announcer.style.overflow = 'hidden';
    
    document.body.appendChild(this.announcer);
  }
  
  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer) this.init();
    if (!this.announcer) return;
    
    // Clear previous message
    this.announcer.textContent = '';
    this.announcer.setAttribute('aria-live', priority);
    
    // Set new message after brief delay
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = message;
      }
    }, 100);
    
    // Clear message after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 5000);
  }
  
  /**
   * Check if screen reader is likely being used
   */
  static isScreenReaderActive(): boolean {
    // This is a heuristic and not 100% reliable
    return (
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis?.getVoices().length > 0
    );
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
    } = {}
  ): number {
    const { orientation = 'both', wrap = true } = options;
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex + 1;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex - 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return currentIndex;
    }
    
    // Handle wrapping
    if (wrap) {
      if (newIndex >= items.length) {
        newIndex = 0;
      } else if (newIndex < 0) {
        newIndex = items.length - 1;
      }
    } else {
      newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    }
    
    // Focus new item
    if (items[newIndex]) {
      items[newIndex].focus();
    }
    
    return newIndex;
  }
}

/**
 * Touch target utilities for mobile accessibility
 */
export class TouchTargets {
  /**
   * Minimum touch target size in pixels (WCAG recommendation)
   */
  static readonly MIN_SIZE = 44;
  
  /**
   * Check if element meets minimum touch target size
   */
  static meetsMinimumSize(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= this.MIN_SIZE && rect.height >= this.MIN_SIZE;
  }
  
  /**
   * Get recommended padding to meet minimum touch target size
   */
  static getRecommendedPadding(element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    const paddingX = Math.max(0, (this.MIN_SIZE - rect.width) / 2);
    const paddingY = Math.max(0, (this.MIN_SIZE - rect.height) / 2);
    
    return { x: paddingX, y: paddingY };
  }
}

/**
 * Initialize accessibility utilities
 */
export function initializeAccessibility(): void {
  ScreenReaderUtils.init();
  
  // Add global keyboard event listeners for accessibility
  document.addEventListener('keydown', (event) => {
    // Show focus indicators when Tab is pressed
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  document.addEventListener('mousedown', () => {
    // Hide focus indicators when mouse is used
    document.body.classList.remove('keyboard-navigation');
  });
}