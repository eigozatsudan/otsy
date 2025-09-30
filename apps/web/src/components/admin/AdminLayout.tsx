'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: 'dashboard' | 'users' | 'content' | 'reports' | 'settings';
  onSectionChange: (section: AdminLayoutProps['currentSection']) => void;
  className?: string;
}

interface NavigationItem {
  id: AdminLayoutProps['currentSection'];
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: number;
}

export default function AdminLayout({
  children,
  currentSection,
  onSectionChange,
  className = '',
}: AdminLayoutProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'System overview and metrics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Manage users and permissions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      id: 'content',
      label: 'Content Moderation',
      description: 'Review and moderate content',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      description: 'Analytics and reporting',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'System configuration',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleSectionChange = (section: AdminLayoutProps['currentSection']) => {
    onSectionChange(section);
    setSidebarOpen(false);
    announce(`Switched to ${section} section`, 'polite');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    announce(sidebarOpen ? 'Sidebar closed' : 'Sidebar opened', 'polite');
  };

  return (
    <div className={clsx('min-h-screen bg-neutral-50', className)}>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          {
            'translate-x-0': sidebarOpen,
            '-translate-x-full': !sidebarOpen,
          }
        )}
        initial={false}
        animate={reducedMotion ? {} : { x: sidebarOpen ? 0 : -256 }}
        transition={reducedMotion ? {} : { duration: 0.3 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-fib-4 border-b border-neutral-200">
            <div>
              <h1 className="text-mobile-lg font-bold text-neutral-900">
                Admin Panel
              </h1>
              <p className="text-mobile-xs text-neutral-600 mt-fib-1">
                System Administration
              </p>
            </div>
            
            {/* Mobile close button */}
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </AccessibleButton>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-fib-4" aria-label="Admin navigation">
            <ul className="space-y-fib-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSectionChange(item.id)}
                    className={clsx(
                      'w-full flex items-center px-fib-3 py-fib-2 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      {
                        'bg-primary-100 text-primary-900 border border-primary-200': currentSection === item.id,
                        'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900': currentSection !== item.id,
                      }
                    )}
                    aria-current={currentSection === item.id ? 'page' : undefined}
                  >
                    <span className={clsx('mr-fib-3', {
                      'text-primary-600': currentSection === item.id,
                      'text-neutral-500': currentSection !== item.id,
                    })}>
                      {item.icon}
                    </span>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-mobile-sm font-medium">
                          {item.label}
                        </span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-fib-2 px-1.5 py-0.5 bg-error-100 text-error-800 rounded-full text-xs font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-mobile-xs text-neutral-600 mt-fib-1">
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-fib-4 border-t border-neutral-200">
            <div className="flex items-center space-x-fib-2 text-mobile-xs text-neutral-600">
              <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>System Status: Online</span>
            </div>
            <div className="mt-fib-1 text-mobile-xs text-neutral-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-neutral-200 px-fib-4 py-fib-3">
          <div className="flex items-center justify-between">
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </AccessibleButton>
            
            <h1 className="text-mobile-base font-semibold text-neutral-900">
              {navigationItems.find(item => item.id === currentSection)?.label}
            </h1>
            
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-fib-4 lg:p-fib-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}