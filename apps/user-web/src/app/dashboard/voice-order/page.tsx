'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore, type ShoppingListItem } from '@/store/orders';
import { LoadingSpinner, LoadingDots } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface VoiceRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  transcript: string;
}

export default function VoiceOrderPage() {
  const router = useRouter();
  const { generateShoppingList, createOrder, isGeneratingList, isCreatingOrder } = useOrdersStore();
  
  const [voiceState, setVoiceState] = useState<VoiceRecorderState>({
    isRecording: false,
    isPlaying: false,
    audioUrl: null,
    transcript: '',
  });
  
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    date: '',
    timeSlot: '',
    instructions: '',
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setVoiceState(prev => ({
          ...prev,
          transcript: finalTranscript || interimTranscript,
        }));
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('音声認識エラーが発生しました');
        stopRecording();
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setVoiceState(prev => ({ ...prev, audioUrl }));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      recognitionRef.current?.start();
      
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: true, 
        transcript: '',
        audioUrl: null 
      }));
      
      toast.success('録音を開始しました');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('マイクへのアクセスが拒否されました');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
      
      setVoiceState(prev => ({ ...prev, isRecording: false }));
      toast.success('録音を停止しました');
    }
  };

  const playRecording = () => {
    if (voiceState.audioUrl) {
      const audio = new Audio(voiceState.audioUrl);
      audio.play();
      
      setVoiceState(prev => ({ ...prev, isPlaying: true }));
      
      audio.onended = () => {
        setVoiceState(prev => ({ ...prev, isPlaying: false }));
      };
    }
  };

  const generateList = async () => {
    if (!voiceState.transcript.trim()) {
      toast.error('音声が認識されませんでした。もう一度お試しください。');
      return;
    }

    try {
      const items = await generateShoppingList({
        transcript: voiceState.transcript,
        audioUrl: voiceState.audioUrl || undefined,
      });
      
      setShoppingList(items);
    } catch (error) {
      console.error('Error generating shopping list:', error);
    }
  };

  const updateItemQuantity = (index: number, change: number) => {
    setShoppingList(prev => prev.map((item, i) => {
      if (i === index) {
        const currentQty = parseInt(item.qty) || 1;
        const newQty = Math.max(1, currentQty + change);
        return { ...item, qty: newQty.toString() };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomItem = () => {
    const newItem: ShoppingListItem = {
      name: '',
      qty: '1',
      estimatePrice: 0,
      category: 'その他',
    };
    setShoppingList(prev => [...prev, newItem]);
  };

  const updateCustomItem = (index: number, field: keyof ShoppingListItem, value: string | number) => {
    setShoppingList(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const getTotalEstimate = () => {
    return shoppingList.reduce((total, item) => {
      const qty = parseInt(item.qty) || 1;
      return total + (item.estimatePrice * qty);
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (shoppingList.length === 0) {
      toast.error('買い物リストが空です');
      return;
    }

    if (!deliveryInfo.address || !deliveryInfo.date) {
      toast.error('配送先住所と配送日を入力してください');
      return;
    }

    try {
      const order = await createOrder({
        items: shoppingList.map(item => ({
          name: item.name,
          qty: item.qty,
          estimatePrice: item.estimatePrice,
        })),
        deliveryAddress: deliveryInfo.address,
        deliveryDate: deliveryInfo.date,
        deliveryTimeSlot: deliveryInfo.timeSlot,
        specialInstructions: deliveryInfo.instructions,
      });

      toast.success('注文を作成しました！');
      router.push(`/dashboard/orders/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          音声で簡単注文
        </h1>
        <p className="text-gray-600">
          マイクボタンを押して、欲しい商品を話してください
        </p>
      </div>

      {/* Voice recorder */}
      <div className="card text-center">
        <div className="mb-6">
          <button
            onClick={voiceState.isRecording ? stopRecording : startRecording}
            disabled={isGeneratingList}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              voiceState.isRecording
                ? 'bg-error-500 hover:bg-error-600 voice-recording'
                : 'bg-primary-500 hover:bg-primary-600'
            } text-white shadow-lg`}
          >
            {voiceState.isRecording ? (
              <StopIcon className="h-10 w-10" />
            ) : (
              <MicrophoneIcon className="h-10 w-10" />
            )}
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-900">
            {voiceState.isRecording ? '録音中...' : 'マイクボタンを押して話してください'}
          </p>

          {voiceState.transcript && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">認識されたテキスト:</h3>
              <p className="text-gray-900">{voiceState.transcript}</p>
            </div>
          )}

          {voiceState.audioUrl && !voiceState.isRecording && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={playRecording}
                disabled={voiceState.isPlaying}
                className="btn-outline flex items-center"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {voiceState.isPlaying ? '再生中...' : '録音を再生'}
              </button>

              <button
                onClick={generateList}
                disabled={isGeneratingList || !voiceState.transcript}
                className="btn-primary flex items-center"
              >
                {isGeneratingList ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    生成中...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    買い物リストを生成
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shopping list */}
      {shoppingList.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">買い物リスト</h2>
            <button
              onClick={addCustomItem}
              className="btn-outline flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              商品を追加
            </button>
          </div>

          <div className="space-y-4">
            {shoppingList.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateCustomItem(index, 'name', e.target.value)}
                    className="input text-sm"
                    placeholder="商品名"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateItemQuantity(index, -1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateItemQuantity(index, 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    value={item.estimatePrice}
                    onChange={(e) => updateCustomItem(index, 'estimatePrice', parseInt(e.target.value) || 0)}
                    className="input text-sm text-right"
                    placeholder="価格"
                  />
                </div>

                <button
                  onClick={() => removeItem(index)}
                  className="text-error-500 hover:text-error-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>合計見積金額:</span>
              <span className="text-primary-600">{formatCurrency(getTotalEstimate())}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ※実際の金額は商品の価格や在庫状況により変動する場合があります
            </p>
          </div>
        </div>
      )}

      {/* Delivery information */}
      {shoppingList.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">配送情報</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配送先住所 *
              </label>
              <textarea
                value={deliveryInfo.address}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                className="input"
                rows={3}
                placeholder="〒123-4567 東京都渋谷区..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配送希望日 *
              </label>
              <input
                type="date"
                value={deliveryInfo.date}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, date: e.target.value }))}
                className="input"
                min={minDate}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配送時間帯
              </label>
              <select
                value={deliveryInfo.timeSlot}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, timeSlot: e.target.value }))}
                className="input"
              >
                <option value="">指定なし</option>
                <option value="morning">午前中 (9:00-12:00)</option>
                <option value="afternoon">午後 (13:00-17:00)</option>
                <option value="evening">夕方 (17:00-20:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                特別な指示
              </label>
              <textarea
                value={deliveryInfo.instructions}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, instructions: e.target.value }))}
                className="input"
                rows={3}
                placeholder="アレルギー情報、商品の選び方など..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Order button */}
      {shoppingList.length > 0 && (
        <div className="card bg-primary-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">注文内容の確認</h3>
              <p className="text-sm text-gray-600 mt-1">
                {shoppingList.length}点の商品 • 見積金額: {formatCurrency(getTotalEstimate())}
              </p>
            </div>
            <button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder || !deliveryInfo.address || !deliveryInfo.date}
              className="btn-primary flex items-center"
            >
              {isCreatingOrder ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  注文中...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  注文を確定
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100">
        <h3 className="text-lg font-semibold text-primary-900 mb-3">
          💡 音声注文のコツ
        </h3>
        <ul className="space-y-2 text-sm text-primary-800">
          <li>• 「牛乳1本、卵1パック、食パン1斤」のように具体的に話してください</li>
          <li>• ブランド名や商品の特徴も伝えると、より正確に選んでもらえます</li>
          <li>• 静かな場所で、はっきりと話すと認識精度が向上します</li>
          <li>• 生成されたリストは後から編集できます</li>
        </ul>
      </div>
    </div>
  );
}