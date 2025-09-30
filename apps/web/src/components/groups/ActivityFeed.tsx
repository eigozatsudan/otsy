'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface ActivityItem {
  id: string;
  type: 'item_added' | 'item_purchased' | 'item_cancelled' | 'member_joined' | 'member_left' | 'purchase_recorded' | 'group_created' | 'group_updated';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  metadata?: {
    itemName?: string;
    itemId?: string;
    amount?: number;
    memberCount?: number;
    groupName?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onItemClick?: (activity: ActivityItem) => void;
  className?: string;
}

export default function ActivityFeed({
  activities,
  loading = false,
  onLoadMore,
  hasMore = false,
  onItemClick,
  className = '',
}: ActivityFeedProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [filter, setFilter] = useState<'all' | 'items' | 'purchases' | 'members'>('all');

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'item_added':
        return (
          <svg className=\"w-4 h-4 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6v6m0 0v6m0-6h6m-6 0H6\" />
          </svg>
        );
      case 'item_purchased':
        return (
          <svg className=\"w-4 h-4 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
          </svg>
        );
      case 'item_cancelled':
        return (
          <svg className=\"w-4 h-4 text-error-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
          </svg>
        );
      case 'member_joined':
        return (
          <svg className=\"w-4 h-4 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z\" />
          </svg>
        );
      case 'member_left':
        return (
          <svg className=\"w-4 h-4 text-warning-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6\" />
          </svg>
        );
      case 'purchase_recorded':
        return (
          <svg className=\"w-4 h-4 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z\" />
          </svg>
        );
      case 'group_created':
        return (
          <svg className=\"w-4 h-4 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" />
          </svg>
        );
      case 'group_updated':
        return (
          <svg className=\"w-4 h-4 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z\" />
          </svg>
        );
      default:
        return (
          <svg className=\"w-4 h-4 text-neutral-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'item_added':
      case 'member_joined':
      case 'group_created':
      case 'group_updated':
        return 'bg-primary-100';
      case 'item_purchased':
      case 'purchase_recorded':
        return 'bg-success-100';
      case 'item_cancelled':
        return 'bg-error-100';
      case 'member_left':
        return 'bg-warning-100';
      default:
        return 'bg-neutral-100';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'items') return ['item_added', 'item_purchased', 'item_cancelled'].includes(activity.type);
    if (filter === 'purchases') return ['purchase_recorded'].includes(activity.type);
    if (filter === 'members') return ['member_joined', 'member_left'].includes(activity.type);
    return true;
  });

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    announce(`Filtered activities to show ${newFilter === 'all' ? 'all activities' : newFilter}`, 'polite');
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  return (
    <div className={clsx('bg-white rounded-xl shadow-mobile-sm border border-neutral-200', className)}>
      {/* Header */}
      <div className=\"p-fib-4 border-b border-neutral-100\">
        <div className=\"flex items-center justify-between mb-fib-3\">
          <h2 className=\"text-mobile-lg font-bold text-neutral-900\">
            Activity Feed
          </h2>
          <span className=\"text-mobile-sm text-neutral-500\">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
          </span>
        </div>

        {/* Filter Tabs */}
        <nav className=\"flex space-x-fib-1\" aria-label=\"Activity filters\">
          {[
            { id: 'all', label: 'All', count: activities.length },
            { id: 'items', label: 'Items', count: activities.filter(a => ['item_added', 'item_purchased', 'item_cancelled'].includes(a.type)).length },
            { id: 'purchases', label: 'Purchases', count: activities.filter(a => a.type === 'purchase_recorded').length },
            { id: 'members', label: 'Members', count: activities.filter(a => ['member_joined', 'member_left'].includes(a.type)).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id as typeof filter)}
              className={clsx(
                'px-fib-2 py-fib-1 rounded-lg text-mobile-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                {
                  'bg-primary-100 text-primary-700': filter === tab.id,
                  'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50': filter !== tab.id,
                }
              )}
              role=\"tab\"
              aria-selected={filter === tab.id}
              aria-controls=\"activity-list\"
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
        </nav>
      </div>

      {/* Activity List */}
      <div id=\"activity-list\" className=\"max-h-96 overflow-y-auto\" role=\"tabpanel\">
        {loading && filteredActivities.length === 0 ? (
          <div className=\"p-fib-4 text-center\">
            <div className=\"animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-fib-2\" />
            <p className=\"text-mobile-sm text-neutral-500\">Loading activities...</p>
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className=\"p-fib-4 space-y-fib-3\">
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className={clsx(
                    'flex items-start space-x-fib-3 p-fib-3 rounded-lg transition-colors',
                    {
                      'hover:bg-neutral-50 cursor-pointer': onItemClick,
                    }
                  )}
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reducedMotion ? {} : { opacity: 0, y: -10 }}
                  transition={reducedMotion ? {} : { duration: 0.3, delay: index * 0.05 }}
                  onClick={() => onItemClick?.(activity)}
                  role={onItemClick ? 'button' : undefined}
                  tabIndex={onItemClick ? 0 : undefined}
                  onKeyDown={onItemClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onItemClick(activity);
                    }
                  } : undefined}
                  aria-label={onItemClick ? `View details for: ${activity.description}` : undefined}
                >
                  {/* Activity Icon */}
                  <div className={clsx(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    getActivityColor(activity.type)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* User Avatar */}
                  <div className=\"flex-shrink-0 w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center overflow-hidden\">
                    {activity.userAvatar ? (
                      <img
                        src={activity.userAvatar}
                        alt={`${activity.userName}'s avatar`}
                        className=\"w-full h-full object-cover\"
                      />
                    ) : (
                      <span className=\"text-xs font-semibold text-neutral-600\">
                        {activity.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-start justify-between\">
                      <div className=\"flex-1 min-w-0\">
                        <p className=\"text-mobile-sm text-neutral-900\">
                          <span className=\"font-medium\">{activity.userName}</span>{' '}
                          <span>{activity.description}</span>
                        </p>
                        
                        {/* Metadata */}
                        {activity.metadata && (
                          <div className=\"mt-fib-1 text-mobile-xs text-neutral-500\">
                            {activity.metadata.itemName && (
                              <span className=\"font-medium text-neutral-700\">
                                "{activity.metadata.itemName}"
                              </span>
                            )}
                            {activity.metadata.amount && (
                              <span className=\"ml-fib-1 font-medium text-success-700\">
                                ${activity.metadata.amount.toFixed(2)}
                              </span>
                            )}
                            {activity.metadata.memberCount && (
                              <span className=\"ml-fib-1\">
                                ({activity.metadata.memberCount} {activity.metadata.memberCount === 1 ? 'member' : 'members'})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <time 
                        className=\"flex-shrink-0 text-mobile-xs text-neutral-500 ml-fib-2\"
                        dateTime={activity.timestamp}
                        title={new Date(activity.timestamp).toLocaleString()}
                      >
                        {formatRelativeTime(activity.timestamp)}
                      </time>
                    </div>
                  </div>

                  {/* Action Indicator */}
                  {onItemClick && (
                    <div className=\"flex-shrink-0 text-neutral-400\">
                      <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 5l7 7-7 7\" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Load More */}
            {hasMore && (
              <div className=\"text-center pt-fib-2\">
                <AccessibleButton
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={onLoadMore}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Activities'}
                </AccessibleButton>
              </div>
            )}
          </div>
        ) : (
          <div className=\"p-fib-8 text-center\">
            <div className=\"w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-fib-3\">
              <svg className=\"w-8 h-8 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
              </svg>
            </div>
            <h3 className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
              {filter === 'all' ? 'No activity yet' : `No ${filter} activity`}
            </h3>
            <p className=\"text-mobile-sm text-neutral-500 max-w-sm mx-auto\">
              {filter === 'all' 
                ? 'Group activity will appear here as members add items, make purchases, and interact with the group.'
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} activity will appear here when relevant actions are taken.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}