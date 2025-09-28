'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ShoppingBagIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore, getOrderStatusColor, getOrderStatusText } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: '', label: 'すべて' },
  { value: 'new', label: '新規' },
  { value: 'accepted', label: '受付済み' },
  { value: 'shopping', label: '買い物中' },
  { value: 'enroute', label: '配送中' },
  { value: 'delivered', label: '配送完了' },
  { value: 'cancelled', label: 'キャンセル' },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const { 
    orders, 
    isLoading, 
    pagination, 
    filters, 
    fetchOrders, 
    setFilters 
  } = useOrdersStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      // For 'active' status, we'll filter on the frontend instead of sending multiple statuses
      setFilters({ status: status === 'active' ? '' : status });
    }
  }, [searchParams, setFilters]);

  // Fetch orders when filters change
  useEffect(() => {
    console.log('Fetching orders with filters:', filters);
    fetchOrders({ page: 1, limit: 10, ...filters });
  }, [filters, fetchOrders]);

  // Debug log for orders
  useEffect(() => {
    console.log('Orders updated:', { orders, isLoading, pagination });
  }, [orders, isLoading, pagination]);

  const handleStatusFilter = (status: string) => {
    setFilters({ status });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  const loadMore = () => {
    if (pagination?.page && pagination?.totalPages && pagination.page < pagination.totalPages) {
      fetchOrders({ 
        page: pagination.page + 1, 
        limit: pagination.limit,
        ...filters 
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'enroute':
      case 'shopping':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      default:
        return <ShoppingBagIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">注文履歴</h1>
          <p className="text-gray-600 mt-1">
            {pagination?.total || 0}件の注文履歴
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/voice-order"
            className="btn-primary inline-flex items-center"
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            新しい注文
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="注文IDや商品名で検索..."
                className="input pl-10"
              />
            </div>
          </form>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            フィルター
          </button>
        </div>

        {/* Filter options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                    filters.status === option.value
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orders list */}
      {isLoading && (!orders || orders.length === 0) ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(order.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        注文 #{order.id.slice(-8)}
                      </h3>
                      <span className={`badge ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">注文日時:</span>
                        <br />
                        {formatDate(order.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">商品数:</span>
                        <br />
                        {order.items.length}点
                      </div>
                      <div>
                        <span className="font-medium">金額:</span>
                        <br />
                        {order.actualAmount ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(order.actualAmount)}
                            </div>
                            {order.actualAmount !== order.estimateAmount && (
                              <div className="text-sm text-gray-500 line-through">
                                見積: {formatCurrency(order.estimateAmount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            見積: {formatCurrency(order.estimateAmount)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">配送先:</span>
                        <br />
                        <span className="truncate block">
                          {order.deliveryAddress?.split('\n')[0] || '住所未設定'}
                        </span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {item.name} × {item.qty}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            +{order.items.length - 3}件
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shopper info */}
                    {order.shopper && (
                      <div className="mt-3 flex items-center text-sm text-gray-600">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-primary-700">
                            {order.shopper.firstName?.[0] || '?'}
                          </span>
                        </div>
                        <span>
                          ショッパー: {order.shopper.lastName || ''} {order.shopper.firstName || ''}
                        </span>
                        {order.shopper.rating && (
                          <span className="ml-2 text-yellow-500">
                            ★ {order.shopper.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="btn-outline text-sm flex items-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    詳細
                  </Link>
                  
                  {['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase()) && (
                    <Link
                      href={`/dashboard/chat?order=${order.id}`}
                      className="btn-primary text-sm flex items-center"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      チャット
                    </Link>
                  )}
                </div>
              </div>

              {/* Progress indicator for active orders */}
              {['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase()) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        'flex items-center',
                        ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
                          ? 'text-success-600' : 'text-gray-400'
                      )}>
                        <div className={cn(
                          'w-2 h-2 rounded-full mr-2',
                          ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
                            ? 'bg-success-600' : 'bg-gray-300'
                        )} />
                        受付済み
                      </div>
                      
                      <div className={cn(
                        'flex items-center',
                        ['shopping', 'enroute'].includes(order.status.toLowerCase())
                          ? 'text-success-600' : 'text-gray-400'
                      )}>
                        <div className={cn(
                          'w-2 h-2 rounded-full mr-2',
                          ['shopping', 'enroute'].includes(order.status.toLowerCase())
                            ? 'bg-success-600' : 'bg-gray-300'
                        )} />
                        買い物中
                      </div>
                      
                      <div className={cn(
                        'flex items-center',
                        order.status.toLowerCase() === 'enroute'
                          ? 'text-success-600' : 'text-gray-400'
                      )}>
                        <div className={cn(
                          'w-2 h-2 rounded-full mr-2',
                          order.status.toLowerCase() === 'enroute'
                            ? 'bg-success-600' : 'bg-gray-300'
                        )} />
                        配送中
                      </div>
                    </div>
                    
                    <span className="text-gray-500">
                      更新: {formatRelativeTime(order.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load more button */}
          {pagination?.page && pagination?.totalPages && pagination.page < pagination.totalPages && (
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">注文履歴がありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            最初の注文を作成してみましょう
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/voice-order"
              className="btn-primary inline-flex items-center"
            >
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              音声で注文
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}