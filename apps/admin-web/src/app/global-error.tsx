'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-gray-300">500</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">システムエラー</h2>
              <p className="text-gray-600 mb-8">
                システム全体でエラーが発生しました。しばらく待ってから再度お試しください。
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
