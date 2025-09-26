'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { useAuthStore, startTokenRefresh, stopTokenRefresh } from '@/store/auth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication on app start only once
    checkAuth();
  }, [checkAuth]); // Remove isAuthenticated from dependencies

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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}