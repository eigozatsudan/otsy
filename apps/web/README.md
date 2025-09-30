# Otsukai DX - Mobile-Optimized Web Application

A privacy-first, mobile-optimized Progressive Web App (PWA) for collaborative shopping management built with Next.js, featuring golden ratio design principles and touch-friendly interfaces.

## 🎨 Design System

### Golden Ratio & Silver Ratio Proportions

The application uses mathematical design principles for visual harmony:

- **Golden Ratio (φ = 1.618)**: Used for card proportions and layout spacing
- **Silver Ratio (δ = 1.414)**: Used for secondary proportions and typography scaling
- **Fibonacci Sequence**: Used for consistent spacing (8, 13, 21, 34, 55px)

### Spacing System

```css
/* Fibonacci-based spacing */
fib-1: 8px    /* 0.5rem */
fib-2: 13px   /* 0.8125rem */
fib-3: 21px   /* 1.3125rem */
fib-4: 34px   /* 2.125rem */
fib-5: 55px   /* 3.4375rem */

/* Golden ratio proportions */
golden-sm: 16px   /* 1rem */
golden-md: 26px   /* 1.618rem */
golden-lg: 42px   /* 2.618rem */

/* Touch-friendly sizes (44px minimum) */
touch-sm: 44px    /* 2.75rem */
touch-md: 48px    /* 3rem */
touch-lg: 56px    /* 3.5rem */
```

### Typography Scale (Mobile-Optimized)

```css
mobile-xs: 12px   /* Small labels */
mobile-sm: 14px   /* Secondary text */
mobile-base: 16px /* Body text (base) */
mobile-lg: 18px   /* Subheadings */
mobile-xl: 20px   /* Headings */
mobile-2xl: 24px  /* Large headings */
```

## 🚀 Features

### Progressive Web App (PWA)
- **Offline Support**: Cached group data viewing when offline
- **App-like Experience**: Standalone display mode with native feel
- **Fast Loading**: Optimized bundle splitting and caching strategies
- **Push Notifications**: Real-time updates for group activities

### Mobile-First Design
- **Touch-Friendly**: 44px minimum touch targets for accessibility
- **Responsive Layout**: Optimized for mobile devices with desktop fallback
- **Safe Area Support**: Handles device notches and rounded corners
- **Gesture Support**: Swipe, tap, and long-press interactions

### Performance Optimizations
- **Subtle Animations**: All animations under 200ms for responsiveness
- **Lazy Loading**: Components and images loaded on demand
- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: WebP/AVIF formats with fallbacks

### Accessibility (WCAG AA Compliant)
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full functionality without mouse
- **Color Contrast**: 4.5:1 ratio for normal text
- **Focus Indicators**: Clear visual focus states
- **Touch Targets**: Minimum 44px size with adequate spacing

## 📱 Components

### Layout Components

#### MobileLayout
Main layout wrapper with mobile optimizations:
- Safe area handling for notched devices
- Sticky header with backdrop blur
- Bottom navigation with touch-friendly buttons
- Proper viewport configuration

```tsx
<MobileLayout 
  title="My Groups" 
  showHeader 
  showNavigation
>
  {/* Your content */}
</MobileLayout>
```

### UI Components

#### GoldenCard
Cards with golden ratio proportions:
- Multiple aspect ratios (golden, silver, square)
- Interactive states with subtle animations
- Specialized variants (ShoppingItemCard, GroupCard)

```tsx
<GoldenCard ratio="golden" variant="elevated" interactive>
  <ShoppingItemCard
    title="Organic Milk"
    category="Dairy"
    quantity={2}
    status="todo"
  />
</GoldenCard>
```

#### TouchButton
Touch-optimized buttons with proper sizing:
- Multiple variants (primary, secondary, outline, ghost, danger)
- Touch-friendly minimum sizes (44px+)
- Loading states and disabled handling
- Icon support with proper spacing

```tsx
<TouchButton 
  variant="primary" 
  size="lg" 
  icon={ButtonIcons.Plus}
  fullWidth
>
  Add Item
</TouchButton>
```

#### MobileInput
Mobile-optimized form inputs:
- Touch-friendly sizing and spacing
- Proper input modes for mobile keyboards
- Error states with animations
- Icon and action button support

