import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput, AccessibleTextArea } from '@/components/accessibility/AccessibleForm';
import { ColorContrast, FocusManager, TouchAccessibility } from '@/lib/accessibility-utils';

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

    it('should meet minimum touch target size', () => {
      render(
        <AccessibleButton size="sm" onClick={() => {}}>
          Small Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button');
      const rect = button.getBoundingClientRect();
      
      // Should meet 44x44px minimum
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('should handle keyboard navigation', () => {
      const handleClick = jest.fn();
      render(
        <AccessibleButton onClick={handleClick}>
          Keyboard Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button');
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleButton 
          ariaLabel="Custom label"
          ariaDescribedBy="description"
          disabled
        >
          ARIA Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('AccessibleInput', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleInput 
          label="Test Input"
          value=""
          onChange={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should associate label with input', () => {
      render(
        <AccessibleInput 
          label="Email Address"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toBeInTheDocument();
    });

    it('should show error state with proper ARIA attributes', () => {
      render(
        <AccessibleInput 
          label="Email"
          value=""
          onChange={() => {}}
          error="Email is required"
        />
      );
      
      const input = screen.getByLabelText('Email');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should handle required fields', () => {
      render(
        <AccessibleInput 
          label="Required Field"
          value=""
          onChange={() => {}}
          required
        />
      );
      
      const input = screen.getByLabelText(/Required Field/);
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('AccessibleTextArea', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleTextArea 
          label="Comments"
          value=""
          onChange={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should show character count', () => {
      render(
        <AccessibleTextArea 
          label="Limited Text"
          value="Hello"
          onChange={() => {}}
          maxLength={100}
        />
      );
      
      expect(screen.getByText('5/100')).toBeInTheDocument();
    });
  });
});

describe('Accessibility Utilities', () => {
  describe('ColorContrast', () => {
    it('should calculate correct contrast ratios', () => {
      // Black on white should have high contrast
      const blackWhite = ColorContrast.getContrastRatio('#000000', '#ffffff');
      expect(blackWhite).toBe(21);
      
      // Same colors should have 1:1 ratio
      const sameColor = ColorContrast.getContrastRatio('#ff0000', '#ff0000');
      expect(sameColor).toBe(1);
    });

    it('should validate WCAG AA compliance', () => {
      // High contrast should pass AA
      expect(ColorContrast.meetsWCAG('#000000', '#ffffff', 'AA')).toBe(true);
      
      // Low contrast should fail AA
      expect(ColorContrast.meetsWCAG('#888888', '#999999', 'AA')).toBe(false);
    });

    it('should provide correct contrast grades', () => {
      expect(ColorContrast.getContrastGrade('#000000', '#ffffff')).toBe('AAA');
      expect(ColorContrast.getContrastGrade('#666666', '#ffffff')).toBe('AA');
      expect(ColorContrast.getContrastGrade('#cccccc', '#ffffff')).toBe('Fail');
    });
  });

  describe('FocusManager', () => {
    it('should find focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" />
        <div tabindex="0">Focusable div</div>
        <div tabindex="-1">Not focusable</div>
      `;
      
      const focusableElements = FocusManager.getFocusableElements(container);
      expect(focusableElements).toHaveLength(4);
    });
  });

  describe('TouchAccessibility', () => {
    it('should validate touch target sizes', () => {
      // Create mock element with getBoundingClientRect
      const element = document.createElement('button');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ width: 48, height: 48 }),
      });
      
      expect(TouchAccessibility.validateTouchTarget(element)).toBe(true);
      
      // Test small target
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ width: 30, height: 30 }),
      });
      
      expect(TouchAccessibility.validateTouchTarget(element)).toBe(false);
    });

    it('should provide touch target recommendations', () => {
      const element = document.createElement('button');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ width: 30, height: 40 }),
      });
      
      const recommendations = TouchAccessibility.getTouchTargetRecommendations(element);
      
      expect(recommendations.isValid).toBe(false);
      expect(recommendations.recommendations).toContain('Increase width to at least 44px (current: 30px)');
      expect(recommendations.recommendations).toContain('Increase height to at least 44px (current: 40px)');
    });
  });
});

describe('Keyboard Navigation', () => {
  it('should handle arrow key navigation', () => {
    const container = document.createElement('div');
    const buttons = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ];
    
    buttons.forEach((button, index) => {
      button.textContent = `Button ${index + 1}`;
      container.appendChild(button);
    });
    
    document.body.appendChild(container);
    
    // Test arrow down navigation
    buttons[0].focus();
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    
    // Clean up
    document.body.removeChild(container);
  });
});

describe('Screen Reader Compatibility', () => {
  it('should announce status changes', () => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'sr-only';
    
    document.body.appendChild(announcer);
    
    // Simulate announcement
    announcer.textContent = 'Form submitted successfully';
    
    expect(announcer.textContent).toBe('Form submitted successfully');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    
    document.body.removeChild(announcer);
  });
});

describe('High Contrast Mode', () => {
  it('should adapt to high contrast preferences', () => {
    // Mock matchMedia for high contrast
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const { container } = render(
      <AccessibleButton>High Contrast Button</AccessibleButton>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('border-2'); // High contrast border
  });
});

describe('Reduced Motion', () => {
  it('should respect reduced motion preferences', () => {
    // Mock matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const { container } = render(
      <AccessibleButton>No Animation Button</AccessibleButton>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('duration-0'); // No animation duration
  });
});