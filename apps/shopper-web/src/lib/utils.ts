import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  if (!date) {
    return '--';
  }
  
  const dateObj = new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return '--';
  }
  
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  if (!date) {
    return '--';
  }
  
  const dateObj = new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDateTime:', date);
    return '--';
  }
  
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatTime(date: string | Date): string {
  if (!date) {
    return '--:--';
  }
  
  const dateObj = new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatTime:', date);
    return '--:--';
  }
  
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) {
    return '--';
  }
  
  const now = new Date();
  const targetDate = new Date(date);
  
  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    console.warn('Invalid date provided to formatRelativeTime:', date);
    return '--';
  }
  
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

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}時間`;
  }
  
  return `${hours}時間${remainingMinutes}分`;
}

export function calculateEarnings(orderAmount: number, distance: number): number {
  // Base commission: 15% of order amount
  const baseCommission = orderAmount * 0.15;
  
  // Distance bonus: ¥50 per km
  const distanceBonus = (distance / 1000) * 50;
  
  // Minimum earning: ¥300
  const minEarning = 300;
  
  return Math.max(baseCommission + distanceBonus, minEarning);
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

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Japanese phone number validation
  const phoneRegex = /^(\+81|0)[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

export function formatPhoneNumber(phone: string): string {
  // Format Japanese phone number
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('81')) {
    // International format
    const number = cleaned.substring(2);
    if (number.length === 10) {
      return `+81 ${number.substring(0, 2)} ${number.substring(2, 6)} ${number.substring(6)}`;
    }
    if (number.length === 11) {
      return `+81 ${number.substring(0, 3)} ${number.substring(3, 7)} ${number.substring(7)}`;
    }
  } else if (cleaned.startsWith('0')) {
    // Domestic format
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    if (cleaned.length === 11) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
    }
  }
  
  return phone;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateAvatarUrl(name: string): string {
  const initials = encodeURIComponent(name.split(' ').map(n => n[0]).join(''));
  return `https://ui-avatars.com/api/?name=${initials}&background=0ea5e9&color=fff&size=128`;
}

// Geolocation utilities
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Status utilities
export function getStatusColor(status: 'available' | 'busy' | 'offline'): string {
  switch (status) {
    case 'available':
      return 'text-success-600';
    case 'busy':
      return 'text-warning-600';
    case 'offline':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

export function getStatusText(status: 'available' | 'busy' | 'offline'): string {
  switch (status) {
    case 'available':
      return '対応可能';
    case 'busy':
      return '対応中';
    case 'offline':
      return 'オフライン';
    default:
      return status;
  }
}

// Rating utilities
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-success-600';
  if (rating >= 4.0) return 'text-warning-600';
  if (rating >= 3.0) return 'text-warning-500';
  return 'text-error-600';
}

// Time utilities
export function getTimeSlotText(timeSlot: string): string {
  switch (timeSlot) {
    case 'morning':
      return '午前中 (9:00-12:00)';
    case 'afternoon':
      return '午後 (13:00-17:00)';
    case 'evening':
      return '夕方 (17:00-20:00)';
    default:
      return timeSlot;
  }
}

export function isWithinTimeSlot(timeSlot: string): boolean {
  const now = new Date();
  const hour = now.getHours();

  switch (timeSlot) {
    case 'morning':
      return hour >= 9 && hour < 12;
    case 'afternoon':
      return hour >= 13 && hour < 17;
    case 'evening':
      return hour >= 17 && hour < 20;
    default:
      return true;
  }
}

// Image utilities
export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}