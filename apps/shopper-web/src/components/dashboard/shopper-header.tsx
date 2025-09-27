'use client';

import { useState } from 'react';
import { 
  BellIcon,
  Bars3Icon,
  ChevronDownIcon,
  CurrencyYenIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { statusApi } from '@/lib/api';
import { getStatusColor, getStatusText, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ShopperHeader() {
  const { shopper, updateStatus, logout } = useAuthStore();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleStatusChange = async (newStatus: 'available' | 'busy' | 'offline') => {
    try {
      await statusApi.updateStatus(newStatus);
      updateStatus(newStatus);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const statusOptions = [
    { value: 'available', label: '対応可能', color: 'text-success-600' },
    { value: 'busy', label: '対応中', color: 'text-warning-600' },
    { value: 'offline', label: 'オフライン', color: 'text-gray-400' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center ml-4 lg:ml-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Otsy</h1>
              </div>
              <span className="ml-2 text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                ショッパー
              </span>
            </div>
          </div>

          {/* Center - Status and earnings */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Status selector */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className={cn('w-3 h-3 rounded-full', 
                  shopper?.status === 'available' ? 'bg-success-500' :
                  shopper?.status === 'busy' ? 'bg-warning-500' : 'bg-gray-400'
                )} />
                <span className="text-sm font-medium text-gray-700">
                  {getStatusText(shopper?.status || 'offline')}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value as any)}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100',
                          shopper?.status === option.value ? 'bg-gray-50' : ''
                        )}
                      >
                        <div className={cn('w-3 h-3 rounded-full mr-3',
                          option.value === 'available' ? 'bg-success-500' :
                          option.value === 'busy' ? 'bg-warning-500' : 'bg-gray-400'
                        )} />
                        <span className={option.color}>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Today's earnings */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-success-50 rounded-lg">
              <CurrencyYenIcon className="h-5 w-5 text-success-600" />
              <div>
                <div className="text-sm font-medium text-success-900">今日の収入</div>
                <div className="text-lg font-bold text-success-600">¥2,400</div>
              </div>
            </div>

            {/* Location indicator */}
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4" />
              <span>渋谷区</span>
            </div>
          </div>

          {/* Right side - Notifications and profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">通知</h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-primary-600 rounded-full mt-2"></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-gray-900">
                            新しい注文が利用可能です
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            渋谷区 • 推定収入 ¥800 • 5分前
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-success-600 rounded-full mt-2"></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-gray-900">
                            配送完了報酬が追加されました
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ¥650 • 15分前
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-200">
                    <button className="text-sm text-primary-600 hover:text-primary-500">
                      すべての通知を表示
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {shopper?.firstName?.[0]}{shopper?.lastName?.[0]}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {shopper?.lastName} {shopper?.firstName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    ★ {shopper?.rating?.toFixed(1) || '5.0'}
                  </div>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <a
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      プロフィール
                    </a>
                    <a
                      href="/dashboard/earnings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      収入管理
                    </a>
                    <a
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      設定
                    </a>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}