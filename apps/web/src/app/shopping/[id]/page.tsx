'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import TouchButton, { IconButton, ButtonIcons } from '@/components/ui/TouchButton';
import MobileInput, { MobileTextArea } from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

type ItemStatus = 'todo' | 'purchased' | 'cancelled';

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
    price?: number;
}

export default function ShoppingItemDetailPage() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;

    // Mock data - replace with actual API call
    const mockItems: ShoppingItem[] = [
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
            price: 600,
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
            price: 300,
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
            price: 800,
        },
    ];

    const [item, setItem] = useState<ShoppingItem | null>(null);

    React.useEffect(() => {
        // Find item by ID
        const foundItem = mockItems.find(i => i.id === itemId);
        if (foundItem) {
            setItem(foundItem);
        } else {
            toast.error('アイテムが見つかりません');
            router.back();
        }
    }, [itemId, router]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        category: '',
        quantity: 1,
        notes: '',
        price: 0,
    });

    // Update edit form when item changes
    React.useEffect(() => {
        if (item) {
            setEditForm({
                title: item.title,
                category: item.category,
                quantity: item.quantity,
                notes: item.notes || '',
                price: item.price || 0,
            });
        }
    }, [item]);

    const handleStatusChange = (newStatus: ItemStatus) => {
        if (item) {
            setItem(prev => prev ? ({
                ...prev,
                status: newStatus,
                purchasedBy: newStatus === 'purchased' ? 'あなた' : undefined,
                purchasedAt: newStatus === 'purchased' ? new Date() : undefined,
            }) : null);

            const statusLabels = {
                todo: '購入予定',
                purchased: '購入済み',
                cancelled: 'キャンセル',
            };

            toast.success(`ステータスを「${statusLabels[newStatus]}」に変更しました`);
        }
    };

    const handleSave = () => {
        if (item) {
            setItem(prev => prev ? ({
                ...prev,
                ...editForm,
            }) : null);
            setIsEditing(false);
            toast.success('アイテムを更新しました');
        }
    };

    const handleDelete = () => {
        if (confirm('このアイテムを削除しますか？')) {
            toast.success('アイテムを削除しました');
            router.back();
        }
    };

    const getStatusColor = (status: ItemStatus) => {
        switch (status) {
            case 'todo': return 'bg-warning-100 text-warning-700 border-warning-200';
            case 'purchased': return 'bg-success-100 text-success-700 border-success-200';
            case 'cancelled': return 'bg-error-100 text-error-700 border-error-200';
        }
    };

    const getStatusLabel = (status: ItemStatus) => {
        switch (status) {
            case 'todo': return '購入予定';
            case 'purchased': return '購入済み';
            case 'cancelled': return 'キャンセル';
        }
    };

    if (!item) {
        return (
            <MobileLayout title="読み込み中..." showHeader showNavigation>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-neutral-600">アイテムを読み込んでいます...</p>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            title={isEditing ? 'アイテム編集' : 'アイテム詳細'}
            showHeader
            showNavigation
        >
            <div className="px-fib-3 py-fib-4 space-y-fib-4">
                {/* Header Actions */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <div className="flex items-center justify-between">
                        <IconButton
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            }
                            label="戻る"
                            onClick={() => router.back()}
                        />

                        <div className="flex items-center space-x-fib-1">
                            {!isEditing && (
                                <IconButton
                                    icon={ButtonIcons.Edit}
                                    label="編集"
                                    onClick={() => setIsEditing(true)}
                                />
                            )}
                            <IconButton
                                icon={ButtonIcons.Delete}
                                label="削除"
                                onClick={handleDelete}
                                variant="ghost"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Item Image */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.05 }}
                >
                    <div className="aspect-golden bg-neutral-200 rounded-xl overflow-hidden">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Item Details */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.1 }}
                >
                    <div className="bg-white rounded-xl p-fib-4 border border-neutral-200 space-y-fib-4">
                        {isEditing ? (
                            <>
                                <MobileInput
                                    label="アイテム名"
                                    value={editForm.title}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, title: value }))}
                                    required
                                />

                                <MobileInput
                                    label="カテゴリ"
                                    value={editForm.category}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                                />

                                <MobileInput
                                    label="数量"
                                    type="number"
                                    value={editForm.quantity.toString()}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, quantity: parseInt(value) || 1 }))}
                                />

                                <MobileInput
                                    label="価格 (円)"
                                    type="number"
                                    value={editForm.price.toString()}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, price: parseInt(value) || 0 }))}
                                />

                                <MobileTextArea
                                    label="メモ"
                                    value={editForm.notes}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, notes: value }))}
                                    rows={3}
                                    maxLength={200}
                                />

                                <div className="flex space-x-fib-2">
                                    <TouchButton
                                        variant="primary"
                                        size="md"
                                        className="flex-1"
                                        onClick={handleSave}
                                    >
                                        保存
                                    </TouchButton>
                                    <TouchButton
                                        variant="outline"
                                        size="md"
                                        className="flex-1"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditForm({
                                                title: item.title,
                                                category: item.category,
                                                quantity: item.quantity,
                                                notes: item.notes || '',
                                                price: item.price || 0,
                                            });
                                        }}
                                    >
                                        キャンセル
                                    </TouchButton>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h1 className="text-mobile-2xl font-bold text-neutral-900 mb-fib-1">
                                        {item.title}
                                    </h1>
                                    <div className="flex items-center space-x-fib-2">
                                        <span className="text-mobile-sm text-neutral-600">
                                            {item.category}
                                        </span>
                                        <span className="text-mobile-sm text-neutral-600">
                                            数量: {item.quantity}
                                        </span>
                                        {item.price && (
                                            <span className="text-mobile-sm font-medium text-neutral-900">
                                                ¥{item.price}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <h3 className="text-mobile-sm font-medium text-neutral-700 mb-fib-2">
                                        ステータス
                                    </h3>
                                    <div className="flex space-x-fib-2">
                                        {(['todo', 'purchased', 'cancelled'] as ItemStatus[]).map((status) => (
                                            <TouchButton
                                                key={status}
                                                variant={item.status === status ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => handleStatusChange(status)}
                                            >
                                                {getStatusLabel(status)}
                                            </TouchButton>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.notes && (
                                    <div>
                                        <h3 className="text-mobile-sm font-medium text-neutral-700 mb-fib-1">
                                            メモ
                                        </h3>
                                        <p className="text-mobile-sm text-neutral-600 bg-neutral-50 rounded-lg p-fib-2">
                                            {item.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Purchase Info */}
                                {item.status === 'purchased' && item.purchasedBy && (
                                    <div className="bg-success-50 rounded-lg p-fib-3 border border-success-200">
                                        <h3 className="text-mobile-sm font-medium text-success-800 mb-fib-1">
                                            購入情報
                                        </h3>
                                        <p className="text-mobile-sm text-success-700">
                                            {item.purchasedBy}が購入
                                        </p>
                                        {item.purchasedAt && (
                                            <p className="text-mobile-xs text-success-600">
                                                {item.purchasedAt.toLocaleString('ja-JP')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Meta Info */}
                                <div className="border-t border-neutral-200 pt-fib-3">
                                    <div className="space-y-fib-1 text-mobile-xs text-neutral-500">
                                        <p>グループ: {item.groupName}</p>
                                        <p>追加者: {item.addedBy}</p>
                                        <p>追加日時: {item.addedAt.toLocaleString('ja-JP')}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.section>

                {/* Quick Actions */}
                {!isEditing && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.15 }}
                    >
                        <div className="grid grid-cols-2 gap-fib-3">
                            <TouchButton
                                variant="outline"
                                size="md"
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                }
                                onClick={() => toast.success('共有機能は近日公開予定です！')}
                            >
                                共有
                            </TouchButton>

                            <TouchButton
                                variant="outline"
                                size="md"
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                }
                                onClick={() => router.push('/chat')}
                            >
                                チャットで相談
                            </TouchButton>
                        </div>
                    </motion.section>
                )}

                {/* Bottom padding for navigation */}
                <div className="h-20" />
            </div>
        </MobileLayout>
    );
}