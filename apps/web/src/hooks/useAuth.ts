'use client';

import { useEffect } from 'react';
import { useAuthStore, startTokenRefresh, stopTokenRefresh } from '@/store/auth';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Kick off a token validity check on mount
    checkAuth().catch(() => {
      // no-op: store handles error states
    });

    startTokenRefresh();
    return () => {
      stopTokenRefresh();
    };
  }, [checkAuth]);

  return { user, isLoading, isAuthenticated };
}


