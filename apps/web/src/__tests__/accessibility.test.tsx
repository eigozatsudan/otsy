/**
 * Accessibility tests for WCAG compliance
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

import AccessibleButton from '@/components/accessibility/AccessibleButton';
import AccessibleForm from '@/components/accessibility/AccessibleForm';
import AccessibleModal from '@/components/accessibility/AccessibleModal';
import AccessibleNavigation from '@/components/accessibility/AccessibleNavigation';
import { getContrastRatio, meetsWCAGAA } from '@/utils/accessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Components', () => {
  describe('AccessibleButton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton onClick={() => {}}>
          Test Button
        </AccessibleButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', async () => {
      const handleClick = jest.fn();
      render(
        <AccessibleButton onClick={handleClick}>
          Test Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button', { name: 'Test Button' });
      
      // Test keyboard interaction
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have proper ARIA attributes when loading', () => {
      render(
        <AccessibleButton loading loadingText="Loading...">
          Submit
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-describedby');
      expect(screen.getByText('Loading, please wait')).toBeInTheDocument();
    });

    it('should meet minimum touch target size', () => {
      render(
        <AccessibleButton size="md">
          Test Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Check minimum height (44px)
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('AccessibleForm', () => {
    const mockFields = [
      {
        id: 'email',
        name: 'email',
        label: 'Email Address',
        type: 'email' as const,
        value: '',
        required: true,
        validation: (value: string) => {
          if (!value.includes('@')) return 'Please enter a valid email';
          return null;
        },
      },
      {
        id: 'password',
        name: 'password',
        label: 'Password',
        type: 'password' as const,
        value: '',
        required: true,
        description: 'Must be at least 8 characters long',
      },
    ];

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleForm
          fields={mockFields}
          onSubmit={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels', () => {
      render(
        <AccessibleForm
          fields={mockFields}
          onSubmit={() => {}}
        />
      );
      
      const emailInput = screen.getByLabelText('Email Address *');
      const passwordInput = screen.getByLabelText('Password *');
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <AccessibleForm
          fields={mockFields}
          onSubmit={() => {}}
        />
      );
      
      const emailInput = screen.getByLabelText('Email Address *');
      
      // Enter invalid email and blur
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      // Check for error message
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please enter a valid email');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <AccessibleForm
          fields={mockFields}
          onSubmit={() => {}}
        />
      );
      
      const emailInput = screen.getByLabelText('Email Address *');
      const passwordInput = screen.getByLabelText('Password *');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      // Test tab navigation
      emailInput.focus();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('AccessibleModal', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>Outside Button</button>
          <AccessibleModal
            isOpen={true}
            onClose={() => {}}
            title="Test Modal"
          >
            <button>Inside Button 1</button>
            <button>Inside Button 2</button>
          </AccessibleModal>
        </div>
      );
      
      const insideButton1 = screen.getByRole('button', { name: 'Inside Button 1' });
      const insideButton2 = screen.getByRole('button', { name: 'Inside Button 2' });
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      
      // Focus should start on first focusable element
      expect(insideButton1).toHaveFocus();
      
      // Tab should cycle through modal elements
      await user.tab();
      expect(insideButton2).toHaveFocus();
      
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      // Tab from last element should go to first
      await user.tab();
      expect(insideButton1).toHaveFocus();
      
      // Shift+Tab should go backwards
      await user.tab({ shift: true });
      expect(closeButton).toHaveFocus();
    });

    it('should close on Escape key', async () => {
      const handleClose = jest.fn();
      
      render(
        <AccessibleModal
          isOpen={true}
          onClose={handleClose}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          description="Modal description"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby');
      
      expect(screen.getByText('Test Modal')).toHaveAttribute('id');
      expect(screen.getByText('Modal description')).toHaveAttribute('id');
    });
  });

  describe('AccessibleNavigation', () => {
    const mockItems = [
      {
        id: 'home',
        label: 'Home',
        href: '/',
      },
      {
        id: 'about',
        label: 'About',
        href: '/about',
      },
      {
        id: 'contact',
        label: 'Contact',
        href: '/contact',
        badge: 3,
      },
    ];

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleNavigation
          items={mockItems}
          ariaLabel="Main navigation"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      render(
        <AccessibleNavigation
          items={mockItems}
          orientation="horizontal"
        />
      );
      
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const aboutLink = screen.getByRole('link', { name: 'About' });
      
      homeLink.focus();
      expect(homeLink).toHaveFocus();
      
      // Arrow right should move to next item
      fireEvent.keyDown(homeLink, { key: 'ArrowRight' });
      expect(aboutLink).toHaveFocus();
      
      // Home key should go to first item
      fireEvent.keyDown(aboutLink, { key: 'Home' });
      expect(homeLink).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleNavigation
          items={mockItems}
          ariaLabel="Main navigation"
        />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      // Check badge accessibility
      const contactLink = screen.getByRole('link', { name: /Contact/ });
      expect(contactLink).toHaveTextContent('3');
    });
  });
});

describe('Accessibility Utilities', () => {
  describe('Color Contrast', () => {
    it('should calculate contrast ratios correctly', () => {
      // Test high contrast (white on black)
      const highContrast = getContrastRatio('#ffffff', '#000000');
      expect(highContrast).toBeCloseTo(21, 1);
      
      // Test low contrast (light gray on white)
      const lowContrast = getContrastRatio('#f0f0f0', '#ffffff');
      expect(lowContrast).toBeLessThan(2);
      
      // Test medium contrast
      const mediumContrast = getContrastRatio('#666666', '#ffffff');
      expect(mediumContrast).toBeGreaterThan(4);
    });

    it('should validate WCAG AA compliance', () => {
      // These should pass WCAG AA
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true); // Black on white
      expect(meetsWCAGAA('#ffffff', '#0284c7')).toBe(true); // White on primary blue
      
      // These should fail WCAG AA
      expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false); // Light gray on white
      expect(meetsWCAGAA('#ffff00', '#ffffff')).toBe(false); // Yellow on white
    });

    it('should handle large text correctly', () => {
      // Lower contrast requirements for large text
      const color1 = '#757575'; // Medium gray
      const color2 = '#ffffff'; // White
      
      expect(meetsWCAGAA(color1, color2, false)).toBe(false); // Normal text
      expect(meetsWCAGAA(color1, color2, true)).toBe(true);   // Large text
    });
  });
});

describe('Keyboard Navigation', () => {
  it('should handle arrow key navigation', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ];
    
    // Mock focus method
    items.forEach(item => {
      item.focus = jest.fn();
    });
    
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as any;
    
    // Test navigation from first item
    const newIndex = require('@/utils/accessibility').KeyboardNavigation.handleArrowNavigation(
      mockEvent,
      items,
      0,
      { orientation: 'vertical' }
    );
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(newIndex).toBe(1);
    expect(items[1].focus).toHaveBeenCalled();
  });
});

describe('Touch Targets', () => {
  it('should validate minimum touch target size', () => {
    // Create mock element with getBoundingClientRect
    const mockElement = {
      getBoundingClientRect: () => ({
        width: 44,
        height: 44,
      }),
    } as HTMLElement;
    
    const { TouchTargets } = require('@/utils/accessibility');
    expect(TouchTargets.meetsMinimumSize(mockElement)).toBe(true);
    
    // Test element that's too small
    const smallElement = {
      getBoundingClientRect: () => ({
        width: 30,
        height: 30,
      }),
    } as HTMLElement;
    
    expect(TouchTargets.meetsMinimumSize(smallElement)).toBe(false);
  });

  it('should calculate recommended padding', () => {
    const smallElement = {
      getBoundingClientRect: () => ({
        width: 30,
        height: 30,
      }),
    } as HTMLElement;
    
    const { TouchTargets } = require('@/utils/accessibility');
    const padding = TouchTargets.getRecommendedPadding(smallElement);
    
    expect(padding.x).toBe(7); // (44 - 30) / 2
    expect(padding.y).toBe(7); // (44 - 30) / 2
  });
});

// Integration test for full page accessibility
describe('Page Accessibility', () => {
  it('should have proper document structure', async () => {
    const { container } = render(
      <div>
        <header>
          <h1>Page Title</h1>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <h2>Main Content</h2>
          <p>This is the main content area.</p>
        </main>
        <footer>
          <p>Footer content</p>
        </footer>
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    
    // Check for proper landmarks
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument();   // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
    
    // Check heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});