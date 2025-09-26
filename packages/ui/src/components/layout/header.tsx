import * as React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuClick?: () => void;
  onLogout?: () => void;
  actions?: React.ReactNode;
  className?: string;
  showMenuButton?: boolean;
}

export function Header({
  title,
  subtitle,
  user,
  onMenuClick,
  onLogout,
  actions,
  className,
  showMenuButton = false,
}: HeaderProps) {
  return (
    <header className={cn('bg-white border-b border-gray-200 px-4 py-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          )}
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {actions}
          
          {user && (
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}