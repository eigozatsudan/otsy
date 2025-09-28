'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';


const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(6, 'パスワードは6文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login page useEffect - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (isAuthenticated && !isLoading) {
      console.log('Redirecting to dashboard - already authenticated');
      // Add a small delay to ensure state is fully updated
      setTimeout(() => {
        console.log('Executing redirect to dashboard');
        router.replace('/dashboard');
      }, 200);
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Shopper login: Starting login process...');
      const success = await login(data.email, data.password);
      console.log('Shopper login result:', success);
      
          if (success) {
            console.log('Shopper login successful, redirecting to dashboard...');
            // Add a small delay to ensure state is fully updated
            setTimeout(() => {
              console.log('Executing redirect after successful login');
              router.replace('/dashboard');
            }, 200);
          } else {
        console.log('Shopper login failed');
      }
      // If login fails, the error message is already shown by the store
      // and the form remains on the login page
    } catch (error) {
      console.error('Shopper login error:', error);
      // This should not happen since login function now returns boolean
      // but if it does, show a generic error message
      toast.error('ログイン中にエラーが発生しました。もう一度お試しください。');
    }
  };

  // Show loading spinner while checking authentication or during login
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If already authenticated, show loading and redirect
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">ダッシュボードに移動しています...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          おかえりなさい
        </h2>
        <p className="mt-2 text-gray-600">
          ショッパーアカウントにログインしてください
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
            placeholder="shopper@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            パスワード
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              ログイン状態を保持する
            </label>
          </div>

          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            パスワードを忘れた方
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              ログイン中...
            </>
          ) : (
            'ログイン'
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ショッパーアカウントをお持ちでない方は{' '}
            <Link
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
        <h3 className="text-sm font-medium text-primary-900 mb-3">
          💰 今月のショッパー実績
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-primary-600">¥1,200</div>
            <div className="text-primary-800">平均時給</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary-600">4.8/5</div>
            <div className="text-primary-800">満足度</div>
          </div>
        </div>
      </div>

      {/* Demo credentials for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">デモ用アカウント</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>メール: shopper@otsy.local</p>
            <p>パスワード: shopper123</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector('form') as HTMLFormElement;
              const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
              const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
              emailInput.value = 'shopper@otsy.local';
              passwordInput.value = 'shopper123';
            }}
            className="mt-2 text-xs text-primary-600 hover:text-primary-500"
          >
            デモアカウントを入力
          </button>
        </div>
      )}
    </>
  );
}