import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">ページが見つかりません</h2>
          <p className="text-gray-600 mb-8">
            お探しのページは存在しないか、移動された可能性があります。
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ダッシュボードに戻る
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/login" className="hover:text-blue-600">
              ログインページ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
