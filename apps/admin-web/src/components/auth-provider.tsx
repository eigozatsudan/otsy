'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, startTokenRefresh, stopTokenRefresh } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // クライアントサイドでのみストアを使用
  const { checkAuth, isAuthenticated } = isMounted ? useAuthStore() : { checkAuth: async () => {}, isAuthenticated: false };

  useEffect(() => {
    if (!isMounted) return;
    
    // Check authentication on app start only once
    checkAuth();
  }, [checkAuth, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    
    // Start/stop token refresh based on auth status
    if (isAuthenticated) {
      startTokenRefresh();
    } else {
      stopTokenRefresh();
    }

    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, [isAuthenticated, isMounted]);

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;
  }

  return <>{children}</>;
}
