'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface GroupMember {
  id: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
  lastActive?: string;
  avatar?: string;
}

interface GroupActivity {
  id: string;
  type: 'item_added' | 'item_purchased' | 'member_joined' | 'purchase_recorded';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

interface GroupStats {
  totalItems: number;
  completedItems: number;
  totalSpent: number;
  pendingSettlements: number;
  activeMembers: number;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  unreadCount?: number;
  stats: GroupStats;
  members: GroupMember[];
  recentActivity: GroupActivity[];
}

interface GroupDashboardProps {
  group: Group;
  currentUserId: string;
  onInviteMembers: () => void;
  onManageMembers: () => void;
  onViewShoppingList: () => void;
  onViewPurchases: () => void;
  onViewChat: () => void;
  onEditGroup: () => void;
  className?: string;
}

export default function GroupDashboard({
  group,
  currentUserId,
  onInviteMembers,
  onManageMembers,
  onViewShoppingList,
  onViewPurchases,
  onViewChat,
  onEditGroup,
  className = '',
}: GroupDashboardProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'members'>('overview');

  const currentUser = group.members.find(m => m.id === currentUserId);
  const isOwner = currentUser?.role === 'owner';

  const completionRate = group.stats.totalItems > 0 
    ? Math.round((group.stats.completedItems / group.stats.totalItems) * 100)
    : 0;

  const handleTabChange = (tab: 'overview' | 'activity' | 'members') => {
    setActiveTab(tab);
    announce(`Switched to ${tab} tab`, 'polite');
  };

  return (
    <div className={clsx('bg-white rounded-xl shadow-mobile-sm border border-neutral-200', className)}>
      {/* Header */}
      <div className=\"p-fib-4 border-b border-neutral-100\">
        <div className=\"flex items-start justify-between\">
          <div className=\"min-w-0 flex-1\">
            <h1 className=\"text-mobile-xl font-bold text-neutral-900 truncate\">
              {group.name}
            </h1>
            {group.description && (
              <p className=\"text-mobile-base text-neutral-600 mt-fib-1\">
                {group.description}
              </p>
            )}
            <div className=\"flex items-center space-x-fib-3 mt-fib-2 text-mobile-sm text-neutral-500\">
              <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
              <span>•</span>
              <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className=\"flex items-center space-x-fib-2 ml-fib-3\">
            <AccessibleButton
              variant=\"outline\"
              size=\"sm\"
              onClick={onInviteMembers}
              ariaLabel=\"Invite new members to group\"
            >
              <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6v6m0 0v6m0-6h6m-6 0H6\" />
              </svg>
              Invite
            </AccessibleButton>

            {isOwner && (
              <AccessibleButton
                variant=\"ghost\"
                size=\"sm\"
                onClick={onEditGroup}
                ariaLabel=\"Edit group settings\"
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z\" />
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 12a3 3 0 11-6 0 3 3 0 016 0z\" />
                </svg>
              </AccessibleButton>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className=\"p-fib-4 border-b border-neutral-100\">
        <div className=\"grid grid-cols-2 lg:grid-cols-4 gap-fib-3\">
          <motion.div
            className=\"bg-primary-50 rounded-xl p-fib-3 border border-primary-100\"
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            transition={reducedMotion ? {} : { duration: 0.15 }}
          >
            <div className=\"text-mobile-sm font-medium text-primary-700 mb-fib-1\">
              Shopping Progress
            </div>
            <div className=\"text-mobile-lg font-bold text-primary-900\">
              {completionRate}%
            </div>
            <div className=\"text-mobile-xs text-primary-600 mt-fib-1\">
              {group.stats.completedItems} of {group.stats.totalItems} items
            </div>
          </motion.div>

          <motion.div
            className=\"bg-success-50 rounded-xl p-fib-3 border border-success-100\"
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            transition={reducedMotion ? {} : { duration: 0.15 }}
          >
            <div className=\"text-mobile-sm font-medium text-success-700 mb-fib-1\">
              Total Spent
            </div>
            <div className=\"text-mobile-lg font-bold text-success-900\">
              ${group.stats.totalSpent.toFixed(2)}
            </div>
            <div className=\"text-mobile-xs text-success-600 mt-fib-1\">
              This month
            </div>
          </motion.div>

          <motion.div
            className=\"bg-warning-50 rounded-xl p-fib-3 border border-warning-100\"
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            transition={reducedMotion ? {} : { duration: 0.15 }}
          >
            <div className=\"text-mobile-sm font-medium text-warning-700 mb-fib-1\">
              Pending Settlements
            </div>
            <div className=\"text-mobile-lg font-bold text-warning-900\">
              {group.stats.pendingSettlements}
            </div>
            <div className=\"text-mobile-xs text-warning-600 mt-fib-1\">
              Need attention
            </div>
          </motion.div>

          <motion.div
            className=\"bg-neutral-50 rounded-xl p-fib-3 border border-neutral-200\"
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            transition={reducedMotion ? {} : { duration: 0.15 }}
          >
            <div className=\"text-mobile-sm font-medium text-neutral-700 mb-fib-1\">
              Active Members
            </div>
            <div className=\"text-mobile-lg font-bold text-neutral-900\">
              {group.stats.activeMembers}
            </div>
            <div className=\"text-mobile-xs text-neutral-600 mt-fib-1\">
              Last 7 days
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className=\"p-fib-4 border-b border-neutral-100\">
        <h2 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
          Quick Actions
        </h2>
        <div className=\"grid grid-cols-2 lg:grid-cols-4 gap-fib-2\">
          <AccessibleButton
            variant=\"outline\"
            size=\"md\"
            fullWidth
            onClick={onViewShoppingList}
            className=\"flex-col h-auto py-fib-3\"
          >
            <svg className=\"w-6 h-6 mb-fib-1 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01\" />
            </svg>
            <span className=\"text-mobile-sm font-medium\">Shopping List</span>
            {group.stats.totalItems > 0 && (
              <span className=\"text-mobile-xs text-neutral-500 mt-fib-1\">
                {group.stats.totalItems} items
              </span>
            )}
          </AccessibleButton>

          <AccessibleButton
            variant=\"outline\"
            size=\"md\"
            fullWidth
            onClick={onViewPurchases}
            className=\"flex-col h-auto py-fib-3\"
          >
            <svg className=\"w-6 h-6 mb-fib-1 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z\" />
            </svg>
            <span className=\"text-mobile-sm font-medium\">Purchases</span>
            <span className=\"text-mobile-xs text-neutral-500 mt-fib-1\">
              ${group.stats.totalSpent.toFixed(2)}
            </span>
          </AccessibleButton>

          <AccessibleButton
            variant=\"outline\"
            size=\"md\"
            fullWidth
            onClick={onViewChat}
            className=\"flex-col h-auto py-fib-3\"
          >
            <div className=\"relative\">
              <svg className=\"w-6 h-6 mb-fib-1 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
              </svg>
              {group.unreadCount && group.unreadCount > 0 && (
                <span className=\"absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none\">
                  {group.unreadCount > 9 ? '9+' : group.unreadCount}
                </span>
              )}
            </div>
            <span className=\"text-mobile-sm font-medium\">Group Chat</span>
            {group.unreadCount && group.unreadCount > 0 && (
              <span className=\"text-mobile-xs text-error-600 mt-fib-1\">
                {group.unreadCount} unread
              </span>
            )}
          </AccessibleButton>

          <AccessibleButton
            variant=\"outline\"
            size=\"md\"
            fullWidth
            onClick={onManageMembers}
            className=\"flex-col h-auto py-fib-3\"
          >
            <svg className=\"w-6 h-6 mb-fib-1 text-neutral-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z\" />
            </svg>
            <span className=\"text-mobile-sm font-medium\">Members</span>
            <span className=\"text-mobile-xs text-neutral-500 mt-fib-1\">
              {group.memberCount} people
            </span>
          </AccessibleButton>
        </div>
      </div>

      {/* Tabs */}
      <div className=\"border-b border-neutral-200\">
        <nav className=\"flex space-x-fib-4 px-fib-4\" aria-label=\"Dashboard tabs\">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: 'Recent Activity' },
            { id: 'members', label: 'Members' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={clsx(
                'py-fib-3 px-fib-1 border-b-2 font-medium text-mobile-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                {
                  'border-primary-500 text-primary-600': activeTab === tab.id,
                  'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300': activeTab !== tab.id,
                }
              )}
              role=\"tab\"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className=\"p-fib-4\">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div id=\"overview-panel\" role=\"tabpanel\" aria-labelledby=\"overview-tab\">
            <div className=\"space-y-fib-4\">
              {/* Progress Overview */}
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-2\">
                  Shopping Progress
                </h3>
                <div className=\"bg-neutral-200 rounded-full h-2 mb-fib-2\">
                  <motion.div
                    className=\"bg-primary-500 h-2 rounded-full\"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={reducedMotion ? {} : { duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className=\"text-mobile-sm text-neutral-600\">
                  {group.stats.completedItems} of {group.stats.totalItems} items completed ({completionRate}%)
                </p>
              </div>

              {/* Recent Purchases */}
              {group.stats.totalSpent > 0 && (
                <div>
                  <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-2\">
                    Recent Spending
                  </h3>
                  <div className=\"bg-success-50 rounded-xl p-fib-3 border border-success-100\">
                    <div className=\"flex items-center justify-between\">
                      <div>
                        <p className=\"text-mobile-sm font-medium text-success-900\">
                          Total spent this month
                        </p>
                        <p className=\"text-mobile-xs text-success-700 mt-fib-1\">
                          Across {group.stats.completedItems} purchases
                        </p>
                      </div>
                      <div className=\"text-mobile-xl font-bold text-success-900\">
                        ${group.stats.totalSpent.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Settlements */}
              {group.stats.pendingSettlements > 0 && (
                <div>
                  <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-2\">
                    Pending Settlements
                  </h3>
                  <div className=\"bg-warning-50 rounded-xl p-fib-3 border border-warning-100\">
                    <div className=\"flex items-center justify-between\">
                      <div>
                        <p className=\"text-mobile-sm font-medium text-warning-900\">
                          {group.stats.pendingSettlements} settlements need attention
                        </p>
                        <p className=\"text-mobile-xs text-warning-700 mt-fib-1\">
                          Review and settle outstanding balances
                        </p>
                      </div>
                      <AccessibleButton
                        variant=\"outline\"
                        size=\"sm\"
                        onClick={onViewPurchases}
                      >
                        Review
                      </AccessibleButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div id=\"activity-panel\" role=\"tabpanel\" aria-labelledby=\"activity-tab\">
            <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
              Recent Activity
            </h3>
            {group.recentActivity.length > 0 ? (
              <div className=\"space-y-fib-3\">
                {group.recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    className=\"flex items-start space-x-fib-2 p-fib-2 rounded-lg hover:bg-neutral-50\"
                    initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                    transition={reducedMotion ? {} : { duration: 0.3 }}
                  >
                    <div className=\"flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center\">
                      {activity.type === 'item_added' && (
                        <svg className=\"w-4 h-4 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6v6m0 0v6m0-6h6m-6 0H6\" />
                        </svg>
                      )}
                      {activity.type === 'item_purchased' && (
                        <svg className=\"w-4 h-4 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                        </svg>
                      )}
                      {activity.type === 'member_joined' && (
                        <svg className=\"w-4 h-4 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\" />
                        </svg>
                      )}
                      {activity.type === 'purchase_recorded' && (
                        <svg className=\"w-4 h-4 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z\" />
                        </svg>
                      )}
                    </div>
                    <div className=\"flex-1 min-w-0\">
                      <p className=\"text-mobile-sm text-neutral-900\">
                        <span className=\"font-medium\">{activity.userName}</span> {activity.description}
                      </p>
                      <p className=\"text-mobile-xs text-neutral-500 mt-fib-1\">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className=\"text-center py-fib-5\">
                <svg className=\"w-12 h-12 text-neutral-400 mx-auto mb-fib-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
                </svg>
                <p className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
                  No recent activity
                </p>
                <p className=\"text-mobile-sm text-neutral-500\">
                  Group activity will appear here as members add items and make purchases
                </p>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div id=\"members-panel\" role=\"tabpanel\" aria-labelledby=\"members-tab\">
            <div className=\"flex items-center justify-between mb-fib-3\">
              <h3 className=\"text-mobile-base font-semibold text-neutral-900\">
                Group Members ({group.members.length})
              </h3>
              <AccessibleButton
                variant=\"primary\"
                size=\"sm\"
                onClick={onInviteMembers}
              >
                Invite Members
              </AccessibleButton>
            </div>
            <div className=\"space-y-fib-2\">
              {group.members.map((member) => (
                <motion.div
                  key={member.id}
                  className=\"flex items-center space-x-fib-3 p-fib-3 rounded-lg border border-neutral-200 hover:border-neutral-300\"
                  whileHover={reducedMotion ? {} : { scale: 1.01 }}
                  transition={reducedMotion ? {} : { duration: 0.15 }}
                >
                  {/* Avatar */}
                  <div className=\"flex-shrink-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center\">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={`${member.displayName}'s avatar`}
                        className=\"w-full h-full rounded-full object-cover\"
                      />
                    ) : (
                      <span className=\"text-mobile-sm font-semibold text-white\">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-center space-x-fib-2\">
                      <h4 className=\"text-mobile-sm font-medium text-neutral-900 truncate\">
                        {member.displayName}
                      </h4>
                      {member.role === 'owner' && (
                        <span className=\"inline-flex items-center px-fib-1 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800\">
                          Owner
                        </span>
                      )}
                      {member.id === currentUserId && (
                        <span className=\"inline-flex items-center px-fib-1 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800\">
                          You
                        </span>
                      )}
                    </div>
                    <p className=\"text-mobile-xs text-neutral-500 truncate\">
                      {member.email}
                    </p>
                    <p className=\"text-mobile-xs text-neutral-500 mt-fib-1\">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                      {member.lastActive && (
                        <span> • Last active {new Date(member.lastActive).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>

                  {/* Member Actions */}
                  {isOwner && member.id !== currentUserId && (
                    <div className=\"flex-shrink-0\">
                      <AccessibleButton
                        variant=\"ghost\"
                        size=\"sm\"
                        onClick={() => {
                          // Handle member management
                          onManageMembers();
                        }}
                        ariaLabel={`Manage ${member.displayName}`}
                      >
                        <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z\" />
                        </svg>
                      </AccessibleButton>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}