'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer, useFocusTrap } from '@/hooks/useAccessibility';
import AccessibleButton from './AccessibleButton';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  className = '',
}: AccessibleModalProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Enable focus trap when modal is open
  useFocusTrap(modalRef as unknown as React.RefObject<HTMLElement>, isOpen);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
        announce('Modal closed', 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape, announce]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Announce modal state changes
  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`, 'polite');
    }
  }, [isOpen, title, announce]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
      announce('Modal closed', 'polite');
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-fib-4',
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: reducedMotion ? 1 : 0.95,
      y: reducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-fib-4">
            {/* Overlay */}
            <motion.div
              ref={overlayRef}
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              variants={reducedMotion ? {} : overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              onClick={handleOverlayClick}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              className={clsx(
                'relative w-full bg-white rounded-xl shadow-xl',
                sizeClasses[size],
                className
              )}
              variants={reducedMotion ? {} : modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby={description ? "modal-description" : undefined}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-fib-4 border-b border-neutral-200">
                <div>
                  <h2 id="modal-title" className="text-mobile-lg font-semibold text-neutral-900">
                    {title}
                  </h2>
                  {description && (
                    <p id="modal-description" className="text-mobile-sm text-neutral-600 mt-fib-1">
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="ml-fib-3 -mr-fib-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </AccessibleButton>
                )}
              </div>

              {/* Content */}
              <div className="p-fib-4">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render modal in portal
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}