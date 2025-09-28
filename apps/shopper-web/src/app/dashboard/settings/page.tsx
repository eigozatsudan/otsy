'use client';

import { useEffect, useState } from 'react';
import { 
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  MapIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface SettingsData {
  notifications: {
    newOrders: boolean;
    orderUpdates: boolean;
    earnings: boolean;
    messages: boolean;
    system: boolean;
    email: boolean;
    push: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
    showEarnings: boolean;
    allowContact: boolean;
  };
  location: {
    autoUpdate: boolean;
    updateInterval: number; // minutes
    accuracy: 'high' | 'medium' | 'low';
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
  security: {
    twoFactorAuth: boolean;
    biometricAuth: boolean;
    sessionTimeout: number; // minutes
  };
  work: {
    maxOrdersPerDay: number;
    maxDistance: number; // km
    workingDays: string[];
    breakTime: number; // minutes
  };
}

export default function SettingsPage() {
  const { shopper, logout } = useAuthStore();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'location' | 'appearance' | 'security' | 'work'>('notifications');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // モックデータ（実際のAPIに置き換え）
      const mockSettings: SettingsData = {
        notifications: {
          newOrders: true,
          orderUpdates: true,
          earnings: true,
          messages: true,
          system: true,
          email: true,
          push: true,
        },
        privacy: {
          showProfile: true,
          showLocation: false,
          showEarnings: false,
          allowContact: true,
        },
        location: {
          autoUpdate: true,
          updateInterval: 5,
          accuracy: 'high',
        },
        appearance: {
          theme: 'system',
          language: 'ja',
          timezone: 'Asia/Tokyo',
        },
        security: {
          twoFactorAuth: false,
          biometricAuth: false,
          sessionTimeout: 30,
        },
        work: {
          maxOrdersPerDay: 10,
          maxDistance: 5,
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          breakTime: 30,
        },
      };

      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('設定の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // 実際のAPI呼び出しに置き換え
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('設定を保存しました');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (category: keyof SettingsData, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value,
      },
    }));
  };

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      try {
        await logout();
        toast.success('ログアウトしました');
      } catch (error) {
        console.error('Failed to logout:', error);
        toast.error('ログアウトに失敗しました');
      }
    }
  };

  const tabs = [
    { id: 'notifications', name: '通知', icon: BellIcon },
    { id: 'privacy', name: 'プライバシー', icon: ShieldCheckIcon },
    { id: 'location', name: '位置情報', icon: MapIcon },
    { id: 'appearance', name: '表示', icon: SunIcon },
    { id: 'security', name: 'セキュリティ', icon: ShieldCheckIcon },
    { id: 'work', name: '勤務', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="card text-center py-12">
        <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          設定の読み込みに失敗しました
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
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-600 mt-1">
            アプリの動作や表示をカスタマイズできます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
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
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="card">
            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">通知設定</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">新しい注文</h4>
                      <p className="text-sm text-gray-500">新しい注文が利用可能になったとき</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.newOrders}
                        onChange={(e) => handleSettingChange('notifications', 'newOrders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">注文の更新</h4>
                      <p className="text-sm text-gray-500">注文のステータスが変更されたとき</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.orderUpdates}
                        onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">収入の更新</h4>
                      <p className="text-sm text-gray-500">収入が更新されたとき</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.earnings}
                        onChange={(e) => handleSettingChange('notifications', 'earnings', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">メッセージ</h4>
                      <p className="text-sm text-gray-500">お客様からのメッセージ</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.messages}
                        onChange={(e) => handleSettingChange('notifications', 'messages', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">通知方法</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">プッシュ通知</h5>
                        <p className="text-sm text-gray-500">アプリ内で通知を表示</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">メール通知</h5>
                        <p className="text-sm text-gray-500">メールで通知を送信</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">プライバシー設定</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">プロフィール表示</h4>
                      <p className="text-sm text-gray-500">お客様にプロフィールを表示する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showProfile}
                        onChange={(e) => handleSettingChange('privacy', 'showProfile', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">位置情報表示</h4>
                      <p className="text-sm text-gray-500">お客様に現在地を表示する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showLocation}
                        onChange={(e) => handleSettingChange('privacy', 'showLocation', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">収入表示</h4>
                      <p className="text-sm text-gray-500">お客様に収入を表示する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showEarnings}
                        onChange={(e) => handleSettingChange('privacy', 'showEarnings', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">連絡先公開</h4>
                      <p className="text-sm text-gray-500">お客様からの直接連絡を許可する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.allowContact}
                        onChange={(e) => handleSettingChange('privacy', 'allowContact', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">位置情報設定</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">自動更新</h4>
                      <p className="text-sm text-gray-500">位置情報を自動的に更新する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.location.autoUpdate}
                        onChange={(e) => handleSettingChange('location', 'autoUpdate', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      更新間隔（分）
                    </label>
                    <select
                      value={settings.location.updateInterval}
                      onChange={(e) => handleSettingChange('location', 'updateInterval', parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={1}>1分</option>
                      <option value={5}>5分</option>
                      <option value={10}>10分</option>
                      <option value={15}>15分</option>
                      <option value={30}>30分</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      位置精度
                    </label>
                    <select
                      value={settings.location.accuracy}
                      onChange={(e) => handleSettingChange('location', 'accuracy', e.target.value)}
                      className="input"
                    >
                      <option value="high">高精度（バッテリー消費大）</option>
                      <option value="medium">中精度（推奨）</option>
                      <option value="low">低精度（バッテリー節約）</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">表示設定</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      テーマ
                    </label>
                    <div className="flex space-x-4">
                      {[
                        { value: 'light', label: 'ライト', icon: SunIcon },
                        { value: 'dark', label: 'ダーク', icon: MoonIcon },
                        { value: 'system', label: 'システム', icon: Cog6ToothIcon },
                      ].map((theme) => (
                        <label key={theme.value} className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value={theme.value}
                            checked={settings.appearance.theme === theme.value}
                            onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                            className="sr-only peer"
                          />
                          <div className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer ${
                            settings.appearance.theme === theme.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}>
                            <theme.icon className="h-4 w-4 mr-2" />
                            {theme.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      言語
                    </label>
                    <select
                      value={settings.appearance.language}
                      onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                      className="input"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                      <option value="ko">한국어</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイムゾーン
                    </label>
                    <select
                      value={settings.appearance.timezone}
                      onChange={(e) => handleSettingChange('appearance', 'timezone', e.target.value)}
                      className="input"
                    >
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">セキュリティ設定</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">二要素認証</h4>
                      <p className="text-sm text-gray-500">アカウントのセキュリティを強化</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">生体認証</h4>
                      <p className="text-sm text-gray-500">指紋や顔認証でログイン</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.biometricAuth}
                        onChange={(e) => handleSettingChange('security', 'biometricAuth', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      セッションタイムアウト（分）
                    </label>
                    <select
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={15}>15分</option>
                      <option value={30}>30分</option>
                      <option value={60}>1時間</option>
                      <option value={120}>2時間</option>
                      <option value={0}>無制限</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Work */}
            {activeTab === 'work' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">勤務設定</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      1日の最大注文数
                    </label>
                    <select
                      value={settings.work.maxOrdersPerDay}
                      onChange={(e) => handleSettingChange('work', 'maxOrdersPerDay', parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={5}>5件</option>
                      <option value={10}>10件</option>
                      <option value={15}>15件</option>
                      <option value={20}>20件</option>
                      <option value={0}>無制限</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大移動距離（km）
                    </label>
                    <select
                      value={settings.work.maxDistance}
                      onChange={(e) => handleSettingChange('work', 'maxDistance', parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={2}>2km</option>
                      <option value={5}>5km</option>
                      <option value={10}>10km</option>
                      <option value={20}>20km</option>
                      <option value={0}>無制限</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      勤務日
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'monday', label: '月曜日' },
                        { value: 'tuesday', label: '火曜日' },
                        { value: 'wednesday', label: '水曜日' },
                        { value: 'thursday', label: '木曜日' },
                        { value: 'friday', label: '金曜日' },
                        { value: 'saturday', label: '土曜日' },
                        { value: 'sunday', label: '日曜日' },
                      ].map((day) => (
                        <label key={day.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.work.workingDays.includes(day.value)}
                            onChange={(e) => {
                              const days = settings.work.workingDays;
                              if (e.target.checked) {
                                handleSettingChange('work', 'workingDays', [...days, day.value]);
                              } else {
                                handleSettingChange('work', 'workingDays', days.filter(d => d !== day.value));
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      休憩時間（分）
                    </label>
                    <select
                      value={settings.work.breakTime}
                      onChange={(e) => handleSettingChange('work', 'breakTime', parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={15}>15分</option>
                      <option value={30}>30分</option>
                      <option value={45}>45分</option>
                      <option value={60}>1時間</option>
                      <option value={0}>なし</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200 bg-red-50">
        <h3 className="text-lg font-medium text-red-900 mb-4">危険な操作</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-red-900">ログアウト</h4>
              <p className="text-sm text-red-700">アカウントからログアウトします</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-outline border-red-300 text-red-700 hover:bg-red-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-r from-success-50 to-success-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-6 w-6 text-success-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-success-900">
              💡 設定のコツ
            </h3>
            <p className="mt-1 text-sm text-success-700">
              通知設定は適切に調整することで、重要な情報を見逃すことなく、不要な通知を減らすことができます。
              位置情報の自動更新は、お客様により正確な到着予定時間を提供するために重要です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
