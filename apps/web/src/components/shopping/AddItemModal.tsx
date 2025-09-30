'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer, useFocusTrap } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput, AccessibleTextArea } from '@/components/accessibility/AccessibleForm';

interface NewShoppingItem {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface AddItemModalProps {
  categories: string[];
  onAdd: (item: NewShoppingItem) => void;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Bakery',
  'Frozen',
  'Pantry',
  'Beverages',
  'Snacks',
  'Health & Beauty',
  'Household',
  'Other',
];

const UNITS = [
  'pcs',
  'kg',
  'g',
  'lb',
  'oz',
  'L',
  'ml',
  'gal',
  'qt',
  'pt',
  'cup',
  'tbsp',
  'tsp',
  'dozen',
  'pack',
  'box',
  'bag',
  'bottle',
  'can',
  'jar',
];

export default function AddItemModal({
  categories,
  onAdd,
  onClose,
}: AddItemModalProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus trap for modal
  useFocusTrap(true);

  const [formData, setFormData] = useState<NewShoppingItem>({
    name: '',
    category: categories[0] || DEFAULT_CATEGORIES[0],
    quantity: 1,
    unit: 'pcs',
    notes: '',
    estimatedPrice: undefined,
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewShoppingItem, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.estimatedPrice !== undefined && formData.estimatedPrice < 0) {
      newErrors.estimatedPrice = 'Price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      announce('Please fix the form errors', 'assertive');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalCategory = showCustomCategory && customCategory.trim() 
        ? customCategory.trim() 
        : formData.category;

      await onAdd({
        ...formData,
        category: finalCategory,
        name: formData.name.trim(),
        notes: formData.notes?.trim() || undefined,
      });

      announce(`${formData.name} added to shopping list`, 'polite');
    } catch (error) {
      announce('Failed to add item. Please try again.', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewShoppingItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <motion.div
      className=\"fixed inset-0 z-50 flex items-center justify-center p-fib-4\"
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={reducedMotion ? {} : { opacity: 1 }}
      exit={reducedMotion ? {} : { opacity: 0 }}
      transition={reducedMotion ? {} : { duration: 0.2 }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className=\"absolute inset-0 bg-black/50\"
        onClick={onClose}
        aria-hidden=\"true\"
      />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        className=\"relative bg-white rounded-xl shadow-mobile-lg border border-neutral-200 max-w-md w-full mx-auto max-h-[90vh] overflow-hidden\"
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        transition={reducedMotion ? {} : { duration: 0.2 }}
        role=\"dialog\"
        aria-modal=\"true\"
        aria-labelledby=\"add-item-title\"
      >
        {/* Header */}
        <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100\">
          <h2 id=\"add-item-title\" className=\"text-mobile-lg font-bold text-neutral-900\">
            Add New Item
          </h2>
          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={onClose}
            ariaLabel=\"Close add item dialog\"
          >
            <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className=\"p-fib-4 space-y-fib-4 max-h-[calc(90vh-120px)] overflow-y-auto\">
          {/* Item Name */}
          <AccessibleInput
            label=\"Item Name\"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            error={errors.name}
            required
            autoFocus
            placeholder=\"e.g., Organic Bananas\"
            maxLength={100}
          />

          {/* Category */}
          <div>
            <label className=\"block text-mobile-sm font-medium text-neutral-700 mb-fib-2\">
              Category *
            </label>
            
            {!showCustomCategory ? (
              <div className=\"flex space-x-fib-2\">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className=\"flex-1 px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"
                  required
                >
                  {allCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <AccessibleButton
                  type=\"button\"
                  variant=\"outline\"
                  size=\"md\"
                  onClick={() => setShowCustomCategory(true)}
                >
                  Custom
                </AccessibleButton>
              </div>
            ) : (
              <div className=\"flex space-x-fib-2\">
                <AccessibleInput
                  label=\"\"
                  value={customCategory}
                  onChange={setCustomCategory}
                  placeholder=\"Enter custom category\"
                  className=\"flex-1\"
                />
                <AccessibleButton
                  type=\"button\"
                  variant=\"outline\"
                  size=\"md\"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setCustomCategory('');
                  }}
                >
                  Cancel
                </AccessibleButton>
              </div>
            )}
            
            {errors.category && (
              <p className=\"mt-fib-1 text-mobile-sm text-error-700\">{errors.category}</p>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className=\"grid grid-cols-2 gap-fib-3\">
            <AccessibleInput
              label=\"Quantity\"
              type=\"number\"
              value={formData.quantity.toString()}
              onChange={(value) => handleInputChange('quantity', parseInt(value) || 1)}
              error={errors.quantity}
              required
              min={1}
              step={1}
            />
            
            <div>
              <label className=\"block text-mobile-sm font-medium text-neutral-700 mb-fib-2\">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className=\"w-full px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className=\"block text-mobile-sm font-medium text-neutral-700 mb-fib-2\">
              Priority
            </label>
            <div className=\"flex space-x-fib-2\">
              {[
                { value: 'low', label: 'Low', color: 'success' },
                { value: 'medium', label: 'Medium', color: 'warning' },
                { value: 'high', label: 'High', color: 'error' },
              ].map(({ value, label, color }) => (
                <label key={value} className=\"flex-1\">
                  <input
                    type=\"radio\"
                    name=\"priority\"
                    value={value}
                    checked={formData.priority === value}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className=\"sr-only\"
                  />
                  <div className={clsx(
                    'w-full p-fib-2 text-center text-mobile-sm font-medium rounded-lg border-2 cursor-pointer transition-all',
                    {
                      'border-success-500 bg-success-50 text-success-700': formData.priority === value && color === 'success',
                      'border-warning-500 bg-warning-50 text-warning-700': formData.priority === value && color === 'warning',
                      'border-error-500 bg-error-50 text-error-700': formData.priority === value && color === 'error',
                      'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400': formData.priority !== value,
                    }
                  )}>
                    {label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Estimated Price */}
          <AccessibleInput
            label=\"Estimated Price (Optional)\"
            type=\"number\"
            value={formData.estimatedPrice?.toString() || ''}
            onChange={(value) => handleInputChange('estimatedPrice', value ? parseFloat(value) : undefined)}
            error={errors.estimatedPrice}
            placeholder=\"0.00\"
            min={0}
            step={0.01}
            helperText=\"Help your group budget better\"
          />

          {/* Notes */}
          <AccessibleTextArea
            label=\"Notes (Optional)\"
            value={formData.notes || ''}
            onChange={(value) => handleInputChange('notes', value)}
            placeholder=\"Any additional details, preferences, or specifications...\"
            rows={3}
            maxLength={500}
            helperText=\"Share any specific brand preferences, size requirements, or other details\"
          />

          {/* Actions */}
          <div className=\"flex space-x-fib-3 pt-fib-2\">
            <AccessibleButton
              type=\"button\"
              variant=\"outline\"
              size=\"md\"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type=\"submit\"
              variant=\"primary\"
              size=\"md\"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Add Item
            </AccessibleButton>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}