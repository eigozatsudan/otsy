'use client';

import React from 'react';
import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import { GroupCard, ShoppingItemCard } from '@/components/ui/GoldenCard';
import TouchButton, { FloatingActionButton, ButtonIcons } from '@/components/ui/TouchButton';
import { SearchInput } from '@/components/ui/MobileInput';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Mock data for demonstration
  const groups = [
    {
      id: '1',
      name: 'Family Shopping',
      description: 'Weekly groceries and household items for the family',
      memberCount: 4,
      recentActivity: 'Sarah added milk to the list',
      unreadCount: 3,
    },
    {
      id: '2',
      name: 'Roommates',
      description: 'Shared apartment supplies and groceries',
      memberCount: 3,
      recentActivity: 'Mike purchased cleaning supplies',
      unreadCount: 0,
    },
    {
      id: '3',
      name: 'Office Snacks',
      description: 'Team snacks and coffee supplies',
      memberCount: 8,
      recentActivity: 'Lisa suggested organic coffee',
      unreadCount: 1,
    },
  ];

  const recentItems = [
    {
      id: '1',
      title: 'Organic Milk',
      category: 'Dairy',
      quantity: 2,
      status: 'todo' as const,
      notes: 'Get the 1L cartons, not the 500ml ones',
    },
    {
      id: '2',
      title: 'Whole Wheat Bread',
      category: 'Bakery',
      quantity: 1,
      status: 'purchased' as const,
      purchasedBy: 'Sarah',
    },
    {
      id: '3',
      title: 'Cleaning Supplies',
      category: 'Household',
      quantity: 1,
      status: 'cancelled' as const,
      notes: 'Found some at home',
    },
  ];

  return (
    <MobileLayout title="Otsukai DX" showHeader showNavigation>
      <div className="px-fib-3 py-fib-4 space-y-fib-5">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="space-y-fib-3">
          <div>
            <h2 className="text-mobile-2xl font-bold text-neutral-900">
              Welcome back! 👋
            </h2>
            <p className="text-mobile-base text-neutral-600 mt-fib-1">
              Manage your collaborative shopping lists with family and friends
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-fib-2">
            <TouchButton
              variant="primary"
              size="md"
              icon={ButtonIcons.Plus}
              className="flex-1"
              onClick={() => window.location.href = '/groups'}
            >
              Create Group
            </TouchButton>
            <TouchButton
              variant="outline"
              size="md"
              icon={ButtonIcons.Share}
              className="flex-1"
              onClick={() => window.location.href = '/groups'}
            >
              Join Group
            </TouchButton>
          </div>
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
            placeholder="Search groups, items, or members..."
            onClear={() => setSearchQuery('')}
          />
        </motion.section>

        {/* My Groups */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.1 }}
        >
          <div className="space-y-fib-3">
          <div className="flex items-center justify-between">
            <h3 className="text-mobile-lg font-semibold text-neutral-900">
              My Groups
            </h3>
            <TouchButton variant="ghost" size="sm">
              View All
            </TouchButton>
          </div>

          <div className="grid grid-cols-1 gap-fib-3">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.15 + index * 0.05 }}
              >
                <GroupCard
                  name={group.name}
                  description={group.description}
                  memberCount={group.memberCount}
                  recentActivity={group.recentActivity}
                  unreadCount={group.unreadCount}
                  onClick={() => window.location.href = '/shopping'}
                />
              </motion.div>
            ))}
          </div>
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.2 }}
        >
          <div className="space-y-fib-3">
          <div className="flex items-center justify-between">
            <h3 className="text-mobile-lg font-semibold text-neutral-900">
              Recent Activity
            </h3>
            <TouchButton variant="ghost" size="sm">
              View All
            </TouchButton>
          </div>

          <div className="space-y-fib-2">
            {recentItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.25 + index * 0.05 }}
              >
                <ShoppingItemCard
                  title={item.title}
                  category={item.category}
                  quantity={item.quantity}
                  status={item.status}
                  notes={item.notes}
                  purchasedBy={item.purchasedBy}
                  onClick={() => window.location.href = '/shopping'}
                />
              </motion.div>
            ))}
          </div>
          </div>
        </motion.section>

        {/* Stats Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.3 }}
        >
          <div className="grid grid-cols-2 gap-fib-3">
          <div className="bg-primary-50 rounded-xl p-fib-3 border border-primary-200">
            <div className="text-primary-600 mb-fib-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-mobile-2xl font-bold text-primary-900">3</p>
            <p className="text-mobile-sm text-primary-700">Active Groups</p>
          </div>

          <div className="bg-success-50 rounded-xl p-fib-3 border border-success-200">
            <div className="text-success-600 mb-fib-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-mobile-2xl font-bold text-success-900">12</p>
            <p className="text-mobile-sm text-success-700">Items Completed</p>
          </div>
          </div>
        </motion.section>

        {/* Bottom padding for navigation */}
        <div className="h-20" />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={ButtonIcons.Plus}
        onClick={() => window.location.href = '/shopping'}
      />
    </MobileLayout>
  );
}