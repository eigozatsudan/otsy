'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import TouchButton from '@/components/ui/TouchButton';
import MobileInput from '@/components/ui/MobileInput';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  
  const [form, setForm] = useState({
    email: 'user1@otsy.local', // Pre-fill for development
    password: 'user123',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    loginMutation.mutate(form, {
      onSuccess: () => {
        router.push('/');
      },
    });
  };

  const handleTestLogin = (userNumber: number) => {
    const testUsers = [
      { email: 'user1@otsy.local', password: 'user123' },
      { email: 'user2@otsy.local', password: 'user456' },
      { email: 'user3@otsy.local', password: 'user789' },
    ];
    
    const testUser = testUsers[userNumber - 1];
    if (testUser) {
      setForm(testUser);
      loginMutation.mutate(testUser, {
        onSuccess: () => {
          router.push('/');
        },
      });
    }
  };

  return (
    <MobileLayout title="ログイン" showHeader={false} showNavigation={false}>
      <div className="min-h-screen flex items-center justify-center px-fib-3 py-fib-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-fib-5"
        >
          {/* Logo/Title */}
          <div className="text-center">
            <h1 className="text-mobile-3xl font-bold text-neutral-900 mb-fib-2">
              おつかいDX
            </h1>
            <p className="text-mobile-base text-neutral-600">
              共同買い物管理アプリ
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-fib-4">
            <div className="bg-white rounded-xl p-fib-4 border border-neutral-200 space-y-fib-3">
              <MobileInput
                label="メールアドレス"
                type="email"
                value={form.email}
                onChange={(value) => setForm(prev => ({ ...prev, email: value }))}
                placeholder="user1@otsy.local"
                required
              />
              
              <MobileInput
                label="パスワード"
                type="password"
                value={form.password}
                onChange={(value) => setForm(prev => ({ ...prev, password: value }))}
                placeholder="パスワードを入力"
                required
              />
              
              <TouchButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loginMutation.isLoading}
              >
                ログイン
              </TouchButton>
            </div>
          </form>

          {/* Test Users */}
          <div className="bg-neutral-50 rounded-xl p-fib-4 border border-neutral-200">
            <h3 className="text-mobile-sm font-medium text-neutral-700 mb-fib-3">
              開発用テストユーザー
            </h3>
            <div className="space-y-fib-2">
              <TouchButton
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => handleTestLogin(1)}
                loading={loginMutation.isLoading}
              >
                田中太郎でログイン (user1@otsy.local)
              </TouchButton>
              <TouchButton
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => handleTestLogin(2)}
                loading={loginMutation.isLoading}
              >
                佐藤花子でログイン (user2@otsy.local)
              </TouchButton>
              <TouchButton
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => handleTestLogin(3)}
                loading={loginMutation.isLoading}
              >
                山田次郎でログイン (user3@otsy.local)
              </TouchButton>
            </div>
          </div>

          {/* Info */}
          <div className="bg-primary-50 rounded-xl p-fib-3 border border-primary-200">
            <div className="flex items-start space-x-fib-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-mobile-sm font-medium text-primary-800 mb-fib-1">
                  開発環境について
                </h4>
                <p className="text-mobile-xs text-primary-700">
                  これは開発環境です。テストユーザーでログインして機能をお試しください。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}