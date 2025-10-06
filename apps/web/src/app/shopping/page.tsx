'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import { ShoppingItemCard } from '@/components/ui/GoldenCard';
import TouchButton, { FloatingActionButton, ButtonIcons, IconButton } from '@/components/ui/TouchButton';
import { SearchInput } from '@/components/ui/MobileInput';
import toast from 'react-hot-toast';

type ItemStatus = 'todo' | 'purchased' | 'cancelled';
type SortOption = 'name' | 'category' | 'status' | 'recent';

interface ShoppingItem {
    id: string;
    title: string;
    category: string;
    quantity: number;
    status: ItemStatus;
    notes?: string;
    image?: string;
    purchasedBy?: string;
    purchasedAt?: Date;
    addedBy: string;
    addedAt: Date;
    groupId: string;
    groupName: string;
}

export default function ShoppingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recent');

    // Mock data - replace with actual API calls
    const items: ShoppingItem[] = [
        {
            id: '1',
            title: 'Organic Milk',
            category: 'Dairy',
            quantity: 2,
            status: 'todo',
            notes: 'Get the 1L cartons, not the 500ml ones',
            addedBy: 'You',
            addedAt: new Date('2025-01-06T10:00:00'),
            groupId: '1',
            groupName: 'Family Shopping',
        },
        {
            id: '2',
            title: 'Whole Wheat Bread',
            category: 'Bakery',
            quantity: 1,
            status: 'purchased',
            purchasedBy: 'Sarah',
            purchasedAt: new Date('2025-01-06T14:30:00'),
            addedBy: 'Mike',
            addedAt: new Date('2025-01-06T09:00:00'),
            groupId: '1',
            groupName: 'Family Shopping',
        },
        {
            id: '3',
            title: 'Cleaning Supplies',
            category: 'Household',
            quantity: 1,
            status: 'cancelled',
            notes: 'Found some at home',
            addedBy: 'Lisa',
            addedAt: new Date('2025-01-05T16:00:00'),
            groupId: '2',
            groupName: 'Roommates',
        },
        {
            id: '4',
            title: 'Coffee Beans',
            category: 'Beverages',
            quantity: 2,
            status: 'todo',
            notes: 'Medium roast, organic if possible',
            addedBy: 'John',
            addedAt: new Date('2025-01-06T11:00:00'),
            groupId: '3',
            groupName: 'Office Team',
        },
        {
            id: '5',
            title: 'Fresh Vegetables',
            category: 'Produce',
            quantity: 1,
            status: 'todo',
            notes: 'Carrots, broccoli, bell peppers',
            addedBy: 'You',
            addedAt: new Date('2025-01-06T12:00:00'),
            groupId: '1',
            groupName: 'Family Shopping',
        },
    ];

    // Filter and sort items
    const filteredItems = items
        .filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.groupName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'status':
                    const statusOrder = { todo: 0, purchased: 1, cancelled: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                case 'recent':
                default:
                    return b.addedAt.getTime() - a.addedAt.getTime();
            }
        });

    const statusCounts = {
        all: items.length,
        todo: items.filter(item => item.status === 'todo').length,
        purchased: items.filter(item => item.status === 'purchased').length,
        cancelled: items.filter(item => item.status === 'cancelled').length,
    };

    const handleAddItem = () => {
        toast.success('Add item feature coming soon!');
    };

    const handleItemClick = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        toast.success(`Opening ${item?.title}`);
    };

    const handleStatusFilter = (status: ItemStatus | 'all') => {
        setSelectedStatus(status);
    };

    const handleSort = (option: SortOption) => {
        setSortBy(option);
    };

    return (
        <MobileLayout title="Shopping Lists" showHeader showNavigation>
            <div className="px-fib-3 py-fib-4 space-y-fib-4">
                {/* Search */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search items, categories, or groups..."
                        onClear={() => setSearchQuery('')}
                    />
                </motion.section>

                {/* Status Filter Tabs */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.05 }}
                >
                    <div className="flex space-x-fib-1 overflow-x-auto scrollbar-hide">
                        {[
                            { key: 'all', label: 'All', count: statusCounts.all },
                            { key: 'todo', label: 'To Buy', count: statusCounts.todo },
                            { key: 'purchased', label: 'Purchased', count: statusCounts.purchased },
                            { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
                        ].map((tab) => (
                            <TouchButton
                                key={tab.key}
                                variant={selectedStatus === tab.key ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => handleStatusFilter(tab.key as ItemStatus | 'all')}
                                className="flex-shrink-0"
                            >
                                {tab.label} ({tab.count})
                            </TouchButton>
                        ))}
                    </div>
                </motion.section>

                {/* Sort and Actions */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.1 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-fib-2">
                            <span className="text-mobile-sm text-neutral-600">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSort(e.target.value as SortOption)}
                                className="text-mobile-sm bg-transparent border-none focus:outline-none text-primary-600 font-medium"
                            >
                                <option value="recent">Recent</option>
                                <option value="name">Name</option>
                                <option value="category">Category</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-fib-1">
                            <IconButton
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                    </svg>
                                }
                                label="Filter"
                                variant="ghost"
                                size="sm"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Items List */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.15 }}
                >
                    <div className="space-y-fib-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-mobile-lg font-semibold text-neutral-900">
                                Items ({filteredItems.length})
                            </h2>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="text-center py-fib-6">
                                <div className="w-16 h-16 mx-auto mb-fib-3 bg-neutral-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-mobile-lg font-medium text-neutral-900 mb-fib-1">
                                    {searchQuery ? 'No items found' : 'No items yet'}
                                </h3>
                                <p className="text-mobile-sm text-neutral-600 mb-fib-4">
                                    {searchQuery
                                        ? 'Try adjusting your search terms or filters'
                                        : 'Add your first item to start shopping'
                                    }
                                </p>
                                {!searchQuery && (
                                    <TouchButton
                                        variant="primary"
                                        size="md"
                                        icon={ButtonIcons.Plus}
                                        onClick={handleAddItem}
                                    >
                                        Add Your First Item
                                    </TouchButton>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-fib-2">
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15, delay: 0.2 + index * 0.05 }}
                                    >
                                        <div className="relative">
                                            <ShoppingItemCard
                                                title={item.title}
                                                category={item.category}
                                                quantity={item.quantity}
                                                status={item.status}
                                                notes={item.notes}
                                                purchasedBy={item.purchasedBy}
                                                onClick={() => handleItemClick(item.id)}
                                            />
                                            {/* Group badge */}
                                            <div className="absolute top-fib-1 right-fib-1">
                                                <span className="px-fib-1 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                                                    {item.groupName}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Quick Stats */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.25 }}
                >
                    <div className="grid grid-cols-3 gap-fib-2">
                        <div className="bg-warning-50 rounded-lg p-fib-2 border border-warning-200 text-center">
                            <p className="text-mobile-lg font-bold text-warning-900">{statusCounts.todo}</p>
                            <p className="text-mobile-xs text-warning-700">To Buy</p>
                        </div>
                        <div className="bg-success-50 rounded-lg p-fib-2 border border-success-200 text-center">
                            <p className="text-mobile-lg font-bold text-success-900">{statusCounts.purchased}</p>
                            <p className="text-mobile-xs text-success-700">Purchased</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-fib-2 border border-neutral-200 text-center">
                            <p className="text-mobile-lg font-bold text-neutral-900">{statusCounts.cancelled}</p>
                            <p className="text-mobile-xs text-neutral-700">Cancelled</p>
                        </div>
                    </div>
                </motion.section>

                {/* Bottom padding for navigation */}
                <div className="h-20" />
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton
                icon={ButtonIcons.Plus}
                onClick={handleAddItem}
            />
        </MobileLayout>
    );
}