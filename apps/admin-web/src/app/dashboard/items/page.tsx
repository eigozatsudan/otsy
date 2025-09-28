'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { itemsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  unit?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category: Category;
}

export default function ItemsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await itemsApi.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('カテゴリーの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: any) => {
    try {
      await itemsApi.createCategory(categoryData);
      toast.success('カテゴリーを作成しました');
      setShowCategoryModal(false);
      loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('カテゴリーの作成に失敗しました');
    }
  };

  const handleUpdateCategory = async (id: string, categoryData: any) => {
    try {
      await itemsApi.updateCategory(id, categoryData);
      toast.success('カテゴリーを更新しました');
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('カテゴリーの更新に失敗しました');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('このカテゴリーを削除しますか？')) return;
    
    try {
      await itemsApi.deleteCategory(id);
      toast.success('カテゴリーを削除しました');
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('カテゴリーの削除に失敗しました');
    }
  };

  const handleCreateItem = async (itemData: any) => {
    try {
      await itemsApi.createItem(itemData);
      toast.success('アイテムを作成しました');
      setShowItemModal(false);
      loadCategories();
    } catch (error) {
      console.error('Failed to create item:', error);
      toast.error('アイテムの作成に失敗しました');
    }
  };

  const handleUpdateItem = async (id: string, itemData: any) => {
    try {
      await itemsApi.updateItem(id, itemData);
      toast.success('アイテムを更新しました');
      setShowItemModal(false);
      setEditingItem(null);
      loadCategories();
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('アイテムの更新に失敗しました');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('このアイテムを削除しますか？')) return;
    
    try {
      await itemsApi.deleteItem(id);
      toast.success('アイテムを削除しました');
      loadCategories();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('アイテムの削除に失敗しました');
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchQuery || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const filteredItems = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)?.items || []
    : categories.flatMap(cat => cat.items);

  const itemsToShow = searchQuery 
    ? filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
            <p className="text-gray-600 mt-2">カテゴリーとアイテムを管理できます</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              カテゴリー追加
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowItemModal(true);
              }}
              className="btn btn-secondary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              アイテム追加
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="カテゴリーまたはアイテムを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedCategory === null
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">カテゴリー一覧</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">読み込み中...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                カテゴリーが見つかりません
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          {category.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            {category.items.length} アイテム
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.is_active ? 'アクティブ' : '非アクティブ'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">アイテム一覧</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アイテム
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsToShow.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {item.image_url ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={item.image_url}
                              alt={item.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">📦</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                          {item.unit && (
                            <div className="text-xs text-gray-400">{item.unit}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{item.category.icon}</span>
                        <span className="text-sm text-gray-900">{item.category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price_min && item.price_max ? (
                        `¥${item.price_min.toLocaleString()} - ¥${item.price_max.toLocaleString()}`
                      ) : item.price_min ? (
                        `¥${item.price_min.toLocaleString()}〜`
                      ) : item.price_max ? (
                        `〜¥${item.price_max.toLocaleString()}`
                      ) : (
                        '価格未設定'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_active ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowItemModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itemsToShow.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                アイテムが見つかりません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        />
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleUpdateItem : handleCreateItem}
        />
      )}
    </AdminLayout>
  );
}

// Category Modal Component
function CategoryModal({ 
  category, 
  onClose, 
  onSave 
}: { 
  category: Category | null; 
  onClose: () => void; 
  onSave: (id: string, data: any) => void | ((data: any) => void);
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3B82F6',
        sort_order: category.sort_order,
        is_active: category.is_active,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      onSave(category.id, formData);
    } else {
      (onSave as (data: any) => void)(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {category ? 'カテゴリー編集' : 'カテゴリー追加'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">名前</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">アイコン</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🥬"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">色</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">並び順</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  アクティブ
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {category ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Item Modal Component
function ItemModal({ 
  item, 
  categories, 
  onClose, 
  onSave 
}: { 
  item: Item | null; 
  categories: Category[]; 
  onClose: () => void; 
  onSave: (id: string, data: any) => void | ((data: any) => void);
}) {
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price_min: '',
    price_max: '',
    unit: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        category_id: item.category.id,
        name: item.name,
        description: item.description || '',
        price_min: item.price_min?.toString() || '',
        price_max: item.price_max?.toString() || '',
        unit: item.unit || '',
        image_url: item.image_url || '',
        sort_order: item.sort_order,
        is_active: item.is_active,
      });
    } else if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [item, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price_min: formData.price_min ? parseInt(formData.price_min) : undefined,
      price_max: formData.price_max ? parseInt(formData.price_max) : undefined,
    };
    
    if (item) {
      onSave(item.id, submitData);
    } else {
      (onSave as (data: any) => void)(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {item ? 'アイテム編集' : 'アイテム追加'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">カテゴリー</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">カテゴリーを選択</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">名前</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">最小価格 (円)</label>
                <input
                  type="number"
                  value={formData.price_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">最大価格 (円)</label>
                <input
                  type="number"
                  value={formData.price_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_max: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">単位</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="個、本、パックなど"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">並び順</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">画像URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                アクティブ
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {item ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
