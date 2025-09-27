'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Toasterを動的インポートでラップ
const Toaster = dynamic(() => import('react-hot-toast').then(mod => ({ default: mod.Toaster })), {
  ssr: false,
  loading: () => null
});

// AuthProviderを動的インポートでラップ
const AuthProvider = dynamic(() => import('./auth-provider'), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
