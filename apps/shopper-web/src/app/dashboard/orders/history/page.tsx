'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusText } from '@/lib/utils';
import { cn } from '@/lib/utils';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function OrderHistoryPage() {
  const { myOrders, isLoading, fetchMyOrders } = useOrdersStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchMyOrders({ limit: 50 });
  }, [fetchMyOrders]);

  const filteredOrders = selectedStatus === 'all' 
    ? myOrders 
    : myOrders.filter(order => order.status.toLowerCase() === selectedStatus.toLowerCase());

  const statusOptions = [
    { value: 'all', label: 'すべて', count: myOrders.length },
    { value: 'completed', label: '完了', count: myOrders.filter(o => o.status.toLowerCase() === 'completed').length },
    { value: 'delivered', label: '配送完了', count: myOrders.filter(o => o.status.toLowerCase() === 'delivered').length },
    { value: 'cancelled', label: 'キャンセル', count: myOrders.filter(o => o.status.toLowerCase() === 'cancelled').length },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2" />
              注文履歴
            </h1>
            <p className="text-gray-600">
              過去の注文一覧とステータス
            </p>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedStatus === option.value
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              注文履歴がありません
            </h3>
            <p className="text-gray-600 mb-6">
              まだ注文を受け付けていません
            </p>
            <Link
              href="/dashboard/orders/available"
              className="btn-primary"
            >
              利用可能な注文を見る
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      注文 #{order.id.slice(-8)}
                    </h3>
                    <span className={cn('badge', getOrderStatusColor(order.status))}>
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formatDateTime(order.createdAt)}
                    </div>
                    
                    <div>
                      <span className="font-medium">商品数:</span> {order.items?.length || 0}点
                    </div>
                    
                    <div>
                      <span className="font-medium">合計金額:</span> {formatCurrency(order.actualAmount || order.estimateAmount)}
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">商品:</p>
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {item.name}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{order.items.length - 3}点
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-success-600">
                      {formatCurrency(order.estimatedEarnings || 0)}
                    </p>
                    <p className="text-sm text-gray-500">収入</p>
                  </div>
                  
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="btn-outline text-sm"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
