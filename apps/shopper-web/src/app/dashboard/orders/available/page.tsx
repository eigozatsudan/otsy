'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  MapPinIcon,
  ClockIcon,
  ShoppingBagIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDistance, formatRelativeTime, calculateEarnings } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AvailableOrdersPage() {
  const { 
    availableOrders, 
    isLoading, 
    isAccepting,
    pagination, 
    filters, 
    fetchAvailableOrders, 
    acceptOrder,
    setFilters 
  } = useOrdersStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableOrders({ page: 1, limit: 20 });
  }, [fetchAvailableOrders, filters]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setSelectedOrder(orderId);
      await acceptOrder(orderId);
      // Order will be removed from available orders automatically
    } catch (error) {
      console.error('Failed to accept order:', error);
    } finally {
      setSelectedOrder(null);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value });
  };

  const refreshOrders = () => {
    fetchAvailableOrders({ page: 1, limit: 20 });
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchAvailableOrders({ 
        page: pagination.page + 1, 
        limit: pagination.limit 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">利用可能な注文</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total}件の注文が利用可能です
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={refreshOrders}
            disabled={isLoading}
            className="btn-outline flex items-center"
          >
            <ArrowPathIcon className={cn('h-5 w-5 mr-2', isLoading && 'animate-spin')} />
            更新
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            フィルター
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">フィルター</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最低収入
              </label>
              <select
                value={filters.minEarnings || ''}
                onChange={(e) => handleFilterChange('minEarnings', e.target.value ? parseInt(e.target.value) : undefined)}
                className="input"
              >
                <option value="">指定なし</option>
                <option value="300">¥300以上</option>
                <option value="500">¥500以上</option>
                <option value="800">¥800以上</option>
                <option value="1000">¥1,000以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                エリア
              </label>
              <select
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="input"
              >
                <option value="">すべてのエリア</option>
                <option value="shibuya">渋谷区</option>
                <option value="shinjuku">新宿区</option>
                <option value="minato">港区</option>
                <option value="chiyoda">千代田区</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="btn-outline w-full"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      {isLoading && availableOrders.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : availableOrders.length > 0 ? (
        <div className="space-y-4">
          {availableOrders.map((order) => (
            <div key={order.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      注文 #{order.id.slice(-8)}
                    </h3>
                    <div className="text-right">
                      <div className="text-xl font-bold text-success-600">
                        {formatCurrency(order.estimatedEarnings || calculateEarnings(order.estimateAmount, order.distance || 1000))}
                      </div>
                      <div className="text-sm text-gray-500">推定収入</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <ShoppingBagIcon className="h-4 w-4 mr-2" />
                      <span>{order.items.length}点の商品</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {order.distance ? formatDistance(order.distance) : '距離不明'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>{formatRelativeTime(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>配送先:</strong> {order.deliveryAddress.split('\n')[0]}
                    </p>
                    {order.deliveryTimeSlot && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>希望時間:</strong> 
                        {order.deliveryTimeSlot === 'morning' ? ' 午前中 (9:00-12:00)' :
                         order.deliveryTimeSlot === 'afternoon' ? ' 午後 (13:00-17:00)' :
                         order.deliveryTimeSlot === 'evening' ? ' 夕方 (17:00-20:00)' :
                         ` ${order.deliveryTimeSlot}`}
                      </p>
                    )}
                    {order.specialInstructions && (
                      <p className="text-sm text-gray-700">
                        <strong>特別な指示:</strong> {order.specialInstructions}
                      </p>
                    )}
                  </div>

                  {/* Items preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">商品一覧</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.items.slice(0, 4).map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {item.name} × {item.qty}
                        </span>
                      ))}
                      {order.items.length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          +{order.items.length - 4}件
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-primary-700">
                        {order.user.firstName[0]}
                      </span>
                    </div>
                    <span>
                      お客様: {order.user.lastName} {order.user.firstName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/dashboard/orders/available/${order.id}`}
                  className="btn-outline flex items-center flex-1"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  詳細を見る
                </Link>
                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={isAccepting && selectedOrder === order.id}
                  className="btn-primary flex items-center flex-1"
                >
                  {isAccepting && selectedOrder === order.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      受付中...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      この注文を受ける
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Load more button */}
          {pagination.page < pagination.totalPages && (
            <div className="text-center py-6">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="btn-outline flex items-center mx-auto"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    読み込み中...
                  </>
                ) : (
                  'さらに読み込む'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.minEarnings || filters.location 
              ? '条件に一致する注文がありません' 
              : '利用可能な注文がありません'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.minEarnings || filters.location
              ? 'フィルター条件を変更してお試しください'
              : '新しい注文が入るまでお待ちください'
            }
          </p>
          {(filters.minEarnings || filters.location) && (
            <div className="mt-6">
              <button
                onClick={() => setFilters({})}
                className="btn-primary"
              >
                フィルターをリセット
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="card bg-gradient-to-r from-success-50 to-success-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ShoppingBagIcon className="h-6 w-6 text-success-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-success-900">
              💡 注文選択のコツ
            </h3>
            <p className="mt-1 text-sm text-success-700">
              距離が近く、商品数が少ない注文は効率よく稼げます。
              また、配送時間に余裕がある注文を選ぶと、焦らずに丁寧な対応ができます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}