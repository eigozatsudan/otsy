'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Golden ratio constant
const GOLDEN_RATIO = 1.618;

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  status: 'todo' | 'purchased' | 'cancelled';
  addedBy: string;
  addedByName: string;
  addedAt: string;
  purchasedBy?: string;
  purchasedByName?: string;
  purchasedAt?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface ShoppingListProps {
  groupId: string;
  items: ShoppingItem[];
  categories: string[];
  currentUserId: string;
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'addedBy' | 'addedByName' | 'addedAt' | 'status'>) => void;
  onUpdateItem: (itemId: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (reorderedItems: ShoppingItem[]) => void;
  onBulkAction: (itemIds: string[], action: 'purchased' | 'cancelled' | 'todo') => void;
  className?: string;
}

export default function ShoppingList({
  groupId,
  items,
  categories,
  currentUserId,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onBulkAction,
  className = '',
}: ShoppingListProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [filter, setFilter] = useState<'all' | 'todo' | 'purchased' | 'cancelled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'added' | 'priority'>('category');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'added':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
        default:
          return 0;
      }
    });

  // Group items by category for grid view
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const handleItemSelect = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
    
    announce(
      `${selected ? 'Selected' : 'Deselected'} item. ${newSelected.size} items selected.`,
      'polite'
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
      announce('All items deselected', 'polite');
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
      announce(`All ${filteredItems.length} items selected`, 'polite');
    }
  };

  const handleBulkAction = (action: 'purchased' | 'cancelled' | 'todo') => {
    if (selectedItems.size === 0) return;
    
    onBulkAction(Array.from(selectedItems), action);
    setSelectedItems(new Set());
    
    const actionText = action === 'purchased' ? 'marked as purchased' : 
                     action === 'cancelled' ? 'cancelled' : 'marked as todo';
    announce(`${selectedItems.size} items ${actionText}`, 'polite');
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(filteredItems);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    onReorderItems(reorderedItems);
    announce(`Item "${removed.name}" moved to position ${result.destination.index + 1}`, 'polite');
  };

  const getItemStatusColor = (status: ShoppingItem['status']) => {
    switch (status) {
      case 'todo':
        return 'border-neutral-200 bg-white';
      case 'purchased':
        return 'border-success-200 bg-success-50';
      case 'cancelled':
        return 'border-error-200 bg-error-50';
      default:
        return 'border-neutral-200 bg-white';
    }
  };

  const getPriorityColor = (priority: ShoppingItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-error-600 bg-error-100';
      case 'medium':
        return 'text-warning-600 bg-warning-100';
      case 'low':
        return 'text-success-600 bg-success-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  // Calculate golden ratio dimensions for cards
  const cardWidth = 280; // Base width in pixels
  const cardHeight = Math.round(cardWidth / GOLDEN_RATIO); // Height based on golden ratio

  return (
    <div className={clsx('bg-white rounded-xl shadow-mobile-sm border border-neutral-200', className)}>
      {/* Header */}
      <div className=\"p-fib-4 border-b border-neutral-100\">
        <div className=\"flex items-center justify-between mb-fib-3\">
          <div>
            <h1 className=\"text-mobile-xl font-bold text-neutral-900\">
              Shopping List
            </h1>
            <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
            </p>
          </div>
          
          <div className=\"flex items-center space-x-fib-2\">
            {/* View Mode Toggle */}
            <div className=\"flex bg-neutral-100 rounded-lg p-1\">
              <AccessibleButton
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size=\"sm\"
                onClick={() => setViewMode('grid')}
                ariaLabel=\"Grid view\"
                className=\"px-fib-2\"
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z\" />
                </svg>
              </AccessibleButton>
              <AccessibleButton
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size=\"sm\"
                onClick={() => setViewMode('list')}
                ariaLabel=\"List view\"
                className=\"px-fib-2\"
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6h16M4 10h16M4 14h16M4 18h16\" />
                </svg>
              </AccessibleButton>
            </div>

            <AccessibleButton
              variant=\"primary\"
              size=\"md\"
              onClick={() => setShowAddForm(true)}
            >
              <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6v6m0 0v6m0-6h6m-6 0H6\" />
              </svg>
              Add Item
            </AccessibleButton>
          </div>
        </div>

        {/* Search and Filters */}
        <div className=\"flex flex-col lg:flex-row gap-fib-3\">
          {/* Search */}
          <div className=\"flex-1\">
            <div className=\"relative\">
              <input
                ref={searchInputRef}
                type=\"text\"
                placeholder=\"Search items...\"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className=\"w-full pl-10 pr-4 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"
                aria-label=\"Search shopping items\"
              />
              <svg className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\" />
              </svg>
            </div>
          </div>

          {/* Filters */}
          <div className=\"flex flex-wrap gap-fib-2\">
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
              aria-label=\"Filter by status\"
            >
              <option value=\"all\">All Status</option>
              <option value=\"todo\">To Do</option>
              <option value=\"purchased\">Purchased</option>
              <option value=\"cancelled\">Cancelled</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
              aria-label=\"Filter by category\"
            >
              <option value=\"all\">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
              aria-label=\"Sort items\"
            >
              <option value=\"category\">Sort by Category</option>
              <option value=\"name\">Sort by Name</option>
              <option value=\"added\">Sort by Date Added</option>
              <option value=\"priority\">Sort by Priority</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <motion.div
            className=\"mt-fib-3 p-fib-3 bg-primary-50 rounded-lg border border-primary-200\"
            initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={reducedMotion ? {} : { duration: 0.2 }}
          >
            <div className=\"flex items-center justify-between\">
              <span className=\"text-mobile-sm font-medium text-primary-900\">
                {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
              </span>
              <div className=\"flex space-x-fib-2\">
                <AccessibleButton
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => handleBulkAction('purchased')}
                >
                  Mark Purchased
                </AccessibleButton>
                <AccessibleButton
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => handleBulkAction('cancelled')}
                >
                  Cancel
                </AccessibleButton>
                <AccessibleButton
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => handleBulkAction('todo')}
                >
                  Mark Todo
                </AccessibleButton>
                <AccessibleButton
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Clear Selection
                </AccessibleButton>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Items List/Grid */}
      <div className=\"p-fib-4\">
        {filteredItems.length === 0 ? (
          <div className=\"text-center py-fib-8\">
            <div className=\"w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-fib-3\">
              <svg className=\"w-8 h-8 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01\" />
              </svg>
            </div>
            <h3 className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
              {searchQuery || filter !== 'all' || categoryFilter !== 'all' 
                ? 'No items match your filters' 
                : 'No items in your shopping list'
              }
            </h3>
            <p className=\"text-mobile-sm text-neutral-500 max-w-sm mx-auto mb-fib-4\">
              {searchQuery || filter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Start by adding items to your shopping list. All group members can add and edit items.'
              }
            </p>
            {(!searchQuery && filter === 'all' && categoryFilter === 'all') && (
              <AccessibleButton
                variant=\"primary\"
                size=\"md\"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Item
              </AccessibleButton>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View with Golden Ratio Cards
          <div className=\"space-y-fib-4\">
            {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3 flex items-center\">
                  {category}
                  <span className=\"ml-fib-2 text-mobile-sm font-normal text-neutral-500\">
                    ({categoryItems.length})
                  </span>
                </h3>
                <div 
                  className=\"grid gap-fib-3\"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))`,
                  }}
                >
                  {categoryItems.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      onSelect={(selected) => handleItemSelect(item.id, selected)}
                      onUpdate={(updates) => onUpdateItem(item.id, updates)}
                      onDelete={() => onDeleteItem(item.id)}
                      currentUserId={currentUserId}
                      width={cardWidth}
                      height={cardHeight}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId=\"shopping-list\">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className=\"space-y-fib-2\"
                >
                  {filteredItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={clsx(
                            'transition-all duration-200',
                            {
                              'scale-105 shadow-lg': snapshot.isDragging,
                            }
                          )}
                        >
                          <ShoppingItemRow
                            item={item}
                            isSelected={selectedItems.has(item.id)}
                            onSelect={(selected) => handleItemSelect(item.id, selected)}
                            onUpdate={(updates) => onUpdateItem(item.id, updates)}
                            onDelete={() => onDeleteItem(item.id)}
                            currentUserId={currentUserId}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add Item Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddItemModal
            categories={categories}
            onAdd={(item) => {
              onAddItem(item);
              setShowAddForm(false);
            }}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}