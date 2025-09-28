'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MicrophoneIcon,
  PencilIcon,
  ListBulletIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore, type ShoppingListItem } from '@/store/orders';
import { LoadingSpinner, LoadingDots } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { itemsApi } from '@/lib/api';

type OrderMethod = 'voice' | 'text' | 'list';

interface Item {
  id: string;
  name: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  unit?: string;
  category: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  items: Item[];
}

export default function OrderPage() {
  const router = useRouter();
  const { createOrder, isCreatingOrder } = useOrdersStore();
  
  const [activeMethod, setActiveMethod] = useState<OrderMethod>('voice');
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    date: '',
    timeSlot: '',
    instructions: '',
  });
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  // List selection state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [priceEdit, setPriceEdit] = useState({ min: '', max: '' });

  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const response = await itemsApi.getCategories();
      // APIレスポンスが配列の場合は直接使用、オブジェクトの場合はdataプロパティを使用
      const categoriesData = Array.isArray(response) ? response : response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('カテゴリーの読み込みに失敗しました');
      setCategories([]); // エラー時は空配列を設定
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddItem = (item: Item, quantity: string = '1') => {
    const existingItem = shoppingList.find(listItem => listItem.name === item.name);
    
    if (existingItem) {
      setShoppingList(prev => 
        prev.map(listItem => 
          listItem.name === item.name 
            ? { ...listItem, qty: quantity }
            : listItem
        )
      );
    } else {
      const newItem: ShoppingListItem = {
        name: item.name,
        qty: quantity,
        price_min: item.price_min,
        price_max: item.price_max,
        allow_subs: true,
        note: '',
      };
      setShoppingList(prev => [...prev, newItem]);
    }
    toast.success(`${item.name}を追加しました`);
  };

  const handleRemoveItem = (itemName: string) => {
    setShoppingList(prev => prev.filter(item => item.name !== itemName));
  };

  const handleUpdateQuantity = (itemName: string, qty: string) => {
    setShoppingList(prev => 
      prev.map(item => 
        item.name === itemName ? { ...item, qty } : item
      )
    );
  };

  const handleStartPriceEdit = (itemName: string) => {
    const item = shoppingList.find(i => i.name === itemName);
    if (item) {
      setEditingItem(itemName);
      setPriceEdit({
        min: item.price_min?.toString() || '',
        max: item.price_max?.toString() || '',
      });
    }
  };

  const handleSavePriceEdit = () => {
    if (!editingItem) return;
    
    setShoppingList(prev => 
      prev.map(item => 
        item.name === editingItem 
          ? { 
              ...item, 
              price_min: priceEdit.min ? parseInt(priceEdit.min) : undefined,
              price_max: priceEdit.max ? parseInt(priceEdit.max) : undefined,
            } 
          : item
      )
    );
    setEditingItem(null);
    setPriceEdit({ min: '', max: '' });
    toast.success('価格を更新しました');
  };

  const handleCancelPriceEdit = () => {
    setEditingItem(null);
    setPriceEdit({ min: '', max: '' });
  };

  const handleProcessTextInput = async () => {
    if (!textInput.trim()) return;
    
    try {
      setIsProcessingText(true);
      // Here you would call an API to process the text input
      // For now, we'll just add it as a single item
      const newItem: ShoppingListItem = {
        name: textInput.trim(),
        qty: '1',
        price_min: undefined,
        price_max: undefined,
        allow_subs: true,
        note: '',
      };
      setShoppingList(prev => [...prev, newItem]);
      setTextInput('');
      toast.success('アイテムを追加しました');
    } catch (error) {
      console.error('Failed to process text input:', error);
      toast.error('テキストの処理に失敗しました');
    } finally {
      setIsProcessingText(false);
    }
  };

  const handleCreateOrder = async () => {
    if (shoppingList.length === 0) {
      toast.error('アイテムを追加してください');
      return;
    }

    if (!deliveryInfo.address || !deliveryInfo.date || !deliveryInfo.timeSlot) {
      toast.error('配送情報を入力してください');
      return;
    }

    try {
      const orderData = {
        mode: 'approve',
        receipt_check: 'required',
        estimate_amount: Math.max(100, shoppingList.reduce((total, item) => 
          total + ((item.price_max || item.price_min || 0) * parseInt(item.qty) || 0), 0
        )),
        address_json: {
          postal_code: '100-0001',
          prefecture: 'Tokyo',
          city: 'Chiyoda',
          address_line: deliveryInfo.address || '住所を入力してください',
          building: '',
          delivery_notes: deliveryInfo.instructions || '',
        },
        items: shoppingList.map(item => ({
          name: item.name,
          qty: item.qty,
          price_min: item.price_min,
          price_max: item.price_max,
          allow_subs: item.allow_subs,
          note: item.note || '',
        })),
      };

      await createOrder(orderData);
      toast.success('注文が作成されました');
      router.push('/dashboard/orders');
    } catch (error: any) {
      console.error('Failed to create order:', error);
      
      // より詳細なエラーメッセージを表示
      let errorMessage = '注文の作成に失敗しました';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const filteredItems = selectedCategory 
    ? (categories || []).find(cat => cat.id === selectedCategory)?.items || []
    : (categories || []).flatMap(cat => cat.items);
  

  const searchResults = searchQuery 
    ? (filteredItems || []).filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems || [];

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const tomorrow = minDate;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          商品を注文
        </h1>
        <p className="text-gray-600">
          音声、テキスト、またはリストから商品を選択してください
        </p>
      </div>

      {/* Method Selection Tabs */}
      <div className="flex justify-center space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveMethod('voice')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeMethod === 'voice'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MicrophoneIcon className="h-5 w-5" />
          <span>音声</span>
        </button>
        <button
          onClick={() => setActiveMethod('text')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeMethod === 'text'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <PencilIcon className="h-5 w-5" />
          <span>フリー入力</span>
        </button>
        <button
          onClick={() => setActiveMethod('list')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeMethod === 'list'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListBulletIcon className="h-5 w-5" />
          <span>リスト選択</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {activeMethod === 'voice' && (
            <div className="card text-center">
              <div className="mb-6">
                <button
                  onClick={() => router.push('/dashboard/voice-order')}
                  className="w-24 h-24 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg flex items-center justify-center"
                >
                  <MicrophoneIcon className="h-10 w-10" />
                </button>
              </div>
              <h3 className="text-lg font-semibold mb-2">音声で注文</h3>
              <p className="text-gray-600 mb-4">
                マイクボタンを押して、欲しい商品を話してください
              </p>
              <button
                onClick={() => router.push('/dashboard/voice-order')}
                className="btn btn-primary"
              >
                音声注文ページへ
              </button>
            </div>
          )}

          {activeMethod === 'text' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">フリー入力</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名を入力
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="例: 牛乳 1本、りんご 3個、パン 1斤"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleProcessTextInput}
                  disabled={!textInput.trim() || isProcessingText}
                  className="btn btn-primary w-full"
                >
                  {isProcessingText ? (
                    <LoadingDots />
                  ) : (
                    'アイテムを追加'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeMethod === 'list' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">リスト選択</h3>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="商品を検索..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === null
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    すべて
                  </button>
                  {(categories || []).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                        selectedCategory === category.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {isLoadingCategories ? (
                  <div className="text-center py-8">
                    <LoadingSpinner />
                    <p className="text-gray-500 mt-2">読み込み中...</p>
                  </div>
                ) : (
                  (searchResults || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{item.category?.icon || '📦'}</span>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            {item.unit && (
                              <p className="text-sm text-gray-500">{item.unit}</p>
                            )}
                            {(item.price_min || item.price_max) && (
                              <p className="text-sm text-gray-500">
                                {item.price_min && item.price_max
                                  ? `${formatCurrency(item.price_min)} - ${formatCurrency(item.price_max)}`
                                  : item.price_min
                                  ? `${formatCurrency(item.price_min)}〜`
                                  : `〜${formatCurrency(item.price_max!)}`
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddItem(item)}
                        className="btn btn-sm btn-primary"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">配送情報</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="住所を入力してください"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配送日
                  </label>
                  <input
                    type="date"
                    value={deliveryInfo.date}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, date: e.target.value }))}
                    min={minDate.toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    時間帯
                  </label>
                  <select
                    value={deliveryInfo.timeSlot}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, timeSlot: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value="morning">午前中 (9:00-12:00)</option>
                    <option value="afternoon">午後 (12:00-17:00)</option>
                    <option value="evening">夕方 (17:00-20:00)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配送メモ
                </label>
                <textarea
                  value={deliveryInfo.instructions}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="配送に関するご要望があれば入力してください"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">注文リスト</h3>
            
            {shoppingList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                まだアイテムが追加されていません
              </div>
            ) : (
              <div className="space-y-3">
                {shoppingList.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.name, String(Math.max(1, parseInt(item.qty) - 1)))}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateQuantity(item.name, e.target.value)}
                            className="w-16 p-1 text-center border border-gray-300 rounded"
                            min="1"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.name, String(parseInt(item.qty) + 1))}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {/* 価格表示・編集 */}
                        <div className="flex items-center space-x-2">
                          {editingItem === item.name ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={priceEdit.min}
                                onChange={(e) => setPriceEdit(prev => ({ ...prev, min: e.target.value }))}
                                placeholder="最小価格"
                                className="w-20 p-1 text-sm border border-gray-300 rounded"
                                min="0"
                              />
                              <span className="text-sm text-gray-500">-</span>
                              <input
                                type="number"
                                value={priceEdit.max}
                                onChange={(e) => setPriceEdit(prev => ({ ...prev, max: e.target.value }))}
                                placeholder="最大価格"
                                className="w-20 p-1 text-sm border border-gray-300 rounded"
                                min="0"
                              />
                              <button
                                onClick={handleSavePriceEdit}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelPriceEdit}
                                className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {item.price_min && item.price_max ? (
                                <span className="text-sm text-gray-500">
                                  {formatCurrency(item.price_min)} - {formatCurrency(item.price_max)}
                                </span>
                              ) : item.price_min ? (
                                <span className="text-sm text-gray-500">
                                  {formatCurrency(item.price_min)}〜
                                </span>
                              ) : item.price_max ? (
                                <span className="text-sm text-gray-500">
                                  〜{formatCurrency(item.price_max)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">価格未設定</span>
                              )}
                              <button
                                onClick={() => handleStartPriceEdit(item.name)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="価格を編集"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.name)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {shoppingList.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">合計見積もり:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {(() => {
                      const total = shoppingList.reduce((total, item) => {
                        const price = item.price_max || item.price_min || 0;
                        return total + (price * parseInt(item.qty) || 0);
                      }, 0);
                      return total > 0 ? formatCurrency(total) : '価格未設定';
                    })()}
                  </span>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  className="btn btn-primary w-full"
                >
                  {isCreatingOrder ? (
                    <LoadingDots />
                  ) : (
                    '注文を確定'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
