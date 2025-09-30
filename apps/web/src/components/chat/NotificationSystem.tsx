'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface ChatNotification {
  id: string;
  type: 'message' | 'mention' | 'thread_created' | 'item_updated';
  title: string;
  message: string;
  timestamp: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  threadId?: string;
  threadTitle?: string;
  itemId?: string;
  itemName?: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
}

interface NotificationSystemProps {
  notifications: ChatNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
  onNavigateToThread: (threadId: string) => void;
  onNavigateToItem: (itemId: string) => void;
  className?: string;
}

export default function NotificationSystem({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onNavigateToThread,
  onNavigateToItem,
  className = '',
}: NotificationSystemProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const mentionCount = notifications.filter(n => n.type === 'mention' && !n.isRead).length;

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'mentions') return notification.type === 'mention';
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Auto-announce new notifications
  useEffect(() => {
    const newNotifications = notifications.filter(n => 
      !n.isRead && 
      new Date(n.timestamp).getTime() > Date.now() - 5000 // Last 5 seconds
    );

    if (newNotifications.length > 0) {
      const highPriorityNotifications = newNotifications.filter(n => n.priority === 'high');
      
      if (highPriorityNotifications.length > 0) {
        announce(`${highPriorityNotifications.length} new important notifications`, 'assertive');
      } else {
        announce(`${newNotifications.length} new notifications`, 'polite');
      }
    }
  }, [notifications, announce]);

  const handleNotificationClick = (notification: ChatNotification) => {
    // Mark as read
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to relevant content
    if (notification.threadId) {
      onNavigateToThread(notification.threadId);
    } else if (notification.itemId) {
      onNavigateToItem(notification.itemId);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: ChatNotification['type']) => {
    switch (type) {
      case 'message':
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
          </svg>
        );
      case 'mention':
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\" />
          </svg>
        );
      case 'thread_created':
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z\" />
          </svg>
        );
      case 'item_updated':
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01\" />
          </svg>
        );
      default:
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM16 3h5v5h-5V3zM4 3h6v6H4V3z\" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type: ChatNotification['type'], priority: ChatNotification['priority']) => {
    if (priority === 'high') {
      return 'text-error-600 bg-error-100';
    }
    
    switch (type) {
      case 'mention':
        return 'text-warning-600 bg-warning-100';
      case 'message':
        return 'text-primary-600 bg-primary-100';
      case 'thread_created':
        return 'text-success-600 bg-success-100';
      case 'item_updated':
        return 'text-neutral-600 bg-neutral-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Notification Bell */}
      <AccessibleButton
        variant=\"ghost\"
        size=\"sm\"
        onClick={() => setIsOpen(!isOpen)}
        ariaLabel={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        className=\"relative\"
      >
        <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 17h5l-5 5v-5zM4.021 19.071l11.314-11.314M4.021 7.757l11.314 11.314\" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className=\"absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none\">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Mention Badge */}
        {mentionCount > 0 && (
          <span className=\"absolute -top-1 -left-1 bg-warning-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none\">
            @
          </span>
        )}
      </AccessibleButton>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className=\"fixed inset-0 z-40\"
              onClick={() => setIsOpen(false)}
              aria-hidden=\"true\"
            />

            {/* Panel */}
            <motion.div
              className=\"absolute right-0 top-full mt-fib-1 w-80 bg-white rounded-xl border border-neutral-200 shadow-mobile-lg z-50 max-h-96 overflow-hidden flex flex-col\"
              initial={reducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
              transition={reducedMotion ? {} : { duration: 0.15 }}
            >
              {/* Header */}
              <div className=\"p-fib-3 border-b border-neutral-100 flex-shrink-0\">
                <div className=\"flex items-center justify-between mb-fib-2\">
                  <h3 className=\"text-mobile-base font-semibold text-neutral-900\">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <AccessibleButton
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={onMarkAllAsRead}
                    >
                      Mark all read
                    </AccessibleButton>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className=\"flex space-x-fib-1\">
                  {[
                    { id: 'all', label: 'All', count: notifications.length },
                    { id: 'unread', label: 'Unread', count: unreadCount },
                    { id: 'mentions', label: 'Mentions', count: mentionCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id as typeof filter)}
                      className={clsx(
                        'px-fib-2 py-fib-1 rounded-lg text-mobile-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                        {
                          'bg-primary-100 text-primary-700': filter === tab.id,
                          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50': filter !== tab.id,
                        }
                      )}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={clsx(
                          'ml-fib-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                          {
                            'bg-primary-200 text-primary-800': filter === tab.id,
                            'bg-neutral-200 text-neutral-600': filter !== tab.id,
                          }
                        )}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification List */}
              <div className=\"flex-1 overflow-y-auto\">
                {filteredNotifications.length === 0 ? (
                  <div className=\"p-fib-6 text-center\">
                    <div className=\"w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-fib-2\">
                      <svg className=\"w-6 h-6 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 17h5l-5 5v-5zM4.021 19.071l11.314-11.314\" />
                      </svg>
                    </div>
                    <p className=\"text-mobile-sm text-neutral-600\">
                      {filter === 'all' ? 'No notifications' :
                       filter === 'unread' ? 'No unread notifications' :
                       'No mention notifications'}
                    </p>
                  </div>
                ) : (
                  <div className=\"p-fib-1\">
                    {filteredNotifications.map((notification) => (
                      <motion.button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={clsx(
                          'w-full text-left p-fib-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 mb-fib-1',
                          {
                            'bg-primary-50 hover:bg-primary-100': !notification.isRead,
                            'hover:bg-neutral-50': notification.isRead,
                          }
                        )}
                        whileHover={reducedMotion ? {} : { scale: 1.02 }}
                        transition={reducedMotion ? {} : { duration: 0.1 }}
                      >
                        <div className=\"flex items-start space-x-fib-2\">
                          {/* Icon */}
                          <div className={clsx(
                            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5',
                            getNotificationColor(notification.type, notification.priority)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className=\"flex-1 min-w-0\">
                            <div className=\"flex items-start justify-between mb-fib-1\">
                              <h4 className=\"text-mobile-sm font-medium text-neutral-900 truncate\">
                                {notification.title}
                              </h4>
                              <div className=\"flex items-center space-x-fib-1 ml-fib-2\">
                                {!notification.isRead && (
                                  <div className=\"w-2 h-2 bg-primary-500 rounded-full\" />
                                )}
                                <span className=\"text-mobile-xs text-neutral-500 flex-shrink-0\">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                            
                            <p className=\"text-mobile-sm text-neutral-600 line-clamp-2 mb-fib-1\">
                              {notification.message}
                            </p>

                            {/* Metadata */}
                            <div className=\"flex items-center space-x-fib-2 text-mobile-xs text-neutral-500\">
                              {notification.senderName && (
                                <span>from {notification.senderName}</span>
                              )}
                              {notification.threadTitle && (
                                <>
                                  <span>•</span>
                                  <span>in {notification.threadTitle}</span>
                                </>
                              )}
                              {notification.itemName && (
                                <>
                                  <span>•</span>
                                  <span>about {notification.itemName}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Dismiss Button */}
                          <AccessibleButton
                            variant=\"ghost\"
                            size=\"sm\"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss(notification.id);
                            }}
                            ariaLabel=\"Dismiss notification\"
                            className=\"flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity\"
                          >
                            <svg className=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
                            </svg>
                          </AccessibleButton>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing notification permissions and push notifications
export function useNotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isSupported) {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
    return null;
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}