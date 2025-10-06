'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import TouchButton, { IconButton, ButtonIcons } from '@/components/ui/TouchButton';
import MobileInput from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

type MessageType = 'text' | 'image' | 'item' | 'system';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  itemId?: string;
  itemName?: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  mentions?: string[];
  threadId?: string;
  replyTo?: string;
}

interface ChatGroup {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }[];
}

export default function ChatPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('1');
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock data
  const groups: ChatGroup[] = [
    {
      id: '1',
      name: 'Family Shopping',
      members: [
        { id: '1', name: 'You', isOnline: true },
        { id: '2', name: 'Sarah', avatar: '👩', isOnline: true },
        { id: '3', name: 'Mike', avatar: '👨', isOnline: false },
        { id: '4', name: 'Lisa', avatar: '👧', isOnline: true },
      ],
    },
    {
      id: '2',
      name: 'Roommates',
      members: [
        { id: '1', name: 'You', isOnline: true },
        { id: '3', name: 'Mike', avatar: '👨', isOnline: false },
        { id: '8', name: 'Alex', avatar: '🧑', isOnline: true },
      ],
    },
    {
      id: '3',
      name: 'Office Team',
      members: [
        { id: '1', name: 'You', isOnline: true },
        { id: '5', name: 'John', avatar: '👨‍💼', isOnline: true },
        { id: '6', name: 'Emma', avatar: '👩‍💼', isOnline: false },
        { id: '7', name: 'David', avatar: '👨‍💻', isOnline: true },
      ],
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      type: 'system',
      content: 'Sarah added "Organic Milk" to the shopping list',
      sender: { id: 'system', name: 'System' },
      timestamp: new Date('2025-01-06T10:00:00'),
    },
    {
      id: '2',
      type: 'text',
      content: 'Hey everyone! I added milk to our list. Should I get the 1L or 2L cartons?',
      sender: { id: '2', name: 'Sarah', avatar: '👩' },
      timestamp: new Date('2025-01-06T10:01:00'),
    },
    {
      id: '3',
      type: 'text',
      content: '2L please! We go through it pretty quickly 😊',
      sender: { id: '4', name: 'Lisa', avatar: '👧' },
      timestamp: new Date('2025-01-06T10:02:00'),
      replyTo: '2',
    },
    {
      id: '4',
      type: 'text',
      content: '@Sarah can you also grab some bread while you\'re there?',
      sender: { id: '1', name: 'You' },
      timestamp: new Date('2025-01-06T10:05:00'),
      mentions: ['Sarah'],
    },
    {
      id: '5',
      type: 'item',
      content: 'Added "Whole Wheat Bread" to the list',
      itemId: '2',
      itemName: 'Whole Wheat Bread',
      sender: { id: '2', name: 'Sarah', avatar: '👩' },
      timestamp: new Date('2025-01-06T10:06:00'),
    },
    {
      id: '6',
      type: 'text',
      content: 'Perfect! I\'ll pick up both items this afternoon 👍',
      sender: { id: '2', name: 'Sarah', avatar: '👩' },
      timestamp: new Date('2025-01-06T10:07:00'),
    },
    {
      id: '7',
      type: 'image',
      content: 'Found these organic options, which one looks better?',
      imageUrl: '/api/placeholder/300/200',
      sender: { id: '2', name: 'Sarah', avatar: '👩' },
      timestamp: new Date('2025-01-06T14:30:00'),
    },
  ];

  const currentGroup = groups.find(g => g.id === selectedGroup);
  const groupMessages = messages.filter(m => true); // In real app, filter by group

  useEffect(() => {
    scrollToBottom();
  }, [groupMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // In real app, send message via API
    toast.success('Message sent!');
    setMessage('');
    setReplyingTo(null);
    
    // Focus back to input
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleMention = (userName: string) => {
    setMessage(prev => prev + `@${userName} `);
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const renderMessage = (msg: Message, index: number) => {
    const isOwn = msg.sender.id === '1';
    const showAvatar = !isOwn && (index === 0 || groupMessages[index - 1]?.sender.id !== msg.sender.id);
    const showName = !isOwn && showAvatar;

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-fib-2`}
      >
        <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {showAvatar && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm mr-fib-1">
              {msg.sender.avatar || msg.sender.name[0]}
            </div>
          )}
          
          <div className={`${!showAvatar && !isOwn ? 'ml-9' : ''}`}>
            {/* Sender name */}
            {showName && (
              <p className="text-mobile-xs text-neutral-600 mb-1 px-fib-2">
                {msg.sender.name}
              </p>
            )}
            
            {/* Reply indicator */}
            {msg.replyTo && (
              <div className="text-mobile-xs text-neutral-500 mb-1 px-fib-2">
                Replying to {groupMessages.find(m => m.id === msg.replyTo)?.sender.name}
              </div>
            )}
            
            {/* Message bubble */}
            <div
              className={`px-fib-3 py-fib-2 rounded-xl ${
                isOwn
                  ? 'bg-primary-500 text-white'
                  : msg.type === 'system'
                  ? 'bg-neutral-100 text-neutral-600 text-center'
                  : 'bg-white border border-neutral-200 text-neutral-900'
              }`}
            >
              {msg.type === 'text' && (
                <p className="text-mobile-sm whitespace-pre-wrap">
                  {msg.content.split(/(@\w+)/g).map((part, i) => 
                    part.startsWith('@') ? (
                      <span key={i} className="font-medium text-primary-300">
                        {part}
                      </span>
                    ) : part
                  )}
                </p>
              )}
              
              {msg.type === 'system' && (
                <p className="text-mobile-xs">{msg.content}</p>
              )}
              
              {msg.type === 'item' && (
                <div className="flex items-center space-x-fib-1">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-mobile-sm">{msg.content}</span>
                </div>
              )}
              
              {msg.type === 'image' && (
                <div>
                  <p className="text-mobile-sm mb-fib-1">{msg.content}</p>
                  <div className="bg-neutral-200 rounded-lg p-fib-2 text-center">
                    <svg className="w-8 h-8 mx-auto text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-mobile-xs text-neutral-500 mt-1">Image placeholder</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Timestamp and actions */}
            <div className={`flex items-center mt-1 space-x-fib-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className="text-mobile-xs text-neutral-500">
                {formatTime(msg.timestamp)}
              </span>
              {!isOwn && msg.type === 'text' && (
                <button
                  onClick={() => handleReply(msg)}
                  className="text-mobile-xs text-neutral-400 hover:text-neutral-600"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <MobileLayout title={currentGroup?.name || 'Chat'} showHeader showNavigation>
      <div className="flex flex-col h-full">
        {/* Group selector */}
        <div className="px-fib-3 py-fib-2 border-b border-neutral-200 bg-white">
          <div className="flex space-x-fib-1 overflow-x-auto scrollbar-hide">
            {groups.map((group) => (
              <TouchButton
                key={group.id}
                variant={selectedGroup === group.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedGroup(group.id)}
                className="flex-shrink-0"
              >
                {group.name}
              </TouchButton>
            ))}
          </div>
        </div>

        {/* Members bar */}
        <div className="px-fib-3 py-fib-2 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center space-x-fib-2">
            <div className="flex -space-x-1">
              {currentGroup?.members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="relative w-6 h-6 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs"
                  title={member.name}
                >
                  {member.avatar || member.name[0]}
                  {member.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success-500 rounded-full border border-white" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-mobile-sm text-neutral-600">
              {currentGroup?.members.length} members
            </span>
            <div className="flex-1" />
            <IconButton
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              }
              label="Group options"
              variant="ghost"
              size="sm"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-fib-3 py-fib-3 space-y-fib-2">
          {groupMessages.map((msg, index) => renderMessage(msg, index))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply indicator */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-fib-3 py-fib-2 bg-neutral-100 border-t border-neutral-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-mobile-xs text-neutral-600">
                    Replying to {replyingTo.sender.name}
                  </p>
                  <p className="text-mobile-sm text-neutral-900 truncate">
                    {replyingTo.content}
                  </p>
                </div>
                <IconButton
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                  label="Cancel reply"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="px-fib-3 py-fib-2 bg-white border-t border-neutral-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-end space-x-fib-2">
            <div className="flex-1">
              <MobileInput
                ref={inputRef}
                value={message}
                onChange={setMessage}
                placeholder="Type a message..."
                onKeyDown={handleKeyPress}
                className="resize-none"
              />
            </div>
            
            <div className="flex items-center space-x-fib-1">
              <IconButton
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                }
                label="Attach image"
                variant="ghost"
                size="sm"
                onClick={() => toast.success('Image attachment coming soon!')}
              />
              
              <TouchButton
                variant="primary"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                }
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                Send
              </TouchButton>
            </div>
          </div>
          
          {/* Quick mentions */}
          <div className="flex items-center space-x-fib-1 mt-fib-1">
            <span className="text-mobile-xs text-neutral-500">Quick mention:</span>
            {currentGroup?.members.filter(m => m.id !== '1').map((member) => (
              <button
                key={member.id}
                onClick={() => handleMention(member.name)}
                className="text-mobile-xs px-fib-1 py-0.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                @{member.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}