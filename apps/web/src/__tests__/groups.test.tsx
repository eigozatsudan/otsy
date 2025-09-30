import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import GroupDashboard from '@/components/groups/GroupDashboard';
import GroupInvite from '@/components/groups/GroupInvite';
import MemberManagement from '@/components/groups/MemberManagement';
import ActivityFeed from '@/components/groups/ActivityFeed';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockGroup = {
  id: 'group-1',
  name: 'Family Shopping',
  description: 'Our family grocery list',
  inviteCode: 'ABC123DEF456',
  createdAt: '2024-01-01T00:00:00Z',
  memberCount: 3,
  unreadCount: 2,
  stats: {
    totalItems: 10,
    completedItems: 6,
    totalSpent: 125.50,
    pendingSettlements: 1,
    activeMembers: 2,
  },
  members: [
    {
      id: 'user-1',
      displayName: 'John Doe',
      email: 'john@example.com',
      role: 'owner' as const,
      joinedAt: '2024-01-01T00:00:00Z',
      lastActive: '2024-01-15T12:00:00Z',
      stats: {
        itemsAdded: 5,
        purchasesMade: 3,
        totalSpent: 75.25,
      },
    },
    {
      id: 'user-2',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      role: 'member' as const,
      joinedAt: '2024-01-02T00:00:00Z',
      lastActive: '2024-01-14T10:00:00Z',
      stats: {
        itemsAdded: 3,
        purchasesMade: 2,
        totalSpent: 50.25,
      },
    },
  ],
  recentActivity: [
    {
      id: 'activity-1',
      type: 'item_added' as const,
      description: 'added milk to the shopping list',
      timestamp: '2024-01-15T10:00:00Z',
      userId: 'user-1',
      userName: 'John Doe',
    },
    {
      id: 'activity-2',
      type: 'purchase_recorded' as const,
      description: 'recorded a purchase of $25.50',
      timestamp: '2024-01-14T15:00:00Z',
      userId: 'user-2',
      userName: 'Jane Doe',
    },
  ],
};

const mockActivities = [
  {
    id: 'activity-1',
    type: 'item_added' as const,
    description: 'added milk to the shopping list',
    timestamp: '2024-01-15T10:00:00Z',
    userId: 'user-1',
    userName: 'John Doe',
    metadata: {
      itemName: 'Milk',
      itemId: 'item-1',
    },
  },
  {
    id: 'activity-2',
    type: 'purchase_recorded' as const,
    description: 'recorded a purchase',
    timestamp: '2024-01-14T15:00:00Z',
    userId: 'user-2',
    userName: 'Jane Doe',
    metadata: {
      amount: 25.50,
    },
  },
  {
    id: 'activity-3',
    type: 'member_joined' as const,
    description: 'joined the group',
    timestamp: '2024-01-13T12:00:00Z',
    userId: 'user-3',
    userName: 'Bob Smith',
    metadata: {
      memberCount: 3,
    },
  },
];

