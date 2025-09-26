'use client';

import Link from 'next/link';
import { 
  ShoppingBagIcon,
  CurrencyYenIcon,
  ClockIcon,
  StarIcon,
  PhoneIcon,
  CheckCircleIcon,
  MapPinIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: '柔軟な働き方',
    description: '好きな時間に、好きな場所で。あなたのライフスタイルに合わせて働けます。',
    icon: ClockIcon,
  },
  {
    name: '安定した収入',
    description: '1件あたり300円〜1,500円の報酬。頑張り次第で月10万円以上も可能です。',
    icon: CurrencyYenIcon,
  },
  {
    name: '簡単な操作',
    description: 'スマートフォンアプリで注文受付から配送完了まで、すべて簡単に管理できます。',
    icon: ShoppingBagIcon,
  },
  {
    name: '安心のサポート',
    description: '24時間365日のサポート体制で、困ったときもすぐに相談できます。',
    icon: CheckCircleIcon,
  },
];

const howItWorks = [
  {
    step: '1',
    title: '注文を受ける',
    description: 'アプリで近くの注文を確認し、条件に合うものを選んで受注します。',
    icon: ShoppingBagIcon,
  },
  {
    step: '2',
    title: '買い物をする',
    description: '指定された商品を購入し、レシートをアプリで撮影・送信します。',
    icon: CameraIcon,
  },
  {
    step: '3',
    title: 'お届けする',
    description: 'お客様の指定場所に商品をお届けし、配送完了の報告をします。',
    icon: MapPinIcon,
  },
  {
    step: '4',
    title: '報酬を受け取る',
    description: '配送完了後、報酬が自動的にアカウントに追加されます。',
    icon: CurrencyYenIcon,
  },
];

const testimonials = [
  {
    name: '佐藤 健太',
    role: 'ショッパー歴6ヶ月',
    content: '副業として始めましたが、月8万円ほど稼げています。空いた時間を有効活用できて満足です。',
    rating: 5,
    earnings: '月8万円',
  },
  {
    name: '田中 美咲',
    role: 'ショッパー歴1年',
    content: '子育ての合間にできる仕事を探していました。自分のペースで働けるので続けやすいです。',
    rating: 5,
    earnings: '月5万円',
  },
  {
    name: '山田 太郎',
    role: 'ショッパー歴3ヶ月',
    content: '運動不足解消にもなって一石二鳥。お客様からの感謝の言葉がやりがいになります。',
    rating: 5,
    earnings: '月3万円',
  },
];

const stats = [
  { name: '登録ショッパー数', value: '5,000+' },
  { name: '平均時給', value: '¥1,200' },
  { name: '月間配送件数', value: '50,000+' },
  { name: 'ショッパー満足度', value: '4.8/5' },
];

export function ShopperLandingPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">おつかいDX</span>
              <span className="ml-2 text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                ショッパー
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary"
              >
                ショッパー登録
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              あなたの時間を
              <br />
              <span className="text-primary-200">収入に変える</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              おつかいDXのショッパーとして、お買い物代行で安定した収入を得ませんか？
              好きな時間に、好きな場所で働ける新しい働き方を始めましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3"
              >
                今すぐ始める
              </Link>
              <button className="btn-outline text-lg px-8 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                収入シミュレーター
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              なぜおつかいDXショッパーが選ばれるのか
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              従来の働き方にとらわれない、新しいスタイルの収入源
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card text-center">
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              簡単4ステップで収入獲得
            </h2>
            <p className="text-lg text-gray-600">
              スマートフォンひとつで始められる、シンプルなワークフロー
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <div className="w-full h-0.5 bg-primary-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              収入シミュレーター
            </h2>
            <p className="text-lg text-gray-600">
              あなたの働き方に合わせた収入をシミュレーションしてみましょう
            </p>
          </div>
          
          <div className="card bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">1日2件</div>
                <div className="text-gray-600 mb-4">週3日稼働</div>
                <div className="text-3xl font-bold text-gray-900">月3万円</div>
                <div className="text-sm text-gray-500 mt-1">副業として最適</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">1日4件</div>
                <div className="text-gray-600 mb-4">週5日稼働</div>
                <div className="text-3xl font-bold text-gray-900">月8万円</div>
                <div className="text-sm text-gray-500 mt-1">しっかり稼ぎたい方に</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">1日6件</div>
                <div className="text-gray-600 mb-4">週6日稼働</div>
                <div className="text-3xl font-bold text-gray-900">月15万円</div>
                <div className="text-sm text-gray-500 mt-1">本格的な収入源として</div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ※収入は配送件数・距離・時間帯により変動します
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ショッパーの声
            </h2>
            <p className="text-lg text-gray-600">
              実際に活動しているショッパーからの評価
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      {testimonial.earnings}
                    </div>
                    <div className="text-xs text-gray-500">
                      平均収入
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ショッパー登録要件
            </h2>
            <p className="text-lg text-gray-600">
              以下の条件を満たす方であれば、どなたでもご登録いただけます
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">基本要件</h3>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">年齢</div>
                  <div className="text-gray-600">18歳以上</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">身分証明書</div>
                  <div className="text-gray-600">運転免許証または身分証明書</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">スマートフォン</div>
                  <div className="text-gray-600">iOS 12.0以上 または Android 8.0以上</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">推奨要件</h3>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">移動手段</div>
                  <div className="text-gray-600">自転車、バイク、自動車のいずれか</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">保冷バッグ</div>
                  <div className="text-gray-600">冷凍・冷蔵商品の配送用</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">コミュニケーション</div>
                  <div className="text-gray-600">お客様との円滑なやり取り</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐショッパーとして活動を始めませんか？
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            登録は無料。審査完了後、すぐに収入を得ることができます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3"
            >
              無料でショッパー登録
            </Link>
            <div className="flex items-center justify-center text-primary-100">
              <PhoneIcon className="h-5 w-5 mr-2" />
              <span>サポート: 0120-456-789</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <ShoppingBagIcon className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">おつかいDX</span>
              </div>
              <p className="text-gray-400">
                お買い物代行で新しい働き方を提供するプラットフォーム
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">ショッパー向け</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">ショッパー登録</Link></li>
                <li><Link href="#" className="hover:text-white">収入シミュレーター</Link></li>
                <li><Link href="#" className="hover:text-white">よくある質問</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">ヘルプセンター</Link></li>
                <li><Link href="#" className="hover:text-white">お問い合わせ</Link></li>
                <li><Link href="#" className="hover:text-white">利用規約</Link></li>
                <li><Link href="#" className="hover:text-white">プライバシーポリシー</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">お問い合わせ</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  <span>0120-456-789</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>24時間365日対応</span>
                </div>
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  <span>アプリ内チャットサポート</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 おつかいDX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}