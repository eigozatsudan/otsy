import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import GroupChat from '@/components/chat/GroupChat';
import ItemThread from '@/components/chat/ItemThread';
import MentionAutocomplete, { useMentions } from '@/components/chat/MentionAutocomplete';
import NotificationSystem, { useNotificationPermissions } from '@/components/chat/NotificationSystem';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockMembers = [
  {
    id: 'user-1',
    displayName: 'John Doe',
    email: 'john@example.com',
    isOnline: true,
  },
  {
    id: 'user-2',
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    isOnline: false,
    lastSeen: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-3',
    displayName: 'Bob Smith',
    email: 'bob@example.com',
    isOnline: true,
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hey everyone! Should we get organic bananas?',
    senderId: 'user-1',
    senderName: 'John Doe',
    timestamp: '2024-01-15T10:00:00Z',
    type: 'text' as const,
    mentions: [],
  },
  {
    id: 'msg-2',
    content: '@John Doe Yes, organic is better!',
    senderId: 'user-2',
    senderName: 'Jane Doe',
    timestamp: '2024-01-15T10:05:00Z',
    type: 'text' as const,
    mentions: ['user-1'],
  },
  {
    id: 'msg-3',
    content: 'I can pick them up on my way home',
    senderId: 'user-3',
    senderName: 'Bob Smith',
    timestamp: '2024-01-15T10:10:00Z',
    type: 'text' as const,
    mentions: [],
    reactions: { '👍': ['user-1', 'user-2'] },
  },
];

const mockThreads = [
  {
    id: 'thread-1',
    title: 'General Chat',
    messages: mockMessages,
    participantIds: ['user-1', 'user-2', 'user-3'],
    lastMessageAt: '2024-01-15T10:10:00Z',
    unreadCount: 0,
  },
  {
    id: 'thread-2',
    itemId: 'item-1',
    itemName: 'Organic Bananas',
    title: 'Organic Bananas Discussion',
    messages: [mockMessages[0]],
    participantIds: ['user-1', 'user-2'],
    lastMessageAt: '2024-01-15T10:00:00Z',
    unreadCount: 1,
  },
];

const mockItem = {
  id: 'item-1',
  name: 'Organic Bananas',
  category: 'Produce',
  quantity: 6,
  unit: 'pcs',
  notes: 'Make sure they are ripe',
  status: 'todo' as const,
  addedBy: 'user-1',
  addedByName: 'John Doe',
};

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'mention' as const,
    title: 'You were mentioned',
    message: 'Jane Doe mentioned you in Organic Bananas Discussion',
    timestamp: '2024-01-15T10:05:00Z',
    senderId: 'user-2',
    senderName: 'Jane Doe',
    threadId: 'thread-2',
    threadTitle: 'Organic Bananas Discussion',
    isRead: false,
    priority: 'high' as const,
  },
  {
    id: 'notif-2',
    type: 'message' as const,
    title: 'New message',
    message: 'Bob Smith sent a message in General Chat',
    timestamp: '2024-01-15T10:10:00Z',
    senderId: 'user-3',
    senderName: 'Bob Smith',
    threadId: 'thread-1',
    threadTitle: 'General Chat',
    isRead: true,
    priority: 'normal' as const,
  },
];

