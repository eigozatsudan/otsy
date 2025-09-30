'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface AdContent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  targetUrl: string;
  advertiser: string;
  category?: string;
}

interface AdSlotProps {
  placement: 'list-top' | 'modal-bottom' | 'sidebar' | 'inline';
  frequency?: number; // Show ad every N items (for inline placement)
  maxAdsPerSession?: number;
  className?: string;
  onAdView?: (adId: string) => void;
  onAdClick?: (adId: string) => void;
  onAdClose?: (adId: string) => void;
}

// Mock ad content - in real implementation, this would come from an ad server
const MOCK_ADS: AdContent[] = [
  {
    id: 'ad-1',
    title: 'Save 20% on Organic Produce',
    description: 'Fresh, locally-sourced organic fruits and vegetables delivered to your door.',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=200&fit=crop',
    ctaText: 'Shop Now',
    targetUrl: 'https://example.com/organic-produce',
    advertiser: 'FreshMart',
    category: 'groceries',
  },
  {
    id: 'ad-2',
    title: 'Kitchen Essentials Sale',
    description: 'Up to 40% off premium cookware, utensils, and kitchen gadgets.',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop',
    ctaText: 'Browse Deals',
    targetUrl: 'https://example.com/kitchen-sale',
    advertiser: 'KitchenPro',
    category: 'household',
  },
  {
    id: 'ad-3',
    title: 'Meal Planning Made Easy',
    description: 'Get personalized meal plans and grocery lists delivered weekly.',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=200&fit=crop',
    ctaText: 'Try Free',
    targetUrl: 'https://example.com/meal-planning',
    advertiser: 'MealMaster',
    category: 'food',
  },
];

