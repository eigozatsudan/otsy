'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPhoneNumber, isValidPhone } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
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
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    reset();
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('プロフィールを更新しました');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('ファイルサイズは5MB以下にしてください');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('画像ファイルを選択してください');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
          <p className="text-gray-600 mt-1">
            アカウント情報を管理できます
          </p>
        </div>
        
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="btn-primary flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            編集
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="プロフィール"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary-700">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                )}
              </div>
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700">
                  <CameraIcon className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {user.lastName} {user.firstName}
            </h2>
            <p className="text-gray-600 mt-1">{user.email}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">会員ランク</span>
                <span className="font-medium text-primary-600">スタンダード</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">登録日</span>
                <span className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
              
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="btn-outline flex items-center text-sm"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading || !isDirty}
                    className="btn-primary flex items-center text-sm"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        保存
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    苗字
                  </label>
                  {isEditing ? (
                    <input
                      {...register('lastName')}
                      type="text"
                      className={`input ${errors.lastName ? 'border-error-500' : ''}`}
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.lastName}</p>
                  )}
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前
                  </label>
                  {isEditing ? (
                    <input
                      {...register('firstName')}
                      type="text"
                      className={`input ${errors.firstName ? 'border-error-500' : ''}`}
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.firstName}</p>
                  )}
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                {isEditing ? (
                  <input
                    {...register('email')}
                    type="email"
                    className={`input ${errors.email ? 'border-error-500' : ''}`}
                  />
                ) : (
                  <p className="py-2 text-gray-900">{user.email}</p>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                {isEditing ? (
                  <input
                    {...register('phone')}
                    type="tel"
                    className={`input ${errors.phone ? 'border-error-500' : ''}`}
                  />
                ) : (
                  <p className="py-2 text-gray-900">{formatPhoneNumber(user.phone)}</p>
                )}
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                )}
              </div>
            </form>
          </div>

          {/* Account settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">アカウント設定</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">パスワード</h4>
                  <p className="text-sm text-gray-500">最後に変更: 30日前</p>
                </div>
                <button className="btn-outline text-sm">
                  変更
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">二段階認証</h4>
                  <p className="text-sm text-gray-500">セキュリティを強化します</p>
                </div>
                <button className="btn-outline text-sm">
                  設定
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">通知設定</h4>
                  <p className="text-sm text-gray-500">メールとプッシュ通知の設定</p>
                </div>
                <button className="btn-outline text-sm">
                  設定
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-gray-900">プライバシー設定</h4>
                  <p className="text-sm text-gray-500">データの使用と共有設定</p>
                </div>
                <button className="btn-outline text-sm">
                  設定
                </button>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="card border-error-200">
            <h3 className="text-lg font-semibold text-error-900 mb-4">危険な操作</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-error-900">アカウントを削除</h4>
                  <p className="text-sm text-error-600">
                    この操作は取り消せません。すべてのデータが削除されます。
                  </p>
                </div>
                <button className="btn-danger text-sm">
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}