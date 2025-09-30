'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { 
  BellIcon, 
  ShieldCheckIcon, 
  LanguageIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    dataSharing: false,
    analytics: true,
  });

  const [appSettings, setAppSettings] = useState({
    language: 'ja',
    theme: 'light',
    timezone: 'Asia/Tokyo',
  });

  const handleNotificationUpdate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: '通知設定が更新されました' });
    } catch (error) {
      setMessage({ type: 'error', text: '通知設定の更新に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'プライバシー設定が更新されました' });
    } catch (error) {
      setMessage({ type: 'error', text: 'プライバシー設定の更新に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppSettingsUpdate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'アプリケーション設定が更新されました' });
    } catch (error) {
      setMessage({ type: 'error', text: 'アプリケーション設定の更新に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          アプリケーション設定、通知、プライバシーを管理できます。
        </p>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* App Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Cog6ToothIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">アプリケーション設定</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                言語
              </label>
              <select
                id="language"
                value={appSettings.language}
                onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                テーマ
              </label>
              <select
                id="theme"
                value={appSettings.theme}
                onChange={(e) => setAppSettings({ ...appSettings, theme: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
                <option value="auto">システム設定に従う</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                タイムゾーン
              </label>
              <select
                id="timezone"
                value={appSettings.timezone}
                onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="Asia/Tokyo">東京 (UTC+9)</option>
                <option value="UTC">UTC (UTC+0)</option>
                <option value="America/New_York">ニューヨーク (UTC-5)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAppSettingsUpdate}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? '更新中...' : 'アプリケーション設定を更新'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">通知設定</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">メール通知</h4>
                <p className="text-sm text-gray-500">重要な更新をメールで受け取る</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  emailNotifications: e.target.checked 
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">プッシュ通知</h4>
                <p className="text-sm text-gray-500">ブラウザでプッシュ通知を受け取る</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  pushNotifications: e.target.checked 
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">注文更新</h4>
                <p className="text-sm text-gray-500">注文の状況変更を通知する</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.orderUpdates}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  orderUpdates: e.target.checked 
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">プロモーションメール</h4>
                <p className="text-sm text-gray-500">お得な情報や新機能の案内を受け取る</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.promotionalEmails}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  promotionalEmails: e.target.checked 
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNotificationUpdate}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? '更新中...' : '通知設定を更新'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">プライバシー設定</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700">
                プロフィールの公開設定
              </label>
              <select
                id="profileVisibility"
                value={privacySettings.profileVisibility}
                onChange={(e) => setPrivacySettings({ 
                  ...privacySettings, 
                  profileVisibility: e.target.value 
                })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="private">非公開</option>
                <option value="friends">友達のみ</option>
                <option value="public">公開</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">データ共有</h4>
                <p className="text-sm text-gray-500">サービス改善のための匿名データを共有する</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.dataSharing}
                onChange={(e) => setPrivacySettings({ 
                  ...privacySettings, 
                  dataSharing: e.target.checked 
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">分析データ</h4>
                <p className="text-sm text-gray-500">使用状況の分析データを収集する</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.analytics}
                onChange={(e) => setPrivacySettings({ 
                  ...privacySettings, 
                  analytics: e.target.checked 
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handlePrivacyUpdate}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? '更新中...' : 'プライバシー設定を更新'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">セキュリティ設定</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h4 className="text-sm font-medium text-gray-900">パスワード変更</h4>
                <p className="text-sm text-gray-500">アカウントのパスワードを変更する</p>
              </div>
              <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                変更する
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h4 className="text-sm font-medium text-gray-900">二段階認証</h4>
                <p className="text-sm text-gray-500">セキュリティを強化する</p>
              </div>
              <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                設定する
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">ログイン履歴</h4>
                <p className="text-sm text-gray-500">最近のログイン活動を確認する</p>
              </div>
              <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                確認する
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">アカウント操作</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h4 className="text-sm font-medium text-gray-900">データエクスポート</h4>
                <p className="text-sm text-gray-500">アカウントデータをダウンロードする</p>
              </div>
              <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                エクスポート
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-medium text-red-600">アカウント削除</h4>
                <p className="text-sm text-gray-500">アカウントとすべてのデータを削除する</p>
              </div>
              <button className="text-red-600 hover:text-red-500 text-sm font-medium">
                削除する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
