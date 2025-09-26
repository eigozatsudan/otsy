'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiClient } from '@/lib/api';

interface OrderDetail {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  status: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  shopper?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    method: string;
  };
  receipts: Array<{
    id: string;
    imageUrl: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiClient.get(`/orders/${params.id}`);
        setOrder(response.data);
      } catch (error) {
        console.error('注文詳細の取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      await apiClient.patch(`/orders/${order.id}`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (error) {
      console.error('ステータス更新に失敗しました:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '待機中',
      accepted: '受付済み',
      shopping: '買い物中',
      purchased: '購入済み',
      delivered: '配達完了',
      cancelled: 'キャンセル'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      shopping: 'bg-purple-100 text-purple-800',
      purchased: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const getNextStatuses = (currentStatus: string) => {
    const statusFlow: { [key: string]: string[] } = {
      pending: ['accepted', 'cancelled'],
      accepted: ['shopping', 'cancelled'],
      shopping: ['purchased', 'cancelled'],
      purchased: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return statusFlow[currentStatus] || [];
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">注文が見つかりません</div>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            戻る
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← 注文一覧に戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              注文詳細 #{order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-600">
              作成日時: {new Date(order.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 顧客情報 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">顧客情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">氏名</label>
                  <p className="mt-1 text-sm text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">メールアドレス</label>
                  <p className="mt-1 text-sm text-gray-900">{order.customerEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">電話番号</label>
                  <p className="mt-1 text-sm text-gray-900">{order.customerPhone}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">配達先住所</label>
                  <p className="mt-1 text-sm text-gray-900">{order.deliveryAddress}</p>
                </div>
              </div>
            </div>

            {/* 注文商品 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">注文商品</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-gray-200 pb-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">数量: {item.quantity}</p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">備考: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-base font-medium text-gray-900">合計金額</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* レシート画像 */}
            {order.receipts.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">レシート画像</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.receipts.map((receipt) => (
                    <div key={receipt.id} className="border border-gray-200 rounded-lg p-4">
                      <img
                        src={receipt.imageUrl}
                        alt="レシート"
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                      <p className="text-xs text-gray-500">
                        アップロード日時: {new Date(receipt.uploadedAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* ステータス更新 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ステータス更新</h3>
              <div className="space-y-3">
                {getNextStatuses(order.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(status)}
                    disabled={isUpdating}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? '更新中...' : `${getStatusText(status)}に変更`}
                  </button>
                ))}
              </div>
            </div>

            {/* 買い物代行者情報 */}
            {order.shopper && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">買い物代行者</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">氏名</label>
                    <p className="mt-1 text-sm text-gray-900">{order.shopper.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">メールアドレス</label>
                    <p className="mt-1 text-sm text-gray-900">{order.shopper.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">電話番号</label>
                    <p className="mt-1 text-sm text-gray-900">{order.shopper.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 支払い情報 */}
            {order.payment && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">支払い情報</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">支払い方法</label>
                    <p className="mt-1 text-sm text-gray-900">{order.payment.method}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">金額</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(order.payment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ステータス</label>
                    <p className="mt-1 text-sm text-gray-900">{order.payment.status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 備考 */}
            {order.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">備考</h3>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}