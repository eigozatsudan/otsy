import * as React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../utils/cn';

export type OrderStatus = 'pending' | 'accepted' | 'shopping' | 'purchased' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  icon?: string;
}

const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  pending: { label: '待機中', variant: 'warning', icon: '⏳' },
  accepted: { label: '受付済み', variant: 'default', icon: '✅' },
  shopping: { label: '買い物中', variant: 'default', icon: '🛒' },
  purchased: { label: '購入済み', variant: 'success', icon: '💰' },
  delivered: { label: '配達完了', variant: 'secondary', icon: '📦' },
  cancelled: { label: 'キャンセル', variant: 'destructive', icon: '❌' },
};

const paymentStatusConfig: Record<PaymentStatus, StatusConfig> = {
  pending: { label: '保留中', variant: 'warning', icon: '⏳' },
  authorized: { label: '承認済み', variant: 'default', icon: '🔒' },
  captured: { label: '確定済み', variant: 'success', icon: '✅' },
  refunded: { label: '返金済み', variant: 'secondary', icon: '↩️' },
  failed: { label: '失敗', variant: 'destructive', icon: '❌' },
};

const userStatusConfig: Record<UserStatus, StatusConfig> = {
  active: { label: 'アクティブ', variant: 'success', icon: '✅' },
  inactive: { label: '非アクティブ', variant: 'secondary', icon: '⏸️' },
  suspended: { label: '停止中', variant: 'destructive', icon: '🚫' },
};

const kycStatusConfig: Record<KYCStatus, StatusConfig> = {
  pending: { label: '審査待ち', variant: 'warning', icon: '⏳' },
  approved: { label: '承認済み', variant: 'success', icon: '✅' },
  rejected: { label: '却下', variant: 'destructive', icon: '❌' },
  under_review: { label: '審査中', variant: 'default', icon: '🔍' },
};

type StatusIndicatorProps = 
  | {
      type: 'order';
      status: OrderStatus;
      showIcon?: boolean;
      className?: string;
    }
  | {
      type: 'payment';
      status: PaymentStatus;
      showIcon?: boolean;
      className?: string;
    }
  | {
      type: 'user';
      status: UserStatus;
      showIcon?: boolean;
      className?: string;
    }
  | {
      type: 'kyc';
      status: KYCStatus;
      showIcon?: boolean;
      className?: string;
    };

export function StatusIndicator({ type, status, showIcon = true, className }: StatusIndicatorProps) {
  let config: StatusConfig;

  switch (type) {
    case 'order':
      config = orderStatusConfig[status as OrderStatus];
      break;
    case 'payment':
      config = paymentStatusConfig[status as PaymentStatus];
      break;
    case 'user':
      config = userStatusConfig[status as UserStatus];
      break;
    case 'kyc':
      config = kycStatusConfig[status as KYCStatus];
      break;
    default:
      config = { label: status, variant: 'default' };
  }

  return (
    <Badge variant={config.variant} className={cn('inline-flex items-center gap-1', className)}>
      {showIcon && config.icon && <span>{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

interface StatusTimelineProps {
  type: 'order';
  currentStatus: OrderStatus;
  statusHistory?: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  className?: string;
}

export function StatusTimeline({ type, currentStatus, statusHistory, className }: StatusTimelineProps) {
  const allStatuses: OrderStatus[] = ['pending', 'accepted', 'shopping', 'purchased', 'delivered'];
  const currentIndex = allStatuses.indexOf(currentStatus);

  return (
    <div className={cn('space-y-4', className)}>
      {allStatuses.map((status, index) => {
        const config = orderStatusConfig[status];
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const historyItem = statusHistory?.find(h => h.status === status);

        return (
          <div key={status} className="flex items-center space-x-3">
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm',
                isCompleted
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            <div className="flex-1">
              <div className={cn(
                'font-medium',
                isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
              )}>
                {config.label}
              </div>
              {historyItem && (
                <div className="text-sm text-gray-500">
                  {new Date(historyItem.timestamp).toLocaleString('ja-JP')}
                  {historyItem.note && (
                    <div className="text-xs text-gray-400 mt-1">{historyItem.note}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}