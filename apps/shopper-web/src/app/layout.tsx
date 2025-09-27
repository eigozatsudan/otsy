import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Otsy ショッパー - プロのお買い物代行',
  description: 'Otsyのショッパー向けアプリ。お買い物代行で収入を得ましょう。',
  keywords: ['買い物代行', 'ショッパー', '副業', '収入', '日本'],
  authors: [{ name: 'Otsy' }],
  creator: 'Otsy',
  publisher: 'Otsy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  openGraph: {
    title: 'Otsy ショッパー - プロのお買い物代行',
    description: 'Otsyのショッパー向けアプリ。お買い物代行で収入を得ましょう。',
    url: '/',
    siteName: 'Otsy ショッパー',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image-shopper.png',
        width: 1200,
        height: 630,
        alt: 'Otsy ショッパー',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Otsy ショッパー - プロのお買い物代行',
    description: 'Otsyのショッパー向けアプリ。お買い物代行で収入を得ましょう。',
    images: ['/og-image-shopper.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#0ea5e9',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}