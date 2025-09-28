'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import dynamic from 'next/dynamic';

// Toasterを動的インポートでラップ
const Toaster = dynamic(() => import('react-hot-toast').then(mod => ({ default: mod.Toaster })), {
  ssr: false,
  loading: () => null
});
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
  const { checkAuth, isAuthenticated, token, shopper } = useAuthStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Check authentication on app start only once
    console.log('Providers: Checking auth on mount, token exists:', !!token, 'shopper exists:', !!shopper, 'hasCheckedAuth:', hasCheckedAuth);
    if (!hasCheckedAuth) {
      setHasCheckedAuth(true);
      checkAuth();
    }
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    // Start/stop token refresh based on authentication status
    if (isAuthenticated) {
      console.log('Providers: Starting token refresh');
      startTokenRefresh();
    } else {
      console.log('Providers: Stopping token refresh');
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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}