'use client';

import { useEffect, useState } from 'react';
import { 
  UserIcon,
  PencilIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  address: string;
  dateOfBirth: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  isVerified: boolean;
  joinedAt: string;
  totalOrders: number;
  completedOrders: number;
  rating: number;
  bio?: string;
  preferredAreas: string[];
  workingHours: {
    start: string;
    end: string;
  };
  vehicleType: 'bicycle' | 'motorcycle' | 'car' | 'walking';
  languages: string[];
}

export default function ProfilePage() {
  const { shopper, updateProfile } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // モックデータ（実際のAPIに置き換え）
      const mockProfileData: ProfileData = {
        id: shopper?.id || '1',
        firstName: shopper?.firstName || '太郎',
        lastName: shopper?.lastName || '田中',
        email: shopper?.email || 'tanaka@example.com',
        phone: '090-1234-5678',
        profileImage: undefined,
        address: '東京都渋谷区道玄坂1-2-3',
        dateOfBirth: '1990-05-15',
        kycStatus: shopper?.kycStatus || 'approved',
        isVerified: shopper?.isVerified || true,
        joinedAt: '2023-10-01',
        totalOrders: 45,
        completedOrders: 42,
        rating: 4.8,
        bio: '丁寧で迅速な買い物代行を心がけています。お客様のご要望にお応えできるよう努めます。',
        preferredAreas: ['渋谷区', '新宿区', '港区'],
        workingHours: {
          start: '09:00',
          end: '18:00',
        },
        vehicleType: 'bicycle',
        languages: ['日本語', '英語'],
      };

      setProfileData(mockProfileData);
      setEditForm(mockProfileData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error('プロフィールの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(profileData || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(profileData || {});
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // 実際のAPI呼び出しに置き換え
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfileData(editForm as ProfileData);
      setIsEditing(false);
      toast.success('プロフィールを更新しました');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'under_review':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '認証済み';
      case 'rejected':
        return '認証拒否';
      case 'under_review':
        return '審査中';
      default:
        return '未認証';
    }
  };

  const getVehicleTypeText = (type: string) => {
    switch (type) {
      case 'bicycle':
        return '自転車';
      case 'motorcycle':
        return 'バイク';
      case 'car':
        return '車';
      case 'walking':
        return '徒歩';
      default:
        return '不明';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="card text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          プロフィールの読み込みに失敗しました
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          しばらくしてから再度お試しください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
          <p className="text-gray-600 mt-1">
            あなたのプロフィール情報を管理できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="btn-primary flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              編集
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="btn-outline flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center"
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                保存
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="card">
        <div className="flex items-start space-x-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700">
                  <CameraIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="input text-2xl font-bold"
                      placeholder="姓"
                    />
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="input text-2xl font-bold"
                      placeholder="名"
                    />
                  </div>
                ) : (
                  `${profileData.lastName} ${profileData.firstName}`
                )}
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getKycStatusColor(profileData.kycStatus)}`}>
                {getKycStatusText(profileData.kycStatus)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>登録日: {formatDate(profileData.joinedAt)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckIcon className="h-4 w-4 mr-2" />
                <span>完了注文: {profileData.completedOrders}件</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                <span>評価: {profileData.rating}/5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">個人情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input"
              />
            ) : (
              <div className="flex items-center text-sm text-gray-900">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {profileData.email}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="input"
              />
            ) : (
              <div className="flex items-center text-sm text-gray-900">
                <PhoneIcon className="h-4 w-4 mr-2" />
                {profileData.phone}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生年月日
            </label>
            {isEditing ? (
              <input
                type="date"
                value={editForm.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="input"
              />
            ) : (
              <div className="text-sm text-gray-900">
                {formatDate(profileData.dateOfBirth)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              住所
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="input"
              />
            ) : (
              <div className="flex items-center text-sm text-gray-900">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {profileData.address}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自己紹介
          </label>
          {isEditing ? (
            <textarea
              value={editForm.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="input"
              placeholder="自己紹介を入力してください"
            />
          ) : (
            <div className="text-sm text-gray-900">
              {profileData.bio || '自己紹介が設定されていません'}
            </div>
          )}
        </div>
      </div>

      {/* Work Preferences */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">勤務設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              勤務時間
            </label>
            {isEditing ? (
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={editForm.workingHours?.start || ''}
                  onChange={(e) => handleInputChange('workingHours', {
                    ...editForm.workingHours,
                    start: e.target.value
                  })}
                  className="input"
                />
                <span className="flex items-center text-gray-500">〜</span>
                <input
                  type="time"
                  value={editForm.workingHours?.end || ''}
                  onChange={(e) => handleInputChange('workingHours', {
                    ...editForm.workingHours,
                    end: e.target.value
                  })}
                  className="input"
                />
              </div>
            ) : (
              <div className="text-sm text-gray-900">
                {profileData.workingHours.start} 〜 {profileData.workingHours.end}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              移動手段
            </label>
            {isEditing ? (
              <select
                value={editForm.vehicleType || ''}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="input"
              >
                <option value="bicycle">自転車</option>
                <option value="motorcycle">バイク</option>
                <option value="car">車</option>
                <option value="walking">徒歩</option>
              </select>
            ) : (
              <div className="text-sm text-gray-900">
                {getVehicleTypeText(profileData.vehicleType)}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              対応可能エリア
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['渋谷区', '新宿区', '港区', '千代田区', '中央区', '文京区'].map((area) => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.preferredAreas?.includes(area) || false}
                        onChange={(e) => {
                          const areas = editForm.preferredAreas || [];
                          if (e.target.checked) {
                            handleInputChange('preferredAreas', [...areas, area]);
                          } else {
                            handleInputChange('preferredAreas', areas.filter(a => a !== area));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileData.preferredAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KYC Status */}
      {profileData.kycStatus !== 'approved' && (
        <div className="card bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-yellow-900">
                本人確認が必要です
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                本人確認が完了していないため、一部の機能が制限されています。
                身分証明書のアップロードを行ってください。
              </p>
              <div className="mt-4">
                <button className="btn-primary">
                  本人確認を開始
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-gradient-to-r from-success-50 to-success-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <UserIcon className="h-6 w-6 text-success-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-success-900">
              💡 プロフィールのコツ
            </h3>
            <p className="mt-1 text-sm text-success-700">
              詳細で正確なプロフィールは、お客様からの信頼を得るために重要です。
              自己紹介では、あなたの強みや経験を具体的に記載し、対応可能エリアは実際に移動できる範囲で設定しましょう。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
