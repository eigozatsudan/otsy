'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { paymentsApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface Payment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  order: {
    id: string;
    status: string;
    estimate_amount: number;
    items: Array<{
      name: string;
      qty: string;
    }>;
  };
}

const statusOptions = [
  { value: '', label: 'すべて' },
  { value: 'captured', label: '支払い完了' },
  { value: 'authorized', label: '承認済み' },
  { value: 'pending', label: '処理中' },
  { value: 'refunded', label: '返金済み' },
  { value: 'failed', label: '失敗' },
];

export default function PaymentsPage() {
  const { isAuthenticated, user, token } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });

  useEffect(() => {
    // Only load payments if authenticated
    if (isAuthenticated && user && token) {
      loadPayments();
    } else {
      console.log('Not authenticated, skipping payments load', {
        isAuthenticated,
        hasUser: !!user,
        hasToken: !!token
      });
      setIsLoading(false);
    }
  }, [isAuthenticated, user, token]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading payments...', {
        isAuthenticated,
        hasUser: !!user,
        hasToken: !!token,
        tokenLength: token?.length
      });
      const paymentsData = await paymentsApi.getMyPayments();
      console.log('Payments loaded:', paymentsData);
      setPayments(paymentsData);
    } catch (error: any) {
      console.error('Error loading payments:', {
        error,
        message: error?.message,
        statusCode: error?.statusCode,
        response: error?.response,
        stack: error?.stack,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        stringified: JSON.stringify(error, null, 2)
      });
      
      // Handle specific error cases
      let errorMessage = '決済履歴の読み込みに失敗しました。';
      
      if (error?.message === 'Payment not found' || error?.statusCode === 404 || error?.response?.statusCode === 404) {
        // If no payments found, show empty state instead of error
        console.log('No payments found, showing empty state');
        setPayments([]);
        setError(null);
        return;
      } else if (error?.statusCode === 401) {
        errorMessage = '認証が必要です。ログインし直してください。';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (selectedStatus && payment.status !== selectedStatus) {
      return false;
    }
    
    if (dateRange.from && new Date(payment.created_at) < new Date(dateRange.from)) {
      return false;
    }
    
    if (dateRange.to && new Date(payment.created_at) > new Date(dateRange.to)) {
      return false;
    }
    
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'captured':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'authorized':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      case 'refunded':
        return <ArrowDownTrayIcon className="h-5 w-5 text-primary-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      default:
        return <CreditCardIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'captured':
        return '支払い完了';
      case 'authorized':
        return '承認済み';
      case 'pending':
        return '処理中';
      case 'refunded':
        return '返金済み';
      case 'failed':
        return '失敗';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'captured':
        return 'badge-success';
      case 'authorized':
        return 'badge-warning';
      case 'pending':
        return 'badge-gray';
      case 'refunded':
        return 'badge-primary';
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-gray';
    }
  };

  const totalAmount = filteredPayments
    .filter(p => p.status === 'captured')
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonthAmount = filteredPayments
    .filter(p => {
      const paymentDate = new Date(p.createdAt);
      const now = new Date();
      return p.status === 'captured' &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">決済・請求</h1>
          <p className="text-gray-600 mt-1">
            支払い履歴と請求情報を確認できます
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">今月の支出</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(thisMonthAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">総支払額</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">完了した支払い</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredPayments.filter(p => p.status === 'captured').length}件
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              期間
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="input text-sm"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStatus('');
                setDateRange({ from: '', to: '' });
              }}
              className="btn-outline text-sm"
            >
              リセット
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={loadPayments}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              再試行
            </button>
          </div>
        </div>
      )}

      {/* Payments list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <XCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">決済履歴を読み込めませんでした</p>
          <button
            onClick={loadPayments}
            className="btn-primary"
          >
            再試行
          </button>
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getStatusIcon(payment.status)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            注文 #{payment.order_id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.order.items.slice(0, 2).map(item => item.name).join(', ')}
                            {payment.order.items.length > 2 && ` +${payment.order.items.length - 2}件`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.created_at)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(payment.created_at).split(' ')[1]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.order.estimate_amount !== payment.amount && (
                        <div className="text-sm text-gray-500 line-through">
                          見積: {formatCurrency(payment.order.estimate_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/orders/${payment.order_id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {selectedStatus || dateRange.from || dateRange.to 
              ? '条件に一致する支払いがありません' 
              : '支払い履歴がありません'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStatus || dateRange.from || dateRange.to
              ? 'フィルター条件を変更してお試しください'
              : '注文を作成すると支払い履歴が表示されます'
            }
          </p>
          {!(selectedStatus || dateRange.from || dateRange.to) && (
            <div className="mt-6">
              <Link
                href="/dashboard/voice-order"
                className="btn-primary inline-flex items-center"
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                最初の注文を作成
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Payment methods section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">支払い方法</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">クレジットカード</p>
                <p className="text-sm text-gray-500">**** **** **** 4242</p>
              </div>
            </div>
            <span className="badge-success">デフォルト</span>
          </div>
          
          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
            + 新しい支払い方法を追加
          </button>
        </div>
      </div>

      {/* Billing info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">請求先情報</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請求先住所
            </label>
            <div className="text-sm text-gray-900">
              <p>〒150-0001</p>
              <p>東京都渋谷区神宮前1-1-1</p>
              <p>サンプルマンション101</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請求書送付先
            </label>
            <div className="text-sm text-gray-900">
              <p>user@example.com</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="btn-outline">
            請求先情報を編集
          </button>
        </div>
      </div>
    </div>
  );
}