'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { isValidPhone } from '@/lib/utils';

const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, '名前を入力してください')
    .max(50, '名前は50文字以内で入力してください'),
  lastName: z
    .string()
    .min(1, '苗字を入力してください')
    .max(50, '苗字は50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  phone: z
    .string()
    .min(1, '電話番号を入力してください')
    .refine((phone) => isValidPhone(phone), '有効な電話番号を入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります'),
  confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
  agreeToTerms: z.boolean().refine((val) => val === true, '利用規約に同意してください'),
  agreeToPrivacy: z.boolean().refine((val) => val === true, 'プライバシーポリシーに同意してください'),
  agreeToShopper: z.boolean().refine((val) => val === true, 'ショッパー規約に同意してください'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: '8文字以上', test: (password: string) => password.length >= 8 },
  { label: '大文字を含む', test: (password: string) => /[A-Z]/.test(password) },
  { label: '小文字を含む', test: (password: string) => /[a-z]/.test(password) },
  { label: '数字を含む', test: (password: string) => /\d/.test(password) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerShopper, isLoading, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerShopper({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      router.push('/onboarding');
    } catch (error: any) {
      // Error is already handled by the store and toast
      console.error('Registration error:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          ショッパー登録
        </h2>
        <p className="mt-2 text-gray-600">
          Otsyで新しい働き方を始めましょう
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              苗字
            </label>
            <input
              {...register('lastName')}
              type="text"
              autoComplete="family-name"
              className={`input ${errors.lastName ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="田中"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              名前
            </label>
            <input
              {...register('firstName')}
              type="text"
              autoComplete="given-name"
              className={`input ${errors.firstName ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="太郎"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
            )}
          </div>
        </div>

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
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            電話番号
          </label>
          <input
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            className={`input ${errors.phone ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
            placeholder="090-1234-5678"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
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
              autoComplete="new-password"
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
          
          {/* Password requirements */}
          <div className="mt-2 space-y-1">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center text-xs">
                <CheckCircleIcon 
                  className={`h-4 w-4 mr-2 ${
                    req.test(password) ? 'text-success-500' : 'text-gray-300'
                  }`}
                />
                <span className={req.test(password) ? 'text-success-600' : 'text-gray-500'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
          
          {errors.password && (
            <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            パスワード確認
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.confirmPassword ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start">
            <input
              {...register('agreeToTerms')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            />
            <label className="ml-2 block text-sm text-gray-700">
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                利用規約
              </Link>
              に同意します
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-error-600">{errors.agreeToTerms.message}</p>
          )}

          <div className="flex items-start">
            <input
              {...register('agreeToPrivacy')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            />
            <label className="ml-2 block text-sm text-gray-700">
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                プライバシーポリシー
              </Link>
              に同意します
            </label>
          </div>
          {errors.agreeToPrivacy && (
            <p className="text-sm text-error-600">{errors.agreeToPrivacy.message}</p>
          )}

          <div className="flex items-start">
            <input
              {...register('agreeToShopper')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            />
            <label className="ml-2 block text-sm text-gray-700">
              <Link href="/shopper-terms" className="text-primary-600 hover:text-primary-500">
                ショッパー規約
              </Link>
              に同意します
            </label>
          </div>
          {errors.agreeToShopper && (
            <p className="text-sm text-error-600">{errors.agreeToShopper.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              アカウント作成中...
            </>
          ) : (
            'ショッパー登録'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          すでにアカウントをお持ちの方は{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            ログイン
          </Link>
        </p>
      </div>

      {/* Registration benefits */}
      <div className="mt-8 p-4 bg-primary-50 rounded-lg">
        <h3 className="text-sm font-medium text-primary-900 mb-2">
          🎉 登録後の流れ
        </h3>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>• 本人確認書類のアップロード</li>
          <li>• 審査完了（通常1-2営業日）</li>
          <li>• すぐに収入獲得開始！</li>
        </ul>
      </div>
    </>
  );
}