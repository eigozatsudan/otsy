import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency, formatRelativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface OrderCardProps {
  id: string;
  customerName: string;
  status: 'pending' | 'accepted' | 'shopping' | 'purchased' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  createdAt: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  shopperName?: string;
  onClick?: () => void;
  className?: string;
  showShopper?: boolean;
  showCustomer?: boolean;
}

const statusConfig = {
  pending: { label: '待機中', variant: 'warning' as const, color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: '受付済み', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  shopping: { label: '買い物中', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' },
  purchased: { label: '購入済み', variant: 'success' as const, color: 'bg-green-100 text-green-800' },
  delivered: { label: '配達完了', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'キャンセル', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
};

export function OrderCard({
  id,
  customerName,
  status,
  total,
  items,
  createdAt,
  deliveryAddress,
  estimatedDelivery,
  shopperName,
  onClick,
  className,
  showShopper = false,
  showCustomer = true,
}: OrderCardProps) {
  const statusInfo = statusConfig[status];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:-translate-y-1',
        onClick && 'hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">注文 #{id.slice(0, 8)}</CardTitle>
            {showCustomer && (
              <p className="text-sm text-gray-600">顧客: {customerName}</p>
            )}
            {showShopper && shopperName && (
              <p className="text-sm text-gray-600">買い物代行者: {shopperName}</p>
            )}
          </div>
          <Badge variant={statusInfo.variant} className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 注文商品 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            注文商品 ({itemCount}点)
          </h4>
          <div className="space-y-1">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} × {item.quantity}
                </span>
                {item.price && (
                  <span className="text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                )}
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-sm text-gray-500">
                他 {items.length - 3} 商品...
              </p>
            )}
          </div>
        </div>

        {/* 配達先 */}
        {deliveryAddress && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">配達先</h4>
            <p className="text-sm text-gray-600 truncate">{deliveryAddress}</p>
          </div>
        )}

        {/* 配達予定時間 */}
        {estimatedDelivery && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">配達予定</h4>
            <p className="text-sm text-gray-600">{estimatedDelivery}</p>
          </div>
        )}

        {/* フッター情報 */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {formatRelativeTime(createdAt)}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(total)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}