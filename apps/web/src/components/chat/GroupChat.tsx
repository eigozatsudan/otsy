'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput } from '@/components/accessibility/AccessibleForm';

interface GroupMember {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
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
  mentions?: string[]; // Array of mentioned user IDs
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> user IDs
  isEdited?: boolean;
  editedAt?: string;
}

interface Thread {
  id: string;
  itemId?: string;
  itemName?: string;
  title: string;
  messages: Message[];
  participantIds: string[];
  lastMessageAt: string;
  unreadCount: number;
}

interface GroupChatProps {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  threads: Thread[];
  activeThreadId?: string;
  onSendMessage: (content: string, threadId?: string, replyToId?: string, mentions?: string[]) => Promise<void>;
  onUploadImage: (file: File, threadId?: string) => Promise<string>;
  onCreateThread: (title: string, itemId?: string) => Promise<string>;
  onSwitchThread: (threadId?: string) => void;
  onMarkAsRead: (threadId: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  className?: string;
}

export default function GroupChat({
  groupId,
  members,
  currentUserId,
  threads,
  activeThreadId,
  onSendMessage,
  onUploadImage,
  onCreateThread,
  onSwitchThread,
  onMarkAsRead,
  onReactToMessage,
  onEditMessage,
  className = '',
}: GroupChatProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active thread
  const activeThread = threads.find(t => t.id === activeThreadId);
  const generalThread = threads.find(t => !t.itemId); // General chat thread
  const currentThread = activeThread || generalThread;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [currentThread?.messages, reducedMotion]);

  // Mark thread as read when switching
  useEffect(() => {
    if (activeThreadId && currentThread?.unreadCount > 0) {
      onMarkAsRead(activeThreadId);
    }
  }, [activeThreadId, currentThread?.unreadCount, onMarkAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const mentions = extractMentions(messageInput);
    
    try {
      await onSendMessage(
        messageInput.trim(),
        activeThreadId,
        replyingTo?.id,
        mentions
      );
      
      setMessageInput('');
      setReplyingTo(null);
      
      announce('Message sent', 'polite');
    } catch (error) {
      announce('Failed to send message', 'assertive');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      announce('Please select an image file', 'assertive');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      announce('Image must be smaller than 10MB', 'assertive');
      return;
    }

    setIsUploading(true);
    
    try {
      const imageUrl = await onUploadImage(file, activeThreadId);
      announce('Image uploaded successfully', 'polite');
    } catch (error) {
      announce('Failed to upload image', 'assertive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const member = members.find(m => 
        m.displayName.toLowerCase().includes(username.toLowerCase())
      );
      if (member) {
        mentions.push(member.id);
      }
    }
    
    return mentions;
  };

  const formatMessageContent = (content: string): string => {
    // Replace @mentions with highlighted spans
    return content.replace(/@(\w+)/g, (match, username) => {
      const member = members.find(m => 
        m.displayName.toLowerCase().includes(username.toLowerCase())
      );
      return member ? `<span class="mention">@${member.displayName}</span>` : match;
    });
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    
    try {
      await onEditMessage(messageId, editContent.trim());
      setEditingMessage(null);
      setEditContent('');
      announce('Message updated', 'polite');
    } catch (error) {
      announce('Failed to update message', 'assertive');
    }
  };

  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.displayName || 'Unknown';
  };

