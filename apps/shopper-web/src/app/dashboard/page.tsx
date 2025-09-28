'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBagIcon,
  CurrencyYenIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { useOrdersStore } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatRelativeTime, getStatusText, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function ShopperDashboardPage() {
  const router = useRouter();
  const { shopper, isAuthenticated, isLoading } = useAuthStore();
  const { availableOrders, myOrders, isLoading: ordersLoading, fetchAvailableOrders, fetchMyOrders } = useOrdersStore();
  const [todayStats, setTodayStats] = useState({
    completedOrders: 3,
    workingHours: 4.5,
    earnings: 2400,
    rating: 4.8,
  });

  // Redirect to login if not authenticated (but not while loading)
  useEffect(() => {
    console.log('Dashboard useEffect - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (!isLoading && !isAuthenticated) {
      console.log('Redirecting to login - not authenticated');
      // Add a small delay to prevent immediate redirect
      setTimeout(() => {
        console.log('Executing redirect to login');
        router.replace('/auth/login');
      }, 200);
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Only fetch orders if authenticated
    if (isAuthenticated) {
      console.log('Shopper profile:', shopper);
      console.log('KYC Status:', shopper?.kycStatus);
      console.log('Is Verified:', shopper?.isVerified);
      
      // Add error handling for order fetching
      fetchAvailableOrders({ limit: 5 }).catch(error => {
        console.error('Failed to fetch available orders:', error);
      });
      fetchMyOrders({ limit: 5 }).catch(error => {
        console.error('Failed to fetch my orders:', error);
      });
    }
  }, [isAuthenticated, shopper, fetchAvailableOrders, fetchMyOrders]);

  const activeOrders = myOrders.filter(order => 
    ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
  );

  const quickActions = [
    {
      name: '利用可能な注文',
      description: `${availableOrders.length}件の新しい注文`,
      href: '/dashboard/orders/available',
      icon: ShoppingBagIcon,
      color: 'bg-primary-500',
      count: availableOrders.length,
    },
    {
      name: 'レシート撮影',
      description: '買い物完了後の撮影',
      href: '/dashboard/receipt-capture',
      icon: CameraIcon,
      color: 'bg-success-500',
    },
    {
      name: 'チャット',
      description: 'お客様とのやり取り',
      href: '/dashboard/chat',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-warning-500',
      count: 2, // Unread messages
    },
    {
      name: '収入管理',
      description: '今月の収入を確認',
      href: '/dashboard/earnings',
      icon: CurrencyYenIcon,
      color: 'bg-secondary-500',
    },
  ];

  const statusCards = [
    {
      name: '今日の収入',
      value: formatCurrency(todayStats.earnings),
      change: '+¥650',
      changeType: 'positive' as const,
      icon: CurrencyYenIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      name: '完了した注文',
      value: `${todayStats.completedOrders}件`,
      change: '+1件',
      changeType: 'positive' as const,
      icon: CheckCircleIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: '稼働時間',
      value: `${todayStats.workingHours}時間`,
      change: '+1.5時間',
      changeType: 'positive' as const,
      icon: ClockIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      name: '評価',
      value: `★ ${todayStats.rating}`,
      change: '+0.1',
      changeType: 'positive' as const,
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Show KYC pending message if not verified
  if (shopper && !shopper.isVerified) {
    return (
      <div className="space-y-8">
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                KYC認証が必要です
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                <p>
                  注文を受けるためには、本人確認（KYC）の認証が必要です。
                  現在のステータス: <span className="font-medium">{shopper.kycStatus}</span>
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/dashboard/kyc"
                  className="btn-warning text-sm"
                >
                  KYC認証を完了する
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              おはようございます、{shopper?.firstName}さん
            </h1>
            <div className="text-primary-100 mt-1 flex items-center">
              <div className={cn('w-2 h-2 rounded-full mr-2',
                shopper?.status === 'available' ? 'bg-success-400' :
                shopper?.status === 'busy' ? 'bg-warning-400' : 'bg-gray-400'
              )} />
              現在のステータス: {getStatusText(shopper?.status || 'offline')}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(todayStats.earnings)}</div>
              <div className="text-primary-200 text-sm">今日の収入</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => (
          <div key={card.name} className="card">
            <div className="flex items-center">
              <div className={cn('flex-shrink-0 p-3 rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-6 w-6', card.color)} />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">{card.name}</p>
                <div className="flex items-baseline">
                  <p className="text-xl font-semibold text-gray-900">{card.value}</p>
                  {card.change && (
                    <p className={cn('ml-2 text-sm font-medium',
                      card.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                    )}>
                      {card.change}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="card hover:shadow-md transition-all duration-200 cursor-pointer group relative"
            >
              {action.count && (
                <div className="absolute -top-2 -right-2 bg-error-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                  {action.count}
                </div>
              )}
              <div className="flex items-center">
                <div className={cn('flex-shrink-0 p-3 rounded-lg text-white', action.color)}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                    {action.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">進行中の注文</h2>
            <Link
              href="/dashboard/orders/active"
              className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
            >
              すべて表示
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="space-y-4">
              {activeOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      注文 #{order.id.slice(-8)}
                    </h3>
                    <span className={cn('badge', 
                      order.status === 'shopping' ? 'badge-warning' :
                      order.status === 'enroute' ? 'badge-primary' : 'badge-gray'
                    )}>
                      {order.status === 'shopping' ? '買い物中' :
                       order.status === 'enroute' ? '配送中' :
                       order.status === 'accepted' ? '受付済み' : order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {order.items.length}点の商品 • 推定収入: {formatCurrency(order.estimatedEarnings || 0)}
                  </p>
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{order.deliveryAddress?.split('\n')[0] || '住所不明'}</span>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="btn-primary text-xs flex-1"
                    >
                      詳細を見る
                    </Link>
                    {order.status === 'shopping' && (
                      <Link
                        href={`/dashboard/receipt-capture?order=${order.id}`}
                        className="btn-success text-xs flex-1"
                      >
                        レシート撮影
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">進行中の注文がありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新しい注文を受けて収入を得ましょう
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/orders/available"
                  className="btn-primary inline-flex items-center"
                >
                  <ShoppingBagIcon className="h-5 w-5 mr-2" />
                  利用可能な注文を見る
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Available orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">利用可能な注文</h2>
            <Link
              href="/dashboard/orders/available"
              className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
            >
              すべて表示
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      注文 #{order.id.slice(-8)}
                    </h3>
                    <div className="text-right">
                      <div className="text-sm font-bold text-success-600">
                        {formatCurrency(order.estimatedEarnings || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        推定収入
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {order.items.length}点の商品 • {order.distance ? `${(order.distance / 1000).toFixed(1)}km` : '距離不明'}
                  </p>
                  <div className="flex items-center text-xs text-gray-600 mb-3">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{order.deliveryAddress?.split('\n')[0] || '住所不明'}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/orders/available/${order.id}`}
                      className="btn-outline text-xs flex-1"
                    >
                      詳細
                    </Link>
                    <button className="btn-primary text-xs flex-1">
                      受ける
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">利用可能な注文がありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新しい注文が入るまでお待ちください
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips section */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <StarIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-primary-900">
              💡 収入アップのコツ
            </h3>
            <p className="mt-1 text-sm text-primary-700">
              ピークタイム（11:00-13:00、18:00-20:00）に稼働すると、より多くの注文を受けることができます。
              また、お客様とのコミュニケーションを大切にすることで高評価を獲得できます。
            </p>
            <div className="mt-3">
              <Link
                href="/dashboard/help/tips"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                収入アップのコツを見る →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}