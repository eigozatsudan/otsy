'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import GoldenCard from '@/components/ui/GoldenCard';
import TouchButton, { ButtonIcons, IconButton } from '@/components/ui/TouchButton';
import { SearchInput } from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

type SplitMethod = 'equal' | 'quantity' | 'custom';
type PaymentStatus = 'pending' | 'completed' | 'cancelled';

interface Purchase {
  id: string;
  title: string;
  totalAmount: number;
  tax?: number;
  shipping?: number;
  receiptImage?: string;
  purchasedBy: string;
  purchasedAt: Date;
  groupId: string;
  groupName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  splitMethod: SplitMethod;
  participants: {
    userId: string;
    name: string;
    share: number; // percentage for custom, quantity for quantity-based
    amount: number; // calculated amount to pay
    status: PaymentStatus;
  }[];
}

export default function SplitsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all');
  const router = useRouter();

  // Mock data - replace with actual API calls
  const purchases: Purchase[] = [
    {
      id: '1',
      title: 'Weekly Groceries',
      totalAmount: 12500, // ¥125.00
      tax: 1000, // ¥10.00
      shipping: 0,
      purchasedBy: 'Sarah',
      purchasedAt: new Date('2025-01-06T14:30:00'),
      groupId: '1',
      groupName: 'Family Shopping',
      items: [
        { id: '1', name: 'Organic Milk', quantity: 2, price: 600 },
        { id: '2', name: 'Whole Wheat Bread', quantity: 1, price: 300 },
        { id: '3', name: 'Fresh Vegetables', quantity: 1, price: 800 },
      ],
      splitMethod: 'equal',
      participants: [
        { userId: '1', name: 'You', share: 25, amount: 3125, status: 'pending' },
        { userId: '2', name: 'Sarah', share: 25, amount: 3125, status: 'completed' },
        { userId: '3', name: 'Mike', share: 25, amount: 3125, status: 'completed' },
        { userId: '4', name: 'Lisa', share: 25, amount: 3125, status: 'pending' },
      ],
    },
    {
      id: '2',
      title: 'Office Snacks',
      totalAmount: 8000, // ¥80.00
      tax: 640, // ¥6.40
      shipping: 500, // ¥5.00
      purchasedBy: 'John',
      purchasedAt: new Date('2025-01-05T16:00:00'),
      groupId: '3',
      groupName: 'Office Team',
      items: [
        { id: '4', name: 'Coffee Beans', quantity: 2, price: 1200 },
        { id: '5', name: 'Cookies', quantity: 3, price: 900 },
      ],
      splitMethod: 'quantity',
      participants: [
        { userId: '1', name: 'You', share: 2, amount: 2000, status: 'completed' },
        { userId: '5', name: 'John', share: 3, amount: 3000, status: 'completed' },
        { userId: '6', name: 'Emma', share: 2, amount: 2000, status: 'pending' },
        { userId: '7', name: 'David', share: 1, amount: 1000, status: 'pending' },
      ],
    },
    {
      id: '3',
      title: 'Cleaning Supplies',
      totalAmount: 4500, // ¥45.00
      tax: 360, // ¥3.60
      shipping: 0,
      purchasedBy: 'Mike',
      purchasedAt: new Date('2025-01-04T12:00:00'),
      groupId: '2',
      groupName: 'Roommates',
      items: [
        { id: '6', name: 'All-purpose Cleaner', quantity: 1, price: 800 },
        { id: '7', name: 'Laundry Detergent', quantity: 1, price: 1200 },
      ],
      splitMethod: 'custom',
      participants: [
        { userId: '1', name: 'You', share: 40, amount: 1800, status: 'completed' },
        { userId: '3', name: 'Mike', share: 35, amount: 1575, status: 'completed' },
        { userId: '8', name: 'Alex', share: 25, amount: 1125, status: 'cancelled' },
      ],
    },
  ];

  // Filter purchases
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         purchase.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         purchase.purchasedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedStatus === 'all') return matchesSearch;
    
    // Check if user has the selected status for this purchase
    const userParticipant = purchase.participants.find(p => p.name === 'You');
    return matchesSearch && userParticipant?.status === selectedStatus;
  });

  const formatCurrency = (amount: number) => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const getSplitMethodLabel = (method: SplitMethod) => {
    switch (method) {
      case 'equal': return 'Equal Split';
      case 'quantity': return 'By Quantity';
      case 'custom': return 'Custom Split';
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'bg-warning-100 text-warning-700';
      case 'completed': return 'bg-success-100 text-success-700';
      case 'cancelled': return 'bg-error-100 text-error-700';
    }
  };

  const handlePurchaseClick = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    toast.success(`Opening ${purchase?.title} details`);
  };

  const handlePayment = (purchaseId: string) => {
    toast.success('Payment feature coming soon!');
  };

  const totalOwed = purchases.reduce((sum, purchase) => {
    const userParticipant = purchase.participants.find(p => p.name === 'You');
    return sum + (userParticipant?.status === 'pending' ? userParticipant.amount : 0);
  }, 0);

  const totalPaid = purchases.reduce((sum, purchase) => {
    const userParticipant = purchase.participants.find(p => p.name === 'You');
    return sum + (userParticipant?.status === 'completed' ? userParticipant.amount : 0);
  }, 0);

  return (
    <MobileLayout title="Bill Splits" showHeader showNavigation>
      <div className="px-fib-3 py-fib-4 space-y-fib-4">
        {/* Summary Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="grid grid-cols-2 gap-fib-3">
            <div className="bg-warning-50 rounded-xl p-fib-3 border border-warning-200">
              <div className="text-warning-600 mb-fib-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-mobile-2xl font-bold text-warning-900">{formatCurrency(totalOwed)}</p>
              <p className="text-mobile-sm text-warning-700">You Owe</p>
            </div>

            <div className="bg-success-50 rounded-xl p-fib-3 border border-success-200">
              <div className="text-success-600 mb-fib-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-mobile-2xl font-bold text-success-900">{formatCurrency(totalPaid)}</p>
              <p className="text-mobile-sm text-success-700">You Paid</p>
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
            placeholder="Search purchases or groups..."
            onClear={() => setSearchQuery('')}
          />
        </motion.section>

        {/* Status Filter */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.1 }}
        >
          <div className="flex space-x-fib-1 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Paid' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <TouchButton
                key={tab.key}
                variant={selectedStatus === tab.key ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus(tab.key as PaymentStatus | 'all')}
                className="flex-shrink-0"
              >
                {tab.label}
              </TouchButton>
            ))}
          </div>
        </motion.section>

        {/* Purchases List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.15 }}
        >
          <div className="space-y-fib-3">
            <div className="flex items-center justify-between">
              <h2 className="text-mobile-lg font-semibold text-neutral-900">
                Recent Purchases ({filteredPurchases.length})
              </h2>
            </div>

            {filteredPurchases.length === 0 ? (
              <div className="text-center py-fib-6">
                <div className="w-16 h-16 mx-auto mb-fib-3 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-mobile-lg font-medium text-neutral-900 mb-fib-1">
                  No purchases found
                </h3>
                <p className="text-mobile-sm text-neutral-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters'
                    : 'Purchases will appear here when items are bought'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-fib-3">
                {filteredPurchases.map((purchase, index) => {
                  const userParticipant = purchase.participants.find(p => p.name === 'You');
                  
                  return (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: 0.2 + index * 0.05 }}
                    >
                      <GoldenCard
                        ratio="silver"
                        variant="default"
                        interactive
                        onClick={() => handlePurchaseClick(purchase.id)}
                        className="group"
                      >
                        <div className="space-y-fib-2">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-mobile-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                                {purchase.title}
                              </h3>
                              <p className="text-mobile-sm text-neutral-600">
                                {purchase.groupName} • by {purchase.purchasedBy}
                              </p>
                              <p className="text-mobile-xs text-neutral-500">
                                {purchase.purchasedAt.toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-mobile-lg font-bold text-neutral-900">
                                {formatCurrency(purchase.totalAmount)}
                              </p>
                              <span className="text-mobile-xs px-fib-1 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                {getSplitMethodLabel(purchase.splitMethod)}
                              </span>
                            </div>
                          </div>

                          {/* Your share */}
                          {userParticipant && (
                            <div className="flex items-center justify-between p-fib-2 bg-neutral-50 rounded-lg">
                              <div>
                                <p className="text-mobile-sm font-medium text-neutral-900">
                                  Your share: {formatCurrency(userParticipant.amount)}
                                </p>
                                <span className={`text-mobile-xs px-fib-1 py-0.5 rounded-full ${getStatusColor(userParticipant.status)}`}>
                                  {userParticipant.status.charAt(0).toUpperCase() + userParticipant.status.slice(1)}
                                </span>
                              </div>
                              
                              {userParticipant.status === 'pending' && (
                                <TouchButton
                                  variant="primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayment(purchase.id);
                                  }}
                                >
                                  Pay Now
                                </TouchButton>
                              )}
                            </div>
                          )}

                          {/* Participants summary */}
                          <div className="flex items-center justify-between text-mobile-xs text-neutral-500">
                            <span>
                              {purchase.participants.length} participants
                            </span>
                            <div className="flex items-center space-x-fib-1">
                              <span className="text-success-600">
                                {purchase.participants.filter(p => p.status === 'completed').length} paid
                              </span>
                              <span className="text-warning-600">
                                {purchase.participants.filter(p => p.status === 'pending').length} pending
                              </span>
                            </div>
                          </div>
                        </div>
                      </GoldenCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* Bottom padding for navigation */}
        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}