'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamically import the auth store to avoid SSR issues
  const AuthProvider = dynamic(() => import('./auth-provider'), {
    ssr: false,
    loading: () => <>{children}</>
  });

  if (!isClient) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}
