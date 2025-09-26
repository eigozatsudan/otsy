import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary-600', sizeClasses[size], className)} />
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('loading-dots text-primary-600', className)}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse-slow', className)}>
      <div className="bg-gray-200 rounded-lg h-4 w-full mb-2"></div>
      <div className="bg-gray-200 rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded-lg h-4 w-1/2"></div>
    </div>
  );
}