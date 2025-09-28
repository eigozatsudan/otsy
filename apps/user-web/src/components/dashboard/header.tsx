'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const pageNames: Record<string, string> = {
  '/dashboard': 'ダッシュボード',
  '/dashboard/order': '商品を注文',
  '/dashboard/voice-order': '音声注文',
  '/dashboard/orders': '注文履歴',
  '/dashboard/chat': 'チャット',
  '/dashboard/payments': '決済・請求',
  '/dashboard/profile': 'プロフィール',
  '/dashboard/settings': '設定',
  '/dashboard/help': 'ヘルプ',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const currentPageName = pageNames[pathname] || 'ページ';

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold leading-6 text-gray-900">
          {currentPageName}
        </h1>
      </div>

      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 max-w-md" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            検索
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="注文を検索..."
            type="search"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="sr-only">通知を表示</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-error-500 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">通知</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {/* Sample notifications */}
                <div className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-900">
                        注文 #12345 が配送中です
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        5分前
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-success-600 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-900">
                        注文 #12344 が配送完了しました
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        1時間前
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-warning-600 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-900">
                        レシートの確認が必要です
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        2時間前
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-2 border-t border-gray-200">
                <button className="text-sm text-primary-600 hover:text-primary-500">
                  すべての通知を表示
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-x-1 text-sm leading-6 text-gray-900"
            id="user-menu-button"
            aria-expanded="false"
            aria-haspopup="true"
          >
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-2 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                {user?.lastName} {user?.firstName}
              </span>
              <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}