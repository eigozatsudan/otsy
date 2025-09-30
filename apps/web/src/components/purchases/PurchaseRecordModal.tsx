'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer, useFocusTrap } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput } from '@/components/accessibility/AccessibleForm';
import { StatusMessage } from '@/components/accessibility/LiveRegion';
import AdSlot from '@/components/ads/AdSlot';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  estimatedPrice?: number;
  status: 'todo' | 'purchased' | 'cancelled';
}

interface PurchaseItem {
  itemId: string;
  purchasedQuantity: number;
  actualPrice: number;
}

interface PurchaseRecord {
  id?: string;
  totalAmount: number;
  items: PurchaseItem[];
  receiptImageUrl?: string;
  notes?: string;
  purchasedAt: string;
  purchasedBy: string;
}

interface PurchaseRecordModalProps {
  items: ShoppingItem[];
  groupMembers: Array<{ id: string; displayName: string }>;
  currentUserId: string;
  onRecord: (purchase: Omit<PurchaseRecord, 'id' | 'purchasedAt' | 'purchasedBy'>) => Promise<void>;
  onClose: () => void;
}

export default function PurchaseRecordModal({
  items,
  groupMembers,
  currentUserId,
  onRecord,
  onClose,
}: PurchaseRecordModalProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus trap for modal
  useFocusTrap(true);

  const [selectedItems, setSelectedItems] = useState<Map<string, PurchaseItem>>(new Map());
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPIIWarning, setShowPIIWarning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'items' | 'receipt' | 'review'>('items');

  // Filter items that can be purchased (todo status)
  const availableItems = items.filter(item => item.status === 'todo');

  const handleItemToggle = (item: ShoppingItem, selected: boolean) => {
    const newSelectedItems = new Map(selectedItems);
    
    if (selected) {
      newSelectedItems.set(item.id, {
        itemId: item.id,
        purchasedQuantity: item.quantity,
        actualPrice: item.estimatedPrice || 0,
      });
    } else {
      newSelectedItems.delete(item.id);
    }
    
    setSelectedItems(newSelectedItems);
    
    // Auto-calculate total if all items have prices
    const total = Array.from(newSelectedItems.values())
      .reduce((sum, purchaseItem) => sum + purchaseItem.actualPrice, 0);
    
    if (total > 0) {
      setTotalAmount(total.toFixed(2));
    }

    announce(
      `${selected ? 'Added' : 'Removed'} ${item.name}. ${newSelectedItems.size} items selected.`,
      'polite'
    );
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelectedItems = new Map(selectedItems);
    const purchaseItem = newSelectedItems.get(itemId);
    
    if (purchaseItem) {
      purchaseItem.purchasedQuantity = Math.max(0, quantity);
      newSelectedItems.set(itemId, purchaseItem);
      setSelectedItems(newSelectedItems);
    }
  };

  const handlePriceChange = (itemId: string, price: number) => {
    const newSelectedItems = new Map(selectedItems);
    const purchaseItem = newSelectedItems.get(itemId);
    
    if (purchaseItem) {
      purchaseItem.actualPrice = Math.max(0, price);
      newSelectedItems.set(itemId, purchaseItem);
      setSelectedItems(newSelectedItems);
      
      // Recalculate total
      const total = Array.from(newSelectedItems.values())
        .reduce((sum, item) => sum + item.actualPrice, 0);
      setTotalAmount(total.toFixed(2));
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ receipt: 'Please select an image file' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ receipt: 'Image must be smaller than 10MB' });
      return;
    }

    setReceiptImage(file);
    setShowPIIWarning(true);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setReceiptImageUrl(url);
    
    announce('Receipt image uploaded. Please review privacy warning.', 'polite');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedItems.size === 0) {
      newErrors.items = 'Please select at least one item';
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      newErrors.total = 'Please enter a valid total amount';
    }

    // Validate that purchased quantities don't exceed available quantities
    for (const [itemId, purchaseItem] of selectedItems) {
      const item = availableItems.find(i => i.id === itemId);
      if (item && purchaseItem.purchasedQuantity > item.quantity) {
        newErrors[`quantity-${itemId}`] = `Cannot exceed ${item.quantity} ${item.unit || 'pcs'}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      announce('Please fix the form errors', 'assertive');
      return;
    }

    setIsSubmitting(true);

    try {
      await onRecord({
        totalAmount: parseFloat(totalAmount),
        items: Array.from(selectedItems.values()),
        receiptImageUrl: receiptImageUrl || undefined,
        notes: notes.trim() || undefined,
      });

      announce('Purchase recorded successfully', 'polite');
      onClose();
    } catch (error) {
      announce('Failed to record purchase. Please try again.', 'assertive');
      setErrors({ submit: 'Failed to record purchase. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateItemTotal = () => {
    return Array.from(selectedItems.values())
      .reduce((sum, item) => sum + item.actualPrice, 0);
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
        className=\"relative bg-white rounded-xl shadow-mobile-lg border border-neutral-200 max-w-2xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col\"
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        transition={reducedMotion ? {} : { duration: 0.2 }}
        role=\"dialog\"
        aria-modal=\"true\"
        aria-labelledby=\"purchase-record-title\"
      >
        {/* Header */}
        <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100 flex-shrink-0\">
          <div>
            <h2 id=\"purchase-record-title\" className=\"text-mobile-lg font-bold text-neutral-900\">
              Record Purchase
            </h2>
            <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
              {step === 'items' && 'Select items and enter amounts'}
              {step === 'receipt' && 'Upload receipt (optional)'}
              {step === 'review' && 'Review and confirm purchase'}
            </p>
          </div>
          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={onClose}
            ariaLabel=\"Close purchase record dialog\"
          >
            <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Progress Steps */}
        <div className=\"px-fib-4 py-fib-2 border-b border-neutral-100 flex-shrink-0\">
          <div className=\"flex items-center space-x-fib-4\">
            {[
              { id: 'items', label: 'Items & Amounts', icon: '📝' },
              { id: 'receipt', label: 'Receipt', icon: '📄' },
              { id: 'review', label: 'Review', icon: '✓' },
            ].map((stepItem, index) => (
              <div key={stepItem.id} className=\"flex items-center\">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-mobile-sm font-medium',
                  {
                    'bg-primary-500 text-white': step === stepItem.id,
                    'bg-success-500 text-white': 
                      (stepItem.id === 'items' && (step === 'receipt' || step === 'review')) ||
                      (stepItem.id === 'receipt' && step === 'review'),
                    'bg-neutral-200 text-neutral-600': 
                      (stepItem.id === 'receipt' && step === 'items') ||
                      (stepItem.id === 'review' && (step === 'items' || step === 'receipt')),
                  }
                )}>
                  {stepItem.icon}
                </div>
                <span className={clsx(
                  'ml-fib-2 text-mobile-sm font-medium',
                  {
                    'text-primary-600': step === stepItem.id,
                    'text-success-600': 
                      (stepItem.id === 'items' && (step === 'receipt' || step === 'review')) ||
                      (stepItem.id === 'receipt' && step === 'review'),
                    'text-neutral-500': 
                      (stepItem.id === 'receipt' && step === 'items') ||
                      (stepItem.id === 'review' && (step === 'items' || step === 'receipt')),
                  }
                )}>
                  {stepItem.label}
                </span>
                {index < 2 && (
                  <svg className=\"w-4 h-4 mx-fib-2 text-neutral-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 5l7 7-7 7\" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className=\"flex-1 overflow-y-auto p-fib-4\">
          {/* Step 1: Items Selection */}
          {step === 'items' && (
            <div className=\"space-y-fib-4\">
              {/* Items List */}
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Select Items Purchased ({selectedItems.size} selected)
                </h3>
                
                {availableItems.length === 0 ? (
                  <div className=\"text-center py-fib-6\">
                    <p className=\"text-mobile-base text-neutral-600 mb-fib-2\">
                      No items available for purchase
                    </p>
                    <p className=\"text-mobile-sm text-neutral-500\">
                      Add items to your shopping list first
                    </p>
                  </div>
                ) : (
                  <div className=\"space-y-fib-2 max-h-64 overflow-y-auto\">
                    {availableItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      const purchaseItem = selectedItems.get(item.id);
                      
                      return (
                        <div
                          key={item.id}
                          className={clsx(
                            'border rounded-lg p-fib-3 transition-all',
                            {
                              'border-primary-300 bg-primary-50': isSelected,
                              'border-neutral-200 hover:border-neutral-300': !isSelected,
                            }
                          )}
                        >
                          <div className=\"flex items-start space-x-fib-3\">
                            {/* Checkbox */}
                            <label className=\"flex items-center cursor-pointer mt-1\">
                              <input
                                type=\"checkbox\"
                                checked={isSelected}
                                onChange={(e) => handleItemToggle(item, e.target.checked)}
                                className=\"sr-only\"
                                aria-label={`Select ${item.name}`}
                              />
                              <div className={clsx(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                                {
                                  'bg-primary-500 border-primary-500': isSelected,
                                  'bg-white border-neutral-300 hover:border-primary-400': !isSelected,
                                }
                              )}>
                                {isSelected && (
                                  <svg className=\"w-3 h-3 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={3} d=\"M5 13l4 4L19 7\" />
                                  </svg>
                                )}
                              </div>
                            </label>

                            {/* Item Info */}
                            <div className=\"flex-1 min-w-0\">
                              <div className=\"flex items-center justify-between mb-fib-1\">
                                <h4 className=\"text-mobile-sm font-medium text-neutral-900\">
                                  {item.name}
                                </h4>
                                <span className=\"text-mobile-xs text-neutral-500\">
                                  {item.category}
                                </span>
                              </div>
                              
                              <div className=\"text-mobile-xs text-neutral-600 mb-fib-2\">
                                Available: {item.quantity} {item.unit || 'pcs'}
                                {item.estimatedPrice && (
                                  <span className=\"ml-fib-2\">
                                    Est: ${item.estimatedPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {/* Quantity and Price Inputs */}
                              {isSelected && purchaseItem && (
                                <div className=\"grid grid-cols-2 gap-fib-2\">
                                  <AccessibleInput
                                    label=\"Quantity\"
                                    type=\"number\"
                                    value={purchaseItem.purchasedQuantity.toString()}
                                    onChange={(value) => handleQuantityChange(item.id, parseInt(value) || 0)}
                                    min={0}
                                    max={item.quantity}
                                    step={1}
                                    error={errors[`quantity-${item.id}`]}
                                  />
                                  <AccessibleInput
                                    label=\"Actual Price\"
                                    type=\"number\"
                                    value={purchaseItem.actualPrice.toString()}
                                    onChange={(value) => handlePriceChange(item.id, parseFloat(value) || 0)}
                                    min={0}
                                    step={0.01}
                                    placeholder=\"0.00\"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {errors.items && (
                  <p className=\"mt-fib-2 text-mobile-sm text-error-700\">{errors.items}</p>
                )}
              </div>

              {/* Total Amount */}
              <div className=\"border-t border-neutral-200 pt-fib-4\">
                <div className=\"grid grid-cols-2 gap-fib-4\">
                  <AccessibleInput
                    label=\"Total Amount\"
                    type=\"number\"
                    value={totalAmount}
                    onChange={setTotalAmount}
                    min={0}
                    step={0.01}
                    placeholder=\"0.00\"
                    required
                    error={errors.total}
                    helperText=\"Enter the total amount from your receipt\"
                  />
                  
                  <div className=\"flex flex-col justify-end\">
                    <div className=\"text-mobile-sm text-neutral-700 mb-fib-1\">
                      Items Total: ${calculateItemTotal().toFixed(2)}
                    </div>
                    {Math.abs(calculateItemTotal() - parseFloat(totalAmount || '0')) > 0.01 && (
                      <div className=\"text-mobile-xs text-warning-600\">
                        Difference: ${Math.abs(calculateItemTotal() - parseFloat(totalAmount || '0')).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Receipt Upload */}
          {step === 'receipt' && (
            <div className=\"space-y-fib-4\">
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Upload Receipt (Optional)
                </h3>
                
                <div className=\"border-2 border-dashed border-neutral-300 rounded-xl p-fib-6 text-center\">
                  {receiptImageUrl ? (
                    <div className=\"space-y-fib-3\">
                      <img
                        src={receiptImageUrl}
                        alt=\"Receipt preview\"
                        className=\"max-w-full max-h-64 mx-auto rounded-lg\"
                      />
                      <div className=\"flex justify-center space-x-fib-2\">
                        <AccessibleButton
                          variant=\"outline\"
                          size=\"sm\"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </AccessibleButton>
                        <AccessibleButton
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => {
                            setReceiptImage(null);
                            setReceiptImageUrl('');
                            setShowPIIWarning(false);
                          }}
                        >
                          Remove
                        </AccessibleButton>
                      </div>
                    </div>
                  ) : (
                    <div className=\"space-y-fib-3\">
                      <svg className=\"w-12 h-12 text-neutral-400 mx-auto\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" />
                      </svg>
                      <div>
                        <p className=\"text-mobile-base font-medium text-neutral-900 mb-fib-1\">
                          Upload receipt image
                        </p>
                        <p className=\"text-mobile-sm text-neutral-600 mb-fib-3\">
                          PNG, JPG up to 10MB
                        </p>
                        <AccessibleButton
                          variant=\"primary\"
                          size=\"md\"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </AccessibleButton>
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type=\"file\"
                    accept=\"image/*\"
                    onChange={handleReceiptUpload}
                    className=\"hidden\"
                    aria-label=\"Upload receipt image\"
                  />
                </div>
                
                {errors.receipt && (
                  <p className=\"mt-fib-2 text-mobile-sm text-error-700\">{errors.receipt}</p>
                )}
              </div>

              {/* PII Warning */}
              {showPIIWarning && (
                <div className=\"bg-warning-50 border border-warning-200 rounded-lg p-fib-4\">
                  <div className=\"flex items-start space-x-fib-2\">
                    <svg className=\"w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z\" />
                    </svg>
                    <div>
                      <h4 className=\"text-mobile-sm font-semibold text-warning-900 mb-fib-1\">
                        Privacy Notice
                      </h4>
                      <p className=\"text-mobile-sm text-warning-800 mb-fib-2\">
                        Receipt images may contain personal information such as credit card numbers, 
                        addresses, or phone numbers. Please review your image before uploading.
                      </p>
                      <p className=\"text-mobile-xs text-warning-700\">
                        We recommend cropping or blurring sensitive information before sharing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className=\"block text-mobile-sm font-medium text-neutral-700 mb-fib-2\">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder=\"Add any additional notes about this purchase...\"
                  rows={3}
                  className=\"w-full px-fib-3 py-fib-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"
                  maxLength={500}
                />
                <div className=\"mt-fib-1 text-right text-mobile-xs text-neutral-500\">
                  {notes.length}/500
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className=\"space-y-fib-4\">
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Review Purchase Details
                </h3>
                
                {/* Purchase Summary */}
                <div className=\"bg-neutral-50 rounded-lg p-fib-4 mb-fib-4\">
                  <div className=\"grid grid-cols-2 gap-fib-4 text-mobile-sm\">
                    <div>
                      <span className=\"text-neutral-600\">Items:</span>
                      <span className=\"ml-fib-2 font-medium\">{selectedItems.size}</span>
                    </div>
                    <div>
                      <span className=\"text-neutral-600\">Total Amount:</span>
                      <span className=\"ml-fib-2 font-medium\">${totalAmount}</span>
                    </div>
                    <div>
                      <span className=\"text-neutral-600\">Receipt:</span>
                      <span className=\"ml-fib-2 font-medium\">
                        {receiptImageUrl ? 'Uploaded' : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className=\"text-neutral-600\">Date:</span>
                      <span className=\"ml-fib-2 font-medium\">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className=\"space-y-fib-2\">
                  {Array.from(selectedItems.entries()).map(([itemId, purchaseItem]) => {
                    const item = availableItems.find(i => i.id === itemId);
                    if (!item) return null;
                    
                    return (
                      <div key={itemId} className=\"flex items-center justify-between p-fib-2 bg-white border border-neutral-200 rounded-lg\">
                        <div>
                          <span className=\"text-mobile-sm font-medium\">{item.name}</span>
                          <span className=\"ml-fib-2 text-mobile-xs text-neutral-600\">
                            {purchaseItem.purchasedQuantity} {item.unit || 'pcs'}
                          </span>
                        </div>
                        <span className=\"text-mobile-sm font-medium\">
                          ${purchaseItem.actualPrice.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {errors.submit && (
                <StatusMessage
                  type=\"error\"
                  message={errors.submit}
                  onDismiss={() => setErrors({ ...errors, submit: undefined })}
                />
              )}
            </div>
          )}
        </div>

        {/* Ad Slot */}
        <div className=\"px-fib-4 pb-fib-2\">
          <AdSlot
            placement=\"modal-bottom\"
            onAdView={(adId) => console.log('Ad viewed:', adId)}
            onAdClick={(adId) => console.log('Ad clicked:', adId)}
            onAdClose={(adId) => console.log('Ad closed:', adId)}
          />
        </div>

        {/* Footer */}
        <div className=\"flex items-center justify-between p-fib-4 border-t border-neutral-100 flex-shrink-0\">
          <div className=\"flex space-x-fib-2\">
            {step !== 'items' && (
              <AccessibleButton
                variant=\"outline\"
                size=\"md\"
                onClick={() => {
                  if (step === 'receipt') setStep('items');
                  if (step === 'review') setStep('receipt');
                }}
                disabled={isSubmitting}
              >
                Back
              </AccessibleButton>
            )}
            <AccessibleButton
              variant=\"outline\"
              size=\"md\"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </AccessibleButton>
          </div>
          
          <div className=\"flex space-x-fib-2\">
            {step === 'items' && (
              <AccessibleButton
                variant=\"primary\"
                size=\"md\"
                onClick={() => setStep('receipt')}
                disabled={selectedItems.size === 0 || !totalAmount}
              >
                Next: Receipt
              </AccessibleButton>
            )}
            {step === 'receipt' && (
              <AccessibleButton
                variant=\"primary\"
                size=\"md\"
                onClick={() => setStep('review')}
              >
                Next: Review
              </AccessibleButton>
            )}
            {step === 'review' && (
              <AccessibleButton
                variant=\"primary\"
                size=\"md\"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Record Purchase
              </AccessibleButton>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}