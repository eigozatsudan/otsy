'use client';

import { useEffect } from 'react';
import { useAuthStore, startTokenRefresh, stopTokenRefresh } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication on app start only once
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
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
  }, [isAuthenticated]);

  return <>{children}</>;
}
