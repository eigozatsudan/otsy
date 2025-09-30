/**
 * Accessibility utility functions for WCAG AA compliance
 */

/**
 * Color contrast calculation utilities
 */
export class ColorContrast {
  /**
   * Convert hex color to RGB values
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Calculate relative luminance of a color
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      throw new Error('Invalid color format. Use hex format (#RRGGBB)');
    }

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  static meetsWCAG(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    isLargeText = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);

    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Get contrast grade (AA, AAA, or Fail)
   */
  static getContrastGrade(
    foreground: string,
    background: string,
    isLargeText = false
  ): 'AAA' | 'AA' | 'Fail' {
    const ratio = this.getContrastRatio(foreground, background);

    if (isLargeText) {
      if (ratio >= 4.5) return 'AAA';
      if (ratio >= 3) return 'AA';
    } else {
      if (ratio >= 7) return 'AAA';
      if (ratio >= 4.5) return 'AA';
    }
    return 'Fail';
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
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
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Restore focus to a previously focused element
   */
  static restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }
}

/**
 * ARIA utilities
 */
export class AriaUtils {
  /**
   * Generate unique ID for ARIA relationships
   */
  static generateId(prefix = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set ARIA attributes for form field relationships
   */
  static setFieldRelationships(
    field: HTMLElement,
    label?: HTMLElement,
    description?: HTMLElement,
    errorMessage?: HTMLElement
  ): void {
    const describedBy: string[] = [];

    if (label) {
      const labelId = label.id || this.generateId('label');
      label.id = labelId;
      field.setAttribute('aria-labelledby', labelId);
    }

    if (description) {
      const descId = description.id || this.generateId('desc');
      description.id = descId;
      describedBy.push(descId);
    }

    if (errorMessage) {
      const errorId = errorMessage.id || this.generateId('error');
      errorMessage.id = errorId;
      describedBy.push(errorId);
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.setAttribute('aria-invalid', 'false');
    }

    if (describedBy.length > 0) {
      field.setAttribute('aria-describedby', describedBy.join(' '));
    }
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    
    document.body.appendChild(announcer);
    
    // Delay to ensure screen readers pick up the message
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}

/**
 * Touch accessibility utilities
 */
export class TouchAccessibility {
  /**
   * Check if touch target meets minimum size requirements (44x44px)
   */
  static validateTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  }

  /**
   * Get touch target recommendations
   */
  static getTouchTargetRecommendations(element: HTMLElement): {
    isValid: boolean;
    currentSize: { width: number; height: number };
    recommendations: string[];
  } {
    const rect = element.getBoundingClientRect();
    const recommendations: string[] = [];

    if (rect.width < 44) {
      recommendations.push(`Increase width to at least 44px (current: ${rect.width}px)`);
    }
    if (rect.height < 44) {
      recommendations.push(`Increase height to at least 44px (current: ${rect.height}px)`);
    }

    return {
      isValid: rect.width >= 44 && rect.height >= 44,
      currentSize: { width: rect.width, height: rect.height },
      recommendations,
    };
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityTester {
  /**
   * Run basic accessibility checks on an element
   */
  static runBasicChecks(element: HTMLElement): {
    passed: string[];
    failed: string[];
    warnings: string[];
  } {
    const passed: string[] = [];
    const failed: string[] = [];
    const warnings: string[] = [];

    // Check for alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      if (img.hasAttribute('alt')) {
        passed.push('Image has alt attribute');
      } else {
        failed.push('Image missing alt attribute');
      }
    });

    // Check for form labels
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const hasLabel = 
        input.hasAttribute('aria-label') ||
        input.hasAttribute('aria-labelledby') ||
        element.querySelector(`label[for="${input.id}"]`);
      
      if (hasLabel) {
        passed.push('Form field has label');
      } else {
        failed.push('Form field missing label');
      }
    });

    // Check for touch target sizes
    const interactiveElements = element.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        passed.push('Touch target meets minimum size');
      } else {
        warnings.push(`Touch target too small: ${rect.width}x${rect.height}px`);
      }
    });

    return { passed, failed, warnings };
  }
}

/**
 * Motion and animation utilities
 */
export class MotionUtils {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get safe animation duration based on user preference
   */
  static getSafeAnimationDuration(normalDuration: number): number {
    return this.prefersReducedMotion() ? 0 : normalDuration;
  }
}