describe('Group Components', () => {
  describe('GroupDashboard', () => {
    const defaultProps = {
      group: mockGroup,
      currentUserId: 'user-1',
      onInviteMembers: jest.fn(),
      onManageMembers: jest.fn(),
      onViewShoppingList: jest.fn(),
      onViewPurchases: jest.fn(),
      onViewChat: jest.fn(),
      onEditGroup: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<GroupDashboard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display group information', () => {
      render(<GroupDashboard {...defaultProps} />);
      
      expect(screen.getByText('Family Shopping')).toBeInTheDocument();
      expect(screen.getByText('Our family grocery list')).toBeInTheDocument();
      expect(screen.getByText('3 members')).toBeInTheDocument();
    });

    it('should display stats correctly', () => {
      render(<GroupDashboard {...defaultProps} />);
      
      expect(screen.getByText('60%')).toBeInTheDocument(); // completion rate
      expect(screen.getByText('6 of 10 items')).toBeInTheDocument();
      expect(screen.getByText('$125.50')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // pending settlements
    });

    it('should handle tab navigation', () => {
      render(<GroupDashboard {...defaultProps} />);
      
      const activityTab = screen.getByRole('tab', { name: 'Recent Activity' });
      fireEvent.click(activityTab);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('John Doe added milk to the shopping list')).toBeInTheDocument();
    });

    it('should show owner-specific actions', () => {
      render(<GroupDashboard {...defaultProps} />);
      
      // Owner should see edit button
      expect(screen.getByLabelText('Edit group settings')).toBeInTheDocument();
    });

    it('should hide owner actions for non-owners', () => {
      render(<GroupDashboard {...defaultProps} currentUserId=\"user-2\" />);
      
      // Non-owner should not see edit button
      expect(screen.queryByLabelText('Edit group settings')).not.toBeInTheDocument();
    });

    it('should handle quick action clicks', () => {
      const mockProps = { ...defaultProps };
      render(<GroupDashboard {...mockProps} />);
      
      fireEvent.click(screen.getByText('Shopping List'));
      expect(mockProps.onViewShoppingList).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Purchases'));
      expect(mockProps.onViewPurchases).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Group Chat'));
      expect(mockProps.onViewChat).toHaveBeenCalled();
    });
  });

  describe('GroupInvite', () => {
    const defaultProps = {
      groupName: 'Family Shopping',
      inviteCode: 'ABC123DEF456',
      inviteUrl: 'https://app.example.com/invite/ABC123DEF456',
      onClose: jest.fn(),
      onRegenerateCode: jest.fn(),
    };

    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<GroupInvite {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display invite information', () => {
      render(<GroupInvite {...defaultProps} />);
      
      expect(screen.getByText('Invite Members')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ABC123DEF456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://app.example.com/invite/ABC123DEF456')).toBeInTheDocument();
    });

    it('should copy invite code to clipboard', async () => {
      render(<GroupInvite {...defaultProps} />);
      
      const copyButtons = screen.getAllByLabelText(/Copy invite/);
      fireEvent.click(copyButtons[1]); // Copy code button
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123DEF456');
      });
    });

    it('should copy invite URL to clipboard', async () => {
      render(<GroupInvite {...defaultProps} />);
      
      const copyButtons = screen.getAllByLabelText(/Copy invite/);
      fireEvent.click(copyButtons[0]); // Copy URL button
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://app.example.com/invite/ABC123DEF456');
      });
    });

    it('should show and hide QR code', () => {
      render(<GroupInvite {...defaultProps} />);
      
      const showQRButton = screen.getByLabelText('Show QR code');
      fireEvent.click(showQRButton);
      
      expect(screen.getByAltText('QR code for joining Family Shopping')).toBeInTheDocument();
      
      const hideQRButton = screen.getByLabelText('Hide QR code');
      fireEvent.click(hideQRButton);
      
      expect(screen.queryByAltText('QR code for joining Family Shopping')).not.toBeInTheDocument();
    });

    it('should handle regenerate code', () => {
      render(<GroupInvite {...defaultProps} />);
      
      const regenerateButton = screen.getByLabelText('Generate new invite code');
      fireEvent.click(regenerateButton);
      
      expect(defaultProps.onRegenerateCode).toHaveBeenCalled();
    });
  });

  describe('MemberManagement', () => {
    const defaultProps = {
      groupName: 'Family Shopping',
      members: mockGroup.members,
      currentUserId: 'user-1',
      onTransferOwnership: jest.fn().mockResolvedValue(undefined),
      onRemoveMember: jest.fn().mockResolvedValue(undefined),
      onClose: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<MemberManagement {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display member list', () => {
      render(<MemberManagement {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should expand member details', () => {
      render(<MemberManagement {...defaultProps} />);
      
      const memberButton = screen.getByLabelText('Jane Doe member details');
      fireEvent.click(memberButton);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // items added
      expect(screen.getByText('2')).toBeInTheDocument(); // purchases made
      expect(screen.getByText('$50.25')).toBeInTheDocument(); // total spent
    });

    it('should show owner actions for other members', () => {
      render(<MemberManagement {...defaultProps} />);
      
      const memberButton = screen.getByLabelText('Jane Doe member details');
      fireEvent.click(memberButton);
      
      expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
      expect(screen.getByText('Remove Member')).toBeInTheDocument();
    });

    it('should handle member removal confirmation', async () => {
      render(<MemberManagement {...defaultProps} />);
      
      const memberButton = screen.getByLabelText('Jane Doe member details');
      fireEvent.click(memberButton);
      
      const removeButton = screen.getByText('Remove Member');
      fireEvent.click(removeButton);
      
      // Should show confirmation dialog
      expect(screen.getByText('Remove Member')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove Jane Doe/)).toBeInTheDocument();
      
      // Confirm removal
      const confirmButton = screen.getAllByText('Remove Member')[1];
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(defaultProps.onRemoveMember).toHaveBeenCalledWith('user-2');
      });
    });

    it('should handle ownership transfer confirmation', async () => {
      render(<MemberManagement {...defaultProps} />);
      
      const memberButton = screen.getByLabelText('Jane Doe member details');
      fireEvent.click(memberButton);
      
      const transferButton = screen.getByText('Transfer Ownership');
      fireEvent.click(transferButton);
      
      // Should show confirmation dialog
      expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to transfer ownership/)).toBeInTheDocument();
      
      // Confirm transfer
      const confirmButton = screen.getAllByText('Transfer Ownership')[1];
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(defaultProps.onTransferOwnership).toHaveBeenCalledWith('user-2');
      });
    });
  });

  describe('ActivityFeed', () => {
    const defaultProps = {
      activities: mockActivities,
      loading: false,
      onLoadMore: jest.fn(),
      hasMore: true,
      onItemClick: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ActivityFeed {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display activities', () => {
      render(<ActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('John Doe added milk to the shopping list')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe recorded a purchase')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith joined the group')).toBeInTheDocument();
    });

    it('should filter activities by type', () => {
      render(<ActivityFeed {...defaultProps} />);
      
      const itemsFilter = screen.getByRole('tab', { name: /Items/ });
      fireEvent.click(itemsFilter);
      
      expect(screen.getByText('John Doe added milk to the shopping list')).toBeInTheDocument();
      expect(screen.queryByText('Jane Doe recorded a purchase')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Smith joined the group')).not.toBeInTheDocument();
    });

    it('should show activity metadata', () => {
      render(<ActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('"Milk"')).toBeInTheDocument();
      expect(screen.getByText('$25.50')).toBeInTheDocument();
      expect(screen.getByText('(3 members)')).toBeInTheDocument();
    });

    it('should handle activity item clicks', () => {
      render(<ActivityFeed {...defaultProps} />);
      
      const activityItem = screen.getByLabelText(/View details for: added milk to the shopping list/);
      fireEvent.click(activityItem);
      
      expect(defaultProps.onItemClick).toHaveBeenCalledWith(mockActivities[0]);
    });

    it('should handle load more', () => {
      render(<ActivityFeed {...defaultProps} />);
      
      const loadMoreButton = screen.getByText('Load More Activities');
      fireEvent.click(loadMoreButton);
      
      expect(defaultProps.onLoadMore).toHaveBeenCalled();
    });

    it('should show loading state', () => {
      render(<ActivityFeed {...defaultProps} loading={true} activities={[]} />);
      
      expect(screen.getByText('Loading activities...')).toBeInTheDocument();
    });

    it('should show empty state', () => {
      render(<ActivityFeed {...defaultProps} activities={[]} />);
      
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
      expect(screen.getByText(/Group activity will appear here/)).toBeInTheDocument();
    });

    it('should format relative time correctly', () => {
      const recentActivity = {
        ...mockActivities[0],
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      };
      
      render(<ActivityFeed {...defaultProps} activities={[recentActivity]} />);
      
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in GroupDashboard tabs', () => {
      const defaultProps = {
        group: mockGroup,
        currentUserId: 'user-1',
        onInviteMembers: jest.fn(),
        onManageMembers: jest.fn(),
        onViewShoppingList: jest.fn(),
        onViewPurchases: jest.fn(),
        onViewChat: jest.fn(),
        onEditGroup: jest.fn(),
      };

      render(<GroupDashboard {...defaultProps} />);
      
      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      const activityTab = screen.getByRole('tab', { name: 'Recent Activity' });
      
      // Focus first tab
      overviewTab.focus();
      expect(overviewTab).toHaveFocus();
      
      // Navigate with arrow keys
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
      expect(activityTab).toHaveFocus();
      
      // Activate with Enter
      fireEvent.keyDown(activityTab, { key: 'Enter' });
      expect(activityTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should support keyboard navigation in ActivityFeed filters', () => {
      render(<ActivityFeed activities={mockActivities} />);
      
      const allFilter = screen.getByRole('tab', { name: /All/ });
      const itemsFilter = screen.getByRole('tab', { name: /Items/ });
      
      allFilter.focus();
      expect(allFilter).toHaveFocus();
      
      fireEvent.keyDown(allFilter, { key: 'ArrowRight' });
      expect(itemsFilter).toHaveFocus();
      
      fireEvent.keyDown(itemsFilter, { key: 'Enter' });
      expect(itemsFilter).toHaveAttribute('aria-selected', 'true');
    });
  });
});