'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  MicrophoneIcon,
  ShoppingBagIcon,
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { useOrdersStore } from '@/store/orders';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { orders, isLoading, fetchOrders } = useOrdersStore();

  useEffect(() => {
    fetchOrders({ limit: 5 });
  }, [fetchOrders]);

  const recentOrders = orders.slice(0, 3);
  const activeOrders = orders.filter(order => 
    ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
  );

  const stats = [
    {
      name: '今月の注文',
      value: '12',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: ShoppingBagIcon,
    },
    {
      name: '進行中の注文',
      value: activeOrders.length.toString(),
      change: '',
      changeType: 'neutral' as const,
      icon: ClockIcon,
    },
    {
      name: '今月の支出',
      value: '¥24,500',
      change: '-4.3%',
      changeType: 'negative' as const,
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              おかえりなさい、{user?.firstName}さん
            </h1>
            <p className="text-primary-100 mt-1">
              今日も便利なOtsyサービスをご利用ください
            </p>
          </div>
          <div className="hidden sm:block">
            <Link
              href="/dashboard/voice-order"
              className="bg-white text-primary-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center"
            >
              <MicrophoneIcon className="h-5 w-5 mr-2" />
              音声で注文
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/voice-order"
          className="card hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="bg-primary-100 rounded-lg p-3 group-hover:bg-primary-200 transition-colors">
              <MicrophoneIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">音声注文</h3>
              <p className="text-xs text-gray-500">話すだけで簡単注文</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="card hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="bg-success-100 rounded-lg p-3 group-hover:bg-success-200 transition-colors">
              <ShoppingBagIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">注文履歴</h3>
              <p className="text-xs text-gray-500">過去の注文を確認</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/chat"
          className="card hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="bg-warning-100 rounded-lg p-3 group-hover:bg-warning-200 transition-colors">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">進行中</h3>
              <p className="text-xs text-gray-500">{activeOrders.length}件の注文</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/payments"
          className="card hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="bg-secondary-100 rounded-lg p-3 group-hover:bg-secondary-200 transition-colors">
              <CreditCardIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">決済・請求</h3>
              <p className="text-xs text-gray-500">支払い履歴を確認</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  {stat.change && (
                    <p className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-success-600' : 
                      stat.changeType === 'negative' ? 'text-error-600' : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">最近の注文</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
            >
              すべて表示
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBagIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        注文 #{order.id.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.estimateAmount)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-success-100 text-success-800' :
                      order.status === 'enroute' ? 'bg-warning-100 text-warning-800' :
                      order.status === 'shopping' ? 'bg-primary-100 text-primary-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'delivered' ? '配送完了' :
                       order.status === 'enroute' ? '配送中' :
                       order.status === 'shopping' ? '買い物中' :
                       order.status === 'accepted' ? '受付済み' :
                       order.status === 'new' ? '新規' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">注文履歴がありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                最初の注文を作成してみましょう
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/voice-order"
                  className="btn-primary inline-flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  音声で注文
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Active orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">進行中の注文</h2>
            <Link
              href="/dashboard/orders?status=active"
              className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
            >
              詳細を表示
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {activeOrders.length > 0 ? (
            <div className="space-y-4">
              {activeOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      注文 #{order.id.slice(-8)}
                    </h3>
                    <span className="badge-primary">
                      {order.status === 'enroute' ? '配送中' :
                       order.status === 'shopping' ? '買い物中' :
                       order.status === 'accepted' ? '受付済み' : order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {order.items.length}点の商品 • {formatCurrency(order.estimateAmount)}
                  </p>
                  {order.shopper && (
                    <p className="text-xs text-gray-600">
                      ショッパー: {order.shopper.lastName} {order.shopper.firstName}
                    </p>
                  )}
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-xs text-primary-600 hover:text-primary-500"
                    >
                      詳細を表示 →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">進行中の注文がありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新しい注文を作成してみましょう
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips section */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <MicrophoneIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-primary-900">
              💡 音声注文のコツ
            </h3>
            <p className="mt-1 text-sm text-primary-700">
              「牛乳1本、卵1パック、食パン1斤を買ってきて」のように、具体的に話すとより正確に認識されます。
            </p>
            <div className="mt-3">
              <Link
                href="/dashboard/voice-order"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                音声注文を試す →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}