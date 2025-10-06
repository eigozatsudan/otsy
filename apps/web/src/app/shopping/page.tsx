'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { ShoppingItemCard } from '@/components/ui/GoldenCard';
import TouchButton, { FloatingActionButton, ButtonIcons, IconButton } from '@/components/ui/TouchButton';
import { SearchInput } from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

type ItemStatus = 'todo' | 'purchased' | 'cancelled';
type SortOption = 'name' | 'category' | 'status' | 'recent';

interface ShoppingItem {
    id: string;
    title: string;
    category: string;
    quantity: number;
    status: ItemStatus;
    notes?: string;
    image?: string;
    purchasedBy?: string;
    purchasedAt?: Date;
    addedBy: string;
    addedAt: Date;
    groupId: string;
    groupName: string;
}

export default function ShoppingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const router = useRouter();
    
    // Get group filter from URL params
    const [selectedGroup, setSelectedGroup] = useState<string | 'all'>('all');
    
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const groupParam = urlParams.get('group');
            if (groupParam) {
                setSelectedGroup(groupParam);
            }
        }
    }, []);

    // Mock data - replace with actual API calls
    const items: ShoppingItem[] = [
        {
            id: '1',
            title: 'オーガニック牛乳',
            category: '乳製品',
            quantity: 2,
            status: 'todo',
            notes: '500mlではなく1Lパックを購入',
            addedBy: 'あなた',
            addedAt: new Date('2025-01-06T10:00:00'),
            groupId: '1',
            groupName: '家族の買い物',
        },
        {
            id: '2',
            title: '全粒粉パン',
            category: 'パン',
            quantity: 1,
            status: 'purchased',
            purchasedBy: 'さら',
            purchasedAt: new Date('2025-01-06T14:30:00'),
            addedBy: 'みけ',
            addedAt: new Date('2025-01-06T09:00:00'),
            groupId: '1',
            groupName: '家族の買い物',
        },
        {
            id: '3',
            title: '掃除用品',
            category: '日用品',
            quantity: 1,
            status: 'cancelled',
            notes: '家にあることが判明',
            addedBy: 'りさ',
            addedAt: new Date('2025-01-05T16:00:00'),
            groupId: '2',
            groupName: 'ルームメイト',
        },
        {
            id: '4',
            title: 'コーヒー豆',
            category: '飲み物',
            quantity: 2,
            status: 'todo',
            notes: 'ミディアムロースト、できればオーガニック',
            addedBy: 'じょん',
            addedAt: new Date('2025-01-06T11:00:00'),
            groupId: '3',
            groupName: 'オフィスチーム',
        },
        {
            id: '5',
            title: '新鮮な野菜',
            category: '青果',
            quantity: 1,
            status: 'todo',
            notes: 'にんじん、ブロッコリー、ピーマン',
            addedBy: 'あなた',
            addedAt: new Date('2025-01-06T12:00:00'),
            groupId: '1',
            groupName: '家族の買い物',
        },
    ];

    // Filter and sort items
    const filteredItems = items
        .filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.groupName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
            const matchesGroup = selectedGroup === 'all' || item.groupId === selectedGroup;

            return matchesSearch && matchesStatus && matchesGroup;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'status':
                    const statusOrder = { todo: 0, purchased: 1, cancelled: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                case 'recent':
                default:
                    return b.addedAt.getTime() - a.addedAt.getTime();
            }
        });

    const statusCounts = {
        all: items.length,
        todo: items.filter(item => item.status === 'todo').length,
        purchased: items.filter(item => item.status === 'purchased').length,
        cancelled: items.filter(item => item.status === 'cancelled').length,
    };

    const handleAddItem = () => {
        router.push('/shopping/add');
    };

    const handleItemClick = (itemId: string) => {
        router.push(`/shopping/${itemId}`);
    };

    const handleStatusFilter = (status: ItemStatus | 'all') => {
        setSelectedStatus(status);
    };

    const handleSort = (option: SortOption) => {
        setSortBy(option);
    };

    return (
        <MobileLayout title="買い物リスト" showHeader showNavigation>
            <div className="px-fib-3 py-fib-4 space-y-fib-4">
                {/* Search */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="アイテム、カテゴリ、グループを検索..."
                        onClear={() => setSearchQuery('')}
                    />
                </motion.section>

                {/* Group Filter */}
                {selectedGroup !== 'all' && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.05 }}
                    >
                        <div className="bg-primary-50 rounded-lg p-fib-2 border border-primary-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-fib-2">
                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                    </svg>
                                    <span className="text-mobile-sm font-medium text-primary-800">
                                        グループでフィルター中: {items.find(item => item.groupId === selectedGroup)?.groupName}
                                    </span>
                                </div>
                                <TouchButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedGroup('all');
                                        // Remove group param from URL
                                        const url = new URL(window.location.href);
                                        url.searchParams.delete('group');
                                        window.history.replaceState({}, '', url.toString());
                                    }}
                                >
                                    クリア
                                </TouchButton>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Status Filter Tabs */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.1 }}
                >
                    <div className="flex space-x-fib-1 overflow-x-auto scrollbar-hide">
                        {[
                            { key: 'all', label: 'すべて', count: statusCounts.all },
                            { key: 'todo', label: '購入予定', count: statusCounts.todo },
                            { key: 'purchased', label: '購入済み', count: statusCounts.purchased },
                            { key: 'cancelled', label: 'キャンセル', count: statusCounts.cancelled },
                        ].map((tab) => (
                            <TouchButton
                                key={tab.key}
                                variant={selectedStatus === tab.key ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => handleStatusFilter(tab.key as ItemStatus | 'all')}
                                className="flex-shrink-0"
                            >
                                {tab.label} ({tab.count})
                            </TouchButton>
                        ))}
                    </div>
                </motion.section>

                {/* Sort and Actions */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.1 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-fib-2">
                            <span className="text-mobile-sm text-neutral-600">並び順:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSort(e.target.value as SortOption)}
                                className="text-mobile-sm bg-transparent border-none focus:outline-none text-primary-600 font-medium"
                            >
                                <option value="recent">最新</option>
                                <option value="name">名前</option>
                                <option value="category">カテゴリ</option>
                                <option value="status">ステータス</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-fib-1">
                            <IconButton
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                    </svg>
                                }
                                label="フィルター"
                                variant="ghost"
                                size="sm"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Items List */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.15 }}
                >
                    <div className="space-y-fib-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-mobile-lg font-semibold text-neutral-900">
                                アイテム ({filteredItems.length})
                            </h2>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="text-center py-fib-6">
                                <div className="w-16 h-16 mx-auto mb-fib-3 bg-neutral-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-mobile-lg font-medium text-neutral-900 mb-fib-1">
                                    {searchQuery ? 'アイテムが見つかりません' : 'まだアイテムがありません'}
                                </h3>
                                <p className="text-mobile-sm text-neutral-600 mb-fib-4">
                                    {searchQuery
                                        ? '検索条件やフィルターを調整してみてください'
                                        : '最初のアイテムを追加して買い物を始めましょう'
                                    }
                                </p>
                                {!searchQuery && (
                                    <TouchButton
                                        variant="primary"
                                        size="md"
                                        icon={ButtonIcons.Plus}
                                        onClick={handleAddItem}
                                    >
                                        最初のアイテムを追加
                                    </TouchButton>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-fib-2">
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15, delay: 0.2 + index * 0.05 }}
                                    >
                                        <div className="relative">
                                            <ShoppingItemCard
                                                title={item.title}
                                                category={item.category}
                                                quantity={item.quantity}
                                                status={item.status}
                                                notes={item.notes}
                                                purchasedBy={item.purchasedBy}
                                                onClick={() => handleItemClick(item.id)}
                                            />
                                            {/* Group badge */}
                                            <div className="absolute top-fib-1 right-fib-1">
                                                <span className="px-fib-1 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                                                    {item.groupName}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Quick Stats */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.25 }}
                >
                    <div className="grid grid-cols-3 gap-fib-2">
                        <div className="bg-warning-50 rounded-lg p-fib-2 border border-warning-200 text-center">
                            <p className="text-mobile-lg font-bold text-warning-900">{statusCounts.todo}</p>
                            <p className="text-mobile-xs text-warning-700">購入予定</p>
                        </div>
                        <div className="bg-success-50 rounded-lg p-fib-2 border border-success-200 text-center">
                            <p className="text-mobile-lg font-bold text-success-900">{statusCounts.purchased}</p>
                            <p className="text-mobile-xs text-success-700">購入済み</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-fib-2 border border-neutral-200 text-center">
                            <p className="text-mobile-lg font-bold text-neutral-900">{statusCounts.cancelled}</p>
                            <p className="text-mobile-xs text-neutral-700">キャンセル</p>
                        </div>
                    </div>
                </motion.section>

                {/* Bottom padding for navigation */}
                <div className="h-20" />
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton
                icon={ButtonIcons.Plus}
                onClick={handleAddItem}
            />
        </MobileLayout>
    );
}