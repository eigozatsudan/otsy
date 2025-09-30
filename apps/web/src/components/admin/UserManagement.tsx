'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput } from '@/components/accessibility/AccessibleForm';

interface User {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  lastActiveAt?: string;
  status: 'active' | 'suspended' | 'banned';
  suspensionEndDate?: string;
  suspensionReason?: string;
  groupCount: number;
  messageCount: number;
  purchaseCount: number;
  reportCount: number;
  isOnline: boolean;
}

interface UserManagementProps {
  users: User[];
  onSuspendUser: (userId: string, duration: number, reason: string) => Promise<void>;
  onUnsuspendUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string, reason: string) => Promise<void>;
  onViewUserActivity: (userId: string) => void;
  className?: string;
}

export default function UserManagement({
  users,
  onSuspendUser,
  onUnsuspendUser,
  onDeleteUser,
  onViewUserActivity,
  className = '',
}: UserManagementProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'lastActive' | 'reports'>('created');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionDuration, setSuspensionDuration] = useState(1);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (searchQuery && !user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'lastActive':
          if (!a.lastActiveAt && !b.lastActiveAt) return 0;
          if (!a.lastActiveAt) return 1;
          if (!b.lastActiveAt) return -1;
          return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
        case 'reports':
          return b.reportCount - a.reportCount;
        default:
          return 0;
      }
    });

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspensionReason.trim()) return;
    
    setIsProcessing(true);
    
    try {
      await onSuspendUser(selectedUser.id, suspensionDuration, suspensionReason.trim());
      announce(`${selectedUser.displayName} suspended for ${suspensionDuration} days`, 'polite');
      setShowSuspensionModal(false);
      setSelectedUser(null);
      setSuspensionReason('');
    } catch (error) {
      announce('Failed to suspend user', 'assertive');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    setIsProcessing(true);
    
    try {
      await onUnsuspendUser(user.id);
      announce(`${user.displayName} unsuspended`, 'polite');
    } catch (error) {
      announce('Failed to unsuspend user', 'assertive');
    } finally {
      setIsProcessing(false);
    }
  };

  const getUserStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100';
      case 'suspended':
        return 'text-warning-600 bg-warning-100';
      case 'banned':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className={clsx('space-y-fib-4', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-mobile-xl font-bold text-neutral-900\">
            User Management
          </h1>
          <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
            Manage user accounts and access
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\">
        <div className=\"flex flex-col lg:flex-row gap-fib-3\">
          {/* Search */}
          <div className=\"flex-1\">
            <AccessibleInput
              label=\"\"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder=\"Search users by name or email...\"
              className=\"w-full\"
            />
          </div>

          {/* Filters */}
          <div className=\"flex space-x-fib-2\">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
            >
              <option value=\"all\">All Status</option>
              <option value=\"active\">Active</option>
              <option value=\"suspended\">Suspended</option>
              <option value=\"banned\">Banned</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
            >
              <option value=\"created\">Sort by Join Date</option>
              <option value=\"name\">Sort by Name</option>
              <option value=\"lastActive\">Sort by Last Active</option>
              <option value=\"reports\">Sort by Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200\">
        <div className=\"p-fib-4 border-b border-neutral-100\">
          <h2 className=\"text-mobile-base font-semibold text-neutral-900\">
            Users ({filteredUsers.length})
          </h2>
        </div>

        <div className=\"divide-y divide-neutral-100\">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              className=\"p-fib-4 hover:bg-neutral-50 transition-colors\"
              whileHover={reducedMotion ? {} : { scale: 1.01 }}
              transition={reducedMotion ? {} : { duration: 0.15 }}
            >
              <div className=\"flex items-center justify-between\">
                <div className=\"flex items-center space-x-fib-3 flex-1\">
                  {/* Avatar */}
                  <div className=\"relative\">
                    <div className=\"w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center\">
                      <span className=\"text-mobile-sm font-semibold text-white\">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {user.isOnline && (
                      <div className=\"absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border-2 border-white rounded-full\" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-center space-x-fib-2 mb-fib-1\">
                      <h3 className=\"text-mobile-base font-semibold text-neutral-900 truncate\">
                        {user.displayName}
                      </h3>
                      <span className={clsx(
                        'px-fib-1 py-0.5 rounded-full text-xs font-medium',
                        getUserStatusColor(user.status)
                      )}>
                        {user.status}
                      </span>
                      {user.reportCount > 0 && (
                        <span className=\"px-fib-1 py-0.5 bg-error-100 text-error-800 rounded-full text-xs font-medium\">
                          {user.reportCount} reports
                        </span>
                      )}
                    </div>
                    
                    <p className=\"text-mobile-sm text-neutral-600 truncate mb-fib-1\">
                      {user.email}
                    </p>
                    
                    <div className=\"flex items-center space-x-fib-3 text-mobile-xs text-neutral-500\">
                      <span>Joined {formatRelativeTime(user.createdAt)}</span>
                      {user.lastActiveAt && (
                        <>
                          <span>•</span>
                          <span>Active {formatRelativeTime(user.lastActiveAt)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{user.groupCount} groups</span>
                    </div>

                    {/* Suspension Info */}
                    {user.status === 'suspended' && user.suspensionEndDate && (
                      <div className=\"mt-fib-1 text-mobile-xs text-warning-700\">
                        Suspended until {new Date(user.suspensionEndDate).toLocaleDateString()}
                        {user.suspensionReason && ` - ${user.suspensionReason}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className=\"flex items-center space-x-fib-1 ml-fib-3\">
                  <AccessibleButton
                    variant=\"ghost\"
                    size=\"sm\"
                    onClick={() => onViewUserActivity(user.id)}
                    ariaLabel={`View ${user.displayName}'s activity`}
                  >
                    <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\" />
                    </svg>
                  </AccessibleButton>

                  {user.status === 'active' && (
                    <AccessibleButton
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowSuspensionModal(true);
                      }}
                      disabled={isProcessing}
                    >
                      Suspend
                    </AccessibleButton>
                  )}

                  {user.status === 'suspended' && (
                    <AccessibleButton
                      variant=\"primary\"
                      size=\"sm\"
                      onClick={() => handleUnsuspendUser(user)}
                      disabled={isProcessing}
                    >
                      Unsuspend
                    </AccessibleButton>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}