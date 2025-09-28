'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, startTokenRefresh, stopTokenRefresh } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // 常にHooksを呼び出す（条件分岐しない）
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Handle authentication redirects
  useEffect(() => {
    if (!isMounted || isLoading) return;

    const publicPaths = ['/login', '/'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      // Redirect to login if not authenticated and not on a public path
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      // Redirect to dashboard if authenticated and on login page
      router.push('/dashboard');
    }
  }, [isMounted, isAuthenticated, isLoading, pathname, router]);

  if (!isMounted || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;
  }

  return <>{children}</>;
}
