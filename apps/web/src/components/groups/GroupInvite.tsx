'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput } from '@/components/accessibility/AccessibleForm';

interface GroupInviteProps {
  groupName: string;
  inviteCode: string;
  inviteUrl: string;
  onClose: () => void;
  onRegenerateCode?: () => void;
  className?: string;
}

export default function GroupInvite({
  groupName,
  inviteCode,
  inviteUrl,
  onClose,
  onRegenerateCode,
  className = '',
}: GroupInviteProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);
  const [showQR, setShowQR] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async (type: 'code' | 'url', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      announce(`${type === 'code' ? 'Invite code' : 'Invite link'} copied to clipboard`, 'polite');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      announce('Failed to copy to clipboard', 'assertive');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on Otsukai`,
          text: `You've been invited to join the "${groupName}" shopping group!`,
          url: inviteUrl,
        });
        announce('Invite shared successfully', 'polite');
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          announce('Failed to share invite', 'assertive');
        }
      }
    } else {
      // Fallback to copying URL
      handleCopy('url', inviteUrl);
    }
  };

  const generateQRCode = (text: string): string => {
    // In a real implementation, you would use a QR code library like qrcode
    // For now, we'll use a placeholder QR code service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  return (
    <motion.div
      className={clsx(
        'bg-white rounded-xl shadow-mobile-lg border border-neutral-200 max-w-md w-full mx-auto',
        className
      )}
      initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
      exit={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      transition={reducedMotion ? {} : { duration: 0.2 }}
    >
      {/* Header */}
      <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100\">
        <div>
          <h2 className=\"text-mobile-lg font-bold text-neutral-900\">
            Invite Members
          </h2>
          <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
            Share this invite to add people to "{groupName}"
          </p>
        </div>
        <AccessibleButton
          variant=\"ghost\"
          size=\"sm\"
          onClick={onClose}
          ariaLabel=\"Close invite dialog\"
        >
          <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
          </svg>
        </AccessibleButton>
      </div>

      <div className=\"p-fib-4 space-y-fib-4\">
        {/* Invite Link */}
        <div>
          <label className=\"block text-mobile-sm font-medium text-neutral-700 mb-fib-2\">
            Invite Link
          </label>
          <div className=\"flex space-x-fib-2\">
            <AccessibleInput
              ref={urlInputRef}
              label=\"\"
              value={inviteUrl}
              readOnly
              className=\"flex-1\"
              onClick={() => urlInputRef.current?.select()}
            />
            <AccessibleButton
              variant={copied === 'url' ? 'primary' : 'outline'}
              size=\"md\"
              onClick={() => handleCopy('url', inviteUrl)}
              ariaLabel=\"Copy invite link\"
              className=\"flex-shrink-0\"
            >
              {copied === 'url' ? (
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                </svg>
              ) : (
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z\" />
                </svg>
              )}
            </AccessibleButton>
          </div>
        </div>

        {/* Invite Code */}
        <div>
          <label className=\"block text-mobile-sm font-medium text-neutral-700 mb-fib-2\">
            Invite Code
          </label>
          <div className=\"flex space-x-fib-2\">
            <AccessibleInput
              ref={codeInputRef}
              label=\"\"
              value={inviteCode}
              readOnly
              className=\"flex-1 font-mono text-center text-mobile-lg tracking-wider\"
              onClick={() => codeInputRef.current?.select()}
            />
            <AccessibleButton
              variant={copied === 'code' ? 'primary' : 'outline'}
              size=\"md\"
              onClick={() => handleCopy('code', inviteCode)}
              ariaLabel=\"Copy invite code\"
              className=\"flex-shrink-0\"
            >
              {copied === 'code' ? (
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                </svg>
              ) : (
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z\" />
                </svg>
              )}
            </AccessibleButton>
          </div>
          <p className=\"text-mobile-xs text-neutral-500 mt-fib-1\">
            People can enter this code manually to join the group
          </p>
        </div>

        {/* QR Code */}
        <div>
          <div className=\"flex items-center justify-between mb-fib-2\">
            <label className=\"text-mobile-sm font-medium text-neutral-700\">
              QR Code
            </label>
            <AccessibleButton
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => setShowQR(!showQR)}
              ariaLabel={showQR ? 'Hide QR code' : 'Show QR code'}
            >
              {showQR ? 'Hide' : 'Show'}
            </AccessibleButton>
          </div>
          
          <AnimatePresence>
            {showQR && (
              <motion.div
                className=\"flex justify-center p-fib-3 bg-neutral-50 rounded-lg border border-neutral-200\"
                initial={reducedMotion ? {} : { opacity: 0, height: 0 }}
                animate={reducedMotion ? {} : { opacity: 1, height: 'auto' }}
                exit={reducedMotion ? {} : { opacity: 0, height: 0 }}
                transition={reducedMotion ? {} : { duration: 0.2 }}
              >
                <div className=\"text-center\">
                  <img
                    src={generateQRCode(inviteUrl)}
                    alt={`QR code for joining ${groupName}`}
                    className=\"w-48 h-48 mx-auto mb-fib-2\"
                  />
                  <p className=\"text-mobile-xs text-neutral-600\">
                    Scan with camera to join the group
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className=\"flex space-x-fib-2 pt-fib-2\">
          <AccessibleButton
            variant=\"primary\"
            size=\"md\"
            fullWidth
            onClick={handleShare}
            className=\"flex items-center justify-center\"
          >
            <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z\" />
            </svg>
            Share Invite
          </AccessibleButton>

          {onRegenerateCode && (
            <AccessibleButton
              variant=\"outline\"
              size=\"md\"
              onClick={onRegenerateCode}
              ariaLabel=\"Generate new invite code\"
              className=\"flex-shrink-0\"
            >
              <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
              </svg>
            </AccessibleButton>
          )}
        </div>

        {/* Instructions */}
        <div className=\"bg-primary-50 rounded-lg p-fib-3 border border-primary-100\">
          <h3 className=\"text-mobile-sm font-medium text-primary-900 mb-fib-1\">
            How to invite people:
          </h3>
          <ul className=\"text-mobile-xs text-primary-800 space-y-fib-1\">
            <li>• Share the invite link via message, email, or social media</li>
            <li>• Give them the invite code to enter manually</li>
            <li>• Let them scan the QR code with their phone camera</li>
            <li>• All methods will add them to "{groupName}" instantly</li>
          </ul>
        </div>

        {/* Security Note */}
        <div className=\"bg-warning-50 rounded-lg p-fib-3 border border-warning-100\">
          <div className=\"flex items-start space-x-fib-2\">
            <svg className=\"w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z\" />
            </svg>
            <div>
              <p className=\"text-mobile-xs font-medium text-warning-900\">
                Security reminder
              </p>
              <p className=\"text-mobile-xs text-warning-800 mt-fib-1\">
                Only share this invite with people you trust. Anyone with this code can join your group and see all shopping lists and purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}