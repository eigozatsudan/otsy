'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiClient } from '@/lib/api';

interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method: string;
  stripePaymentIntentId?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    customerName: string;
    status: string;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await apiClient.get('/payments');
        setPayments(response.data);
      } catch (error) {
        console.error('支払いデータの取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const capturePayment = async (paymentId: string) => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/payments/${paymentId}/capture`);
      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'captured' as const }
          : payment
      ));
      alert('支払いが確定されました');
    } catch (error) {
      console.error('支払い確定に失敗しました:', error);
      alert('支払いの確定に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const refundPayment = async (paymentId: string, amount?: number) => {
    const refundAmount = amount || payments.find(p => p.id === paymentId)?.amount;
    if (!refundAmount) return;

    const confirmed = confirm(`${formatCurrency(refundAmount)}を返金しますか？`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await apiClient.post(`/payments/${paymentId}/refund`, { amount: refundAmount });
      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'refunded' as const, refundAmount }
          : payment
      ));
      alert('返金が完了しました');
    } catch (error) {
      console.error('返金に失敗しました:', error);
      alert('返金に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '保留中',
      authorized: '承認済み',
      captured: '確定済み',
      refunded: '返金済み',
      failed: '失敗'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      authorized: 'bg-blue-100 text-blue-800',
      captured: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const capturedAmount = payments
    .filter(p => p.status === 'captured')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const refundedAmount = payments
    .filter(p => p.status === 'refunded')
    .reduce((sum, payment) => sum + (payment.refundAmount || 0), 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">支払い管理</h1>
            <p className="text-gray-600">すべての支払いトランザクションを管理できます</p>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">全</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総取引額
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(totalAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">確</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      確定済み
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(capturedAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">返</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      返金済み
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(refundedAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">承</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      承認待ち
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {payments.filter(p => p.status === 'authorized').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて ({payments.length})
            </button>
            <button
              onClick={() => setFilter('authorized')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'authorized'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              承認済み ({payments.filter(p => p.status === 'authorized').length})
            </button>
            <button
              onClick={() => setFilter('captured')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'captured'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              確定済み ({payments.filter(p => p.status === 'captured').length})
            </button>
            <button
              onClick={() => setFilter('refunded')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'refunded'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              返金済み ({payments.filter(p => p.status === 'refunded').length})
            </button>
          </div>
        </div>

        {/* 支払いリスト */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払いID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払い方法
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.orderId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                      {payment.refundAmount && (
                        <div className="text-xs text-red-600">
                          返金: {formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {payment.status === 'authorized' && (
                          <button
                            onClick={() => capturePayment(payment.id)}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            確定
                          </button>
                        )}
                        {payment.status === 'captured' && (
                          <button
                            onClick={() => refundPayment(payment.id)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            返金
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {filter === 'all' ? '支払いデータがありません' : `条件に一致する支払いがありません`}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}