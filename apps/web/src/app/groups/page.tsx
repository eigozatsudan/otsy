'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { GroupCard } from '@/components/ui/GoldenCard';
import TouchButton, { FloatingActionButton, ButtonIcons } from '@/components/ui/TouchButton';
import { SearchInput } from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  // Mock data - replace with actual API calls
  const groups = [
    {
      id: '1',
      name: 'Family Shopping',
      description: 'Weekly groceries and household items',
      memberCount: 4,
      recentActivity: 'Sarah added milk to the list',
      unreadCount: 3,
      role: 'Owner' as const,
    },
    {
      id: '2',
      name: 'Roommates',
      description: 'Shared apartment supplies',
      memberCount: 3,
      recentActivity: 'Mike purchased cleaning supplies',
      unreadCount: 0,
      role: 'Member' as const,
    },
    {
      id: '3',
      name: 'Office Team',
      description: 'Team snacks and coffee supplies',
      memberCount: 8,
      recentActivity: 'Lisa suggested organic coffee',
      unreadCount: 1,
      role: 'Member' as const,
    },
  ];

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleJoinGroup = () => {
    toast.success('Join group feature coming soon!');
  };

  const handleGroupClick = (groupId: string) => {
    // Navigate to group detail page
    console.log('Navigate to group:', groupId);
    toast.success(`Opening ${groups.find(g => g.id === groupId)?.name}`);
    router.push('/shopping');
  };

  return (
    <MobileLayout title="My Groups" showHeader showNavigation>
      <div className="px-fib-3 py-fib-4 space-y-fib-5">
        {/* Header Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex space-x-fib-2">
            <TouchButton
              variant="primary"
              size="md"
              icon={ButtonIcons.Plus}
              className="flex-1"
              onClick={handleCreateGroup}
            >
              Create Group
            </TouchButton>
            <TouchButton
              variant="outline"
              size="md"
              icon={ButtonIcons.Share}
              className="flex-1"
              onClick={handleJoinGroup}
            >
              Join Group
            </TouchButton>
          </div>
        </motion.section>

        {/* Search */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.05 }}
        >
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search groups..."
            onClear={() => setSearchQuery('')}
          />
        </motion.section>

        {/* Groups List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.1 }}
        >
          <div className="space-y-fib-3">
            <div className="flex items-center justify-between">
              <h2 className="text-mobile-lg font-semibold text-neutral-900">
                Your Groups ({filteredGroups.length})
              </h2>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-fib-6">
                <div className="w-16 h-16 mx-auto mb-fib-3 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-mobile-lg font-medium text-neutral-900 mb-fib-1">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </h3>
                <p className="text-mobile-sm text-neutral-600 mb-fib-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first group to start collaborative shopping'
                  }
                </p>
                {!searchQuery && (
                  <TouchButton
                    variant="primary"
                    size="md"
                    icon={ButtonIcons.Plus}
                    onClick={handleCreateGroup}
                  >
                    Create Your First Group
                  </TouchButton>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-fib-3">
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: 0.15 + index * 0.05 }}
                  >
                    <div className="relative">
                      <GroupCard
                        name={group.name}
                        description={group.description}
                        memberCount={group.memberCount}
                        recentActivity={group.recentActivity}
                        unreadCount={group.unreadCount}
                        onClick={() => handleGroupClick(group.id)}
                      />
                      {/* Role badge */}
                      <div className="absolute top-fib-2 right-fib-2">
                        <span className={`px-fib-1 py-0.5 rounded-full text-xs font-medium ${
                          group.role === 'Owner' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {group.role}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-fib-3">
            <div className="bg-primary-50 rounded-xl p-fib-3 border border-primary-200">
              <div className="text-primary-600 mb-fib-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-mobile-2xl font-bold text-primary-900">{groups.length}</p>
              <p className="text-mobile-sm text-primary-700">Total Groups</p>
            </div>

            <div className="bg-success-50 rounded-xl p-fib-3 border border-success-200">
              <div className="text-success-600 mb-fib-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-mobile-2xl font-bold text-success-900">
                {groups.filter(g => g.role === 'Owner').length}
              </p>
              <p className="text-mobile-sm text-success-700">Owned Groups</p>
            </div>
          </div>
        </motion.section>

        {/* Bottom padding for navigation */}
        <div className="h-20" />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={ButtonIcons.Plus}
        onClick={handleCreateGroup}
      />
    </MobileLayout>
  );
}