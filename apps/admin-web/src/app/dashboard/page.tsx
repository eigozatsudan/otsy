'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import { AdminLayout } from '@/components/layout/admin-layout';

export const dynamic = 'force-dynamic';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalShoppers: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { admin } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const fetchStats = async () => {
      try {
        const [ordersRes, shoppersRes] = await Promise.all([
          apiClient.get('/orders'),
          apiClient.get('/users?role=shopper')
        ]);

        // APIレスポンスの構造に合わせて修正
        const orders = ordersRes.orders || [];
        const shoppers = Array.isArray(shoppersRes) ? shoppersRes : [];

        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        const activeOrders = orders.filter((order: any) => 
          ['new', 'accepted', 'shopping', 'await_receipt_ok', 'enroute'].includes(order.status)
        ).length;

        setStats({
          totalOrders: orders.length,
          activeOrders,
          totalShoppers: shoppers.length,
          totalRevenue,
          recentOrders: orders.slice(0, 5).map((order: any) => ({
            id: order.id,
            customerName: order.customer?.name || '不明',
            status: order.status,
            total: order.total || 0,
            createdAt: order.createdAt || order.created_at
          }))
        });
      } catch (error) {
        console.error('統計データの取得に失敗しました:', error);
        // エラー時はデフォルト値を設定
        setStats({
          totalOrders: 0,
          activeOrders: 0,
          totalShoppers: 0,
          totalRevenue: 0,
          recentOrders: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isMounted]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  if (!isMounted || isLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">Otsukai DX 管理画面へようこそ、{admin?.firstName || '管理者'}さん</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-medium">📦</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総注文数
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats?.totalOrders || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-medium">🔄</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      進行中注文
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats?.activeOrders || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-medium">🛒</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      買い物代行者
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats?.totalShoppers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-medium">💰</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総売上
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近の注文 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              最近の注文
            </h3>
            {stats?.recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📦</div>
                <p className="text-gray-500">まだ注文がありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注文ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      顧客名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日時
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}