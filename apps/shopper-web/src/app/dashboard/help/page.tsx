'use client';

import { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '注文の受け方は？',
    answer: 'ダッシュボードの「利用可能な注文」から、受けたい注文を選択して「この注文を受ける」ボタンを押してください。注文を受けると、お客様とのチャットが開始されます。',
    category: '基本操作'
  },
  {
    id: '2',
    question: '収入はいつ支払われますか？',
    answer: '毎週月曜日に前週分の収入が銀行口座に振り込まれます。初回の出金までに1-2週間かかる場合があります。',
    category: '収入・支払い'
  },
  {
    id: '3',
    question: '注文をキャンセルできますか？',
    answer: '注文を受けた後は、お客様との合意の上でキャンセルが可能です。ただし、頻繁なキャンセルは評価に影響する場合があります。',
    category: '注文管理'
  },
  {
    id: '4',
    question: '評価はどのように決まりますか？',
    answer: 'お客様からの評価、注文完了率、レスポンス時間、商品の品質などが総合的に評価されます。',
    category: '評価・ランキング'
  },
  {
    id: '5',
    question: '位置情報は必要ですか？',
    answer: 'はい、正確な位置情報が必要です。これにより、お客様により正確な到着予定時間を提供できます。',
    category: '位置情報'
  },
  {
    id: '6',
    question: 'レシート撮影は必須ですか？',
    answer: 'はい、購入した商品のレシートを撮影してアップロードする必要があります。これは透明性と信頼性を保つためです。',
    category: 'レシート・証明'
  },
  {
    id: '7',
    question: '複数の注文を同時に受けられますか？',
    answer: 'はい、効率的に複数の注文を同時に処理できます。ただし、お客様への影響を考慮して適切に管理してください。',
    category: '注文管理'
  },
  {
    id: '8',
    question: '問題が発生した場合はどうすればいいですか？',
    answer: 'まずはお客様とのチャットで解決を試みてください。解決しない場合は、サポートチームに連絡してください。',
    category: 'トラブル対応'
  }
];

const articles: Article[] = [
  {
    id: '1',
    title: '買い物代行の基本ガイド',
    content: '買い物代行の基本的な流れと注意点について説明します。\n\n1. 注文の受付\n2. お客様との連絡\n3. 商品の購入\n4. 配送\n5. 完了報告\n\n各ステップで注意すべき点を詳しく説明しています。',
    category: '基本ガイド',
    lastUpdated: '2024-01-10'
  },
  {
    id: '2',
    title: '効率的なルート計画のコツ',
    content: '複数の注文を効率的に処理するためのルート計画について説明します。\n\n- 店舗の位置関係を把握する\n- 商品の種類でグループ化する\n- 冷凍・冷蔵商品は最後に購入する\n- 交通状況を考慮する',
    category: '効率化',
    lastUpdated: '2024-01-08'
  },
  {
    id: '3',
    title: 'お客様とのコミュニケーション',
    content: 'お客様との良好な関係を築くためのコミュニケーションのコツを紹介します。\n\n- 丁寧な言葉遣い\n- 定期的な状況報告\n- 問題発生時の迅速な対応\n- 感謝の気持ちを伝える',
    category: 'コミュニケーション',
    lastUpdated: '2024-01-05'
  },
  {
    id: '4',
    title: '安全な配送のための注意点',
    content: '商品を安全に配送するための注意点をまとめました。\n\n- 商品の温度管理\n- 破損防止の梱包\n- 配送時間の遵守\n- お客様への連絡',
    category: '安全・配送',
    lastUpdated: '2024-01-03'
  }
];

const categories = [
  'すべて',
  '基本操作',
  '収入・支払い',
  '注文管理',
  '評価・ランキング',
  '位置情報',
  'レシート・証明',
  'トラブル対応',
  '基本ガイド',
  '効率化',
  'コミュニケーション',
  '安全・配送'
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [showContactForm, setShowContactForm] = useState(false);

  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'すべて' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'すべて' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際のAPI呼び出しに置き換え
    console.log('Contact form submitted:', contactForm);
    setShowContactForm(false);
    setContactForm({ subject: '', message: '', priority: 'medium' });
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ヘルプセンター</h1>
          <p className="text-gray-600 mt-1">
            よくある質問やサポート情報を確認できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowContactForm(true)}
            className="btn-primary flex items-center"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            サポートに連絡
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="質問やキーワードを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">利用ガイド</h3>
              <p className="text-sm text-gray-500">基本的な使い方を確認</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <PhoneIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">電話サポート</h3>
              <p className="text-sm text-gray-500">03-1234-5678</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <EnvelopeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">メールサポート</h3>
              <p className="text-sm text-gray-500">support@okaimono.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">カテゴリ</h3>
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedCategory === category
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* FAQ Section */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-6">よくある質問</h3>
            <div className="space-y-4">
              {filteredFAQ.length === 0 ? (
                <div className="text-center py-8">
                  <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    該当する質問が見つかりません
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    検索条件を変更してお試しください
                  </p>
                </div>
              ) : (
                filteredFAQ.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleFAQ(item.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {item.question}
                      </span>
                      {expandedFAQ === item.id ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {expandedFAQ === item.id && (
                      <div className="px-4 pb-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700 mt-3">
                          {item.answer}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Articles Section */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-6">ヘルプ記事</h3>
            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    該当する記事が見つかりません
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    検索条件を変更してお試しください
                  </p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {article.content}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {article.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            更新日: {article.lastUpdated}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedArticle(article)}
                        className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        詳細を見る
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">サポートに連絡</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  件名
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="input"
                  placeholder="問題の件名を入力してください"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  優先度
                </label>
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="input"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">緊急</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="input"
                  placeholder="問題の詳細を入力してください"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="btn-outline flex-1"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  送信
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedArticle.title}</h3>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedArticle.category}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                更新日: {selectedArticle.lastUpdated}
              </span>
            </div>

            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {selectedArticle.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-gradient-to-r from-success-50 to-success-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-6 w-6 text-success-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-success-900">
              💡 ヘルプの使い方
            </h3>
            <p className="mt-1 text-sm text-success-700">
              まずはよくある質問を確認してみてください。解決しない場合は、サポートチームに直接お問い合わせいただけます。
              緊急の場合は電話サポートをご利用ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
