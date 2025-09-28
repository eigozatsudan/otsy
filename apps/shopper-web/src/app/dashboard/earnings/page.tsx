'use client';

import { useEffect, useState } from 'react';
import { 
  CurrencyYenIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface EarningsData {
  totalEarnings: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  averagePerOrder: number;
  totalOrders: number;
  completedOrders: number;
  pendingPayout: number;
  nextPayoutDate: string;
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  type: 'order' | 'bonus' | 'adjustment' | 'payout';
  status: 'completed' | 'pending' | 'processing';
  description: string;
  createdAt: string;
  payoutDate?: string;
}

export default function EarningsPage() {
  const { shopper } = useAuthStore();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      
      // モックデータ（実際のAPIに置き換え）
      const mockEarningsData: EarningsData = {
        totalEarnings: 45600,
        thisWeek: 12800,
        lastWeek: 15200,
        thisMonth: 45600,
        lastMonth: 38900,
        averagePerOrder: 1200,
        totalOrders: 38,
        completedOrders: 35,
        pendingPayout: 12800,
        nextPayoutDate: '2024-01-15',
      };

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          orderId: 'ORD-001',
          amount: 1200,
          type: 'order',
          status: 'completed',
          description: '注文完了 - 渋谷区の買い物代行',
          createdAt: '2024-01-10T14:30:00Z',
          payoutDate: '2024-01-15',
        },
        {
          id: '2',
          orderId: 'ORD-002',
          amount: 1500,
          type: 'order',
          status: 'completed',
          description: '注文完了 - 新宿区の買い物代行',
          createdAt: '2024-01-09T16:45:00Z',
          payoutDate: '2024-01-15',
        },
        {
          id: '3',
          orderId: 'BONUS-001',
          amount: 500,
          type: 'bonus',
          status: 'completed',
          description: '週間目標達成ボーナス',
          createdAt: '2024-01-08T10:00:00Z',
          payoutDate: '2024-01-15',
        },
        {
          id: '4',
          orderId: 'ORD-003',
          amount: 1800,
          type: 'order',
          status: 'pending',
          description: '注文完了 - 港区の買い物代行',
          createdAt: '2024-01-11T12:20:00Z',
        },
        {
          id: '5',
          orderId: 'ORD-004',
          amount: 900,
          type: 'order',
          status: 'processing',
          description: '注文完了 - 千代田区の買い物代行',
          createdAt: '2024-01-11T18:15:00Z',
        },
      ];

      setEarningsData(mockEarningsData);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodEarnings = () => {
    if (!earningsData) return { current: 0, previous: 0, change: 0 };
    
    switch (selectedPeriod) {
      case 'week':
        return {
          current: earningsData.thisWeek,
          previous: earningsData.lastWeek,
          change: earningsData.thisWeek - earningsData.lastWeek,
        };
      case 'month':
        return {
          current: earningsData.thisMonth,
          previous: earningsData.lastMonth,
          change: earningsData.thisMonth - earningsData.lastMonth,
        };
      default:
        return {
          current: earningsData.totalEarnings,
          previous: earningsData.lastMonth,
          change: earningsData.totalEarnings - earningsData.lastMonth,
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'processing':
        return '処理中';
      case 'pending':
        return '保留中';
      default:
        return '不明';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'order':
        return '注文報酬';
      case 'bonus':
        return 'ボーナス';
      case 'adjustment':
        return '調整';
      case 'payout':
        return '出金';
      default:
        return 'その他';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="card text-center py-12">
        <CurrencyYenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          収入データの読み込みに失敗しました
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          しばらくしてから再度お試しください
        </p>
      </div>
    );
  }

  const periodEarnings = getPeriodEarnings();
  const changePercentage = periodEarnings.previous > 0 
    ? ((periodEarnings.change / periodEarnings.previous) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">収入管理</h1>
          <p className="text-gray-600 mt-1">
            あなたの収入状況と支払い履歴を確認できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'all')}
            className="input"
          >
            <option value="week">今週</option>
            <option value="month">今月</option>
            <option value="all">すべて</option>
          </select>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyYenIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {selectedPeriod === 'week' ? '今週の収入' : 
                 selectedPeriod === 'month' ? '今月の収入' : '総収入'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(periodEarnings.current)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {periodEarnings.change >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ml-1 ${
              periodEarnings.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(periodEarnings.change) > 0 ? `${changePercentage}%` : '0%'}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {selectedPeriod === 'week' ? '先週比' : 
               selectedPeriod === 'month' ? '先月比' : '前月比'}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">平均単価</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.averagePerOrder)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              注文あたりの平均収入
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">完了注文数</p>
              <p className="text-2xl font-bold text-gray-900">
                {earningsData.completedOrders}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              総注文数: {earningsData.totalOrders}件
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">次回出金予定</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.pendingPayout)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              {formatDate(earningsData.nextPayoutDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Payout Information */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900">
              出金スケジュール
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              毎週月曜日に前週分の収入が銀行口座に振り込まれます。
              次回の出金予定日は <strong>{formatDate(earningsData.nextPayoutDate)}</strong> です。
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">取引履歴</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {showDetails ? '簡易表示' : '詳細表示'}
          </button>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  種類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                {showDetails && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出金日
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{formatDate(transaction.createdAt)}</div>
                      <div className="text-gray-500">{formatTime(transaction.createdAt)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeText(transaction.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {transaction.description}
                    </div>
                    {showDetails && transaction.orderId && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.orderId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className="ml-2 text-sm text-gray-900">
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                  </td>
                  {showDetails && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.payoutDate ? formatDate(transaction.payoutDate) : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <CurrencyYenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              取引履歴がありません
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              注文を完了すると、ここに収入履歴が表示されます
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-r from-success-50 to-success-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ChartBarIcon className="h-6 w-6 text-success-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-success-900">
              💡 収入を増やすコツ
            </h3>
            <p className="mt-1 text-sm text-success-700">
              効率的なルートで複数の注文をまとめて受けることで、移動時間を短縮し収入を最大化できます。
              また、お客様からの評価が高いと、より高単価の注文が優先的に配信されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
