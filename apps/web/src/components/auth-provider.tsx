'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, startTokenRefresh, stopTokenRefresh } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated, isLoading, isCheckingAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check authentication on app start only once
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    // Only initialize once
    if (!isInitialized) {
      initializeAuth();
    }
  }, []); // Empty dependency array to run only once

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

  // Show loading while initializing auth
  if (!isInitialized || isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
