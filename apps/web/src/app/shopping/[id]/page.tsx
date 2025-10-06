'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import TouchButton, { IconButton, ButtonIcons } from '@/components/ui/TouchButton';
import MobileInput, { MobileTextArea } from '@/components/ui/MobileInput';
import { useItem, useUpdateItem, useUpdateItemStatus, useDeleteItem } from '@/hooks/useShoppingItems';
import { useGroups } from '@/hooks/useGroups';
import toast from 'react-hot-toast';

type ItemStatus = 'todo' | 'purchased' | 'cancelled';

export default function ShoppingItemDetailPage() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;

    // Fetch item data
    const { data: item, isLoading, error } = useItem(itemId);
    const { data: groups = [] } = useGroups();

    // Mutations
    const updateItemMutation = useUpdateItem();
    const updateStatusMutation = useUpdateItemStatus();
    const deleteItemMutation = useDeleteItem();

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        category: '',
        quantity: '',
        note: '',
    });

    // Update edit form when item changes
    React.useEffect(() => {
        if (item) {
            setEditForm({
                name: item.name,
                category: item.category || '',
                quantity: item.quantity,
                note: item.note || '',
            });
        }
    }, [item]);

    // Handle error
    React.useEffect(() => {
        if (error) {
            toast.error('アイテムが見つかりません');
            router.back();
        }
    }, [error, router]);

    const handleStatusChange = (newStatus: ItemStatus) => {
        if (item) {
            updateStatusMutation.mutate({
                itemId: item.id,
                data: { status: newStatus },
            });
        }
    };

    const handleSave = () => {
        if (item) {
            updateItemMutation.mutate({
                itemId: item.id,
                data: editForm,
            }, {
                onSuccess: () => {
                    setIsEditing(false);
                },
            });
        }
    };

    const handleDelete = () => {
        if (confirm('このアイテムを削除しますか？')) {
            deleteItemMutation.mutate(itemId, {
                onSuccess: () => {
                    router.back();
                },
            });
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

    if (isLoading) {
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

    if (!item) {
        return (
            <MobileLayout title="エラー" showHeader showNavigation>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-neutral-600">アイテムが見つかりません</p>
                        <TouchButton
                            variant="primary"
                            size="sm"
                            onClick={() => router.back()}
                            className="mt-4"
                        >
                            戻る
                        </TouchButton>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    const groupName = groups.find(g => g.id === item.group_id)?.name || 'Unknown Group';

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
                                disabled={deleteItemMutation.isLoading}
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
                        {item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={item.name}
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
                                    value={editForm.name}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, name: value }))}
                                    required
                                />

                                <MobileInput
                                    label="カテゴリ"
                                    value={editForm.category}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                                />

                                <MobileInput
                                    label="数量"
                                    value={editForm.quantity}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, quantity: value }))}
                                />

                                <MobileTextArea
                                    label="メモ"
                                    value={editForm.note}
                                    onChange={(value) => setEditForm(prev => ({ ...prev, note: value }))}
                                    rows={3}
                                    maxLength={500}
                                />

                                <div className="flex space-x-fib-2">
                                    <TouchButton
                                        variant="primary"
                                        size="md"
                                        className="flex-1"
                                        onClick={handleSave}
                                        loading={updateItemMutation.isLoading}
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
                                                name: item.name,
                                                category: item.category || '',
                                                quantity: item.quantity,
                                                note: item.note || '',
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
                                        {item.name}
                                    </h1>
                                    <div className="flex items-center space-x-fib-2">
                                        <span className="text-mobile-sm text-neutral-600">
                                            {item.category || 'カテゴリなし'}
                                        </span>
                                        <span className="text-mobile-sm text-neutral-600">
                                            数量: {item.quantity}
                                        </span>
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
                                                loading={updateStatusMutation.isLoading}
                                            >
                                                {getStatusLabel(status)}
                                            </TouchButton>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.note && (
                                    <div>
                                        <h3 className="text-mobile-sm font-medium text-neutral-700 mb-fib-1">
                                            メモ
                                        </h3>
                                        <p className="text-mobile-sm text-neutral-600 bg-neutral-50 rounded-lg p-fib-2">
                                            {item.note}
                                        </p>
                                    </div>
                                )}

                                {/* Purchase Info */}
                                {item.status === 'purchased' && (
                                    <div className="bg-success-50 rounded-lg p-fib-3 border border-success-200">
                                        <h3 className="text-mobile-sm font-medium text-success-800 mb-fib-1">
                                            購入情報
                                        </h3>
                                        <p className="text-mobile-sm text-success-700">
                                            {item.creator_name || 'Unknown'}が購入
                                        </p>
                                        <p className="text-mobile-xs text-success-600">
                                            {new Date(item.updated_at).toLocaleString('ja-JP')}
                                        </p>
                                    </div>
                                )}

                                {/* Meta Info */}
                                <div className="border-t border-neutral-200 pt-fib-3">
                                    <div className="space-y-fib-1 text-mobile-xs text-neutral-500">
                                        <p>グループ: {groupName}</p>
                                        <p>追加者: {item.creator_name || 'Unknown'}</p>
                                        <p>追加日時: {new Date(item.created_at).toLocaleString('ja-JP')}</p>
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