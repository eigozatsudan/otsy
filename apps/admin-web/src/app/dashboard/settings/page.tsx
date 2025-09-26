'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiClient } from '@/lib/api';

interface SystemSettings {
  serviceFeeRate: number;
  deliveryFeeBase: number;
  deliveryFeePerKm: number;
  maxOrderValue: number;
  minOrderValue: number;
  operatingHours: {
    start: string;
    end: string;
  };
  supportedPaymentMethods: string[];
  autoAssignOrders: boolean;
  requireReceiptUpload: boolean;
  maxOrdersPerShopper: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    serviceFeeRate: 0.1,
    deliveryFeeBase: 300,
    deliveryFeePerKm: 100,
    maxOrderValue: 50000,
    minOrderValue: 500,
    operatingHours: {
      start: '09:00',
      end: '21:00'
    },
    supportedPaymentMethods: ['card', 'bank_transfer'],
    autoAssignOrders: true,
    requireReceiptUpload: true,
    maxOrdersPerShopper: 3
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/admin/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('設定データの取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/admin/settings', settings);
      alert('設定が保存されました');
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSetting = (parentKey: string, childKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey as keyof SystemSettings] as any,
        [childKey]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', name: '一般設定', icon: '⚙️' },
    { id: 'pricing', name: '料金設定', icon: '💰' },
    { id: 'operations', name: '運用設定', icon: '🔧' },
    { id: 'payments', name: '支払い設定', icon: '💳' }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
            <p className="text-gray-600">Otsukai DXの各種設定を管理できます</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 一般設定 */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">営業時間</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        開始時間
                      </label>
                      <input
                        type="time"
                        value={settings.operatingHours.start}
                        onChange={(e) => updateNestedSetting('operatingHours', 'start', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        終了時間
                      </label>
                      <input
                        type="time"
                        value={settings.operatingHours.end}
                        onChange={(e) => updateNestedSetting('operatingHours', 'end', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">注文制限</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最小注文金額 (円)
                      </label>
                      <input
                        type="number"
                        value={settings.minOrderValue}
                        onChange={(e) => updateSetting('minOrderValue', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大注文金額 (円)
                      </label>
                      <input
                        type="number"
                        value={settings.maxOrderValue}
                        onChange={(e) => updateSetting('maxOrderValue', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 料金設定 */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サービス手数料率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.serviceFeeRate}
                    onChange={(e) => updateSetting('serviceFeeRate', parseFloat(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    現在の設定: {(settings.serviceFeeRate * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">配送料金</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        基本配送料 (円)
                      </label>
                      <input
                        type="number"
                        value={settings.deliveryFeeBase}
                        onChange={(e) => updateSetting('deliveryFeeBase', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        距離料金 (円/km)
                      </label>
                      <input
                        type="number"
                        value={settings.deliveryFeePerKm}
                        onChange={(e) => updateSetting('deliveryFeePerKm', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 運用設定 */}
            {activeTab === 'operations' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    買い物代行者あたりの最大同時注文数
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxOrdersPerShopper}
                    onChange={(e) => updateSetting('maxOrdersPerShopper', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="autoAssignOrders"
                      type="checkbox"
                      checked={settings.autoAssignOrders}
                      onChange={(e) => updateSetting('autoAssignOrders', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoAssignOrders" className="ml-2 block text-sm text-gray-900">
                      注文の自動割り当てを有効にする
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="requireReceiptUpload"
                      type="checkbox"
                      checked={settings.requireReceiptUpload}
                      onChange={(e) => updateSetting('requireReceiptUpload', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireReceiptUpload" className="ml-2 block text-sm text-gray-900">
                      レシートアップロードを必須にする
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 支払い設定 */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">対応支払い方法</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'card', name: 'クレジットカード' },
                      { id: 'bank_transfer', name: '銀行振込' },
                      { id: 'cash_on_delivery', name: '代金引換' },
                      { id: 'digital_wallet', name: 'デジタルウォレット' }
                    ].map((method) => (
                      <div key={method.id} className="flex items-center">
                        <input
                          id={method.id}
                          type="checkbox"
                          checked={settings.supportedPaymentMethods.includes(method.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateSetting('supportedPaymentMethods', [
                                ...settings.supportedPaymentMethods,
                                method.id
                              ]);
                            } else {
                              updateSetting('supportedPaymentMethods', 
                                settings.supportedPaymentMethods.filter(m => m !== method.id)
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={method.id} className="ml-2 block text-sm text-gray-900">
                          {method.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        支払い設定の変更について
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          支払い方法の変更は既存の注文には影響しません。
                          新しい注文から適用されます。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}