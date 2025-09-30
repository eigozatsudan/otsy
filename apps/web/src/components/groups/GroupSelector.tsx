'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import TouchButton, { IconButton, ButtonIcons } from '@/components/ui/TouchButton';
import { 
  useAccessibility, 
  useFocusTrap, 
  useKeyboardNavigation,
  useAnnouncer 
} from '@/hooks/useAccessibility';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  unreadCount?: number;
  recentActivity?: string;
}

interface GroupSelectorProps {
  groups: Group[];
  currentGroupId?: string;
  onGroupSelect: (groupId: string) => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  className?: string;
}

export default function GroupSelector({
  groups,
  currentGroupId,
  onGroupSelect,
  onCreateGroup,
  onJoinGroup,
  className = '',
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  const dropdownId = useId();
  const labelId = useId();
  
  const currentGroup = groups.find(g => g.id === currentGroupId);
  const totalUnread = groups.reduce((sum, group) => sum + (group.unreadCount || 0), 0);

  // Focus trap for dropdown
  useFocusTrap(isOpen);

  // Handle keyboard navigation
  useKeyboardNavigation({
    onEscape: () => {
      if (isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    onArrowDown: () => {
      if (isOpen && groups.length > 0) {
        const newIndex = focusedIndex < groups.length - 1 ? focusedIndex + 1 : 0;
        setFocusedIndex(newIndex);
      }
    },
    onArrowUp: () => {
      if (isOpen && groups.length > 0) {
        const newIndex = focusedIndex > 0 ? focusedIndex - 1 : groups.length - 1;
        setFocusedIndex(newIndex);
      }
    },
    onEnter: () => {
      if (isOpen && groups[focusedIndex]) {
        handleGroupSelect(groups[focusedIndex].id);
      }
    },
  });

  const handleGroupSelect = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id === groupId);
    onGroupSelect(groupId);
    setIsOpen(false);
    
    // Announce selection to screen readers
    if (selectedGroup) {
      announce(`Selected group: ${selectedGroup.name}`, 'polite');
    }
    
    // Return focus to trigger
    triggerRef.current?.focus();
  };

  const handleToggle = () => {
    if (!isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setFocusedIndex(currentGroupId ? groups.findIndex(g => g.id === currentGroupId) : 0);
    }
    setIsOpen(!isOpen);
    
    // Announce state change
    announce(isOpen ? 'Group selector closed' : 'Group selector opened', 'polite');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Screen reader label */}
      <label id={labelId} className="sr-only">
        Group selector
      </label>
      
      {/* Current Group Display */}
      <motion.button
        ref={triggerRef}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="w-full flex items-center justify-between p-fib-3 bg-white rounded-xl border border-neutral-200 shadow-mobile-sm hover:shadow-mobile-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        whileTap={reducedMotion ? {} : { scale: 0.98 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        aria-describedby={totalUnread > 0 ? `${dropdownId}-unread` : undefined}
      >
        <div className="flex items-center space-x-fib-2 min-w-0 flex-1">
          {/* Group Avatar */}
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-mobile-sm font-semibold text-white">
              {currentGroup?.name.charAt(0).toUpperCase() || 'G'}
            </span>
          </div>
          
          {/* Group Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-mobile-base font-medium text-neutral-900 truncate">
              {currentGroup?.name || 'Select a group'}
            </h3>
            <p className="text-mobile-sm text-neutral-500 truncate">
              {currentGroup?.memberCount 
                ? `${currentGroup.memberCount} ${currentGroup.memberCount === 1 ? 'member' : 'members'}`
                : 'No group selected'
              }
            </p>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex items-center space-x-fib-1">
          {totalUnread > 0 && (
            <span 
              id={`${dropdownId}-unread`}
              className="bg-primary-500 text-white text-xs font-bold px-fib-1 py-0.5 rounded-full min-w-[20px] text-center"
              aria-label={`${totalUnread} unread ${totalUnread === 1 ? 'message' : 'messages'}`}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
          
          <motion.div
            animate={reducedMotion ? {} : { rotate: isOpen ? 180 : 0 }}
            transition={reducedMotion ? {} : { duration: 0.15 }}
            aria-hidden="true"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0 }}
              animate={reducedMotion ? {} : { opacity: 1 }}
              exit={reducedMotion ? {} : { opacity: 0 }}
              transition={reducedMotion ? {} : { duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown Content */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
              transition={reducedMotion ? {} : { duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-fib-1 bg-white rounded-xl border border-neutral-200 shadow-mobile-lg z-50 max-h-96 overflow-y-auto focus:outline-none"
              role="listbox"
              aria-labelledby={labelId}
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-fib-3 border-b border-neutral-100">
                <h4 className="text-mobile-base font-semibold text-neutral-900">
                  Switch Group
                </h4>
                <p className="text-mobile-sm text-neutral-500 mt-1">
                  Select a group to manage
                </p>
              </div>

              {/* Group List */}
              <div className="py-fib-1" role="none">
                {groups.map((group, index) => (
                  <motion.button
                    key={group.id}
                    onClick={() => handleGroupSelect(group.id)}
                    onFocus={() => setFocusedIndex(index)}
                    className={clsx(
                      'w-full flex items-center space-x-fib-2 p-fib-3 hover:bg-neutral-50 transition-colors duration-150 focus:outline-none focus:bg-primary-50 focus:ring-2 focus:ring-inset focus:ring-primary-500',
                      {
                        'bg-primary-50 border-r-2 border-primary-500': group.id === currentGroupId,
                        'bg-primary-100': index === focusedIndex && isOpen,
                      }
                    )}
                    whileHover={reducedMotion ? {} : { x: 2 }}
                    transition={reducedMotion ? {} : { duration: 0.15 }}
                    role="option"
                    aria-selected={group.id === currentGroupId}
                    tabIndex={index === focusedIndex ? 0 : -1}
                    aria-describedby={group.unreadCount ? `group-${group.id}-unread` : undefined}
                  >
                    {/* Group Avatar */}
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      {
                        'bg-primary-500': group.id === currentGroupId,
                        'bg-neutral-400': group.id !== currentGroupId,
                      }
                    )}>
                      <span className="text-xs font-semibold text-white">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Group Details */}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h5 className="text-mobile-sm font-medium text-neutral-900 truncate">
                          {group.name}
                        </h5>
                        {group.unreadCount && group.unreadCount > 0 && (
                          <span 
                            id={`group-${group.id}-unread`}
                            className="bg-primary-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ml-fib-1"
                            aria-label={`${group.unreadCount} unread ${group.unreadCount === 1 ? 'message' : 'messages'}`}
                          >
                            {group.unreadCount > 9 ? '9+' : group.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-mobile-xs text-neutral-500 truncate">
                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        {group.recentActivity && ` • ${group.recentActivity}`}
                      </p>
                    </div>

                    {/* Selected Indicator */}
                    {group.id === currentGroupId && (
                      <div className="text-primary-500" aria-hidden="true">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}

                {/* Empty State */}
                {groups.length === 0 && (
                  <div className="p-fib-4 text-center">
                    <div className="text-neutral-400 mb-fib-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h5 className="text-mobile-base font-medium text-neutral-900 mb-fib-1">
                      No groups yet
                    </h5>
                    <p className="text-mobile-sm text-neutral-500 mb-fib-3">
                      Create your first group or join an existing one
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-fib-3 border-t border-neutral-100 space-y-fib-2">
                <TouchButton
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={ButtonIcons.Plus}
                  onClick={() => {
                    onCreateGroup();
                    setIsOpen(false);
                  }}
                >
                  Create New Group
                </TouchButton>
                
                <TouchButton
                  variant="outline"
                  size="md"
                  fullWidth
                  icon={ButtonIcons.Share}
                  onClick={() => {
                    onJoinGroup();
                    setIsOpen(false);
                  }}
                >
                  Join with Invite Code
                </TouchButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Group Switcher for bottom navigation
interface QuickGroupSwitcherProps {
  groups: Group[];
  currentGroupId?: string;
  onGroupSelect: (groupId: string) => void;
  maxVisible?: number;
}

export function QuickGroupSwitcher({
  groups,
  currentGroupId,
  onGroupSelect,
  maxVisible = 4,
}: QuickGroupSwitcherProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const visibleGroups = groups.slice(0, maxVisible);
  const hasMore = groups.length > maxVisible;

  const handleGroupSelect = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id === groupId);
    onGroupSelect(groupId);
    
    if (selectedGroup) {
      announce(`Switched to group: ${selectedGroup.name}`, 'polite');
    }
  };

  return (
    <nav aria-label="Quick group switcher" className="flex items-center space-x-fib-1 overflow-x-auto pb-fib-1">
      {visibleGroups.map((group) => (
        <motion.button
          key={group.id}
          onClick={() => handleGroupSelect(group.id)}
          className={clsx(
            'relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            {
              'bg-primary-500 text-white shadow-mobile-md': group.id === currentGroupId,
              'bg-neutral-200 text-neutral-600 hover:bg-neutral-300': group.id !== currentGroupId,
            }
          )}
          whileTap={reducedMotion ? {} : { scale: 0.9 }}
          transition={reducedMotion ? {} : { duration: 0.15 }}
          aria-label={`Switch to ${group.name} group${group.unreadCount ? `, ${group.unreadCount} unread messages` : ''}`}
          aria-current={group.id === currentGroupId ? 'page' : undefined}
        >
          <span className="text-xs font-semibold">
            {group.name.charAt(0).toUpperCase()}
          </span>
          
          {/* Unread indicator */}
          {group.unreadCount && group.unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none"
              aria-hidden="true"
            >
              {group.unreadCount > 9 ? '9+' : group.unreadCount}
            </span>
          )}
        </motion.button>
      ))}

      {/* More indicator */}
      {hasMore && (
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center"
          aria-label={`${groups.length - maxVisible} more groups available`}
          role="status"
        >
          <span className="text-xs font-medium text-neutral-500" aria-hidden="true">
            +{groups.length - maxVisible}
          </span>
        </div>
      )}
    </div>
  );
}