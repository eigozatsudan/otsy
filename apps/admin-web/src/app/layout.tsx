import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamicImport from 'next/dynamic';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Providersを動的インポートでラップ
const Providers = dynamicImport(() => import('@/components/providers').then(mod => ({ default: mod.Providers })), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>
});

export const metadata: Metadata = {
  title: 'Otsukai DX 管理画面',
  description: 'Otsukai DX買い物代行サービスの管理画面',
};

// プリレンダリングを無効にする
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}