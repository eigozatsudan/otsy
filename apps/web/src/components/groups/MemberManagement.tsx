'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { StatusMessage } from '@/components/accessibility/LiveRegion';

interface GroupMember {
  id: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
  lastActive?: string;
  avatar?: string;
  stats?: {
    itemsAdded: number;
    purchasesMade: number;
    totalSpent: number;
  };
}

interface MemberManagementProps {
  groupName: string;
  members: GroupMember[];
  currentUserId: string;
  onTransferOwnership: (memberId: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onClose: () => void;
  className?: string;
}

export default function MemberManagement({
  groupName,
  members,
  currentUserId,
  onTransferOwnership,
  onRemoveMember,
  onClose,
  className = '',
}: MemberManagementProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'remove' | 'transfer';
    member: GroupMember;
  } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const currentUser = members.find(m => m.id === currentUserId);
  const isOwner = currentUser?.role === 'owner';
  const otherMembers = members.filter(m => m.id !== currentUserId);

  const handleRemoveMember = async (member: GroupMember) => {
    setLoading(member.id);
    try {
      await onRemoveMember(member.id);
      setStatusMessage({
        type: 'success',
        message: `${member.displayName} has been removed from the group`,
      });
      announce(`${member.displayName} removed from group`, 'polite');
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `Failed to remove ${member.displayName}. Please try again.`,
      });
      announce(`Failed to remove ${member.displayName}`, 'assertive');
    } finally {
      setLoading(null);
      setShowConfirmDialog(null);
    }
  };

  const handleTransferOwnership = async (member: GroupMember) => {
    setLoading(member.id);
    try {
      await onTransferOwnership(member.id);
      setStatusMessage({
        type: 'success',
        message: `Ownership transferred to ${member.displayName}`,
      });
      announce(`Ownership transferred to ${member.displayName}`, 'polite');
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `Failed to transfer ownership to ${member.displayName}. Please try again.`,
      });
      announce(`Failed to transfer ownership`, 'assertive');
    } finally {
      setLoading(null);
      setShowConfirmDialog(null);
    }
  };

  const clearStatusMessage = () => {
    setStatusMessage(null);
  };

  return (
    <>
      <motion.div
        className={clsx(
          'bg-white rounded-xl shadow-mobile-lg border border-neutral-200 max-w-2xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col',
          className
        )}
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
        exit={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
        transition={reducedMotion ? {} : { duration: 0.2 }}
      >
        {/* Header */}
        <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100 flex-shrink-0\">
          <div>
            <h2 className=\"text-mobile-lg font-bold text-neutral-900\">
              Manage Members
            </h2>
            <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
              {members.length} {members.length === 1 ? 'member' : 'members'} in "{groupName}"
            </p>
          </div>
          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={onClose}
            ariaLabel=\"Close member management\"
          >
            <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className=\"p-fib-4 border-b border-neutral-100\">
            <StatusMessage
              type={statusMessage.type}
              message={statusMessage.message}
              onDismiss={clearStatusMessage}
            />
          </div>
        )}

        {/* Member List */}
        <div className=\"flex-1 overflow-y-auto p-fib-4\">
          <div className=\"space-y-fib-3\">
            {members.map((member) => (
              <motion.div
                key={member.id}
                className={clsx(
                  'border border-neutral-200 rounded-xl p-fib-4 transition-all',
                  {
                    'border-primary-300 bg-primary-50': selectedMember?.id === member.id,
                    'hover:border-neutral-300': selectedMember?.id !== member.id,
                  }
                )}
                whileHover={reducedMotion ? {} : { scale: 1.01 }}
                transition={reducedMotion ? {} : { duration: 0.15 }}
                onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                role=\"button\"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMember(selectedMember?.id === member.id ? null : member);
                  }
                }}
                aria-expanded={selectedMember?.id === member.id}
                aria-label={`${member.displayName} member details`}
              >
                <div className=\"flex items-center space-x-fib-3\">
                  {/* Avatar */}
                  <div className=\"flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center\">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={`${member.displayName}'s avatar`}
                        className=\"w-full h-full rounded-full object-cover\"
                      />
                    ) : (
                      <span className=\"text-mobile-base font-semibold text-white\">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-center space-x-fib-2 mb-fib-1\">
                      <h3 className=\"text-mobile-base font-semibold text-neutral-900 truncate\">
                        {member.displayName}
                      </h3>
                      {member.role === 'owner' && (
                        <span className=\"inline-flex items-center px-fib-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800\">
                          Owner
                        </span>
                      )}
                      {member.id === currentUserId && (
                        <span className=\"inline-flex items-center px-fib-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800\">
                          You
                        </span>
                      )}
                    </div>
                    <p className=\"text-mobile-sm text-neutral-600 truncate mb-fib-1\">
                      {member.email}
                    </p>
                    <div className=\"flex items-center space-x-fib-3 text-mobile-xs text-neutral-500\">
                      <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                      {member.lastActive && (
                        <>
                          <span>•</span>
                          <span>Last active {new Date(member.lastActive).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className=\"flex-shrink-0\">
                    <motion.svg
                      className=\"w-5 h-5 text-neutral-400\"
                      fill=\"none\"
                      stroke=\"currentColor\"
                      viewBox=\"0 0 24 24\"
                      animate={reducedMotion ? {} : { 
                        rotate: selectedMember?.id === member.id ? 180 : 0 
                      }}
                      transition={reducedMotion ? {} : { duration: 0.2 }}
                    >
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 9l-7 7-7-7\" />
                    </motion.svg>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedMember?.id === member.id && (
                    <motion.div
                      initial={reducedMotion ? {} : { opacity: 0, height: 0 }}
                      animate={reducedMotion ? {} : { opacity: 1, height: 'auto' }}
                      exit={reducedMotion ? {} : { opacity: 0, height: 0 }}
                      transition={reducedMotion ? {} : { duration: 0.2 }}
                      className=\"mt-fib-4 pt-fib-4 border-t border-neutral-200\"
                    >
                      {/* Member Stats */}
                      {member.stats && (
                        <div className=\"grid grid-cols-3 gap-fib-3 mb-fib-4\">
                          <div className=\"text-center\">
                            <div className=\"text-mobile-lg font-bold text-neutral-900\">
                              {member.stats.itemsAdded}
                            </div>
                            <div className=\"text-mobile-xs text-neutral-500\">
                              Items Added
                            </div>
                          </div>
                          <div className=\"text-center\">
                            <div className=\"text-mobile-lg font-bold text-neutral-900\">
                              {member.stats.purchasesMade}
                            </div>
                            <div className=\"text-mobile-xs text-neutral-500\">
                              Purchases
                            </div>
                          </div>
                          <div className=\"text-center\">
                            <div className=\"text-mobile-lg font-bold text-neutral-900\">
                              ${member.stats.totalSpent.toFixed(2)}
                            </div>
                            <div className=\"text-mobile-xs text-neutral-500\">
                              Total Spent
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {isOwner && member.id !== currentUserId && (
                        <div className=\"flex space-x-fib-2\">
                          <AccessibleButton
                            variant=\"outline\"
                            size=\"sm\"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowConfirmDialog({ type: 'transfer', member });
                            }}
                            disabled={loading === member.id}
                          >
                            <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4\" />
                            </svg>
                            Transfer Ownership
                          </AccessibleButton>
                          
                          <AccessibleButton
                            variant=\"danger\"
                            size=\"sm\"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowConfirmDialog({ type: 'remove', member });
                            }}
                            disabled={loading === member.id}
                            loading={loading === member.id}
                          >
                            <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16\" />
                            </svg>
                            Remove Member
                          </AccessibleButton>
                        </div>
                      )}

                      {/* Current User Actions */}
                      {member.id === currentUserId && member.role !== 'owner' && (
                        <div className=\"bg-neutral-50 rounded-lg p-fib-3 border border-neutral-200\">
                          <p className=\"text-mobile-sm text-neutral-700 mb-fib-2\">
                            You can leave this group at any time. Your purchase history will remain visible to other members.
                          </p>
                          <AccessibleButton
                            variant=\"outline\"
                            size=\"sm\"
                            onClick={() => {
                              // Handle leave group
                              setShowConfirmDialog({ type: 'remove', member });
                            }}
                          >
                            Leave Group
                          </AccessibleButton>
                        </div>
                      )}

                      {/* Owner Info */}
                      {member.id === currentUserId && member.role === 'owner' && (
                        <div className=\"bg-primary-50 rounded-lg p-fib-3 border border-primary-200\">
                          <p className=\"text-mobile-sm text-primary-800 mb-fib-2\">
                            As the group owner, you can manage members and group settings. To leave the group, you must first transfer ownership to another member.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            className=\"fixed inset-0 z-50 flex items-center justify-center p-fib-4\"
            initial={reducedMotion ? {} : { opacity: 0 }}
            animate={reducedMotion ? {} : { opacity: 1 }}
            exit={reducedMotion ? {} : { opacity: 0 }}
            transition={reducedMotion ? {} : { duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className=\"absolute inset-0 bg-black/50\"
              onClick={() => setShowConfirmDialog(null)}
            />

            {/* Dialog */}
            <motion.div
              className=\"relative bg-white rounded-xl shadow-mobile-lg border border-neutral-200 max-w-md w-full mx-auto\"
              initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
              exit={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
              transition={reducedMotion ? {} : { duration: 0.2 }}
              role=\"dialog\"
              aria-modal=\"true\"
              aria-labelledby=\"confirm-dialog-title\"
              aria-describedby=\"confirm-dialog-description\"
            >
              <div className=\"p-fib-4\">
                <div className=\"flex items-center space-x-fib-3 mb-fib-4\">
                  <div className={clsx(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    {
                      'bg-error-100': showConfirmDialog.type === 'remove',
                      'bg-warning-100': showConfirmDialog.type === 'transfer',
                    }
                  )}>
                    {showConfirmDialog.type === 'remove' ? (
                      <svg className=\"w-5 h-5 text-error-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z\" />
                      </svg>
                    ) : (
                      <svg className=\"w-5 h-5 text-warning-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4\" />
                      </svg>
                    )}
                  </div>
                  <div className=\"flex-1\">
                    <h3 id=\"confirm-dialog-title\" className=\"text-mobile-base font-semibold text-neutral-900\">
                      {showConfirmDialog.type === 'remove' 
                        ? showConfirmDialog.member.id === currentUserId 
                          ? 'Leave Group'
                          : 'Remove Member'
                        : 'Transfer Ownership'
                      }
                    </h3>
                  </div>
                </div>

                <p id=\"confirm-dialog-description\" className=\"text-mobile-sm text-neutral-600 mb-fib-4\">
                  {showConfirmDialog.type === 'remove' 
                    ? showConfirmDialog.member.id === currentUserId
                      ? `Are you sure you want to leave "${groupName}"? You won't be able to access the group's shopping lists or chat.`
                      : `Are you sure you want to remove ${showConfirmDialog.member.displayName} from "${groupName}"? They will lose access to the group immediately.`
                    : `Are you sure you want to transfer ownership of "${groupName}" to ${showConfirmDialog.member.displayName}? You will become a regular member and won't be able to manage the group anymore.`
                  }
                </p>

                <div className=\"flex space-x-fib-2\">
                  <AccessibleButton
                    variant=\"outline\"
                    size=\"md\"
                    fullWidth
                    onClick={() => setShowConfirmDialog(null)}
                  >
                    Cancel
                  </AccessibleButton>
                  <AccessibleButton
                    variant={showConfirmDialog.type === 'remove' ? 'danger' : 'primary'}
                    size=\"md\"
                    fullWidth
                    onClick={() => {
                      if (showConfirmDialog.type === 'remove') {
                        handleRemoveMember(showConfirmDialog.member);
                      } else {
                        handleTransferOwnership(showConfirmDialog.member);
                      }
                    }}
                    loading={loading === showConfirmDialog.member.id}
                  >
                    {showConfirmDialog.type === 'remove' 
                      ? showConfirmDialog.member.id === currentUserId ? 'Leave Group' : 'Remove Member'
                      : 'Transfer Ownership'
                    }
                  </AccessibleButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}