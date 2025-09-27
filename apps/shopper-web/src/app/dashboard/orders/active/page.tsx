'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon,
  MapPinIcon,
  ClockIcon,
  CameraIcon,
  TruckIcon,
  CheckCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore, canSubmitReceipt, canCompleteDelivery, getOrderStatusColor, getOrderStatusText } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function ActiveOrdersPage() {
  const { 
    myOrders, 
    isLoading, 
    fetchMyOrders
  } = useOrdersStore();

  useEffect(() => {
    fetchMyOrders({ status: 'accepted,shopping,enroute' });
  }, [fetchMyOrders]);

  const activeOrders = myOrders.filter(order => 
    ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
  );

  const getNextAction = (order: any) => {
    if (order.status.toLowerCase() === 'accepted') {
      return { text: '買い物を開始', href: `/dashboard/orders/${order.id}`, color: 'btn-primary' };
    }
    if (canSubmitReceipt(order)) {
      return { text: 'レシート撮影', href: `/dashboard/receipt-capture?order=${order.id}`, color: 'btn-success' };
    }
    if (order.status.toLowerCase() === 'shopping' && order.receiptStatus === 'approved') {
      return { text: '配送開始', href: `/dashboard/orders/${order.id}`, color: 'btn-primary' };
    }
    if (canCompleteDelivery(order)) {
      return { text: '配送完了', href: `/dashboard/orders/${order.id}`, color: 'btn-success' };
    }
    return { text: '詳細を見る', href: `/dashboard/orders/${order.id}`, color: 'btn-outline' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">進行中の注文</h1>
          <p className="text-gray-600 mt-1">
            {activeOrders.length}件の注文が進行中です
          </p>
        </div>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeOrders.length > 0 ? (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const nextAction = getNextAction(order);
            
            return (
              <div key={order.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        注文 #{order.id.slice(-8)}
                      </h3>
                      <span className={cn('badge', getOrderStatusColor(order.status))}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                        <span>{order.items.length}点の商品</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">
                          {order.deliveryAddress.split('\n')[0]}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>{formatRelativeTime(order.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        推定収入: <span className="font-medium text-success-600">
                          {formatCurrency(order.estimatedEarnings || 0)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-primary-700">
                            {order.user.firstName[0]}
                          </span>
                        </div>
                        <span>{order.user.lastName} {order.user.firstName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className={cn('flex items-center',
                        ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
                          ? 'text-success-600' : 'text-gray-400'
                      )}>
                        <div className={cn('w-2 h-2 rounded-full mr-2',
                          ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase())
                            ? 'bg-success-600' : 'bg-gray-300'
                        )} />
                        受付済み
                      </div>
                      
                      <div className={cn('flex items-center',
                        ['shopping', 'enroute'].includes(order.status.toLowerCase())
                          ? 'text-success-600' : 'text-gray-400'
                      )}>
                        <div className={cn('w-2 h-2 rounded-full mr-2',
                          ['shopping', 'enroute'].includes(order.status.toLowerCase())
                            ? 'bg-success-600' : 'bg-gray-300'
                        )} />
                        買い物中
                      </div>
                      
                      <div className={cn('flex items-center',
                        order.status.toLowerCase() === 'enroute'
                          ? 'text-success-600' : 'text-gray-400'
                      )}>
                        <div className={cn('w-2 h-2 rounded-full mr-2',
                          order.status.toLowerCase() === 'enroute'
                            ? 'bg-success-600' : 'bg-gray-300'
                        )} />
                        配送中
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="btn-outline flex items-center flex-1"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    詳細
                  </Link>
                  
                  <Link
                    href={`/dashboard/chat?order=${order.id}`}
                    className="btn-outline flex items-center"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    チャット
                  </Link>
                  
                  <Link
                    href={nextAction.href}
                    className={cn(nextAction.color, 'flex items-center flex-1')}
                  >
                    {nextAction.text === 'レシート撮影' && <CameraIcon className="h-4 w-4 mr-2" />}
                    {nextAction.text === '配送開始' && <TruckIcon className="h-4 w-4 mr-2" />}
                    {nextAction.text === '配送完了' && <CheckCircleIcon className="h-4 w-4 mr-2" />}
                    {nextAction.text}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">進行中の注文がありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            新しい注文を受けて収入を得ましょう
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/orders/available"
              className="btn-primary inline-flex items-center"
            >
              利用可能な注文を見る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}