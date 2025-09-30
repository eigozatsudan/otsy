'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { StatusMessage } from '@/components/accessibility/LiveRegion';

interface ReportedContent {
  id: string;
  type: 'message' | 'image' | 'user_profile';
  content: string;
  imageUrl?: string;
  reportedBy: string;
  reportedByName: string;
  reportedAt: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'violence' | 'other';
  reasonDetails?: string;
  status: 'pending' | 'approved' | 'removed' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  groupId?: string;
  groupName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ContentModerationProps {
  reportedContent: ReportedContent[];
  onApproveContent: (contentId: string, notes?: string) => Promise<void>;
  onRemoveContent: (contentId: string, notes?: string) => Promise<void>;
  onEscalateContent: (contentId: string, notes?: string) => Promise<void>;
  onSuspendUser: (userId: string, duration: number, reason: string) => Promise<void>;
  className?: string;
}

export default function ContentModeration({
  reportedContent,
  onApproveContent,
  onRemoveContent,
  onEscalateContent,
  onSuspendUser,
  className = '',
}: ContentModerationProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'high_priority'>('pending');
  const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showUserActions, setShowUserActions] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter content
  const filteredContent = reportedContent.filter(content => {
    if (filter === 'pending') return content.status === 'pending';
    if (filter === 'high_priority') return content.severity === 'high' || content.severity === 'critical';
    return true;
  }).sort((a, b) => {
    // Sort by severity first, then by date
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });

