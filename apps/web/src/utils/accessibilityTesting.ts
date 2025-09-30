/**
 * Accessibility testing utilities for automated WCAG compliance checking
 */

import { getContrastRatio, meetsWCAGAA, meetsWCAGAAA } from './accessibility';

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: HTMLElement;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  score: number; // 0-100
}

/**
 * Comprehensive accessibility audit for a DOM element and its children
 */
export class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];
  
  /**
   * Run full accessibility audit
   */
  audit(container: HTMLElement = document.body): AccessibilityReport {
    this.issues = [];
    
    // Run all checks
    this.checkColorContrast(container);
    this.checkFocusableElements(container);
    this.checkAriaLabels(container);
    this.checkHeadingStructure(container);
    this.checkFormLabels(container);
    this.checkImages(container);
    this.checkLinks(container);
    this.checkTouchTargets(container);
    this.checkKeyboardNavigation(container);
    this.checkLiveRegions(container);
    
    return this.generateReport();
  }
  
  /**
   * Check color contrast ratios
   */
  private checkColorContrast(container: HTMLElement): void {
    const elements = container.querySelectorAll('*');
    
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip if no text content or transparent background
      if (!htmlElement.textContent?.trim() || backgroundColor === 'rgba(0, 0, 0, 0)') {
        return;
      }
      
      try {
        // Convert colors to hex (simplified - would need more robust color parsing)
        const foreground = this.rgbToHex(color);
        const background = this.rgbToHex(backgroundColor);
        
        if (foreground && background) {
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
          
          if (!meetsWCAGAA(foreground, background, isLargeText)) {
            this.addIssue({
              type: 'error',
              rule: 'WCAG 1.4.3 Contrast (Minimum)',
              message: `Insufficient color contrast ratio. Current: ${getContrastRatio(foreground, background).toFixed(2)}, Required: ${isLargeText ? '3:1' : '4.5:1'}`,
              element: htmlElement,
              severity: 'serious',
            });
          }
        }
      } catch (error) {
        // Skip elements with unparseable colors
      }
    });
  }
  
  /**
   * Check focusable elements
   */
  private checkFocusableElements(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Check if element is visible
      const styles = window.getComputedStyle(htmlElement);
      if (styles.display === 'none' || styles.visibility === 'hidden') {
        return;
      }
      
      // Check for accessible name
      const accessibleName = this.getAccessibleName(htmlElement);
      if (!accessibleName) {
        this.addIssue({
          type: 'error',
          rule: 'WCAG 4.1.2 Name, Role, Value',
          message: 'Focusable element lacks accessible name',
          element: htmlElement,
          severity: 'critical',
        });
      }
      
      // Check focus indicator
      const focusOutline = styles.outline;
      const focusRing = styles.boxShadow;
      if (focusOutline === 'none' && !focusRing.includes('ring')) {
        this.addIssue({
          type: 'warning',
          rule: 'WCAG 2.4.7 Focus Visible',
          message: 'Element may lack visible focus indicator',
          element: htmlElement,
          severity: 'moderate',
        });
      }
    });
  }
  
  /**
   * Check ARIA labels and attributes
   */
  private checkAriaLabels(container: HTMLElement): void {
    const elementsWithAria = container.querySelectorAll('[aria-labelledby], [aria-describedby]');
    
    elementsWithAria.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Check aria-labelledby references
      const labelledBy = htmlElement.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelIds = labelledBy.split(' ');
        labelIds.forEach((id) => {
          if (!document.getElementById(id)) {
            this.addIssue({
              type: 'error',
              rule: 'WCAG 4.1.2 Name, Role, Value',
              message: `aria-labelledby references non-existent element with id "${id}"`,
              element: htmlElement,
              severity: 'serious',
            });
          }
        });
      }
      
      // Check aria-describedby references
      const describedBy = htmlElement.getAttribute('aria-describedby');
      if (describedBy) {
        const descriptionIds = describedBy.split(' ');
        descriptionIds.forEach((id) => {
          if (!document.getElementById(id)) {
            this.addIssue({
              type: 'error',
              rule: 'WCAG 4.1.2 Name, Role, Value',
              message: `aria-describedby references non-existent element with id "${id}"`,
              element: htmlElement,
              severity: 'serious',
            });
          }
        });
      }
    });
  }
  
  /**
   * Check heading structure
   */
  private checkHeadingStructure(container: HTMLElement): void {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      // Check for skipped heading levels
      if (level > previousLevel + 1) {
        this.addIssue({
          type: 'warning',
          rule: 'WCAG 1.3.1 Info and Relationships',
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          element: heading as HTMLElement,
          severity: 'moderate',
        });
      }
      
      // Check for empty headings
      if (!heading.textContent?.trim()) {
        this.addIssue({
          type: 'error',
          rule: 'WCAG 2.4.6 Headings and Labels',
          message: 'Empty heading element',
          element: heading as HTMLElement,
          severity: 'serious',
        });
      }
      
      previousLevel = level;
    });
  }
  
  /**
   * Check form labels
   */
  private checkFormLabels(container: HTMLElement): void {
    const formControls = container.querySelectorAll('input, select, textarea');
    
    formControls.forEach((control) => {
      const htmlControl = control as HTMLFormElement;
      
      // Skip hidden inputs
      if (htmlControl.type === 'hidden') return;
      
      const hasLabel = this.hasAssociatedLabel(htmlControl);
      const hasAriaLabel = htmlControl.hasAttribute('aria-label') || htmlControl.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel) {
        this.addIssue({
          type: 'error',
          rule: 'WCAG 3.3.2 Labels or Instructions',
          message: 'Form control lacks associated label',
          element: htmlControl,
          severity: 'critical',
        });
      }
    });
  }
  
  /**
   * Check images for alt text
   */
  private checkImages(container: HTMLElement): void {
    const images = container.querySelectorAll('img');
    
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      
      if (alt === null) {
        this.addIssue({
          type: 'error',
          rule: 'WCAG 1.1.1 Non-text Content',
          message: 'Image lacks alt attribute',
          element: img,
          severity: 'critical',
        });
      } else if (alt === '' && !img.hasAttribute('role')) {
        // Empty alt is okay for decorative images, but should have role="presentation"
        this.addIssue({
          type: 'info',
          rule: 'WCAG 1.1.1 Non-text Content',
          message: 'Decorative image should have role="presentation" or role="none"',
          element: img,
          severity: 'minor',
        });
      }
    });
  }
  
  /**
   * Check links
   */
  private checkLinks(container: HTMLElement): void {
    const links = container.querySelectorAll('a[href]');
    
    links.forEach((link) => {
      const htmlLink = link as HTMLAnchorElement;
      const text = htmlLink.textContent?.trim();
      const ariaLabel = htmlLink.getAttribute('aria-label');
      
      if (!text && !ariaLabel) {
        this.addIssue({
          type: 'error',
          rule: 'WCAG 2.4.4 Link Purpose (In Context)',
          message: 'Link lacks accessible text',
          element: htmlLink,
          severity: 'critical',
        });
      }
      
      // Check for generic link text
      const genericTexts = ['click here', 'read more', 'more', 'here', 'link'];
      if (text && genericTexts.includes(text.toLowerCase())) {
        this.addIssue({
          type: 'warning',
          rule: 'WCAG 2.4.4 Link Purpose (In Context)',
          message: 'Link text is not descriptive',
          element: htmlLink,
          severity: 'moderate',
        });
      }
    });
  }
  
  /**
   * Check touch target sizes
   */
  private checkTouchTargets(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll('button, [href], input, select, textarea');
    
    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      if (rect.width < 44 || rect.height < 44) {
        this.addIssue({
          type: 'warning',
          rule: 'WCAG 2.5.5 Target Size',
          message: `Touch target too small: ${rect.width}x${rect.height}px (minimum 44x44px)`,
          element: htmlElement,
          severity: 'moderate',
        });
      }
    });
  }
  
  /**
   * Check keyboard navigation
   */
  private checkKeyboardNavigation(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]');
    
    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const tabIndex = htmlElement.getAttribute('tabindex');
      
      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          type: 'warning',
          rule: 'WCAG 2.4.3 Focus Order',
          message: 'Positive tabindex can disrupt natural tab order',
          element: htmlElement,
          severity: 'moderate',
        });
      }
    });
  }
  
  /**
   * Check live regions
   */
  private checkLiveRegions(container: HTMLElement): void {
    const liveRegions = container.querySelectorAll('[aria-live]');
    
    liveRegions.forEach((region) => {
      const htmlRegion = region as HTMLElement;
      const ariaLive = htmlRegion.getAttribute('aria-live');
      
      if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
        this.addIssue({
          type: 'error',
          rule: 'WCAG 4.1.2 Name, Role, Value',
          message: `Invalid aria-live value: "${ariaLive}"`,
          element: htmlRegion,
          severity: 'serious',
        });
      }
    });
  }
  
  /**
   * Helper methods
   */
  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue);
  }
  
  private getAccessibleName(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    
    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent?.trim() || '';
    }
    
    // Check associated label
    if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent?.trim() || '';
    }
    
    // Check text content
    return element.textContent?.trim() || '';
  }
  
  private hasAssociatedLabel(element: HTMLFormElement): boolean {
    // Check for explicit label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return true;
    }
    
    // Check for implicit label (element inside label)
    const parentLabel = element.closest('label');
    return !!parentLabel;
  }
  
  private rgbToHex(rgb: string): string | null {
    // Simplified RGB to hex conversion
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  private generateReport(): AccessibilityReport {
    const summary = {
      total: this.issues.length,
      critical: this.issues.filter(i => i.severity === 'critical').length,
      serious: this.issues.filter(i => i.severity === 'serious').length,
      moderate: this.issues.filter(i => i.severity === 'moderate').length,
      minor: this.issues.filter(i => i.severity === 'minor').length,
    };
    
    // Calculate score (100 - weighted penalty for issues)
    const score = Math.max(0, 100 - (
      summary.critical * 25 +
      summary.serious * 10 +
      summary.moderate * 5 +
      summary.minor * 1
    ));
    
    return {
      issues: this.issues,
      summary,
      score,
    };
  }
}

