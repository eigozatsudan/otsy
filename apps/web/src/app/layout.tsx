import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'おつかいDX - 共同買い物管理アプリ',
  description: 'プライバシー重視の共同買い物管理アプリ。家族や友人と一緒に買い物リストを管理し、割り勘計算も簡単に。',
  keywords: ['買い物リスト', '共同買い物', '割り勘', 'グループ買い物', '家族', '友人', 'プライバシー', '日本'],
  authors: [{ name: 'おつかいDX' }],
  creator: 'おつかいDX',
  publisher: 'おつかいDX',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'おつかいDX - 共同買い物管理アプリ',
    description: 'プライバシー重視の共同買い物管理アプリ。家族や友人と一緒に買い物リストを管理し、割り勘計算も簡単に。',
    url: '/',
    siteName: 'おつかいDX',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'おつかいDX',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'おつかいDX - 共同買い物管理アプリ',
    description: 'プライバシー重視の共同買い物管理アプリ。家族や友人と一緒に買い物リストを管理し、割り勘計算も簡単に。',
    images: ['/og-image.png'],
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
        </Providers>
      </body>
    </html>
  );
}