'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamically import the auth store to avoid SSR issues
  const AuthProvider = dynamic(() => import('./auth-provider'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>
  });

  if (!isClient) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </AuthProvider>
  );
}
