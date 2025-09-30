/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Golden Ratio and Silver Ratio Design System
      spacing: {
        // Fibonacci sequence for consistent spacing (8, 13, 21, 34, 55px)
        'fib-1': '0.5rem',   // 8px
        'fib-2': '0.8125rem', // 13px
        'fib-3': '1.3125rem', // 21px
        'fib-4': '2.125rem',  // 34px
        'fib-5': '3.4375rem', // 55px
        'fib-6': '5.5625rem', // 89px
        'fib-7': '9rem',      // 144px
        'fib-8': '14.5625rem', // 233px
        
        // Golden ratio proportions (1:1.618)
        'golden-sm': '1rem',      // 16px
        'golden-md': '1.618rem',  // ~26px
        'golden-lg': '2.618rem',  // ~42px
        'golden-xl': '4.236rem',  // ~68px
        'golden-2xl': '6.854rem', // ~110px
        
        // Silver ratio proportions (1:1.414)
        'silver-sm': '1rem',      // 16px
        'silver-md': '1.414rem',  // ~23px
        'silver-lg': '2.414rem',  // ~39px
        'silver-xl': '3.828rem',  // ~61px
        
        // Touch-friendly minimum sizes (44px minimum)
        'touch-sm': '2.75rem',    // 44px
        'touch-md': '3rem',       // 48px
        'touch-lg': '3.5rem',     // 56px
        'touch-xl': '4rem',       // 64px
      },
      
      // Golden ratio aspect ratios
      aspectRatio: {
        'golden': '1.618',
        'golden-inverse': '0.618',
        'silver': '1.414',
        'silver-inverse': '0.707',
      },
      
      // Mobile-optimized typography (14-16sp base)
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],    // 16px (base)
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'mobile-xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        'mobile-2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
        'mobile-3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        'mobile-4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
      },
      
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Neutral colors optimized for mobile readability
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      // Subtle animations under 200ms for responsiveness
      animation: {
        'fade-in': 'fadeIn 150ms ease-in-out',
        'fade-out': 'fadeOut 150ms ease-in-out',
        'slide-up': 'slideUp 180ms ease-out',
        'slide-down': 'slideDown 180ms ease-out',
        'slide-left': 'slideLeft 180ms ease-out',
        'slide-right': 'slideRight 180ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'scale-out': 'scaleOut 150ms ease-in',
        'bounce-subtle': 'bounceSubtle 200ms ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      
      // Custom utilities for mobile optimization
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Box shadows optimized for mobile
      boxShadow: {
        'mobile-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'mobile': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'mobile-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'mobile-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'mobile-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Custom plugin for golden ratio and accessibility utilities
    function({ addUtilities, addBase, theme }) {
      // Base accessibility styles
      addBase({
        // Focus visible styles for keyboard navigation
        '.keyboard-navigation *:focus': {
          outline: `2px solid ${theme('colors.primary.500')}`,
          outlineOffset: '2px',
        },
        // High contrast mode support
        '@media (prefers-contrast: high)': {
          '*': {
            borderColor: 'currentColor !important',
          },
        },
        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      });

      const newUtilities = {
        // Golden ratio utilities
        '.aspect-golden': {
          aspectRatio: '1.618',
        },
        '.aspect-golden-inverse': {
          aspectRatio: '0.618',
        },
        '.aspect-silver': {
          aspectRatio: '1.414',
        },
        '.aspect-silver-inverse': {
          aspectRatio: '0.707',
        },
        
        // Accessibility utilities
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        '.mobile-safe-area': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        
        // Screen reader only content
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.sr-only-focusable:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        
        // Focus management
        '.focus-visible-only:focus:not(:focus-visible)': {
          outline: 'none',
          boxShadow: 'none',
        },
        
        // Skip link utility
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme('colors.primary.600'),
          color: 'white',
          padding: '8px 16px',
          textDecoration: 'none',
          borderRadius: '4px',
          zIndex: '100',
          fontSize: theme('fontSize.mobile-sm')[0],
          fontWeight: '500',
          transition: 'top 0.3s ease',
        },
        '.skip-link:focus': {
          top: '6px',
        },
        
        // High contrast mode utilities
        '@media (prefers-contrast: high)': {
          '.high-contrast\\:border-2': {
            borderWidth: '2px',
          },
          '.high-contrast\\:bg-white': {
            backgroundColor: 'white !important',
          },
          '.high-contrast\\:text-black': {
            color: 'black !important',
          },
          '.high-contrast\\:border-black': {
            borderColor: 'black !important',
          },
        },
        
        // Reduced motion utilities
        '@media (prefers-reduced-motion: reduce)': {
          '.motion-reduce\\:animate-none': {
            animation: 'none !important',
          },
          '.motion-reduce\\:transition-none': {
            transition: 'none !important',
          },
          '.motion-reduce\\:transform-none': {
            transform: 'none !important',
          },
        },
        
        // WCAG AA compliant focus indicators
        '.focus-ring': {
          '&:focus': {
            outline: `2px solid ${theme('colors.primary.500')}`,
            outlineOffset: '2px',
          },
        },
        '.focus-ring-inset': {
          '&:focus': {
            outline: `2px solid ${theme('colors.primary.500')}`,
            outlineOffset: '-2px',
          },
        },
        
        // Accessible color combinations (WCAG AA compliant)
        '.text-accessible-primary': {
          color: theme('colors.primary.700'),
        },
        '.bg-accessible-primary': {
          backgroundColor: theme('colors.primary.50'),
          color: theme('colors.primary.900'),
        },
        '.text-accessible-error': {
          color: theme('colors.error.700'),
        },
        '.bg-accessible-error': {
          backgroundColor: theme('colors.error.50'),
          color: theme('colors.error.900'),
        },
        '.text-accessible-success': {
          color: theme('colors.success.700'),
        },
        '.bg-accessible-success': {
          backgroundColor: theme('colors.success.50'),
          color: theme('colors.success.900'),
        },
        '.text-accessible-warning': {
          color: theme('colors.warning.700'),
        },
        '.bg-accessible-warning': {
          backgroundColor: theme('colors.warning.50'),
          color: theme('colors.warning.900'),
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
};