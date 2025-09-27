import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative">
        <div className="flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <Link href="/" className="flex items-center">
              <ShoppingBagIcon className="h-10 w-10 text-white" />
              <span className="ml-3 text-2xl font-bold">Otsy</span>
              <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
                ショッパー
              </span>
            </Link>
          </div>

          <h1 className="text-4xl font-bold mb-6">
            あなたの時間を
            <br />
            収入に変える
          </h1>

          <p className="text-xl text-primary-100 mb-8">
            Otsyのショッパーとして、お買い物代行で安定した収入を得ませんか？
            好きな時間に、好きな場所で働ける新しい働き方を始めましょう。
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span className="text-primary-100">好きな時間に働ける</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span className="text-primary-100">1件300円〜の安定報酬</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span className="text-primary-100">スマホひとつで完結</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span className="text-primary-100">24時間サポート体制</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Otsy</span>
              <span className="ml-2 text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                ショッパー
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}