```tsx
<MobileInput
  label="Item Name"
  placeholder="Enter item name..."
  icon={<SearchIcon />}
  error={validationError}
  required
/>
```

## 🛠️ Technical Stack

### Core Technologies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with custom design system
- **Framer Motion**: Smooth animations and gestures
- **PWA**: Service worker and offline support

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Turbo**: Monorepo build system
- **PostCSS**: CSS processing and optimization

### Mobile Optimizations
- **Viewport Meta**: Proper mobile viewport configuration
- **Touch Events**: Optimized touch and gesture handling
- **Performance**: Bundle splitting and lazy loading
- **Caching**: Service worker with runtime caching

## 📦 Project Structure

```
apps/web/
├── public/
│   ├── icons/              # PWA icons (72x72 to 512x512)
│   ├── screenshots/        # App store screenshots
│   └── manifest.json       # PWA manifest
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── styles/            # Global styles
├── tailwind.config.js     # Design system configuration
├── next.config.js         # Next.js and PWA configuration
└── package.json
```

## 🎯 Design Principles

### 1. Mobile-First Approach
- Design for mobile screens first, then enhance for larger screens
- Touch-friendly interactions with proper feedback
- Optimized for one-handed use

### 2. Mathematical Harmony
- Golden ratio (1.618) for primary proportions
- Silver ratio (1.414) for secondary elements
- Fibonacci sequence for consistent spacing

### 3. Performance-Focused
- Animations under 200ms for perceived speed
- Lazy loading and code splitting
- Optimized images and assets

### 4. Accessibility-First
- WCAG AA compliance out of the box
- Screen reader optimization
- Keyboard navigation support

### 5. Privacy-Conscious
- Minimal data collection
- No tracking scripts
- Secure by default

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Docker and Docker Compose (for full stack)

### Development Setup

1. **Install dependencies:**
```bash
yarn install
```

2. **Start development server:**
```bash
yarn dev
```

3. **Build for production:**
```bash
yarn build
```

4. **Run with full stack:**
```bash
docker compose up
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## 📱 PWA Features

### Installation
- Add to home screen on mobile devices
- Standalone app experience
- Custom splash screen and icons

### Offline Support
- Cached group data viewing
- Service worker with runtime caching
- Graceful offline state handling

### Performance
- Lighthouse score optimization
- Core Web Vitals compliance
- Fast loading and smooth interactions

## 🎨 Customization

### Design System
The design system is fully customizable through Tailwind configuration:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'fib-1': '0.5rem',    // 8px
        'fib-2': '0.8125rem', // 13px
        // ... more Fibonacci spacing
      },
      aspectRatio: {
        'golden': '1.618',
        'silver': '1.414',
      },
    },
  },
};
```

### Component Variants
Components support multiple variants and can be extended:

```tsx
// Custom button variant
<TouchButton 
  variant="custom" 
  className="bg-gradient-to-r from-purple-500 to-pink-500"
>
  Custom Style
</TouchButton>
```

## 🔮 Future Enhancements

### Planned Features
- **Dark Mode**: System-aware theme switching
- **Gesture Navigation**: Swipe gestures for navigation
- **Voice Input**: Speech-to-text for item entry
- **Camera Integration**: Barcode scanning for items
- **Advanced Animations**: Shared element transitions

### Performance Improvements
- **Image Optimization**: Next.js Image component integration
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching Strategy**: Advanced service worker caching
- **Preloading**: Intelligent resource preloading

## 📊 Browser Support

### Supported Browsers
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### PWA Support
- **iOS**: Add to home screen, standalone mode
- **Android**: Full PWA support with install prompts
- **Desktop**: Chrome, Edge PWA installation

## 🤝 Contributing

### Development Guidelines
1. Follow the established design system
2. Maintain mobile-first approach
3. Ensure accessibility compliance
4. Write tests for new components
5. Optimize for performance

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use semantic HTML elements
- Implement proper ARIA attributes

This mobile-optimized web application provides a solid foundation for the Otsukai DX platform, emphasizing user experience, performance, and accessibility while maintaining the privacy-first principles of the overall system.