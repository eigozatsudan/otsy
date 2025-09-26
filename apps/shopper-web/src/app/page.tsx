'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ShopperLandingPage } from '@/components/landing/shopper-landing-page';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, shopper } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && shopper) {
      // Redirect authenticated shoppers to dashboard
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, shopper, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <ShopperLandingPage />;
}