  const totalUnreadCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <div className={clsx('bg-white rounded-xl shadow-mobile-sm border border-neutral-200 flex flex-col h-full', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100 flex-shrink-0\">
        <div className=\"flex items-center space-x-fib-2\">
          <h2 className=\"text-mobile-lg font-bold text-neutral-900\">
            {currentThread?.title || 'Group Chat'}
          </h2>
          {currentThread?.itemName && (
            <span className=\"px-fib-2 py-fib-1 bg-primary-100 text-primary-700 rounded-full text-mobile-xs font-medium\">
              {currentThread.itemName}
            </span>
          )}
          {totalUnreadCount > 0 && (
            <span className=\"px-fib-1 py-0.5 bg-error-500 text-white rounded-full text-xs font-bold min-w-[16px] text-center\">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </div>

        <div className=\"flex items-center space-x-fib-2\">
          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={() => setShowMemberList(!showMemberList)}
            ariaLabel=\"Toggle member list\"
          >
            <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z\" />
            </svg>
          </AccessibleButton>
        </div>
      </div>

      <div className=\"flex flex-1 min-h-0\">
        {/* Thread Sidebar */}
        <div className=\"w-64 border-r border-neutral-200 flex flex-col flex-shrink-0\">
          {/* Thread List Header */}
          <div className=\"p-fib-3 border-b border-neutral-100\">
            <div className=\"flex items-center justify-between mb-fib-2\">
              <h3 className=\"text-mobile-sm font-semibold text-neutral-900\">
                Threads
              </h3>
              <AccessibleButton
                variant=\"ghost\"
                size=\"sm\"
                onClick={() => {
                  // Create new thread modal would open here
                }}
                ariaLabel=\"Create new thread\"
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6v6m0 0v6m0-6h6m-6 0H6\" />
                </svg>
              </AccessibleButton>
            </div>
          </div>

          {/* Thread List */}
          <div className=\"flex-1 overflow-y-auto\">
            <div className=\"p-fib-2 space-y-fib-1\">
              {threads.map((thread) => (
                <motion.button
                  key={thread.id}
                  onClick={() => onSwitchThread(thread.id)}
                  className={clsx(
                    'w-full text-left p-fib-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                    {
                      'bg-primary-100 text-primary-900': activeThreadId === thread.id,
                      'hover:bg-neutral-50': activeThreadId !== thread.id,
                    }
                  )}
                  whileHover={reducedMotion ? {} : { scale: 1.02 }}
                  transition={reducedMotion ? {} : { duration: 0.15 }}
                >
                  <div className=\"flex items-center justify-between mb-fib-1\">
                    <h4 className=\"text-mobile-sm font-medium truncate\">
                      {thread.title}
                    </h4>
                    {thread.unreadCount > 0 && (
                      <span className=\"px-1.5 py-0.5 bg-primary-500 text-white rounded-full text-xs font-bold min-w-[16px] text-center\">
                        {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  {thread.itemName && (
                    <p className=\"text-mobile-xs text-neutral-600 mb-fib-1\">
                      📝 {thread.itemName}
                    </p>
                  )}
                  
                  <div className=\"flex items-center justify-between text-mobile-xs text-neutral-500\">
                    <span>{thread.participantIds.length} participants</span>
                    <span>{getMessageTime(thread.lastMessageAt)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className=\"flex-1 flex flex-col min-w-0\">
          {/* Messages */}
          <div className=\"flex-1 overflow-y-auto p-fib-4 space-y-fib-3\">
            {currentThread?.messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar = index === 0 || 
                currentThread.messages[index - 1].senderId !== message.senderId;
              
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
                  <div className={clsx('flex max-w-[70%]', {
                    'flex-row-reverse': isOwn,
                    'flex-row': !isOwn,
                  })}>
                    {/* Avatar */}
                    <div className={clsx('flex-shrink-0', {
                      'ml-fib-2': isOwn,
                      'mr-fib-2': !isOwn,
                    })}>
                      {showAvatar && (
                        <div className=\"w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center\">
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
                          {message.isEdited && (
                            <span className=\"italic\">(edited)</span>
                          )}
                        </div>
                      )}

                      {/* Reply Context */}
                      {message.replyToId && (
                        <div className=\"mb-fib-1 p-fib-1 bg-neutral-100 rounded border-l-2 border-neutral-300 text-mobile-xs text-neutral-600\">
                          Replying to previous message
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
                        onDoubleClick={() => {
                          if (isOwn && message.type === 'text') {
                            setEditingMessage(message.id);
                            setEditContent(message.content);
                          }
                        }}
                      >
                        {editingMessage === message.id ? (
                          <div className=\"space-y-fib-2\">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className=\"w-full p-fib-1 border border-neutral-300 rounded text-neutral-900 text-mobile-sm\"
                              rows={2}
                              autoFocus
                            />
                            <div className=\"flex space-x-fib-1\">
                              <AccessibleButton
                                variant=\"primary\"
                                size=\"sm\"
                                onClick={() => handleEditMessage(message.id)}
                              >
                                Save
                              </AccessibleButton>
                              <AccessibleButton
                                variant=\"ghost\"
                                size=\"sm\"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                              >
                                Cancel
                              </AccessibleButton>
                            </div>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      {/* Reactions */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className=\"flex flex-wrap gap-fib-1 mt-fib-1\">
                          {Object.entries(message.reactions).map(([emoji, userIds]) => (
                            <button
                              key={emoji}
                              onClick={() => onReactToMessage(message.id, emoji)}
                              className={clsx(
                                'flex items-center space-x-1 px-fib-1 py-0.5 rounded-full text-xs transition-colors',
                                {
                                  'bg-primary-100 text-primary-700': userIds.includes(currentUserId),
                                  'bg-neutral-100 text-neutral-700 hover:bg-neutral-200': !userIds.includes(currentUserId),
                                }
                              )}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message Actions */}
                      <div className=\"flex items-center space-x-fib-1 mt-fib-1 opacity-0 group-hover:opacity-100 transition-opacity\">
                        <AccessibleButton
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => setReplyingTo(message)}
                          ariaLabel=\"Reply to message\"
                        >
                          <svg className=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6\" />
                          </svg>
                        </AccessibleButton>
                        
                        <AccessibleButton
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => setShowEmojiPicker(message.id)}
                          ariaLabel=\"Add reaction\"
                        >
                          <svg className=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />
                          </svg>
                        </AccessibleButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Context */}
          {replyingTo && (
            <div className=\"px-fib-4 py-fib-2 bg-neutral-50 border-t border-neutral-200\">
              <div className=\"flex items-center justify-between\">
                <div className=\"flex items-center space-x-fib-2 text-mobile-sm text-neutral-600\">
                  <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6\" />
                  </svg>
                  <span>Replying to {replyingTo.senderName}</span>
                  <span className=\"truncate max-w-xs\">"{replyingTo.content}"</span>
                </div>
                <AccessibleButton
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setReplyingTo(null)}
                  ariaLabel=\"Cancel reply\"
                >
                  <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
                  </svg>
                </AccessibleButton>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className=\"p-fib-4 border-t border-neutral-200 flex-shrink-0\">
            <div className=\"flex items-end space-x-fib-2\">
              <div className=\"flex-1\">
                <textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${currentThread?.title || 'group'}...`}
                  className=\"w-full px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none\"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
              </div>
              
              <div className=\"flex items-center space-x-fib-1\">
                <AccessibleButton
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  ariaLabel=\"Upload image\"
                >
                  <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" />
                  </svg>
                </AccessibleButton>
                
                <AccessibleButton
                  variant=\"primary\"
                  size=\"sm\"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isUploading}
                  ariaLabel=\"Send message\"
                >
                  <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 19l9 2-9-18-9 18 9-2zm0 0v-8\" />
                  </svg>
                </AccessibleButton>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type=\"file\"
              accept=\"image/*\"
              onChange={handleImageUpload}
              className=\"hidden\"
              aria-label=\"Upload image file\"
            />
          </div>
        </div>

        {/* Member List Sidebar */}
        <AnimatePresence>
          {showMemberList && (
            <motion.div
              className=\"w-64 border-l border-neutral-200 flex flex-col flex-shrink-0\"
              initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
              animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
              exit={reducedMotion ? {} : { opacity: 0, x: 20 }}
              transition={reducedMotion ? {} : { duration: 0.2 }}
            >
              <div className=\"p-fib-3 border-b border-neutral-100\">
                <h3 className=\"text-mobile-sm font-semibold text-neutral-900\">
                  Members ({members.length})
                </h3>
              </div>
              
              <div className=\"flex-1 overflow-y-auto p-fib-2 space-y-fib-1\">
                {members.map((member) => (
                  <div key={member.id} className=\"flex items-center space-x-fib-2 p-fib-2 rounded-lg hover:bg-neutral-50\">
                    <div className=\"relative\">
                      <div className=\"w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center\">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={`${member.displayName}'s avatar`}
                            className=\"w-full h-full rounded-full object-cover\"
                          />
                        ) : (
                          <span className=\"text-xs font-semibold text-white\">
                            {member.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {member.isOnline && (
                        <div className=\"absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border-2 border-white rounded-full\" />
                      )}
                    </div>
                    
                    <div className=\"flex-1 min-w-0\">
                      <h4 className=\"text-mobile-sm font-medium text-neutral-900 truncate\">
                        {member.displayName}
                        {member.id === currentUserId && (
                          <span className=\"ml-fib-1 text-xs text-neutral-500\">(You)</span>
                        )}
                      </h4>
                      <p className=\"text-mobile-xs text-neutral-500\">
                        {member.isOnline ? 'Online' : member.lastSeen ? `Last seen ${getMessageTime(member.lastSeen)}` : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}