export default function AdSlot({
  placement,
  frequency = 5,
  maxAdsPerSession = 3,
  className = '',
  onAdView,
  onAdClick,
  onAdClose,
}: AdSlotProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [currentAd, setCurrentAd] = useState<AdContent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adsShownThisSession, setAdsShownThisSession] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // Load ad content
  useEffect(() => {
    if (adsShownThisSession >= maxAdsPerSession || isDismissed) {
      return;
    }

    // Simulate ad loading delay
    const timer = setTimeout(() => {
      const randomAd = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
      setCurrentAd(randomAd);
      setIsVisible(true);
      setAdsShownThisSession(prev => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [adsShownThisSession, maxAdsPerSession, isDismissed]);

  // Track ad view when it becomes visible
  useEffect(() => {
    if (!currentAd || !isVisible || viewedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          onAdView?.(currentAd.id);
          announce('Advertisement loaded', 'polite');
        }
      },
      { threshold: 0.5 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [currentAd, isVisible, onAdView]);

  const handleAdClick = () => {
    if (!currentAd) return;
    
    onAdClick?.(currentAd.id);
    announce(`Opening ${currentAd.advertiser} advertisement`, 'polite');
    
    // Open in new tab to maintain user's shopping session
    window.open(currentAd.targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAdClose = () => {
    if (!currentAd) return;
    
    onAdClose?.(currentAd.id);
    setIsDismissed(true);
    setIsVisible(false);
    announce('Advertisement dismissed', 'polite');
  };

  const getAdDimensions = () => {
    switch (placement) {
      case 'list-top':
        return { width: '100%', height: '120px' };
      case 'modal-bottom':
        return { width: '100%', height: '80px' };
      case 'sidebar':
        return { width: '300px', height: '250px' };
      case 'inline':
        return { width: '100%', height: '100px' };
      default:
        return { width: '100%', height: '120px' };
    }
  };

  const getAdLayout = () => {
    switch (placement) {
      case 'modal-bottom':
      case 'inline':
        return 'horizontal-compact';
      case 'sidebar':
        return 'vertical';
      default:
        return 'horizontal';
    }
  };

  if (!currentAd || !isVisible || isDismissed) {
    return null;
  }

  const dimensions = getAdDimensions();
  const layout = getAdLayout();

  return (
    <AnimatePresence>
      <motion.div
        ref={adRef}
        className={clsx(
          'relative bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl overflow-hidden',
          className
        )}
        style={dimensions}
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
        exit={reducedMotion ? {} : { opacity: 0, y: -20 }}
        transition={reducedMotion ? {} : { duration: 0.3 }}
        role=\"complementary\"
        aria-label=\"Advertisement\"
      >
        {/* Ad Label */}
        <div className=\"absolute top-fib-1 left-fib-1 z-10\">
          <span className=\"px-fib-1 py-0.5 bg-neutral-600 text-white text-xs font-medium rounded\">
            Ad
          </span>
        </div>

        {/* Close Button */}
        <div className=\"absolute top-fib-1 right-fib-1 z-10\">
          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={handleAdClose}
            ariaLabel=\"Close advertisement\"
            className=\"w-6 h-6 p-0 bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900\"
          >
            <svg className=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Ad Content */}
        <div
          className={clsx(
            'h-full cursor-pointer transition-all duration-200 hover:bg-primary-200/50',
            {
              'flex items-center p-fib-3': layout === 'horizontal' || layout === 'horizontal-compact',
              'flex flex-col p-fib-3': layout === 'vertical',
            }
          )}
          onClick={handleAdClick}
          role=\"button\"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAdClick();
            }
          }}
          aria-label={`Advertisement: ${currentAd.title} by ${currentAd.advertiser}`}
        >
          {/* Ad Image */}
          {currentAd.imageUrl && (
            <div className={clsx(
              'bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0',
              {
                'w-20 h-16 mr-fib-3': layout === 'horizontal',
                'w-16 h-12 mr-fib-2': layout === 'horizontal-compact',
                'w-full h-32 mb-fib-2': layout === 'vertical',
              }
            )}>
              <img
                src={currentAd.imageUrl}
                alt=\"\"
                className=\"w-full h-full object-cover\"
                loading=\"lazy\"
              />
            </div>
          )}

          {/* Ad Text */}
          <div className={clsx(
            'flex-1 min-w-0',
            {
              'flex flex-col justify-center': layout === 'horizontal' || layout === 'horizontal-compact',
            }
          )}>
            <h3 className={clsx(
              'font-semibold text-neutral-900 mb-fib-1',
              {
                'text-mobile-sm': layout === 'horizontal-compact',
                'text-mobile-base': layout === 'horizontal' || layout === 'vertical',
              }
            )}>
              {currentAd.title}
            </h3>
            
            <p className={clsx(
              'text-neutral-700 mb-fib-2 line-clamp-2',
              {
                'text-mobile-xs': layout === 'horizontal-compact',
                'text-mobile-sm': layout === 'horizontal' || layout === 'vertical',
              }
            )}>
              {currentAd.description}
            </p>

            <div className=\"flex items-center justify-between\">
              <span className={clsx(
                'text-neutral-600 font-medium',
                {
                  'text-mobile-xs': layout === 'horizontal-compact',
                  'text-mobile-sm': layout === 'horizontal' || layout === 'vertical',
                }
              )}>
                {currentAd.advertiser}
              </span>
              
              <span className={clsx(
                'px-fib-2 py-fib-1 bg-primary-600 text-white rounded-lg font-medium transition-colors hover:bg-primary-700',
                {
                  'text-mobile-xs px-fib-1 py-0.5': layout === 'horizontal-compact',
                  'text-mobile-sm': layout === 'horizontal' || layout === 'vertical',
                }
              )}>
                {currentAd.ctaText}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className=\"absolute bottom-0 left-0 right-0 bg-black/5 px-fib-2 py-fib-1\">
          <p className=\"text-xs text-neutral-600 text-center\">
            Ad personalization is based on your shopping categories only. 
            <button 
              className=\"underline hover:no-underline ml-1\"
              onClick={(e) => {
                e.stopPropagation();
                // Open privacy policy
                window.open('/privacy#advertising', '_blank');
              }}
            >
              Learn more
            </button>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}