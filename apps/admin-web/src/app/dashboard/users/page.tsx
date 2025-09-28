'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiClient } from '@/lib/api';

interface User {
    id: string;
    email: string;
    phone: string;
    subscription_tier?: string;
    created_at: string;
    updated_at: string;
    // 追加フィールド（フロントエンドで生成）
    name?: string;
    role?: 'customer' | 'shopper' | 'admin';
    isActive?: boolean;
    lastLoginAt?: string;
    totalOrders?: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get('/users');
                // APIレスポンスは直接配列の形式
                const usersData = Array.isArray(response) ? response : response.data || [];
                
                // ユーザーデータを整形
                const formattedUsers = usersData.map((user: any) => ({
                    ...user,
                    name: user.email.split('@')[0], // メールアドレスから名前を生成
                    role: user.email.includes('shopper') ? 'shopper' : 'customer', // メールアドレスから役割を判定
                    isActive: true, // デフォルトでアクティブ
                    createdAt: user.created_at,
                    totalOrders: 0 // デフォルト値
                }));
                
                setUsers(formattedUsers);
            } catch (error) {
                console.error('ユーザーデータの取得に失敗しました:', error);
                setUsers([]); // エラー時は空配列を設定
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await apiClient.patch(`/users/${userId}`, { isActive: !currentStatus });
            setUsers(users.map(user =>
                user.id === userId ? { ...user, isActive: !currentStatus } : user
            ));
        } catch (error) {
            console.error('ユーザーステータスの更新に失敗しました:', error);
            alert('ステータスの更新に失敗しました');
        }
    };

    const getRoleText = (role: string) => {
        const roleMap: { [key: string]: string } = {
            customer: '顧客',
            shopper: '買い物代行者',
            admin: '管理者'
        };
        return roleMap[role] || role;
    };

    const getRoleColor = (role: string) => {
        const colorMap: { [key: string]: string } = {
            customer: 'bg-blue-100 text-blue-800',
            shopper: 'bg-green-100 text-green-800',
            admin: 'bg-purple-100 text-purple-800'
        };
        return colorMap[role] || 'bg-gray-100 text-gray-800';
    };

    const filteredUsers = (users || []).filter(user => {
        if (filter === 'all') return true;
        if (filter === 'active') return user.isActive;
        if (filter === 'inactive') return !user.isActive;
        return user.role === filter;
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
                        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
                        <p className="text-gray-600">すべてのユーザーを管理できます</p>
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
                                            総ユーザー数
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {users?.length || 0}
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
                                        <span className="text-white text-sm font-medium">顧</span>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            顧客
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {users?.filter(u => u.role === 'customer').length || 0}
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
                                        <span className="text-white text-sm font-medium">買</span>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            買い物代行者
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {users?.filter(u => u.role === 'shopper').length || 0}
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
                                        <span className="text-white text-sm font-medium">有</span>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            アクティブ
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {users?.filter(u => u.isActive).length || 0}
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
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            すべて ({users?.length || 0})
                        </button>
                        <button
                            onClick={() => setFilter('customer')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'customer'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            顧客 ({users?.filter(u => u.role === 'customer').length || 0})
                        </button>
                        <button
                            onClick={() => setFilter('shopper')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'shopper'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            買い物代行者 ({users?.filter(u => u.role === 'shopper').length || 0})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'active'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            アクティブ ({users?.filter(u => u.isActive).length || 0})
                        </button>
                        <button
                            onClick={() => setFilter('inactive')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'inactive'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            非アクティブ ({users?.filter(u => !u.isActive).length || 0})
                        </button>
                    </div>
                </div>

                {/* ユーザーリスト */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ユーザー情報
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        役割
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ステータス
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        注文数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        最終ログイン
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        登録日
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                                {getRoleText(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? 'アクティブ' : '非アクティブ'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.totalOrders || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.lastLoginAt
                                                ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP')
                                                : '未ログイン'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt || user.created_at).toLocaleDateString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                                className={`${user.isActive
                                                    ? 'text-red-600 hover:text-red-900'
                                                    : 'text-green-600 hover:text-green-900'
                                                    }`}
                                            >
                                                {user.isActive ? '無効化' : '有効化'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-500">
                            {filter === 'all' ? 'ユーザーがいません' : `条件に一致するユーザーがいません`}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}