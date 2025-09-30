'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  notes?: string;
  status: 'todo' | 'purchased' | 'cancelled';
  addedBy: string;
  addedByName: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  mentions?: string[];
  reactions?: Record<string, string[]>;
}

interface ItemThreadProps {
  item: ShoppingItem;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, mentions?: string[]) => Promise<void>;
  onClose: () => void;
  className?: string;
}

export default function ItemThread({
  item,
  messages,
  currentUserId,
  onSendMessage,
  onClose,
  className = '',
}: ItemThreadProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [messages, reducedMotion]);

  // Focus input when component mounts
  useEffect(() => {
    messageInputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const mentions = extractMentions(messageInput);
    
    try {
      await onSendMessage(messageInput.trim(), mentions);
      setMessageInput('');
      announce('Message sent', 'polite');
    } catch (error) {
      announce('Failed to send message', 'assertive');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // In a real implementation, you'd match against actual usernames
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  const formatMessageContent = (content: string): string => {
    // Replace @mentions with highlighted spans
    return content.replace(/@(\w+)/g, '<span class="mention text-primary-600 font-medium">@$1</span>');
  };

  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getItemStatusColor = () => {
    switch (item.status) {
      case 'purchased':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'cancelled':
        return 'bg-error-100 text-error-800 border-error-200';
      default:
        return 'bg-primary-100 text-primary-800 border-primary-200';
    }
  };

  const getItemStatusIcon = () => {
    switch (item.status) {
      case 'purchased':
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
          </svg>
        );
      default:
        return (
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      className={clsx('bg-white rounded-xl shadow-mobile-lg border border-neutral-200 flex flex-col max-w-md w-full mx-auto max-h-[80vh]', className)}
      initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
      animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
      exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
      transition={reducedMotion ? {} : { duration: 0.2 }}
      role=\"dialog\"
      aria-modal=\"true\"
      aria-labelledby=\"item-thread-title\"
    >
      {/* Header */}
      <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100 flex-shrink-0\">
        <div className=\"flex-1 min-w-0\">
          <h2 id=\"item-thread-title\" className=\"text-mobile-lg font-bold text-neutral-900 truncate\">
            {item.name}
          </h2>
          <div className=\"flex items-center space-x-fib-2 mt-fib-1\">
            <span className={clsx(
              'inline-flex items-center px-fib-2 py-fib-1 rounded-full text-xs font-medium border',
              getItemStatusColor()
            )}>
              {getItemStatusIcon()}
              <span className=\"ml-fib-1 capitalize\">{item.status}</span>
            </span>
            <span className=\"text-mobile-sm text-neutral-600\">
              {item.quantity} {item.unit || 'pcs'}
            </span>
            <span className=\"text-mobile-sm text-neutral-500\">
              {item.category}
            </span>
          </div>
        </div>
        
        <AccessibleButton
          variant=\"ghost\"
          size=\"sm\"
          onClick={onClose}
          ariaLabel=\"Close item discussion\"
        >
          <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
          </svg>
        </AccessibleButton>
      </div>

      {/* Item Details */}
      {item.notes && (
        <div className=\"px-fib-4 py-fib-2 bg-neutral-50 border-b border-neutral-100\">
          <p className=\"text-mobile-sm text-neutral-700\">
            <span className=\"font-medium\">Notes:</span> {item.notes}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className=\"flex-1 overflow-y-auto p-fib-4 space-y-fib-3 min-h-0\">
        {messages.length === 0 ? (
          <div className=\"text-center py-fib-6\">
            <div className=\"w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-fib-2\">
              <svg className=\"w-6 h-6 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
              </svg>
            </div>
            <h3 className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
              Start the conversation
            </h3>
            <p className=\"text-mobile-sm text-neutral-500\">
              Discuss details, preferences, or questions about "{item.name}"
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            
            return (
              <motion.div
                key={message.id}
                className={clsx('flex', {
                  'justify-end': isOwn,
                  'justify-start': !isOwn,
                })}
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={reducedMotion ? {} : { duration: 0.2 }}
              >
                <div className={clsx('flex max-w-[85%]', {
                  'flex-row-reverse': isOwn,
                  'flex-row': !isOwn,
                })}>
                  {/* Avatar */}
                  <div className={clsx('flex-shrink-0', {
                    'ml-fib-2': isOwn,
                    'mr-fib-2': !isOwn,
                  })}>
                    {showAvatar && (
                      <div className=\"w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center\">
                        {message.senderAvatar ? (
                          <img
                            src={message.senderAvatar}
                            alt={`${message.senderName}'s avatar`}
                            className=\"w-full h-full rounded-full object-cover\"
                          />
                        ) : (
                          <span className=\"text-xs font-semibold text-white\">
                            {message.senderName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={clsx('flex flex-col', {
                    'items-end': isOwn,
                    'items-start': !isOwn,
                  })}>
                    {/* Sender Name & Time */}
                    {showAvatar && (
                      <div className={clsx('flex items-center space-x-fib-1 mb-fib-1 text-mobile-xs text-neutral-500', {
                        'flex-row-reverse space-x-reverse': isOwn,
                      })}>
                        <span className=\"font-medium\">{message.senderName}</span>
                        <span>{getMessageTime(message.timestamp)}</span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={clsx(
                        'px-fib-3 py-fib-2 rounded-xl max-w-full break-words',
                        {
                          'bg-primary-500 text-white': isOwn,
                          'bg-neutral-100 text-neutral-900': !isOwn,
                        }
                      )}
                    >
                      {message.type === 'text' && (
                        <div
                          className=\"text-mobile-sm\"
                          dangerouslySetInnerHTML={{
                            __html: formatMessageContent(message.content)
                          }}
                        />
                      )}
                      
                      {message.type === 'image' && message.imageUrl && (
                        <div className=\"space-y-fib-2\">
                          <img
                            src={message.imageUrl}
                            alt=\"Shared image\"
                            className=\"max-w-full h-auto rounded-lg\"
                            loading=\"lazy\"
                          />
                          {message.content && (
                            <p className=\"text-mobile-sm\">{message.content}</p>
                          )}
                        </div>
                      )}

                      {message.type === 'system' && (
                        <p className=\"text-mobile-sm italic\">{message.content}</p>
                      )}
                    </div>

                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className=\"flex flex-wrap gap-fib-1 mt-fib-1\">
                        {Object.entries(message.reactions).map(([emoji, userIds]) => (
                          <div
                            key={emoji}
                            className={clsx(
                              'flex items-center space-x-1 px-fib-1 py-0.5 rounded-full text-xs',
                              {
                                'bg-primary-100 text-primary-700': userIds.includes(currentUserId),
                                'bg-neutral-100 text-neutral-700': !userIds.includes(currentUserId),
                              }
                            )}
                          >
                            <span>{emoji}</span>
                            <span>{userIds.length}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className=\"p-fib-4 border-t border-neutral-200 flex-shrink-0\">
        <div className=\"flex items-end space-x-fib-2\">
          <div className=\"flex-1\">
            <textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Discuss "${item.name}"...`}
              className=\"w-full px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none\"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '80px' }}
            />
            <div className=\"mt-fib-1 text-mobile-xs text-neutral-500\">
              Press Enter to send, Shift+Enter for new line, Esc to close
            </div>
          </div>
          
          <AccessibleButton
            variant=\"primary\"
            size=\"sm\"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            ariaLabel=\"Send message\"
          >
            <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 19l9 2-9-18-9 18 9-2zm0 0v-8\" />
            </svg>
          </AccessibleButton>
        </div>
      </div>
    </motion.div>
  );
}