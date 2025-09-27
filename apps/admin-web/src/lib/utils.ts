'use client';

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Admin } from '@/store/auth';
import { toast } from 'react-hot-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'たった今';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }

  return formatDate(date);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve();
      } else {
        reject(new Error('Failed to copy'));
      }
      document.body.removeChild(textArea);
    });
  }
}

// Status utilities
export function getOrderStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'new':
      return 'badge-gray';
    case 'accepted':
      return 'badge-primary';
    case 'shopping':
      return 'badge-warning';
    case 'enroute':
      return 'badge-warning';
    case 'delivered':
      return 'badge-success';
    case 'cancelled':
      return 'badge-error';
    default:
      return 'badge-gray';
  }
}

export function getOrderStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'new':
      return '新規';
    case 'accepted':
      return '受付済み';
    case 'shopping':
      return '買い物中';
    case 'enroute':
      return '配送中';
    case 'delivered':
      return '配送完了';
    case 'cancelled':
      return 'キャンセル';
    default:
      return status;
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'captured':
      return 'badge-success';
    case 'authorized':
      return 'badge-warning';
    case 'pending':
      return 'badge-gray';
    case 'refunded':
      return 'badge-primary';
    case 'failed':
      return 'badge-error';
    default:
      return 'badge-gray';
  }
}

export function getPaymentStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'captured':
      return '支払い完了';
    case 'authorized':
      return '承認済み';
    case 'pending':
      return '処理中';
    case 'refunded':
      return '返金済み';
    case 'failed':
      return '失敗';
    default:
      return status;
  }
}

export function getKycStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'badge-success';
    case 'rejected':
      return 'badge-error';
    case 'pending':
      return 'badge-warning';
    default:
      return 'badge-gray';
  }
}

export function getKycStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return '承認済み';
    case 'rejected':
      return '却下';
    case 'pending':
      return '審査中';
    default:
      return status;
  }
}

export function getRiskTierColor(tier: string): string {
  switch (tier) {
    case 'L0':
      return 'badge-success';
    case 'L1':
      return 'badge-warning';
    case 'L2':
      return 'badge-error';
    case 'L-1':
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
}

export function getRiskTierText(tier: string): string {
  switch (tier) {
    case 'L0':
      return '低リスク';
    case 'L1':
      return '中リスク';
    case 'L2':
      return '高リスク';
    case 'L-1':
      return '要注意';
    default:
      return tier;
  }
}

// Chart utilities
export function formatChartValue(value: number, type: 'currency' | 'number' | 'percentage'): string {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
    default:
      return formatNumber(value);
  }
}

export function getChartColors(): string[] {
  return [
    '#0ea5e9', // primary-500
    '#22c55e', // success-500
    '#f59e0b', // warning-500
    '#ef4444', // error-500
    '#8b5cf6', // purple-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
  ];
}

// Date utilities
export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  let from: Date;

  switch (period) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { from, to };
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Permission utilities
export function hasPermission(admin: Admin | null, permission: string): boolean {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  return admin.permissions.includes(permission);
}

export function canManageUsers(admin: Admin | null): boolean {
  return hasPermission(admin, 'manage_users');
}

export function canManageShoppers(admin: Admin | null): boolean {
  return hasPermission(admin, 'manage_shoppers');
}

export function canManageOrders(admin: Admin | null): boolean {
  return hasPermission(admin, 'manage_orders');
}

export function canManagePayments(admin: Admin | null): boolean {
  return hasPermission(admin, 'manage_payments');
}

export function canViewAuditLogs(admin: Admin | null): boolean {
  return hasPermission(admin, 'view_audit_logs');
}

export function canManageSystem(admin: Admin | null): boolean {
  return hasPermission(admin, 'manage_system');
}

// Export utilities
export function downloadCSV(data: any[], filename: string): void {
  if (data.length === 0) {
    toast.error('エクスポートするデータがありません');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}