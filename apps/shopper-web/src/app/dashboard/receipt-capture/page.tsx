'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore } from '@/store/orders';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, compressImage } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface ActualItem {
  name: string;
  qty: string;
  actualPrice: number;
  found: boolean;
  notes?: string;
}

export default function ReceiptCapturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  
  const { currentOrder, isUpdating, fetchOrder, submitReceipt } = useOrdersStore();
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [actualItems, setActualItems] = useState<ActualItem[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (currentOrder && actualItems.length === 0) {
      // Initialize actual items from order items
      const initialItems: ActualItem[] = currentOrder.items.map(item => ({
        name: item.name,
        qty: item.qty,
        actualPrice: item.estimatePrice || 0,
        found: true,
        notes: '',
      }));
      setActualItems(initialItems);
    }
  }, [currentOrder, actualItems.length]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('カメラにアクセスできませんでした');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const compressedFile = await compressImage(file, 800, 0.8);
            
            setCapturedImage(compressedFile);
            setImagePreview(URL.createObjectURL(compressedFile));
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('画像ファイルを選択してください');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('ファイルサイズは10MB以下にしてください');
        return;
      }

      const compressedFile = await compressImage(file, 800, 0.8);
      setCapturedImage(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    }
  };

  const updateActualItem = (index: number, field: keyof ActualItem, value: any) => {
    setActualItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addCustomItem = () => {
    const newItem: ActualItem = {
      name: '',
      qty: '1',
      actualPrice: 0,
      found: true,
      notes: '',
    };
    setActualItems(prev => [...prev, newItem]);
  };

  const removeItem = (index: number) => {
    setActualItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return actualItems
      .filter(item => item.found)
      .reduce((total, item) => total + item.actualPrice, 0);
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      toast.error('レシート画像を撮影してください');
      return;
    }

    if (!orderId) {
      toast.error('注文IDが見つかりません');
      return;
    }

    const foundItems = actualItems.filter(item => item.found);
    if (foundItems.length === 0) {
      toast.error('購入した商品を入力してください');
      return;
    }

    try {
      setIsProcessing(true);
      await submitReceipt(orderId, capturedImage, foundItems);
      toast.success('レシートを提出しました');
      router.push(`/dashboard/orders/${orderId}`);
    } catch (error) {
      console.error('Error submitting receipt:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">注文IDが指定されていません</p>
        <button
          onClick={() => router.back()}
          className="btn-primary mt-4"
        >
          戻る
        </button>
      </div>
    );
  }

  if (!currentOrder) {
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">レシート撮影</h1>
            <p className="text-gray-600">
              注文 #{currentOrder.id.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera/Image section */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              レシート画像
            </h2>

            {showCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="receipt-capture-guide"></div>
                </div>

                {/* Camera controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <button
                    onClick={capturePhoto}
                    className="bg-white text-gray-900 rounded-full p-4 shadow-lg hover:bg-gray-50"
                  >
                    <CameraIcon className="h-8 w-8" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-gray-800 text-white rounded-full p-4 shadow-lg hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-8 w-8" />
                  </button>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Captured receipt"
                    className="w-full rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-error-500 text-white rounded-full p-2 hover:bg-error-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={startCamera}
                    className="btn-outline flex items-center flex-1"
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    撮り直し
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline flex items-center flex-1"
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    別の画像
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  レシートを撮影
                </h3>
                <p className="text-gray-500 mb-6">
                  カメラでレシートを撮影するか、ギャラリーから選択してください
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={startCamera}
                    className="btn-primary flex items-center"
                  >
                    <CameraIcon className="h-5 w-5 mr-2" />
                    カメラで撮影
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline flex items-center"
                  >
                    <PhotoIcon className="h-5 w-5 mr-2" />
                    ギャラリーから選択
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Items section */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                購入した商品
              </h2>
              <button
                onClick={addCustomItem}
                className="btn-outline text-sm flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                商品を追加
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {actualItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateActualItem(index, 'name', e.target.value)}
                      className="input text-sm flex-1 mr-2"
                      placeholder="商品名"
                    />
                    <button
                      onClick={() => removeItem(index)}
                      className="text-error-500 hover:text-error-700 p-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      value={item.qty}
                      onChange={(e) => updateActualItem(index, 'qty', e.target.value)}
                      className="input text-sm"
                      placeholder="数量"
                    />
                    <input
                      type="number"
                      value={item.actualPrice}
                      onChange={(e) => updateActualItem(index, 'actualPrice', parseInt(e.target.value) || 0)}
                      className="input text-sm"
                      placeholder="価格"
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.found}
                        onChange={(e) => updateActualItem(index, 'found', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">購入済み</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => updateActualItem(index, 'notes', e.target.value)}
                    className="input text-sm w-full"
                    placeholder="備考（代替商品など）"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>合計金額:</span>
                <span className="text-primary-600">{formatCurrency(getTotalAmount())}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                見積金額: {formatCurrency(currentOrder.estimateAmount)}
              </p>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!capturedImage || isProcessing || isUpdating}
            className="w-full btn-primary flex items-center justify-center"
          >
            {isProcessing || isUpdating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                提出中...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                レシートを提出
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CameraIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-primary-900">
              📸 レシート撮影のコツ
            </h3>
            <ul className="mt-1 text-sm text-primary-700 space-y-1">
              <li>• レシート全体が画面に収まるように撮影してください</li>
              <li>• 明るい場所で、影が入らないように注意してください</li>
              <li>• 文字がはっきり読めるように、ピントを合わせてください</li>
              <li>• 商品が見つからない場合は「購入済み」のチェックを外してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}