/**
 * Quick accessibility check for development
 */
export function quickAccessibilityCheck(element?: HTMLElement): void {
  const auditor = new AccessibilityAuditor();
  const report = auditor.audit(element);
  
  console.group('🔍 Accessibility Report');
  console.log(`Score: ${report.score}/100`);
  console.log(`Total Issues: ${report.summary.total}`);
  
  if (report.summary.critical > 0) {
    console.error(`❌ Critical Issues: ${report.summary.critical}`);
  }
  if (report.summary.serious > 0) {
    console.warn(`⚠️ Serious Issues: ${report.summary.serious}`);
  }
  if (report.summary.moderate > 0) {
    console.info(`ℹ️ Moderate Issues: ${report.summary.moderate}`);
  }
  if (report.summary.minor > 0) {
    console.log(`💡 Minor Issues: ${report.summary.minor}`);
  }
  
  report.issues.forEach((issue, index) => {
    const icon = issue.severity === 'critical' ? '❌' : 
                 issue.severity === 'serious' ? '⚠️' : 
                 issue.severity === 'moderate' ? 'ℹ️' : '💡';
    
    console.group(`${icon} ${issue.rule}`);
    console.log(issue.message);
    if (issue.element) {
      console.log('Element:', issue.element);
    }
    console.groupEnd();
  });
  
  console.groupEnd();
}