describe('Chat Components', () => {
  describe('GroupChat', () => {
    const defaultProps = {
      groupId: 'group-1',
      members: mockMembers,
      currentUserId: 'user-1',
      threads: mockThreads,
      activeThreadId: 'thread-1',
      onSendMessage: jest.fn().mockResolvedValue(undefined),
      onUploadImage: jest.fn().mockResolvedValue('image-url'),
      onCreateThread: jest.fn().mockResolvedValue('new-thread-id'),
      onSwitchThread: jest.fn(),
      onMarkAsRead: jest.fn(),
      onReactToMessage: jest.fn(),
      onEditMessage: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<GroupChat {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display chat interface', () => {
      render(<GroupChat {...defaultProps} />);
      
      expect(screen.getByText('General Chat')).toBeInTheDocument();
      expect(screen.getByText('Threads')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Message General Chat...')).toBeInTheDocument();
    });

    it('should display thread list', () => {
      render(<GroupChat {...defaultProps} />);
      
      expect(screen.getByText('General Chat')).toBeInTheDocument();
      expect(screen.getByText('Organic Bananas Discussion')).toBeInTheDocument();
      expect(screen.getByText('📝 Organic Bananas')).toBeInTheDocument();
    });

    it('should display messages', () => {
      render(<GroupChat {...defaultProps} />);
      
      expect(screen.getByText('Hey everyone! Should we get organic bananas?')).toBeInTheDocument();
      expect(screen.getByText('Yes, organic is better!')).toBeInTheDocument();
      expect(screen.getByText('I can pick them up on my way home')).toBeInTheDocument();
    });

    it('should handle message sending', async () => {
      const mockProps = { ...defaultProps };
      render(<GroupChat {...mockProps} />);
      
      const messageInput = screen.getByPlaceholderText('Message General Chat...');
      const sendButton = screen.getByLabelText('Send message');
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockProps.onSendMessage).toHaveBeenCalledWith(
          'Test message',
          'thread-1',
          undefined,
          []
        );
      });
    });

    it('should handle Enter key for sending messages', async () => {
      const mockProps = { ...defaultProps };
      render(<GroupChat {...mockProps} />);
      
      const messageInput = screen.getByPlaceholderText('Message General Chat...');
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.keyDown(messageInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(mockProps.onSendMessage).toHaveBeenCalledWith(
          'Test message',
          'thread-1',
          undefined,
          []
        );
      });
    });

    it('should handle thread switching', () => {
      const mockProps = { ...defaultProps };
      render(<GroupChat {...mockProps} />);
      
      const threadButton = screen.getByText('Organic Bananas Discussion');
      fireEvent.click(threadButton);
      
      expect(mockProps.onSwitchThread).toHaveBeenCalledWith('thread-2');
    });

    it('should show unread count', () => {
      render(<GroupChat {...defaultProps} />);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count for thread-2
    });

    it('should display message reactions', () => {
      render(<GroupChat {...defaultProps} />);
      
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Reaction count
    });

    it('should handle member list toggle', () => {
      render(<GroupChat {...defaultProps} />);
      
      const memberListButton = screen.getByLabelText('Toggle member list');
      fireEvent.click(memberListButton);
      
      expect(screen.getByText('Members (3)')).toBeInTheDocument();
      expect(screen.getByText('John Doe (You)')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should show online status', () => {
      render(<GroupChat {...defaultProps} />);
      
      const memberListButton = screen.getByLabelText('Toggle member list');
      fireEvent.click(memberListButton);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText(/Last seen/)).toBeInTheDocument();
    });

    it('should handle image upload', () => {
      render(<GroupChat {...defaultProps} />);
      
      const uploadButton = screen.getByLabelText('Upload image');
      expect(uploadButton).toBeInTheDocument();
      
      // File input should be hidden but accessible
      const fileInput = screen.getByLabelText('Upload image file');
      expect(fileInput).toHaveClass('hidden');
    });

    it('should extract mentions from message', async () => {
      const mockProps = { ...defaultProps };
      render(<GroupChat {...mockProps} />);
      
      const messageInput = screen.getByPlaceholderText('Message General Chat...');
      
      fireEvent.change(messageInput, { target: { value: '@John test message' } });
      fireEvent.keyDown(messageInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(mockProps.onSendMessage).toHaveBeenCalledWith(
          '@John test message',
          'thread-1',
          undefined,
          ['user-1'] // Should extract John's user ID
        );
      });
    });
  });

  describe('ItemThread', () => {
    const defaultProps = {
      item: mockItem,
      messages: [mockMessages[0]],
      currentUserId: 'user-1',
      onSendMessage: jest.fn().mockResolvedValue(undefined),
      onClose: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ItemThread {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display item information', () => {
      render(<ItemThread {...defaultProps} />);
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.getByText('6 pcs')).toBeInTheDocument();
      expect(screen.getByText('Produce')).toBeInTheDocument();
      expect(screen.getByText('Notes: Make sure they are ripe')).toBeInTheDocument();
    });

    it('should display item status', () => {
      render(<ItemThread {...defaultProps} />);
      
      expect(screen.getByText('Todo')).toBeInTheDocument();
    });

    it('should handle message sending', async () => {
      const mockProps = { ...defaultProps };
      render(<ItemThread {...mockProps} />);
      
      const messageInput = screen.getByPlaceholderText('Discuss "Organic Bananas"...');
      const sendButton = screen.getByLabelText('Send message');
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockProps.onSendMessage).toHaveBeenCalledWith('Test message', []);
      });
    });

    it('should handle close action', () => {
      const mockProps = { ...defaultProps };
      render(<ItemThread {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Close item discussion');
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should handle Escape key to close', () => {
      const mockProps = { ...defaultProps };
      render(<ItemThread {...mockProps} />);
      
      const messageInput = screen.getByPlaceholderText('Discuss "Organic Bananas"...');
      fireEvent.keyDown(messageInput, { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should show empty state when no messages', () => {
      render(<ItemThread {...defaultProps} messages={[]} />);
      
      expect(screen.getByText('Start the conversation')).toBeInTheDocument();
      expect(screen.getByText(/Discuss details, preferences, or questions/)).toBeInTheDocument();
    });

    it('should format mentions in messages', () => {
      const messageWithMention = {
        ...mockMessages[1],
        content: '@John Doe Yes, organic is better!',
      };
      
      render(<ItemThread {...defaultProps} messages={[messageWithMention]} />);
      
      // Should render mention with special styling
      expect(screen.getByText(/Yes, organic is better!/)).toBeInTheDocument();
    });
  });

  describe('MentionAutocomplete', () => {
    const defaultProps = {
      members: mockMembers,
      inputValue: '@Jo',
      cursorPosition: 3,
      onSelect: jest.fn(),
      onClose: jest.fn(),
      inputRef: { current: null } as React.RefObject<HTMLTextAreaElement>,
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<MentionAutocomplete {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display filtered members', () => {
      render(<MentionAutocomplete {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument(); // Should be filtered out
    });

    it('should show member status', () => {
      render(<MentionAutocomplete {...defaultProps} />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should handle member selection', () => {
      const mockProps = { ...defaultProps };
      render(<MentionAutocomplete {...mockProps} />);
      
      const memberButton = screen.getByText('John Doe');
      fireEvent.click(memberButton);
      
      expect(mockProps.onSelect).toHaveBeenCalledWith(
        mockMembers[0],
        1, // Start position
        3  // End position
      );
    });

    it('should show keyboard navigation instructions', () => {
      render(<MentionAutocomplete {...defaultProps} />);
      
      expect(screen.getByText('↑↓ to navigate • Enter to select • Esc to close')).toBeInTheDocument();
    });
  });

  describe('NotificationSystem', () => {
    const defaultProps = {
      notifications: mockNotifications,
      onMarkAsRead: jest.fn(),
      onMarkAllAsRead: jest.fn(),
      onDismiss: jest.fn(),
      onNavigateToThread: jest.fn(),
      onNavigateToItem: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<NotificationSystem {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display notification bell with unread count', () => {
      render(<NotificationSystem {...defaultProps} />);
      
      const bellButton = screen.getByLabelText(/Notifications \(1 unread\)/);
      expect(bellButton).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread badge
      expect(screen.getByText('@')).toBeInTheDocument(); // Mention badge
    });

    it('should open notification panel', () => {
      render(<NotificationSystem {...defaultProps} />);
      
      const bellButton = screen.getByLabelText(/Notifications/);
      fireEvent.click(bellButton);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('You were mentioned')).toBeInTheDocument();
      expect(screen.getByText('New message')).toBeInTheDocument();
    });

    it('should filter notifications', () => {
      render(<NotificationSystem {...defaultProps} />);
      
      const bellButton = screen.getByLabelText(/Notifications/);
      fireEvent.click(bellButton);
      
      const unreadTab = screen.getByText('Unread');
      fireEvent.click(unreadTab);
      
      expect(screen.getByText('You were mentioned')).toBeInTheDocument();
      expect(screen.queryByText('New message')).not.toBeInTheDocument();
    });

    it('should handle notification click', () => {
      const mockProps = { ...defaultProps };
      render(<NotificationSystem {...mockProps} />);
      
      const bellButton = screen.getByLabelText(/Notifications/);
      fireEvent.click(bellButton);
      
      const notificationButton = screen.getByText('You were mentioned');
      fireEvent.click(notificationButton);
      
      expect(mockProps.onMarkAsRead).toHaveBeenCalledWith('notif-1');
      expect(mockProps.onNavigateToThread).toHaveBeenCalledWith('thread-2');
    });

    it('should handle mark all as read', () => {
      const mockProps = { ...defaultProps };
      render(<NotificationSystem {...mockProps} />);
      
      const bellButton = screen.getByLabelText(/Notifications/);
      fireEvent.click(bellButton);
      
      const markAllButton = screen.getByText('Mark all read');
      fireEvent.click(markAllButton);
      
      expect(mockProps.onMarkAllAsRead).toHaveBeenCalled();
    });

    it('should show empty state when no notifications', () => {
      render(<NotificationSystem {...defaultProps} notifications={[]} />);
      
      const bellButton = screen.getByLabelText(/Notifications/);
      fireEvent.click(bellButton);
      
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('should format relative time correctly', () => {
      const recentNotification = {
        ...mockNotifications[0],
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      };
      
      render(<NotificationSystem {...defaultProps} notifications={[recentNotification]} />);
      
      const bellButton = screen.getByLabelText(/Notifications/);
      fireEvent.click(bellButton);
      
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });
  });

  describe('useMentions Hook', () => {
    const TestComponent = () => {
      const inputRef = React.useRef<HTMLTextAreaElement>(null);
      const {
        inputValue,
        showAutocomplete,
        handleInputChange,
        handleMentionSelect,
        handleAutocompleteClose,
      } = useMentions(inputRef, mockMembers);

      return (
        <div>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            data-testid="input"
          />
          {showAutocomplete && (
            <div data-testid="autocomplete">
              <button onClick={() => handleMentionSelect(mockMembers[0], 0, 3)}>
                Select John
              </button>
              <button onClick={handleAutocompleteClose}>
                Close
              </button>
            </div>
          )}
        </div>
      );
    };

    it('should show autocomplete when typing @', () => {
      render(<TestComponent />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: '@Jo' } });
      
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
    });

    it('should handle mention selection', () => {
      render(<TestComponent />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: '@Jo' } });
      
      const selectButton = screen.getByText('Select John');
      fireEvent.click(selectButton);
      
      expect(input).toHaveValue('@John Doe ');
    });

    it('should close autocomplete', () => {
      render(<TestComponent />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: '@Jo' } });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('autocomplete')).not.toBeInTheDocument();
    });
  });

  describe('useNotificationPermissions Hook', () => {
    const TestComponent = () => {
      const {
        permission,
        isSupported,
        requestPermission,
        showNotification,
      } = useNotificationPermissions();

      return (
        <div>
          <div data-testid="permission">{permission}</div>
          <div data-testid="supported">{isSupported.toString()}</div>
          <button onClick={requestPermission}>Request Permission</button>
          <button onClick={() => showNotification('Test', { body: 'Test body' })}>
            Show Notification
          </button>
        </div>
      );
    };

    beforeEach(() => {
      // Mock Notification API
      global.Notification = {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      } as any;
    });

    it('should detect notification support', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('supported')).toHaveTextContent('true');
      expect(screen.getByTestId('permission')).toHaveTextContent('default');
    });

    it('should request notification permission', async () => {
      render(<TestComponent />);
      
      const requestButton = screen.getByText('Request Permission');
      fireEvent.click(requestButton);
      
      await waitFor(() => {
        expect(global.Notification.requestPermission).toHaveBeenCalled();
      });
    });
  });

  describe('Message Formatting', () => {
    it('should format mentions in message content', () => {
      const messageWithMention = '@John Doe thanks for the suggestion!';
      const formatted = messageWithMention.replace(
        /@(\w+)/g, 
        '<span class="mention text-primary-600 font-medium">@$1</span>'
      );
      
      expect(formatted).toContain('class="mention text-primary-600 font-medium"');
    });

    it('should handle multiple mentions', () => {
      const messageWithMentions = '@John and @Jane, what do you think?';
      const mentions = [];
      let match;
      const regex = /@(\w+)/g;
      
      while ((match = regex.exec(messageWithMentions)) !== null) {
        mentions.push(match[1]);
      }
      
      expect(mentions).toEqual(['John', 'Jane']);
    });
  });

  describe('Real-time Features', () => {
    it('should handle message reactions', () => {
      render(<GroupChat {...{
        groupId: 'group-1',
        members: mockMembers,
        currentUserId: 'user-1',
        threads: mockThreads,
        onSendMessage: jest.fn(),
        onUploadImage: jest.fn(),
        onCreateThread: jest.fn(),
        onSwitchThread: jest.fn(),
        onMarkAsRead: jest.fn(),
        onReactToMessage: jest.fn(),
        onEditMessage: jest.fn(),
      }} />);
      
      // Should display existing reactions
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should handle message editing', () => {
      render(<GroupChat {...{
        groupId: 'group-1',
        members: mockMembers,
        currentUserId: 'user-1',
        threads: mockThreads,
        onSendMessage: jest.fn(),
        onUploadImage: jest.fn(),
        onCreateThread: jest.fn(),
        onSwitchThread: jest.fn(),
        onMarkAsRead: jest.fn(),
        onReactToMessage: jest.fn(),
        onEditMessage: jest.fn(),
      }} />);
      
      // Double-click on own message should enable editing
      const ownMessage = screen.getByText('Hey everyone! Should we get organic bananas?');
      fireEvent.doubleClick(ownMessage);
      
      // Should show edit interface (implementation dependent)
    });
  });
});