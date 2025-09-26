'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CurrencyYenIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  MapIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
  { name: '利用可能な注文', href: '/dashboard/orders/available', icon: ShoppingBagIcon },
  { name: '進行中の注文', href: '/dashboard/orders/active', icon: ClipboardDocumentListIcon },
  { name: '注文履歴', href: '/dashboard/orders/history', icon: ClipboardDocumentListIcon },
  { name: 'チャット', href: '/dashboard/chat', icon: ChatBubbleLeftRightIcon },
  { name: '収入管理', href: '/dashboard/earnings', icon: CurrencyYenIcon },
  { name: 'プロフィール', href: '/dashboard/profile', icon: UserIcon },
  { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'ヘルプ', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
];

const quickActions = [
  { name: 'レシート撮影', href: '/dashboard/receipt-capture', icon: CameraIcon, color: 'text-primary-600' },
  { name: '現在地更新', href: '/dashboard/location', icon: MapIcon, color: 'text-success-600' },
];

export function ShopperNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:top-16">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
          {/* Quick actions */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              クイックアクション
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <action.icon className={cn('h-5 w-5 mr-3', action.color)} />
                  {action.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Main navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon
                          className={cn(
                            pathname === item.href ? 'text-primary-700' : 'text-gray-400 group-hover:text-primary-700',
                            'h-6 w-6 shrink-0'
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Status summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-success-900 mb-2">
                今日の実績
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-success-700">完了した注文</span>
                  <span className="font-medium text-success-900">3件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-success-700">稼働時間</span>
                  <span className="font-medium text-success-900">4時間</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-success-700">収入</span>
                  <span className="font-bold text-success-900">¥2,400</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 text-xs font-medium rounded-lg',
                pathname === item.href
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="truncate">{item.name.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}