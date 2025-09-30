// Group management components
export { default as GroupSelector, QuickGroupSwitcher } from './GroupSelector';
export { default as GroupDashboard } from './GroupDashboard';
export { default as GroupInvite } from './GroupInvite';
export { default as MemberManagement } from './MemberManagement';
export { default as ActivityFeed } from './ActivityFeed';

// Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  unreadCount?: number;
  recentActivity?: string;
}

export interface GroupMember {
  id: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
  lastActive?: string;
  avatar?: string;
}

export interface GroupActivity {
  id: string;
  type: 'item_added' | 'item_purchased' | 'member_joined' | 'purchase_recorded';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface GroupStats {
  totalItems: number;
  completedItems: number;
  totalSpent: number;
  pendingSettlements: number;
  activeMembers: number;
}