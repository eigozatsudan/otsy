'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiClient } from '@/lib/api';

interface Shopper {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isAvailable: boolean;
  rating: number;
  totalOrders: number;
  completedOrders: number;
  earnings: number;
  createdAt: string;
  lastActiveAt?: string;
  currentOrders: number;
}

export default function ShoppersPage() {
  const [shoppers, setShoppers] = useState<Shopper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchShoppers = async () => {
      try {
        const response = await apiClient.get('/users?role=shopper');
        setShoppers(response.data);
      } catch (error) {
        console.error('買い物代行者データの取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShoppers();
  }, []);

  const toggleShopperStatus = async (shopperId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/users/${shopperId}`, { isActive: !currentStatus });
      setShoppers(shoppers.map(shopper => 
        shopper.id === shopperId ? { ...shopper, isActive: !currentStatus } : shopper
      ));
    } catch (error) {
      console.error('買い物代行者ステータスの更新に失敗しました:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredShoppers = shoppers.filter(shopper => {
    if (filter === 'all') return true;
    if (filter === 'active') return shopper.isActive;
    if (filter === 'available') return shopper.isAvailable;
    if (filter === 'busy') return shopper.currentOrders > 0;
    return false;
  });

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
            <h1 className="text-2xl font-bold text-gray-900">買い物代行者管理</h1>
            <p className="text-gray-600">買い物代行者の管理とパフォーマンス確認</p>
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
                      総代行者数
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {shoppers.length}
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
                    <span className="text-white text-sm font-medium">有</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      利用可能
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {shoppers.filter(s => s.isAvailable).length}
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
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">忙</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      作業中
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {shoppers.filter(s => s.currentOrders > 0).length}
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
                    <span className="text-white text-sm font-medium">¥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総売上
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(shoppers.reduce((sum, s) => sum + s.earnings, 0))}
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
              すべて ({shoppers.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              アクティブ ({shoppers.filter(s => s.isActive).length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'available'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              利用可能 ({shoppers.filter(s => s.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter('busy')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'busy'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              作業中 ({shoppers.filter(s => s.currentOrders > 0).length})
            </button>
          </div>
        </div>

        {/* 買い物代行者リスト */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代行者情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    評価
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文実績
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    売上
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終活動
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShoppers.map((shopper) => (
                  <tr key={shopper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {shopper.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shopper.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shopper.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex">
                          {getRatingStars(shopper.rating)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          ({shopper.rating.toFixed(1)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        完了: {shopper.completedOrders}
                      </div>
                      <div className="text-sm text-gray-500">
                        総計: {shopper.totalOrders}
                      </div>
                      {shopper.currentOrders > 0 && (
                        <div className="text-sm text-blue-600">
                          進行中: {shopper.currentOrders}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(shopper.earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          shopper.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shopper.isActive ? 'アクティブ' : '非アクティブ'}
                        </span>
                        {shopper.isActive && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            shopper.isAvailable 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {shopper.isAvailable ? '利用可能' : '作業中'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shopper.lastActiveAt 
                        ? new Date(shopper.lastActiveAt).toLocaleDateString('ja-JP')
                        : '未活動'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleShopperStatus(shopper.id, shopper.isActive)}
                        className={`${
                          shopper.isActive 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {shopper.isActive ? '無効化' : '有効化'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredShoppers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {filter === 'all' ? '買い物代行者がいません' : `条件に一致する買い物代行者がいません`}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}