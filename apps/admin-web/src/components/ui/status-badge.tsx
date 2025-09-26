import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  children: React.ReactNode;
}

export function StatusBadge({ status, variant = 'default', className, children }: StatusBadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span
      className={cn(
        'inline-flex px-2 py-1 text-xs font-semibold rounded-full status-badge',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}