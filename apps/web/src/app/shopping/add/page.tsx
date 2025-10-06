'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import TouchButton, { IconButton, ButtonIcons } from '@/components/ui/TouchButton';
import MobileInput, { MobileTextArea } from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

interface AddItemForm {
  title: string;
  category: string;
  quantity: number;
  notes: string;
  price: number;
  groupId: string;
}

export default function AddItemPage() {
  const router = useRouter();
  
  const [form, setForm] = useState<AddItemForm>({
    title: '',
    category: '',
    quantity: 1,
    notes: '',
    price: 0,
    groupId: '1', // Default to first group
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock groups data
  const groups = [
    { id: '1', name: '家族の買い物' },
    { id: '2', name: 'ルームメイト' },
    { id: '3', name: 'オフィスチーム' },
  ];

  // Common categories
  const categories = [
    '乳製品', 'パン', '肉類', '魚介類', '野菜', '果物',
    '冷凍食品', '調味料', '飲み物', 'お菓子', '日用品',
    '掃除用品', 'その他'
  ];

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('アイテム名を入力してください');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('アイテムを追加しました！');
      router.back();
    } catch (error) {
      toast.error('アイテムの追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (categoryName: string) => {
    setForm(prev => ({ ...prev, category: categoryName }));
  };

  return (
    <MobileLayout title="アイテム追加" showHeader showNavigation>
      <div className="px-fib-3 py-fib-4 space-y-fib-4">
        {/* Header */}
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
            
            <TouchButton
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!form.title.trim()}
            >
              追加
            </TouchButton>
          </div>
        </motion.section>

        {/* Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.05 }}
        >
          <div className="bg-white rounded-xl p-fib-4 border border-neutral-200 space-y-fib-4">
            <MobileInput
              label="アイテム名"
              value={form.title}
              onChange={(value) => setForm(prev => ({ ...prev, title: value }))}
              placeholder="例: オーガニック牛乳"
              required
              autoFocus
            />

            <div>
              <label className="block text-mobile-sm font-medium text-neutral-700 mb-fib-2">
                グループ
              </label>
              <div className="grid grid-cols-1 gap-fib-1">
                {groups.map((group) => (
                  <TouchButton
                    key={group.id}
                    variant={form.groupId === group.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setForm(prev => ({ ...prev, groupId: group.id }))}
                    className="justify-start"
                  >
                    {group.name}
                  </TouchButton>
                ))}
              </div>
            </div>

            <MobileInput
              label="カテゴリ"
              value={form.category}
              onChange={(value) => setForm(prev => ({ ...prev, category: value }))}
              placeholder="例: 乳製品"
            />

            {/* Quick Category Selection */}
            <div>
              <label className="block text-mobile-sm font-medium text-neutral-700 mb-fib-2">
                よく使うカテゴリ
              </label>
              <div className="flex flex-wrap gap-fib-1">
                {categories.map((category) => (
                  <TouchButton
                    key={category}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAdd(category)}
                    className="text-xs"
                  >
                    {category}
                  </TouchButton>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-fib-3">
              <MobileInput
                label="数量"
                type="number"
                value={form.quantity.toString()}
                onChange={(value) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(value) || 1) }))}
              />
              
              <MobileInput
                label="価格 (円)"
                type="number"
                value={form.price.toString()}
                onChange={(value) => setForm(prev => ({ ...prev, price: Math.max(0, parseInt(value) || 0) }))}
                placeholder="任意"
              />
            </div>

            <MobileTextArea
              label="メモ"
              value={form.notes}
              onChange={(value) => setForm(prev => ({ ...prev, notes: value }))}
              placeholder="例: 1Lパックを購入、有機栽培のものを選ぶ"
              rows={3}
              maxLength={200}
            />
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.1 }}
        >
          <div className="bg-neutral-50 rounded-xl p-fib-3 border border-neutral-200">
            <h3 className="text-mobile-sm font-medium text-neutral-700 mb-fib-2">
              クイックアクション
            </h3>
            <div className="grid grid-cols-2 gap-fib-2">
              <TouchButton
                variant="outline"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                }
                onClick={() => toast.success('画像添付機能は近日公開予定です！')}
              >
                画像を追加
              </TouchButton>
              
              <TouchButton
                variant="outline"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                onClick={() => toast.success('レシピ機能は近日公開予定です！')}
              >
                レシピから追加
              </TouchButton>
            </div>
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.15 }}
        >
          <div className="bg-primary-50 rounded-xl p-fib-3 border border-primary-200">
            <div className="flex items-start space-x-fib-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-mobile-sm font-medium text-primary-800 mb-fib-1">
                  ヒント
                </h4>
                <ul className="text-mobile-xs text-primary-700 space-y-1">
                  <li>• 詳細なメモを追加すると、他のメンバーが買い物しやすくなります</li>
                  <li>• 価格を入力すると、割り勘計算が正確になります</li>
                  <li>• カテゴリを設定すると、買い物リストが整理されます</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Bottom padding for navigation */}
        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}