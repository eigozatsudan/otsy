import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Otsy - あなたの買い物をお手伝い',
  description: '音声で簡単に買い物を依頼できるサービス。プロのショッパーがあなたの代わりに買い物をお届けします。',
  keywords: ['買い物代行', '音声注文', 'おつかい', 'デリバリー', '日本'],
  authors: [{ name: 'Otsy' }],
  creator: 'Otsy',
  publisher: 'Otsy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Otsy - あなたの買い物をお手伝い',
    description: '音声で簡単に買い物を依頼できるサービス。プロのショッパーがあなたの代わりに買い物をお届けします。',
    url: '/',
    siteName: 'Otsy',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Otsy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Otsy - あなたの買い物をお手伝い',
    description: '音声で簡単に買い物を依頼できるサービス。プロのショッパーがあなたの代わりに買い物をお届けします。',
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