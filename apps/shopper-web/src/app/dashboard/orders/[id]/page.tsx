'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  TruckIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore, canStartShopping, canSubmitReceipt, canCompleteDelivery, getOrderStatusColor, getOrderStatusText } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const { 
    currentOrder, 
    isLoading, 
    isUpdating,
    fetchOrder, 
    startShopping,
    updateOrderStatus,
    completeDelivery
  } = useOrdersStore();

  const [showDeliveryProof, setShowDeliveryProof] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  const handleStartShopping = async () => {
    try {
      await startShopping(orderId);
    } catch (error) {
      console.error('Error starting shopping:', error);
    }
  };

  const handleStartDelivery = async () => {
    try {
      await updateOrderStatus(orderId, 'enroute');
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      await completeDelivery(orderId);
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const order = currentOrder;
  const canStart = canStartShopping(order);
  const canSubmit = canSubmitReceipt(order);
  const canComplete = canCompleteDelivery(order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              注文 #{order.id.slice(-8)}
            </h1>
            <p className="text-gray-600">
              {formatDateTime(order.createdAt)}に受注
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={cn('badge', getOrderStatusColor(order.status))}>
            {getOrderStatusText(order.status)}
          </span>
          
          <Link
            href={`/dashboard/chat?order=${order.id}`}
            className="btn-primary flex items-center"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            チャット
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              注文商品
            </h2>
            
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">数量: {item.qty}</p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1">備考: {item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.actualPrice ? (
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(item.actualPrice)}
                        </p>
                        {item.estimatePrice && item.actualPrice !== item.estimatePrice && (
                          <p className="text-sm text-gray-500 line-through">
                            見積: {formatCurrency(item.estimatePrice)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium text-gray-600">
                        見積: {formatCurrency(item.estimatePrice || 0)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">合計金額</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(order.actualAmount || order.estimateAmount)}
                  </p>
                  {order.actualAmount && order.actualAmount !== order.estimateAmount && (
                    <p className="text-sm text-gray-500">
                      見積: {formatCurrency(order.estimateAmount)}
                    </p>
                  )}
                  <p className="text-sm text-success-600 font-medium">
                    推定収入: {formatCurrency(order.estimatedEarnings || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt section */}
          {order.receiptUrl && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                レシート
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">ステータス:</span>
                  <span className={cn('badge',
                    order.receiptStatus === 'approved' ? 'badge-success' :
                    order.receiptStatus === 'rejected' ? 'badge-error' :
                    'badge-warning'
                  )}>
                    {order.receiptStatus === 'approved' ? '承認済み' :
                     order.receiptStatus === 'rejected' ? '差し戻し' :
                     '確認待ち'}
                  </span>
                </div>

                <div className="relative max-w-sm">
                  <Image
                    src={order.receiptUrl}
                    alt="レシート"
                    width={300}
                    height={400}
                    className="rounded-lg border border-gray-200"
                  />
                </div>

                {order.receiptStatus === 'rejected' && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-error-900 mb-2">差し戻し理由</h4>
                    <p className="text-sm text-error-700">
                      レシートが不鮮明です。もう一度撮影してください。
                    </p>
                    <Link
                      href={`/dashboard/receipt-capture?order=${order.id}`}
                      className="btn-primary text-sm mt-3 inline-flex items-center"
                    >
                      <CameraIcon className="h-4 w-4 mr-1" />
                      再撮影
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              進捗状況
            </h2>

            <div className="space-y-4">
              <div className="timeline-step completed">
                <div>
                  <p className="text-sm font-medium text-gray-900">注文を受付</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              {['shopping', 'enroute', 'delivered'].includes(order.status.toLowerCase()) && (
                <div className="timeline-step completed">
                  <div>
                    <p className="text-sm font-medium text-gray-900">買い物を開始</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {['enroute', 'delivered'].includes(order.status.toLowerCase()) && (
                <div className="timeline-step completed">
                  <div>
                    <p className="text-sm font-medium text-gray-900">配送を開始</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {order.status.toLowerCase() === 'delivered' && (
                <div className="timeline-step completed">
                  <div>
                    <p className="text-sm font-medium text-gray-900">配送完了</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              お客様情報
            </h3>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-primary-700">
                  {order.user.firstName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {order.user.lastName} {order.user.firstName}
                </p>
                {order.user.phone && (
                  <p className="text-sm text-gray-600">
                    {order.user.phone}
                  </p>
                )}
              </div>
            </div>

            <Link
              href={`/dashboard/chat?order=${order.id}`}
              className="btn-outline w-full flex items-center justify-center"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              チャットで連絡
            </Link>
          </div>

          {/* Delivery info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              配送情報
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">配送先:</span>
                <p className="text-gray-900 mt-1 whitespace-pre-line">
                  {order.deliveryAddress}
                </p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">配送日:</span>
                <p className="text-gray-900 mt-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDateTime(order.deliveryDate)}
                </p>
              </div>

              {order.deliveryTimeSlot && (
                <div>
                  <span className="font-medium text-gray-700">時間帯:</span>
                  <p className="text-gray-900 mt-1">
                    {order.deliveryTimeSlot === 'morning' ? '午前中 (9:00-12:00)' :
                     order.deliveryTimeSlot === 'afternoon' ? '午後 (13:00-17:00)' :
                     order.deliveryTimeSlot === 'evening' ? '夕方 (17:00-20:00)' :
                     order.deliveryTimeSlot}
                  </p>
                </div>
              )}

              {order.specialInstructions && (
                <div>
                  <span className="font-medium text-gray-700">特別な指示:</span>
                  <p className="text-gray-900 mt-1 whitespace-pre-line">
                    {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">アクション</h3>
            
            <div className="space-y-3">
              {canStart && (
                <button
                  onClick={handleStartShopping}
                  disabled={isUpdating}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      開始中...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      買い物を開始
                    </>
                  )}
                </button>
              )}

              {canSubmit && (
                <Link
                  href={`/dashboard/receipt-capture?order=${order.id}`}
                  className="btn-success w-full flex items-center justify-center"
                >
                  <CameraIcon className="h-5 w-5 mr-2" />
                  レシートを撮影
                </Link>
              )}

              {order.status.toLowerCase() === 'shopping' && order.receiptStatus === 'approved' && (
                <button
                  onClick={handleStartDelivery}
                  disabled={isUpdating}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      開始中...
                    </>
                  ) : (
                    <>
                      <TruckIcon className="h-5 w-5 mr-2" />
                      配送を開始
                    </>
                  )}
                </button>
              )}

              {canComplete && (
                <button
                  onClick={handleCompleteDelivery}
                  disabled={isUpdating}
                  className="btn-success w-full flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      完了中...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      配送完了
                    </>
                  )}
                </button>
              )}

              <Link
                href="/dashboard/orders/active"
                className="btn-outline w-full flex items-center justify-center"
              >
                進行中の注文に戻る
              </Link>
            </div>
          </div>

          {/* Earnings info */}
          <div className="card bg-gradient-to-r from-success-50 to-success-100">
            <h3 className="text-lg font-semibold text-success-900 mb-2">
              💰 この注文の収入
            </h3>
            <div className="text-2xl font-bold text-success-600 mb-1">
              {formatCurrency(order.estimatedEarnings || 0)}
            </div>
            <p className="text-sm text-success-700">
              基本報酬 + 距離ボーナス
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}