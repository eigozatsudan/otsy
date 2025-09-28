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
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const faqData = [
  {
    category: '基本機能',
    questions: [
      {
        question: '音声注文はどのように使いますか？',
        answer: '音声注文ページでマイクボタンを押し、買い物の内容を話してください。AIが内容を理解し、ショッパーに伝達します。'
      },
      {
        question: '注文のキャンセルはできますか？',
        answer: 'ショッパーが店舗に到着する前であれば、注文をキャンセルできます。チャットページからショッパーに連絡してキャンセルを依頼してください。'
      },
      {
        question: '支払い方法は何がありますか？',
        answer: 'クレジットカード、デビットカード、電子マネー、銀行振込に対応しています。決済・請求ページから設定できます。'
      }
    ]
  },
  {
    category: '注文・配送',
    questions: [
      {
        question: '配送時間はどのくらいですか？',
        answer: '通常1-3時間でお届けします。店舗の混雑状況や距離によって変動する場合があります。'
      },
      {
        question: '配送料はかかりますか？',
        answer: '配送料は注文金額に応じて変動します。注文時に配送料を確認できます。'
      },
      {
        question: '商品が見つからない場合はどうなりますか？',
        answer: 'ショッパーがチャットで代替商品を提案します。ご了承いただけない場合は注文をキャンセルできます。'
      }
    ]
  },
  {
    category: 'アカウント・決済',
    questions: [
      {
        question: 'パスワードを忘れました',
        answer: 'ログインページの「パスワードを忘れた方」をクリックし、登録メールアドレスを入力してください。'
      },
      {
        question: '支払い情報を変更したいです',
        answer: '設定ページの決済情報から変更できます。セキュリティのため、再認証が必要な場合があります。'
      },
      {
        question: 'アカウントを削除したいです',
        answer: '設定ページのアカウント操作から削除できます。削除後はデータの復元ができませんのでご注意ください。'
      }
    ]
  },
  {
    category: 'トラブルシューティング',
    questions: [
      {
        question: '音声が認識されません',
        answer: 'マイクの許可を確認し、静かな環境で話してください。ブラウザの音声設定も確認してみてください。'
      },
      {
        question: 'チャットが送信できません',
        answer: 'インターネット接続を確認し、ページを再読み込みしてみてください。問題が続く場合はサポートにお問い合わせください。'
      },
      {
        question: '注文が反映されません',
        answer: '注文履歴ページで確認してください。反映されていない場合は、ショッパーに直接チャットで確認するか、サポートにお問い合わせください。'
      }
    ]
  }
];

const contactMethods = [
  {
    name: 'チャットサポート',
    description: '24時間対応のチャットサポート',
    icon: ChatBubbleLeftRightIcon,
    action: 'チャットを開始',
    available: true
  },
  {
    name: 'メールサポート',
    description: 'support@otsy.com',
    icon: EnvelopeIcon,
    action: 'メールを送信',
    available: true
  },
  {
    name: '電話サポート',
    description: '平日 9:00-18:00',
    icon: PhoneIcon,
    action: '03-1234-5678',
    available: false
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleExpanded = (category: string, questionIndex: number) => {
    const key = `${category}-${questionIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredFaq = faqData.filter(category => 
    selectedCategory === null || category.category === selectedCategory
  ).map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ヘルプ・サポート</h1>
        <p className="mt-1 text-sm text-gray-500">
          よくある質問やサポート情報をご確認いただけます。
        </p>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="質問を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Contact Methods */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">サポートに連絡</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {contactMethods.map((method) => (
            <div
              key={method.name}
              className={`relative rounded-lg border p-4 ${
                method.available 
                  ? 'border-gray-200 hover:border-primary-300 cursor-pointer' 
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <method.icon className={`h-6 w-6 ${
                  method.available ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    method.available ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {method.name}
                  </h3>
                  <p className={`text-xs ${
                    method.available ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {method.description}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-sm font-medium ${
                  method.available ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {method.action}
                </span>
                {!method.available && (
                  <span className="ml-2 text-xs text-gray-400">(準備中)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">カテゴリで絞り込み</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCategory === null
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          {faqData.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCategory === category.category
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-6">
        {filteredFaq.map((category) => (
          <div key={category.category} className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{category.category}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {category.questions.map((faq, index) => {
                const key = `${category.category}-${index}`;
                const isExpanded = expandedItems[key];
                
                return (
                  <div key={index} className="px-6 py-4">
                    <button
                      onClick={() => toggleExpanded(category.category, index)}
                      className="flex w-full text-left items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {faq.question}
                      </span>
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 text-sm text-gray-600">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && filteredFaq.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">検索結果が見つかりません</h3>
          <p className="mt-1 text-sm text-gray-500">
            「{searchQuery}」に一致する質問が見つかりませんでした。
          </p>
          <div className="mt-6">
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              検索をクリア
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">よく使われる操作</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">利用規約</h3>
              <p className="text-xs text-gray-500">サービス利用規約を確認</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <ShieldCheckIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">プライバシーポリシー</h3>
              <p className="text-xs text-gray-500">個人情報の取り扱い</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <ExclamationTriangleIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">不具合報告</h3>
              <p className="text-xs text-gray-500">問題を報告する</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
