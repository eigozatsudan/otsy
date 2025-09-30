'use client';

import Link from 'next/link';
import { 
  MicrophoneIcon, 
  ShoppingBagIcon, 
  TruckIcon, 
  CheckCircleIcon,
  StarIcon,
  PhoneIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: '音声で簡単注文',
    description: 'スマートフォンに話しかけるだけで、買い物リストを自動生成。手間なく注文できます。',
    icon: MicrophoneIcon,
  },
  {
    name: 'プロのショッパー',
    description: '厳選されたプロのショッパーが、あなたの代わりに丁寧に買い物をします。',
    icon: ShoppingBagIcon,
  },
  {
    name: '迅速な配送',
    description: '最短1時間でお届け。忙しいあなたの時間を大切にします。',
    icon: TruckIcon,
  },
  {
    name: '品質保証',
    description: '商品の品質に満足いただけない場合は、初回利用者には全額返金保証。',
    icon: CheckCircleIcon,
  },
];

const testimonials = [
  {
    name: '田中 美咲',
    role: '会社員',
    content: '仕事が忙しくて買い物に行く時間がなかったのですが、Otsyのおかげで本当に助かっています。音声で注文できるのが特に便利です。',
    rating: 5,
  },
  {
    name: '佐藤 健太',
    role: '子育て中のパパ',
    content: '小さい子供がいるとなかなか買い物に行けませんが、このサービスがあれば安心です。ショッパーの方も親切で信頼できます。',
    rating: 5,
  },
  {
    name: '山田 花子',
    role: '高齢者',
    content: '重い荷物を持つのが大変でしたが、Otsyを使い始めてから生活が楽になりました。操作も簡単で助かります。',
    rating: 5,
  },
];

const stats = [
  { name: '利用者数', value: '10,000+' },
  { name: '配送完了率', value: '99.8%' },
  { name: '平均配送時間', value: '45分' },
  { name: '顧客満足度', value: '4.9/5' },
];

export function LandingPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Otsy</span>
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
                新規登録
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
              音声で簡単
              <br />
              <span className="text-primary-200">買い物代行</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              スマートフォンに話しかけるだけで、プロのショッパーがあなたの代わりに買い物をお届け。
              忙しいあなたの時間を大切にします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="btn-primary text-lg px-8 py-3"
              >
                今すぐ始める
              </Link>
              <button className="btn-outline text-lg px-8 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                デモを見る
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              なぜOtsyが選ばれるのか
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              革新的な技術とプロのサービスで、あなたの買い物体験を変革します
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
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              簡単3ステップ
            </h2>
            <p className="text-lg text-gray-600">
              誰でも簡単に使える、シンプルな注文プロセス
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MicrophoneIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. 音声で注文
              </h3>
              <p className="text-gray-600">
                「牛乳と卵とパンを買ってきて」と話しかけるだけ。AIが自動で買い物リストを作成します。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. プロが買い物
              </h3>
              <p className="text-gray-600">
                厳選されたプロのショッパーが、あなたの代わりに丁寧に買い物をします。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. 迅速配送
              </h3>
              <p className="text-gray-600">
                最短1時間でご自宅までお届け。レシートも一緒にお渡しします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-200">
                  {stat.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              お客様の声
            </h2>
            <p className="text-lg text-gray-600">
              実際にご利用いただいているお客様からの評価
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
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐ始めませんか？
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            初回利用者には全額返金保証。リスクなしでお試しいただけます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3"
            >
              無料で始める
            </Link>
            <div className="flex items-center justify-center text-primary-100">
              <PhoneIcon className="h-5 w-5 mr-2" />
              <span>サポート: 0120-123-456</span>
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
                <span className="ml-2 text-xl font-bold">Otsy</span>
              </div>
              <p className="text-gray-400">
                音声で簡単に買い物を依頼できる、次世代の買い物代行サービス
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">買い物代行</Link></li>
                <li><Link href="#" className="hover:text-white">配送サービス</Link></li>
                <li><Link href="#" className="hover:text-white">プレミアム会員</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">よくある質問</Link></li>
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
                  <span>0120-123-456</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>24時間365日対応</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  <span>安心・安全保証</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Otsy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}