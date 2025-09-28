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
  ExclamationTriangleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore, getOrderStatusColor, getOrderStatusText } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const { 
    currentOrder, 
    isLoading, 
    fetchOrder, 
    approveReceipt, 
    rejectReceipt, 
    cancelOrder 
  } = useOrdersStore();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  const handleApproveReceipt = async () => {
    try {
      await approveReceipt(orderId);
      toast.success('レシートを承認しました');
    } catch (error) {
      console.error('Error approving receipt:', error);
    }
  };

  const handleRejectReceipt = async () => {
    if (!rejectReason.trim()) {
      toast.error('差し戻し理由を入力してください');
      return;
    }

    try {
      await rejectReceipt(orderId, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
      toast.success('レシートを差し戻しました');
    } catch (error) {
      console.error('Error rejecting receipt:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('キャンセル理由を入力してください');
      return;
    }

    try {
      await cancelOrder(orderId, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      toast.success('注文をキャンセルしました');
    } catch (error) {
      console.error('Error cancelling order:', error);
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
  // キャンセル可能な条件: ステータスが'new'または'accepted'で、かつショッパーがまだマッチングされていない場合
  const canCancel = ['new', 'accepted'].includes(order.status.toLowerCase()) && !order.shopperId;
  const hasReceipt = order.receiptUrl && order.receiptStatus;
  const needsReceiptReview = hasReceipt && order.receiptStatus === 'pending';

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
              {formatDateTime(order.createdAt)}に注文
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`badge ${getOrderStatusColor(order.status)}`}>
            {getOrderStatusText(order.status)}
          </span>
          
          {['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase()) && (
            <Link
              href={`/dashboard/chat?order=${order.id}`}
              className="btn-primary flex items-center"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              チャット
            </Link>
          )}
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
                  {order.actualAmount ? (
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.actualAmount)}
                      </p>
                      {order.actualAmount !== order.estimateAmount && (
                        <p className="text-sm text-gray-500 line-through">
                          見積: {formatCurrency(order.estimateAmount)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold text-gray-600">
                        見積: {formatCurrency(order.estimateAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        実際の金額は確定後に更新されます
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt section */}
          {hasReceipt && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                レシート
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">ステータス:</span>
                  <span className={`badge ${
                    order.receiptStatus === 'approved' ? 'badge-success' :
                    order.receiptStatus === 'rejected' ? 'badge-error' :
                    'badge-warning'
                  }`}>
                    {order.receiptStatus === 'approved' ? '承認済み' :
                     order.receiptStatus === 'rejected' ? '差し戻し' :
                     '確認待ち'}
                  </span>
                </div>

                {order.receiptUrl && (
                  <div className="relative">
                    <Image
                      src={order.receiptUrl}
                      alt="レシート"
                      width={400}
                      height={600}
                      className="rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {needsReceiptReview && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleApproveReceipt}
                      className="btn-primary flex items-center flex-1"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      承認
                    </button>
                    <button
                      onClick={() => setShowRejectDialog(true)}
                      className="btn-danger flex items-center flex-1"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      差し戻し
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              注文履歴
            </h2>

            <div className="space-y-4">
              {/* Sample timeline - in real app, this would come from order audit logs */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">注文が作成されました</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              {['accepted', 'shopping', 'purchased', 'enroute', 'delivered'].includes(order.status.toLowerCase()) && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">ショッパーが注文を受付</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {['shopping', 'enroute', 'delivered'].includes(order.status.toLowerCase()) && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">買い物を開始</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {['enroute', 'delivered'].includes(order.status.toLowerCase()) && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">配送を開始</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {order.status.toLowerCase() === 'delivered' && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">配送完了</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {order.status.toLowerCase() === 'cancelled' && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">注文がキャンセルされました</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Shopper info */}
          {order.shopper && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                ショッパー情報
              </h3>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-700">
                    {order.shopper.firstName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {order.shopper.lastName} {order.shopper.firstName}
                  </p>
                  {order.shopper.rating && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      {order.shopper.rating.toFixed(1)} / 5.0
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">アクション</h3>
            
            <div className="space-y-3">
              {['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase()) && (
                <Link
                  href={`/dashboard/chat?order=${order.id}`}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  ショッパーとチャット
                </Link>
              )}

              {canCancel ? (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="btn-danger w-full flex items-center justify-center"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  注文をキャンセル
                </button>
              ) : order.shopperId ? (
                <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      ショッパーとマッチング済みのため、キャンセルできません
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-600 mr-2" />
                    <p className="text-sm text-gray-600">
                      この注文はキャンセルできません
                    </p>
                  </div>
                </div>
              )}

              <Link
                href="/dashboard/orders"
                className="btn-outline w-full flex items-center justify-center"
              >
                注文履歴に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-error-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">注文をキャンセル</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              この注文をキャンセルしますか？キャンセル理由を入力してください。
            </p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="キャンセル理由を入力してください..."
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="btn-outline flex-1"
              >
                戻る
              </button>
              <button
                onClick={handleCancelOrder}
                className="btn-danger flex-1"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject receipt dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <XCircleIcon className="h-6 w-6 text-error-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">レシートを差し戻し</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              レシートを差し戻す理由を入力してください。
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="差し戻し理由を入力してください..."
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="btn-outline flex-1"
              >
                戻る
              </button>
              <button
                onClick={handleRejectReceipt}
                className="btn-danger flex-1"
              >
                差し戻し
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}