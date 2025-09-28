'use client';

import { useEffect, useState } from 'react';
import { 
  MapIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LocationMarkerIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatTime, formatDistance } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  lastUpdated: string;
  isTracking: boolean;
  updateInterval: number; // minutes
}

interface LocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  accuracy: number;
}

export default function LocationPage() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(5); // minutes

  useEffect(() => {
    checkLocationPermission();
    loadLocationData();
    loadLocationHistory();
  }, []);

  useEffect(() => {
    if (autoUpdate && permissionStatus === 'granted') {
      const interval = setInterval(() => {
        updateLocation();
      }, updateInterval * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoUpdate, updateInterval, permissionStatus]);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state as any);
    } catch (error) {
      console.error('Error checking location permission:', error);
      setPermissionStatus('unknown');
    }
  };

  const loadLocationData = async () => {
    try {
      setIsLoading(true);
      
      // モックデータ（実際のAPIに置き換え）
      const mockLocationData: LocationData = {
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 10,
        address: '東京都渋谷区道玄坂1-2-3',
        lastUpdated: new Date().toISOString(),
        isTracking: true,
        updateInterval: 5,
      };

      setLocationData(mockLocationData);
    } catch (error) {
      console.error('Failed to load location data:', error);
      toast.error('位置情報の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocationHistory = async () => {
    try {
      // モックデータ（実際のAPIに置き換え）
      const mockHistory: LocationHistory[] = [
        {
          id: '1',
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都渋谷区道玄坂1-2-3',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          accuracy: 10,
        },
        {
          id: '2',
          latitude: 35.6765,
          longitude: 139.6508,
          address: '東京都渋谷区道玄坂1-5-7',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          accuracy: 15,
        },
        {
          id: '3',
          latitude: 35.6758,
          longitude: 139.6499,
          address: '東京都渋谷区道玄坂1-1-1',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          accuracy: 8,
        },
      ];

      setLocationHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load location history:', error);
    }
  };

  const updateLocation = async () => {
    if (permissionStatus !== 'granted') {
      toast.error('位置情報の許可が必要です');
      return;
    }

    try {
      setIsUpdating(true);
      
      // 実際の位置情報取得
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // 住所の逆ジオコーディング（実際のAPIに置き換え）
      const address = await reverseGeocode(latitude, longitude);
      
      const newLocationData: LocationData = {
        latitude,
        longitude,
        accuracy: accuracy || 0,
        address,
        lastUpdated: new Date().toISOString(),
        isTracking: autoUpdate,
        updateInterval,
      };

      setLocationData(newLocationData);
      
      // 履歴に追加
      const newHistoryItem: LocationHistory = {
        id: Date.now().toString(),
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
        accuracy: accuracy || 0,
      };
      
      setLocationHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]); // 最新10件を保持
      
      toast.success('位置情報を更新しました');
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('位置情報の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // 実際の逆ジオコーディングAPIに置き換え
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('東京都渋谷区道玄坂1-2-3');
      }, 1000);
    });
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      setPermissionStatus('granted');
      await updateLocation();
      toast.success('位置情報の許可が完了しました');
    } catch (error) {
      console.error('Failed to get location permission:', error);
      setPermissionStatus('denied');
      toast.error('位置情報の許可が拒否されました');
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyText = (accuracy: number) => {
    if (accuracy <= 10) return '高精度';
    if (accuracy <= 50) return '中精度';
    return '低精度';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">現在地管理</h1>
          <p className="text-gray-600 mt-1">
            位置情報の設定と履歴を確認できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={updateLocation}
            disabled={isUpdating || permissionStatus !== 'granted'}
            className="btn-primary flex items-center"
          >
            {isUpdating ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <ArrowPathIcon className="h-4 w-4 mr-2" />
            )}
            現在地を更新
          </button>
        </div>
      </div>

      {/* Permission Status */}
      {permissionStatus !== 'granted' && (
        <div className="card bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-yellow-900">
                位置情報の許可が必要です
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                正確な位置情報を提供するために、ブラウザの位置情報許可が必要です。
                許可後、お客様により正確な到着予定時間を提供できます。
              </p>
              <div className="mt-4">
                <button
                  onClick={requestLocationPermission}
                  className="btn-primary"
                >
                  位置情報を許可
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Location */}
      {locationData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">現在の位置</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">住所</p>
                  <p className="text-sm text-gray-600">{locationData.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">緯度</p>
                  <p className="text-sm text-gray-600">{locationData.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">経度</p>
                  <p className="text-sm text-gray-600">{locationData.longitude.toFixed(6)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">最終更新</p>
                    <p className="text-sm text-gray-600">{formatTime(locationData.lastUpdated)}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getAccuracyColor(locationData.accuracy)
                } bg-opacity-10`}>
                  {getAccuracyText(locationData.accuracy)}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">精度: ±{locationData.accuracy}m</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      locationData.isTracking ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {locationData.isTracking ? '追跡中' : '停止中'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">設定</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">自動更新</h4>
                  <p className="text-sm text-gray-500">定期的に位置情報を更新</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                    className="sr-only peer"
                    disabled={permissionStatus !== 'granted'}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  更新間隔
                </label>
                <select
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
                  className="input"
                  disabled={!autoUpdate || permissionStatus !== 'granted'}
                >
                  <option value={1}>1分</option>
                  <option value={5}>5分</option>
                  <option value={10}>10分</option>
                  <option value={15}>15分</option>
                  <option value={30}>30分</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  <span>位置情報は暗号化されて保存されます</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location History */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">位置履歴</h3>
        {locationHistory.length === 0 ? (
          <div className="text-center py-8">
            <LocationMarkerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              位置履歴がありません
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              位置情報を更新すると、ここに履歴が表示されます
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    住所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    座標
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    精度
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(item.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {item.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getAccuracyColor(item.accuracy)}`}>
                        ±{item.accuracy}m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Map Preview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">地図表示</h3>
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              地図を表示するには
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              地図APIの設定が必要です
            </p>
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
              💡 位置情報のコツ
            </h3>
            <p className="mt-1 text-sm text-success-700">
              正確な位置情報は、お客様により正確な到着予定時間を提供するために重要です。
              自動更新を有効にすることで、常に最新の位置情報を維持できます。
              プライバシーが心配な場合は、必要時のみ手動で更新することも可能です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
