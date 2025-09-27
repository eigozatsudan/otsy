'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  ShoppingBagIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
  { name: '音声注文', href: '/dashboard/voice-order', icon: MicrophoneIcon },
  { name: '注文履歴', href: '/dashboard/orders', icon: ShoppingBagIcon },
  { name: 'チャット', href: '/dashboard/chat', icon: ChatBubbleLeftRightIcon },
  { name: '決済・請求', href: '/dashboard/payments', icon: CreditCardIcon },
  { name: 'プロフィール', href: '/dashboard/profile', icon: UserIcon },
  { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'ヘルプ', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <Link href="/dashboard" className="flex items-center">
                <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Otsy</span>
              </Link>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent pathname={pathname} user={user} logout={logout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Otsy</span>
            </Link>
          </div>
          <SidebarContent pathname={pathname} user={user} logout={logout} />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="text-gray-700"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          Otsy
        </div>
      </div>
    </>
  );
}

function SidebarContent({ 
  pathname, 
  user, 
  logout 
}: { 
  pathname: string; 
  user: any; 
  logout: () => void; 
}) {
  return (
    <>
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

      {/* User profile section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center px-2 py-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.lastName} {user?.firstName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
        >
          ログアウト
        </button>
      </div>
    </>
  );
}