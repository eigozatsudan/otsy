'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer, useFocusTrap } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';
import { AccessibleInput } from '@/components/accessibility/AccessibleForm';

interface GroupMember {
  id: string;
  displayName: string;
  email: string;
}

interface PurchaseItem {
  itemId: string;
  itemName: string;
  purchasedQuantity: number;
  actualPrice: number;
}

interface Purchase {
  id: string;
  totalAmount: number;
  items: PurchaseItem[];
  purchasedBy: string;
  purchasedByName: string;
  purchasedAt: string;
}

interface SplitRule {
  memberId: string;
  percentage?: number;
  amount?: number;
  itemQuantities?: Record<string, number>; // itemId -> quantity
}

interface Settlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

interface CostSplitModalProps {
  purchase: Purchase;
  groupMembers: GroupMember[];
  currentUserId: string;
  onSave: (splitRules: SplitRule[], settlements: Settlement[]) => Promise<void>;
  onClose: () => void;
}

type SplitMethod = 'equal' | 'quantity' | 'custom';

export default function CostSplitModal({
  purchase,
  groupMembers,
  currentUserId,
  onSave,
  onClose,
}: CostSplitModalProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();

  // Focus trap for modal
  useFocusTrap(true);

  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [splitRules, setSplitRules] = useState<SplitRule[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize split rules
  useEffect(() => {
    const initialRules: SplitRule[] = groupMembers.map(member => ({
      memberId: member.id,
      percentage: splitMethod === 'equal' ? 100 / groupMembers.length : 0,
      amount: 0,
      itemQuantities: {},
    }));

    if (splitMethod === 'quantity') {
      // Calculate quantity-based split
      const totalQuantities: Record<string, number> = {};
      purchase.items.forEach(item => {
        totalQuantities[item.itemId] = item.purchasedQuantity;
      });

      // For quantity-based, assume equal distribution for now
      // In a real app, this would be based on user preferences or past behavior
      initialRules.forEach(rule => {
        purchase.items.forEach(item => {
          rule.itemQuantities![item.itemId] = item.purchasedQuantity / groupMembers.length;
        });
      });
    }

    setSplitRules(initialRules);
  }, [splitMethod, groupMembers, purchase.items]);

  // Calculate settlements whenever split rules change
  useEffect(() => {
    const newSettlements = calculateSettlements();
    setSettlements(newSettlements);
  }, [splitRules]);

  const calculateSettlements = (): Settlement[] => {
    const balances: Record<string, number> = {};
    
    // Initialize balances
    groupMembers.forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate what each member owes
    splitRules.forEach(rule => {
      if (splitMethod === 'equal' || splitMethod === 'custom') {
        const amount = rule.amount || (purchase.totalAmount * (rule.percentage || 0) / 100);
        balances[rule.memberId] -= amount;
      } else if (splitMethod === 'quantity') {
        let memberTotal = 0;
        purchase.items.forEach(item => {
          const memberQuantity = rule.itemQuantities?.[item.itemId] || 0;
          const itemUnitPrice = item.actualPrice / item.purchasedQuantity;
          memberTotal += memberQuantity * itemUnitPrice;
        });
        balances[rule.memberId] -= memberTotal;
      }
    });

    // The purchaser gets credited for the total amount
    balances[purchase.purchasedBy] += purchase.totalAmount;

    // Generate settlements to balance out debts
    const settlements: Settlement[] = [];
    const debtors = Object.entries(balances).filter(([_, balance]) => balance < -0.01);
    const creditors = Object.entries(balances).filter(([_, balance]) => balance > 0.01);

    debtors.forEach(([debtorId, debt]) => {
      let remainingDebt = Math.abs(debt);
      
      creditors.forEach(([creditorId, credit]) => {
        if (remainingDebt > 0.01 && credit > 0.01) {
          const settlementAmount = Math.min(remainingDebt, credit);
          
          settlements.push({
            fromMemberId: debtorId,
            toMemberId: creditorId,
            amount: settlementAmount,
          });
          
          remainingDebt -= settlementAmount;
          balances[creditorId] -= settlementAmount;
        }
      });
    });

    return settlements;
  };

  const handleSplitMethodChange = (method: SplitMethod) => {
    setSplitMethod(method);
    announce(`Split method changed to ${method}`, 'polite');
  };

  const handlePercentageChange = (memberId: string, percentage: number) => {
    const newRules = splitRules.map(rule => 
      rule.memberId === memberId 
        ? { ...rule, percentage: Math.max(0, Math.min(100, percentage)) }
        : rule
    );
    setSplitRules(newRules);
  };

  const handleAmountChange = (memberId: string, amount: number) => {
    const newRules = splitRules.map(rule => 
      rule.memberId === memberId 
        ? { ...rule, amount: Math.max(0, amount) }
        : rule
    );
    setSplitRules(newRules);
  };

  const handleQuantityChange = (memberId: string, itemId: string, quantity: number) => {
    const newRules = splitRules.map(rule => 
      rule.memberId === memberId 
        ? { 
            ...rule, 
            itemQuantities: {
              ...rule.itemQuantities,
              [itemId]: Math.max(0, quantity)
            }
          }
        : rule
    );
    setSplitRules(newRules);
  };

  const validateSplit = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (splitMethod === 'equal') {
      // Equal split is always valid
    } else if (splitMethod === 'custom') {
      const totalPercentage = splitRules.reduce((sum, rule) => sum + (rule.percentage || 0), 0);
      const totalAmount = splitRules.reduce((sum, rule) => sum + (rule.amount || 0), 0);
      
      if (Math.abs(totalPercentage - 100) > 0.01 && Math.abs(totalAmount - purchase.totalAmount) > 0.01) {
        newErrors.split = 'Percentages must add up to 100% or amounts must equal total purchase amount';
      }
    } else if (splitMethod === 'quantity') {
      // Validate that all quantities are distributed
      purchase.items.forEach(item => {
        const totalDistributed = splitRules.reduce(
          (sum, rule) => sum + (rule.itemQuantities?.[item.itemId] || 0), 
          0
        );
        
        if (Math.abs(totalDistributed - item.purchasedQuantity) > 0.01) {
          newErrors[`quantity-${item.itemId}`] = `${item.itemName}: quantities must add up to ${item.purchasedQuantity}`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateSplit()) {
      announce('Please fix the split errors', 'assertive');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(splitRules, settlements);
      announce('Cost split saved successfully', 'polite');
      onClose();
    } catch (error) {
      announce('Failed to save cost split. Please try again.', 'assertive');
      setErrors({ submit: 'Failed to save cost split. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberName = (memberId: string) => {
    return groupMembers.find(m => m.id === memberId)?.displayName || 'Unknown';
  };

  const getTotalPercentage = () => {
    return splitRules.reduce((sum, rule) => sum + (rule.percentage || 0), 0);
  };

  const getTotalAmount = () => {
    return splitRules.reduce((sum, rule) => sum + (rule.amount || 0), 0);
  };

  return (
    <motion.div
      className=\"fixed inset-0 z-50 flex items-center justify-center p-fib-4\"
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={reducedMotion ? {} : { opacity: 1 }}
      exit={reducedMotion ? {} : { opacity: 0 }}
      transition={reducedMotion ? {} : { duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className=\"absolute inset-0 bg-black/50\"
        onClick={onClose}
        aria-hidden=\"true\"
      />

      {/* Modal */}
      <motion.div
        className=\"relative bg-white rounded-xl shadow-mobile-lg border border-neutral-200 max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col\"
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
        transition={reducedMotion ? {} : { duration: 0.2 }}
        role=\"dialog\"
        aria-modal=\"true\"
        aria-labelledby=\"cost-split-title\"
      >
        {/* Header */}
        <div className=\"flex items-center justify-between p-fib-4 border-b border-neutral-100 flex-shrink-0\">
          <div>
            <h2 id=\"cost-split-title\" className=\"text-mobile-lg font-bold text-neutral-900\">
              Split Purchase Cost
            </h2>
            <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
              Total: ${purchase.totalAmount.toFixed(2)} • Purchased by {purchase.purchasedByName}
            </p>
          </div>
          <AccessibleButton
            variant=\"ghost\"
            size=\"sm\"
            onClick={onClose}
            ariaLabel=\"Close cost split dialog\"
          >
            <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M6 18L18 6M6 6l12 12\" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Content */}
        <div className=\"flex-1 overflow-y-auto p-fib-4\">
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-fib-6\">
            {/* Left Column: Split Configuration */}
            <div className=\"space-y-fib-4\">
              {/* Split Method Selection */}
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Split Method
                </h3>
                
                <div className=\"space-y-fib-2\">
                  {[
                    {
                      id: 'equal',
                      label: 'Equal Split',
                      description: 'Divide cost equally among all members',
                      icon: '⚖️',
                    },
                    {
                      id: 'quantity',
                      label: 'Quantity-Based',
                      description: 'Split based on quantity of items each person gets',
                      icon: '📊',
                    },
                    {
                      id: 'custom',
                      label: 'Custom Split',
                      description: 'Set custom percentages or amounts for each person',
                      icon: '🎯',
                    },
                  ].map((method) => (
                    <label key={method.id} className=\"block\">
                      <input
                        type=\"radio\"
                        name=\"splitMethod\"
                        value={method.id}
                        checked={splitMethod === method.id}
                        onChange={(e) => handleSplitMethodChange(e.target.value as SplitMethod)}
                        className=\"sr-only\"
                      />
                      <div className={clsx(
                        'p-fib-3 border-2 rounded-lg cursor-pointer transition-all',
                        {
                          'border-primary-500 bg-primary-50': splitMethod === method.id,
                          'border-neutral-200 hover:border-neutral-300': splitMethod !== method.id,
                        }
                      )}>
                        <div className=\"flex items-start space-x-fib-2\">
                          <span className=\"text-mobile-lg\">{method.icon}</span>
                          <div>
                            <h4 className=\"text-mobile-sm font-medium text-neutral-900\">
                              {method.label}
                            </h4>
                            <p className=\"text-mobile-xs text-neutral-600 mt-fib-1\">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Split Configuration */}
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Member Splits
                </h3>

                <div className=\"space-y-fib-3\">
                  {splitRules.map((rule) => {
                    const member = groupMembers.find(m => m.id === rule.memberId);
                    if (!member) return null;

                    return (
                      <div key={rule.memberId} className=\"border border-neutral-200 rounded-lg p-fib-3\">
                        <div className=\"flex items-center justify-between mb-fib-2\">
                          <div className=\"flex items-center space-x-fib-2\">
                            <div className=\"w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center\">
                              <span className=\"text-xs font-semibold text-white\">
                                {member.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className=\"text-mobile-sm font-medium text-neutral-900\">
                                {member.displayName}
                                {member.id === purchase.purchasedBy && (
                                  <span className=\"ml-fib-1 text-xs text-success-600 font-medium\">
                                    (Purchaser)
                                  </span>
                                )}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Equal Split */}
                        {splitMethod === 'equal' && (
                          <div className=\"text-mobile-sm text-neutral-600\">
                            ${(purchase.totalAmount / groupMembers.length).toFixed(2)} 
                            ({(100 / groupMembers.length).toFixed(1)}%)
                          </div>
                        )}

                        {/* Custom Split */}
                        {splitMethod === 'custom' && (
                          <div className=\"grid grid-cols-2 gap-fib-2\">
                            <AccessibleInput
                              label=\"Percentage\"
                              type=\"number\"
                              value={rule.percentage?.toString() || ''}
                              onChange={(value) => handlePercentageChange(rule.memberId, parseFloat(value) || 0)}
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder=\"0\"
                            />
                            <AccessibleInput
                              label=\"Amount\"
                              type=\"number\"
                              value={rule.amount?.toString() || ''}
                              onChange={(value) => handleAmountChange(rule.memberId, parseFloat(value) || 0)}
                              min={0}
                              step={0.01}
                              placeholder=\"0.00\"
                            />
                          </div>
                        )}

                        {/* Quantity Split */}
                        {splitMethod === 'quantity' && (
                          <div className=\"space-y-fib-2\">
                            {purchase.items.map((item) => (
                              <div key={item.itemId} className=\"flex items-center justify-between\">
                                <span className=\"text-mobile-sm text-neutral-700\">
                                  {item.itemName}
                                </span>
                                <div className=\"w-20\">
                                  <AccessibleInput
                                    label=\"\"
                                    type=\"number\"
                                    value={rule.itemQuantities?.[item.itemId]?.toString() || ''}
                                    onChange={(value) => handleQuantityChange(rule.memberId, item.itemId, parseFloat(value) || 0)}
                                    min={0}
                                    max={item.purchasedQuantity}
                                    step={0.1}
                                    placeholder=\"0\"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Validation Summary */}
                {splitMethod === 'custom' && (
                  <div className=\"mt-fib-3 p-fib-3 bg-neutral-50 rounded-lg\">
                    <div className=\"grid grid-cols-2 gap-fib-4 text-mobile-sm\">
                      <div>
                        <span className=\"text-neutral-600\">Total Percentage:</span>
                        <span className={clsx(
                          'ml-fib-2 font-medium',
                          {
                            'text-success-600': Math.abs(getTotalPercentage() - 100) < 0.01,
                            'text-error-600': Math.abs(getTotalPercentage() - 100) >= 0.01,
                          }
                        )}>
                          {getTotalPercentage().toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className=\"text-neutral-600\">Total Amount:</span>
                        <span className={clsx(
                          'ml-fib-2 font-medium',
                          {
                            'text-success-600': Math.abs(getTotalAmount() - purchase.totalAmount) < 0.01,
                            'text-error-600': Math.abs(getTotalAmount() - purchase.totalAmount) >= 0.01,
                          }
                        )}>
                          ${getTotalAmount().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {Object.entries(errors).map(([key, error]) => (
                  <p key={key} className=\"text-mobile-sm text-error-700 mt-fib-2\">
                    {error}
                  </p>
                ))}
              </div>
            </div>

            {/* Right Column: Settlement Preview */}
            <div className=\"space-y-fib-4\">
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Settlement Summary
                </h3>

                {settlements.length === 0 ? (
                  <div className=\"text-center py-fib-6 bg-success-50 rounded-lg border border-success-200\">
                    <svg className=\"w-12 h-12 text-success-600 mx-auto mb-fib-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                    </svg>
                    <p className=\"text-mobile-base font-medium text-success-900 mb-fib-1\">
                      All Settled!
                    </p>
                    <p className=\"text-mobile-sm text-success-700\">
                      No payments needed between members
                    </p>
                  </div>
                ) : (
                  <div className=\"space-y-fib-2\">
                    {settlements.map((settlement, index) => (
                      <div key={index} className=\"flex items-center justify-between p-fib-3 bg-warning-50 border border-warning-200 rounded-lg\">
                        <div className=\"flex items-center space-x-fib-2\">
                          <div className=\"text-mobile-sm\">
                            <span className=\"font-medium text-neutral-900\">
                              {getMemberName(settlement.fromMemberId)}
                            </span>
                            <span className=\"text-neutral-600 mx-fib-1\">owes</span>
                            <span className=\"font-medium text-neutral-900\">
                              {getMemberName(settlement.toMemberId)}
                            </span>
                          </div>
                        </div>
                        <div className=\"text-mobile-base font-bold text-warning-900\">
                          ${settlement.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Items */}
              <div>
                <h3 className=\"text-mobile-base font-semibold text-neutral-900 mb-fib-3\">
                  Purchase Items
                </h3>
                
                <div className=\"space-y-fib-2\">
                  {purchase.items.map((item) => (
                    <div key={item.itemId} className=\"flex items-center justify-between p-fib-2 bg-neutral-50 rounded-lg\">
                      <div>
                        <span className=\"text-mobile-sm font-medium\">{item.itemName}</span>
                        <span className=\"ml-fib-2 text-mobile-xs text-neutral-600\">
                          Qty: {item.purchasedQuantity}
                        </span>
                      </div>
                      <span className=\"text-mobile-sm font-medium\">
                        ${item.actualPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className=\"mt-fib-3 pt-fib-3 border-t border-neutral-200\">
                  <div className=\"flex items-center justify-between text-mobile-base font-semibold\">
                    <span>Total</span>
                    <span>${purchase.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className=\"flex items-center justify-between p-fib-4 border-t border-neutral-100 flex-shrink-0\">
          <AccessibleButton
            variant=\"outline\"
            size=\"md\"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </AccessibleButton>
          
          <AccessibleButton
            variant=\"primary\"
            size=\"md\"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Split
          </AccessibleButton>
        </div>
      </motion.div>
    </motion.div>
  );
}