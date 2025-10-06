'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export default function MobileLayout({
  children,
  title = 'おつかいDX',
  description = 'プライバシー重視の共同買い物管理アプリ',
  showHeader = true,
  showNavigation = true,
  className = '',
}: MobileLayoutProps) {
  const pathname = usePathname();
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="おつかいDX" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>

      <div className={`min-h-screen bg-neutral-50 mobile-safe-area ${className}`}>
        {/* Header */}
        {showHeader && (
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200"
          >
            <div className="px-fib-2 py-fib-2">
              <div className="flex items-center justify-between h-touch-sm">
                <div className="flex items-center space-x-fib-2">
                  <h1 className="text-mobile-lg font-semibold text-neutral-900 truncate">
                    {title}
                  </h1>
                </div>
                
                {/* Header actions */}
                <div className="flex items-center space-x-fib-1">
                  {/* Notification bell */}
                  <button className="touch-target p-fib-1 rounded-lg hover:bg-neutral-100 transition-colors duration-150">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 2.82l3.12 3.12M7.05 5.84L3.93 8.96" />
                    </svg>
                  </button>
                  
                  {/* Profile menu */}
                  <button className="touch-target p-fib-1 rounded-lg hover:bg-neutral-100 transition-colors duration-150">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">U</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.header>
        )}

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, delay: 0.05 }}
          className="flex-1 pb-safe-bottom"
        >
          {children}
        </motion.main>

        {/* Bottom navigation */}
        {showNavigation && (
          <motion.nav
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-neutral-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="px-fib-2 py-fib-1">
              <div className="flex items-center justify-around">
                <NavItem icon="home" label="ホーム" active={pathname === '/'} />
                <NavItem icon="list" label="買い物" active={pathname === '/shopping'} />
                <NavItem icon="plus" label="グループ" active={pathname === '/groups'} />
                <NavItem icon="chart" label="割り勘" active={pathname === '/splits'} />
                <NavItem icon="chat" label="チャット" active={pathname === '/chat'} />
              </div>
            </div>
          </motion.nav>
        )}
      </div>
    </>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  const iconPaths = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    list: "M4 6h16M4 10h16M4 14h16M4 18h16",
    plus: "M12 4v16m8-8H4",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  };

  const getHref = () => {
    switch (icon) {
      case 'home': return '/';
      case 'list': return '/shopping';
      case 'plus': return '/groups';
      case 'chart': return '/splits';
      case 'chat': return '/chat';
      default: return '/';
    }
  };

  return (
    <Link href={getHref()}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`touch-target flex flex-col items-center justify-center space-y-1 rounded-lg transition-colors duration-150 cursor-pointer ${
          active 
            ? 'text-primary-600' 
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        <svg 
          className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={active ? 2.5 : 2} 
            d={iconPaths[icon as keyof typeof iconPaths]} 
          />
        </svg>
        <span className={`text-xs font-medium ${active ? 'text-primary-600' : 'text-neutral-500'}`}>
          {label}
        </span>
      </motion.div>
    </Link>
  );
}