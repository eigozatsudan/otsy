import * as React from 'react';
import { cn } from '../../utils/cn';

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
}

interface SidebarProps {
  title: string;
  navigation: NavigationItem[];
  currentPath: string;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  footer?: React.ReactNode;
}

export function Sidebar({
  title,
  navigation,
  currentPath,
  isOpen = true,
  onClose,
  className,
  footer,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 overflow-y-auto">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <NavigationLink
                key={item.id}
                item={item}
                currentPath={currentPath}
                level={0}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        {footer && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

interface NavigationLinkProps {
  item: NavigationItem;
  currentPath: string;
  level: number;
}

function NavigationLink({ item, currentPath, level }: NavigationLinkProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isActive = currentPath === item.href;
  const hasChildren = item.children && item.children.length > 0;
  const isParentActive = hasChildren && item.children?.some(child => currentPath === child.href);

  React.useEffect(() => {
    if (isParentActive) {
      setIsExpanded(true);
    }
  }, [isParentActive]);

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <a
        href={item.href}
        onClick={handleClick}
        className={cn(
          'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
          level > 0 && 'ml-4',
          isActive || isParentActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        {item.icon && (
          <span className="mr-3 text-lg">{item.icon}</span>
        )}
        <span className="flex-1">{item.name}</span>
        
        {item.badge && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {item.badge}
          </span>
        )}
        
        {hasChildren && (
          <svg
            className={cn(
              'ml-2 h-4 w-4 transition-transform',
              isExpanded ? 'rotate-90' : 'rotate-0'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </a>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavigationLink
              key={child.id}
              item={child}
              currentPath={currentPath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}