  const handleContentAction = async (
    action: 'approve' | 'remove' | 'escalate',
    content: ReportedContent
  ) => {
    setIsProcessing(true);
    
    try {
      switch (action) {
        case 'approve':
          await onApproveContent(content.id, reviewNotes);
          announce(`Content approved`, 'polite');
          setStatusMessage({ type: 'success', message: 'Content approved successfully' });
          break;
        case 'remove':
          await onRemoveContent(content.id, reviewNotes);
          announce(`Content removed`, 'polite');
          setStatusMessage({ type: 'success', message: 'Content removed successfully' });
          break;
        case 'escalate':
          await onEscalateContent(content.id, reviewNotes);
          announce(`Content escalated for further review`, 'polite');
          setStatusMessage({ type: 'success', message: 'Content escalated for further review' });
          break;
      }
      
      setSelectedContent(null);
      setReviewNotes('');
    } catch (error) {
      announce(`Failed to ${action} content`, 'assertive');
      setStatusMessage({ type: 'error', message: `Failed to ${action} content. Please try again.` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserSuspension = async (userId: string, duration: number, reason: string) => {
    setIsProcessing(true);
    
    try {
      await onSuspendUser(userId, duration, reason);
      announce(`User suspended for ${duration} days`, 'polite');
      setStatusMessage({ type: 'success', message: `User suspended for ${duration} days` });
      setShowUserActions(null);
    } catch (error) {
      announce('Failed to suspend user', 'assertive');
      setStatusMessage({ type: 'error', message: 'Failed to suspend user. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityColor = (severity: ReportedContent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-100 text-error-800 border-error-200';
      case 'high':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'medium':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'low':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getReasonLabel = (reason: ReportedContent['reason']) => {
    switch (reason) {
      case 'spam': return 'Spam';
      case 'harassment': return 'Harassment';
      case 'inappropriate': return 'Inappropriate Content';
      case 'violence': return 'Violence/Threats';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const reportTime = new Date(timestamp);
    const diffInHours = (now.getTime() - reportTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just reported';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className={clsx('space-y-fib-4', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-mobile-xl font-bold text-neutral-900\">
            Content Moderation
          </h1>
          <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
            Review and moderate reported content
          </p>
        </div>
        
        <div className=\"flex items-center space-x-fib-2\">
          <span className=\"text-mobile-sm text-neutral-600\">
            {filteredContent.length} items to review
          </span>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <StatusMessage
          type={statusMessage.type}
          message={statusMessage.message}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      {/* Filter Tabs */}
      <div className=\"flex space-x-fib-1\">
        {[
          { id: 'pending', label: 'Pending Review', count: reportedContent.filter(c => c.status === 'pending').length },
          { id: 'high_priority', label: 'High Priority', count: reportedContent.filter(c => c.severity === 'high' || c.severity === 'critical').length },
          { id: 'all', label: 'All Reports', count: reportedContent.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={clsx(
              'px-fib-3 py-fib-2 rounded-lg text-mobile-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
              {
                'bg-primary-100 text-primary-700': filter === tab.id,
                'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50': filter !== tab.id,
              }
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={clsx(
                'ml-fib-1 px-fib-1 py-0.5 rounded-full text-xs font-medium',
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

      {/* Content List */}
      <div className=\"space-y-fib-3\">
        {filteredContent.length === 0 ? (
          <div className=\"text-center py-fib-8 bg-white rounded-xl border border-neutral-200\">
            <div className=\"w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-fib-3\">
              <svg className=\"w-8 h-8 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
              </svg>
            </div>
            <h3 className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
              All caught up!
            </h3>
            <p className=\"text-mobile-sm text-neutral-500\">
              No content reports to review at this time.
            </p>
          </div>
        ) : (
          filteredContent.map((content) => (
            <motion.div
              key={content.id}
              className=\"bg-white rounded-xl border border-neutral-200 overflow-hidden\"
              layout={!reducedMotion}
              transition={reducedMotion ? {} : { duration: 0.2 }}
            >
              <div className=\"p-fib-4\">
                <div className=\"flex items-start justify-between mb-fib-3\">
                  <div className=\"flex items-start space-x-fib-3 flex-1\">
                    {/* Severity Badge */}
                    <span className={clsx(
                      'inline-flex items-center px-fib-2 py-fib-1 rounded-full text-xs font-medium border flex-shrink-0',
                      getSeverityColor(content.severity)
                    )}>
                      {content.severity.toUpperCase()}
                    </span>

                    {/* Content Info */}
                    <div className=\"flex-1 min-w-0\">
                      <div className=\"flex items-center space-x-fib-2 mb-fib-1\">
                        <h3 className=\"text-mobile-base font-semibold text-neutral-900\">
                          {getReasonLabel(content.reason)}
                        </h3>
                        <span className=\"text-mobile-sm text-neutral-500\">
                          {formatRelativeTime(content.reportedAt)}
                        </span>
                      </div>
                      
                      <p className=\"text-mobile-sm text-neutral-700 mb-fib-2\">
                        Reported by {content.reportedByName}
                        {content.groupName && ` in ${content.groupName}`}
                      </p>
                      
                      {content.reasonDetails && (
                        <p className=\"text-mobile-sm text-neutral-600 mb-fib-2 italic\">
                          "{content.reasonDetails}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className=\"flex items-center space-x-fib-1 flex-shrink-0\">
                    <AccessibleButton
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => setSelectedContent(content)}
                      disabled={isProcessing}
                    >
                      Review
                    </AccessibleButton>
                    
                    <AccessibleButton
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={() => setShowUserActions(showUserActions === content.id ? null : content.id)}
                      disabled={isProcessing}
                      ariaLabel=\"User actions\"
                    >
                      <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z\" />
                      </svg>
                    </AccessibleButton>
                  </div>
                </div>

                {/* Content Preview */}
                <div className=\"bg-neutral-50 rounded-lg p-fib-3 mb-fib-3\">
                  {content.type === 'image' && content.imageUrl ? (
                    <div className=\"space-y-fib-2\">
                      <img
                        src={content.imageUrl}
                        alt=\"Reported content\"
                        className=\"max-w-xs h-auto rounded border\"
                      />
                      {content.content && (
                        <p className=\"text-mobile-sm text-neutral-700\">{content.content}</p>
                      )}
                    </div>
                  ) : (
                    <p className=\"text-mobile-sm text-neutral-700\">{content.content}</p>
                  )}
                </div>

                {/* User Info */}
                <div className=\"flex items-center justify-between text-mobile-sm text-neutral-600\">
                  <span>
                    Content by: <span className=\"font-medium\">{content.userName}</span> ({content.userEmail})
                  </span>
                  <span className={clsx(
                    'px-fib-1 py-0.5 rounded text-xs font-medium',
                    {
                      'bg-warning-100 text-warning-800': content.status === 'pending',
                      'bg-success-100 text-success-800': content.status === 'approved',
                      'bg-error-100 text-error-800': content.status === 'removed',
                      'bg-primary-100 text-primary-800': content.status === 'escalated',
                    }
                  )}>
                    {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                  </span>
                </div>

                {/* User Actions Dropdown */}
                <AnimatePresence>
                  {showUserActions === content.id && (
                    <motion.div
                      className=\"mt-fib-3 p-fib-3 bg-warning-50 border border-warning-200 rounded-lg\"
                      initial={reducedMotion ? {} : { opacity: 0, height: 0 }}
                      animate={reducedMotion ? {} : { opacity: 1, height: 'auto' }}
                      exit={reducedMotion ? {} : { opacity: 0, height: 0 }}
                      transition={reducedMotion ? {} : { duration: 0.2 }}
                    >
                      <h4 className=\"text-mobile-sm font-semibold text-warning-900 mb-fib-2\">
                        User Actions
                      </h4>
                      <div className=\"flex space-x-fib-2\">
                        <AccessibleButton
                          variant=\"outline\"
                          size=\"sm\"
                          onClick={() => handleUserSuspension(content.userId, 1, 'Content violation')}
                          disabled={isProcessing}
                        >
                          Suspend 1 day
                        </AccessibleButton>
                        <AccessibleButton
                          variant=\"outline\"
                          size=\"sm\"
                          onClick={() => handleUserSuspension(content.userId, 7, 'Repeated violations')}
                          disabled={isProcessing}
                        >
                          Suspend 7 days
                        </AccessibleButton>
                        <AccessibleButton
                          variant=\"danger\"
                          size=\"sm\"
                          onClick={() => handleUserSuspension(content.userId, 365, 'Permanent suspension')}
                          disabled={isProcessing}
                        >
                          Permanent Ban
                        </AccessibleButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}