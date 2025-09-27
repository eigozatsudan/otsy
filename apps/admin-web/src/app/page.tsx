'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { admin, isLoading } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (!isLoading) {
      if (admin) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [admin, isLoading, router, isMounted]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}