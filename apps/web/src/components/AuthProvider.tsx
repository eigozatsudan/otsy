'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser, initializeAuth } from '@/hooks/useAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
    setIsInitialized(true);
  }, []);

  const { data: user, isLoading, error } = useCurrentUser();
  
  const isAuthenticated = !!user && !error;
  
  // Redirect to login if not authenticated (except for login page)
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isInitialized, isLoading, isAuthenticated, pathname, router]);

  // Redirect to home if authenticated and on login page
  useEffect(() => {
    if (isAuthenticated && pathname === '/login') {
      router.push('/');
    }
  }, [isAuthenticated, pathname, router]);

  // Show loading screen while checking auth
  if (!isInitialized || (isLoading && pathname !== '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">認証状態を確認しています...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}