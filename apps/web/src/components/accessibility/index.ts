/**
 * Accessibility components and utilities
 * 
 * This module provides comprehensive accessibility support including:
 * - WCAG AA compliant components
 * - Screen reader support
 * - Keyboard navigation
 * - Focus management
 * - Color contrast validation
 * - Touch target optimization
 */

// Hooks
export { 
  useAccessibility, 
  useAnnouncer, 
  useKeyboardNavigation, 
  useFocusTrap, 
  useLiveRegion 
} from '@/hooks/useAccessibility';

// Components
export { default as AccessibleButton } from './AccessibleButton';
export type { AccessibleButtonProps } from './AccessibleButton';

export { default as AccessibleForm } from './AccessibleForm';
export type { FormField, FormError } from './AccessibleForm';

export { default as AccessibleModal } from './AccessibleModal';

export { default as AccessibleNavigation } from './AccessibleNavigation';
export type { NavigationItem } from './AccessibleNavigation';

export { default as LiveRegion, useLiveAnnouncements } from './LiveRegion';

// Utilities
export {
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  generateAccessiblePalette,
  FocusManager,
  ScreenReaderUtils,
  KeyboardNavigation,
  TouchTargets,
  initializeAccessibility,
} from '@/utils/accessibility';

export {
  AccessibilityAuditor,
  quickAccessibilityCheck,
} from '@/utils/accessibilityTesting';

export type {
  AccessibilityIssue,
  AccessibilityReport,
} from '@/utils/accessibilityTesting';