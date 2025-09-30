'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';

interface GroupMember {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

interface MentionAutocompleteProps {
  members: GroupMember[];
  inputValue: string;
  cursorPosition: number;
  onSelect: (member: GroupMember, startPos: number, endPos: number) => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export default function MentionAutocomplete({
  members,
  inputValue,
  cursorPosition,
  onSelect,
  onClose,
  inputRef,
}: MentionAutocompleteProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  
  const listRef = useRef<HTMLDivElement>(null);

  // Find mention query and position
  useEffect(() => {
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const startPos = cursorPosition - mentionMatch[0].length;
      
      setMentionQuery(query);
      setMentionStart(startPos);
      
      // Filter members based on query
      const filtered = members.filter(member =>
        member.displayName.toLowerCase().includes(query)
      ).slice(0, 5); // Limit to 5 suggestions
      
      setFilteredMembers(filtered);
      setSelectedIndex(0);
      
      if (filtered.length === 0) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [inputValue, cursorPosition, members, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredMembers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredMembers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredMembers.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredMembers[selectedIndex]) {
            handleSelect(filteredMembers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (inputRef.current) {
      inputRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        inputRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [filteredMembers, selectedIndex, inputRef]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
      }
    }
  }, [selectedIndex, reducedMotion]);

  const handleSelect = (member: GroupMember) => {
    const endPos = mentionStart + mentionQuery.length + 1; // +1 for the @ symbol
    onSelect(member, mentionStart, endPos);
    announce(`Mentioned ${member.displayName}`, 'polite');
  };

  const getPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };

    const input = inputRef.current;
    const inputRect = input.getBoundingClientRect();
    
    // Create a temporary element to measure text position
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'pre-wrap';
    temp.style.font = window.getComputedStyle(input).font;
    temp.style.padding = window.getComputedStyle(input).padding;
    temp.style.border = window.getComputedStyle(input).border;
    temp.style.width = `${input.offsetWidth}px`;
    
    const textBeforeCursor = inputValue.substring(0, mentionStart);
    temp.textContent = textBeforeCursor;
    
    document.body.appendChild(temp);
    const tempRect = temp.getBoundingClientRect();
    document.body.removeChild(temp);
    
    return {
      top: inputRect.bottom + window.scrollY + 4,
      left: inputRect.left + window.scrollX + (tempRect.width % inputRect.width),
    };
  };

  if (filteredMembers.length === 0) {
    return null;
  }

  const position = getPosition();

  return (
    <AnimatePresence>
      <motion.div
        ref={listRef}
        className=\"fixed z-50 bg-white border border-neutral-200 rounded-lg shadow-mobile-lg max-w-xs w-full\"
        style={{
          top: position.top,
          left: position.left,
        }}
        initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
        animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
        exit={reducedMotion ? {} : { opacity: 0, y: -10 }}
        transition={reducedMotion ? {} : { duration: 0.15 }}
        role=\"listbox\"
        aria-label=\"Mention suggestions\"
      >
        <div className=\"p-fib-1\">
          {filteredMembers.map((member, index) => (
            <motion.button
              key={member.id}
              onClick={() => handleSelect(member)}
              className={clsx(
                'w-full flex items-center space-x-fib-2 p-fib-2 rounded-lg text-left transition-colors focus:outline-none',
                {
                  'bg-primary-100 text-primary-900': index === selectedIndex,
                  'hover:bg-neutral-50': index !== selectedIndex,
                }
              )}
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              transition={reducedMotion ? {} : { duration: 0.1 }}
              role=\"option\"
              aria-selected={index === selectedIndex}
            >
              {/* Avatar */}
              <div className=\"relative flex-shrink-0\">
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
                  <div className=\"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 border border-white rounded-full\" />
                )}
              </div>

              {/* Member Info */}
              <div className=\"flex-1 min-w-0\">
                <h4 className=\"text-mobile-sm font-medium text-neutral-900 truncate\">
                  {member.displayName}
                </h4>
                <p className=\"text-mobile-xs text-neutral-500 truncate\">
                  {member.email}
                </p>
              </div>

              {/* Online Status */}
              <div className=\"flex-shrink-0\">
                {member.isOnline ? (
                  <span className=\"text-mobile-xs text-success-600 font-medium\">
                    Online
                  </span>
                ) : (
                  <span className=\"text-mobile-xs text-neutral-400\">
                    Offline
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className=\"px-fib-2 py-fib-1 border-t border-neutral-100 bg-neutral-50 rounded-b-lg\">
          <p className=\"text-mobile-xs text-neutral-600 text-center\">
            ↑↓ to navigate • Enter to select • Esc to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing mention functionality
export function useMentions(
  inputRef: React.RefObject<HTMLTextAreaElement>,
  members: GroupMember[]
) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Update cursor position
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
    
    // Check if we should show autocomplete
    const textBeforeCursor = value.substring(0, inputRef.current?.selectionStart || 0);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    setShowAutocomplete(!!mentionMatch);
  };

  const handleMentionSelect = (
    member: GroupMember,
    startPos: number,
    endPos: number
  ) => {
    const beforeMention = inputValue.substring(0, startPos);
    const afterMention = inputValue.substring(endPos);
    const newValue = `${beforeMention}@${member.displayName} ${afterMention}`;
    
    setInputValue(newValue);
    setShowAutocomplete(false);
    
    // Set cursor position after the mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = startPos + member.displayName.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleAutocompleteClose = () => {
    setShowAutocomplete(false);
  };

  return {
    inputValue,
    cursorPosition,
    showAutocomplete,
    handleInputChange,
    handleMentionSelect,
    handleAutocompleteClose,
  };
}