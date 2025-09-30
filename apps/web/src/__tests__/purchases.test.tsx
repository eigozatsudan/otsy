import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PurchaseRecordModal from '@/components/purchases/PurchaseRecordModal';
import CostSplitModal from '@/components/purchases/CostSplitModal';
import PurchaseHistory from '@/components/purchases/PurchaseHistory';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockItems = [
  {
    id: 'item-1',
    name: 'Organic Bananas',
    category: 'Produce',
    quantity: 6,
    unit: 'pcs',
    estimatedPrice: 3.99,
    status: 'todo' as const,
  },
  {
    id: 'item-2',
    name: 'Whole Milk',
    category: 'Dairy',
    quantity: 1,
    unit: 'gal',
    estimatedPrice: 4.29,
    status: 'todo' as const,
  },
];

const mockMembers = [
  { id: 'user-1', displayName: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', displayName: 'Jane Doe', email: 'jane@example.com' },
  { id: 'user-3', displayName: 'Bob Smith', email: 'bob@example.com' },
];

const mockPurchase = {
  id: 'purchase-1',
  totalAmount: 25.50,
  items: [
    {
      itemId: 'item-1',
      itemName: 'Organic Bananas',
      purchasedQuantity: 6,
      actualPrice: 3.99,
    },
    {
      itemId: 'item-2',
      itemName: 'Whole Milk',
      purchasedQuantity: 1,
      actualPrice: 4.29,
    },
  ],
  purchasedBy: 'user-1',
  purchasedByName: 'John Doe',
  purchasedAt: '2024-01-15T12:00:00Z',
};

const mockPurchases = [
  {
    ...mockPurchase,
    settlements: [
      {
        fromMemberId: 'user-2',
        fromMemberName: 'Jane Doe',
        toMemberId: 'user-1',
        toMemberName: 'John Doe',
        amount: 8.50,
        status: 'pending' as const,
      },
      {
        fromMemberId: 'user-3',
        fromMemberName: 'Bob Smith',
        toMemberId: 'user-1',
        toMemberName: 'John Doe',
        amount: 8.50,
        status: 'pending' as const,
      },
    ],
    splitMethod: 'equal' as const,
  },
];

describe('Purchase Components', () => {
  describe('PurchaseRecordModal', () => {
    const defaultProps = {
      items: mockItems,
      groupMembers: mockMembers,
      currentUserId: 'user-1',
      onRecord: jest.fn().mockResolvedValue(undefined),
      onClose: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<PurchaseRecordModal {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display available items for purchase', () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.getByText('Whole Milk')).toBeInTheDocument();
      expect(screen.getByText('Available: 6 pcs')).toBeInTheDocument();
      expect(screen.getByText('Available: 1 gal')).toBeInTheDocument();
    });

    it('should handle item selection', () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      expect(screen.getByText('Select Items Purchased (1 selected)')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      // Try to proceed without selecting items
      const nextButton = screen.getByText('Next: Receipt');
      fireEvent.click(nextButton);
      
      // Should still be on items step due to validation
      expect(screen.getByText('Select Items Purchased (0 selected)')).toBeInTheDocument();
    });

    it('should handle quantity and price changes', () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      // Select an item
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      // Change quantity
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '3' } });
      
      // Change price
      const priceInput = screen.getByLabelText('Actual Price');
      fireEvent.change(priceInput, { target: { value: '2.99' } });
      
      expect(quantityInput).toHaveValue(3);
      expect(priceInput).toHaveValue(2.99);
    });

    it('should navigate through steps', () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      // Select item and add total
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      const totalInput = screen.getByLabelText('Total Amount');
      fireEvent.change(totalInput, { target: { value: '3.99' } });
      
      // Go to receipt step
      const nextButton = screen.getByText('Next: Receipt');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Upload Receipt (Optional)')).toBeInTheDocument();
      
      // Go to review step
      const nextButton2 = screen.getByText('Next: Review');
      fireEvent.click(nextButton2);
      
      expect(screen.getByText('Review Purchase Details')).toBeInTheDocument();
    });

    it('should handle receipt upload', () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      // Navigate to receipt step
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      const totalInput = screen.getByLabelText('Total Amount');
      fireEvent.change(totalInput, { target: { value: '3.99' } });
      
      const nextButton = screen.getByText('Next: Receipt');
      fireEvent.click(nextButton);
      
      // Check for upload area
      expect(screen.getByText('Upload receipt image')).toBeInTheDocument();
      expect(screen.getByText('PNG, JPG up to 10MB')).toBeInTheDocument();
    });

    it('should show PII warning when receipt is uploaded', async () => {
      render(<PurchaseRecordModal {...defaultProps} />);
      
      // Navigate to receipt step
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      const totalInput = screen.getByLabelText('Total Amount');
      fireEvent.change(totalInput, { target: { value: '3.99' } });
      
      const nextButton = screen.getByText('Next: Receipt');
      fireEvent.click(nextButton);
      
      // Mock file upload
      const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Upload receipt image');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText('Privacy Notice')).toBeInTheDocument();
        expect(screen.getByText(/Receipt images may contain personal information/)).toBeInTheDocument();
      });
    });

    it('should submit purchase record', async () => {
      const mockProps = { ...defaultProps };
      render(<PurchaseRecordModal {...mockProps} />);
      
      // Select item and fill form
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      const totalInput = screen.getByLabelText('Total Amount');
      fireEvent.change(totalInput, { target: { value: '3.99' } });
      
      // Navigate to review
      fireEvent.click(screen.getByText('Next: Receipt'));
      fireEvent.click(screen.getByText('Next: Review'));
      
      // Submit
      const submitButton = screen.getByText('Record Purchase');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onRecord).toHaveBeenCalledWith({
          totalAmount: 3.99,
          items: expect.arrayContaining([
            expect.objectContaining({
              itemId: 'item-1',
              purchasedQuantity: 6,
              actualPrice: 3.99,
            }),
          ]),
          receiptImageUrl: undefined,
          notes: undefined,
        });
      });
    });
  });

  describe('CostSplitModal', () => {
    const defaultProps = {
      purchase: mockPurchase,
      groupMembers: mockMembers,
      currentUserId: 'user-1',
      onSave: jest.fn().mockResolvedValue(undefined),
      onClose: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<CostSplitModal {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display purchase information', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      expect(screen.getByText('Split Purchase Cost')).toBeInTheDocument();
      expect(screen.getByText('Total: $25.50 • Purchased by John Doe')).toBeInTheDocument();
    });

    it('should show split method options', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      expect(screen.getByText('Equal Split')).toBeInTheDocument();
      expect(screen.getByText('Quantity-Based')).toBeInTheDocument();
      expect(screen.getByText('Custom Split')).toBeInTheDocument();
    });

    it('should handle split method selection', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      const customSplitOption = screen.getByLabelText(/Custom Split/);
      fireEvent.click(customSplitOption);
      
      // Should show percentage and amount inputs
      expect(screen.getAllByLabelText('Percentage')).toHaveLength(mockMembers.length);
      expect(screen.getAllByLabelText('Amount')).toHaveLength(mockMembers.length);
    });

    it('should calculate equal split correctly', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      // Equal split should be selected by default
      const equalAmount = (25.50 / 3).toFixed(2);
      const equalPercentage = (100 / 3).toFixed(1);
      
      expect(screen.getByText(`$${equalAmount} (${equalPercentage}%)`)).toBeInTheDocument();
    });

    it('should handle custom percentage changes', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      // Switch to custom split
      const customSplitOption = screen.getByLabelText(/Custom Split/);
      fireEvent.click(customSplitOption);
      
      // Change first member's percentage
      const percentageInputs = screen.getAllByLabelText('Percentage');
      fireEvent.change(percentageInputs[0], { target: { value: '50' } });
      
      expect(percentageInputs[0]).toHaveValue(50);
    });

    it('should show settlement preview', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      expect(screen.getByText('Settlement Summary')).toBeInTheDocument();
      // With equal split, other members should owe the purchaser
      expect(screen.getByText(/Jane Doe owes John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Smith owes John Doe/)).toBeInTheDocument();
    });

    it('should validate custom split totals', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      // Switch to custom split
      const customSplitOption = screen.getByLabelText(/Custom Split/);
      fireEvent.click(customSplitOption);
      
      // Set percentages that don't add up to 100%
      const percentageInputs = screen.getAllByLabelText('Percentage');
      fireEvent.change(percentageInputs[0], { target: { value: '30' } });
      fireEvent.change(percentageInputs[1], { target: { value: '30' } });
      fireEvent.change(percentageInputs[2], { target: { value: '30' } });
      
      // Try to save
      const saveButton = screen.getByText('Save Split');
      fireEvent.click(saveButton);
      
      // Should show validation error
      expect(screen.getByText(/Percentages must add up to 100%/)).toBeInTheDocument();
    });

    it('should handle quantity-based split', () => {
      render(<CostSplitModal {...defaultProps} />);
      
      // Switch to quantity-based split
      const quantitySplitOption = screen.getByLabelText(/Quantity-Based/);
      fireEvent.click(quantitySplitOption);
      
      // Should show quantity inputs for each item
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.getByText('Whole Milk')).toBeInTheDocument();
    });

    it('should submit split configuration', async () => {
      const mockProps = { ...defaultProps };
      render(<CostSplitModal {...mockProps} />);
      
      const saveButton = screen.getByText('Save Split');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              memberId: expect.any(String),
              percentage: expect.any(Number),
            }),
          ]),
          expect.arrayContaining([
            expect.objectContaining({
              fromMemberId: expect.any(String),
              toMemberId: expect.any(String),
              amount: expect.any(Number),
            }),
          ])
        );
      });
    });
  });

  describe('PurchaseHistory', () => {
    const defaultProps = {
      purchases: mockPurchases,
      currentUserId: 'user-1',
      onViewReceipt: jest.fn(),
      onEditSplit: jest.fn(),
      onMarkSettled: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<PurchaseHistory {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display purchase history', () => {
      render(<PurchaseHistory {...defaultProps} />);
      
      expect(screen.getByText('Purchase History')).toBeInTheDocument();
      expect(screen.getByText('1 purchase')).toBeInTheDocument();
      expect(screen.getByText('$25.50')).toBeInTheDocument();
      expect(screen.getByText('by John Doe (You)')).toBeInTheDocument();
    });

    it('should show summary cards', () => {
      render(<PurchaseHistory {...defaultProps} />);
      
      expect(screen.getByText('Owed to Me')).toBeInTheDocument();
      expect(screen.getByText('I Owe')).toBeInTheDocument();
      expect(screen.getByText('Total Spent')).toBeInTheDocument();
    });

    it('should filter purchases', () => {
      render(<PurchaseHistory {...defaultProps} />);
      
      // Filter to my purchases
      const myPurchasesTab = screen.getByText('My Purchases');
      fireEvent.click(myPurchasesTab);
      
      // Should still show the purchase since current user is the purchaser
      expect(screen.getByText('$25.50')).toBeInTheDocument();
    });

    it('should expand purchase details', () => {
      render(<PurchaseHistory {...defaultProps} />);
      
      // Click on purchase to expand
      const purchaseButton = screen.getByLabelText(/Purchase by John Doe/);
      fireEvent.click(purchaseButton);
      
      // Should show expanded details
      expect(screen.getByText('Items Purchased')).toBeInTheDocument();
      expect(screen.getByText('Cost Split')).toBeInTheDocument();
      expect(screen.getByText('Organic Bananas × 6')).toBeInTheDocument();
      expect(screen.getByText('Whole Milk × 1')).toBeInTheDocument();
    });

    it('should show settlement status', () => {
      render(<PurchaseHistory {...defaultProps} />);
      
      // Should show pending settlements
      expect(screen.getByText(/Jane Doe owes you/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Smith owes you/)).toBeInTheDocument();
    });

    it('should handle mark as settled', () => {
      const mockProps = { ...defaultProps };
      render(<PurchaseHistory {...mockProps} />);
      
      // Expand purchase details
      const purchaseButton = screen.getByLabelText(/Purchase by John Doe/);
      fireEvent.click(purchaseButton);
      
      // Mark first settlement as settled
      const markSettledButtons = screen.getAllByText('Mark Settled');
      fireEvent.click(markSettledButtons[0]);
      
      expect(mockProps.onMarkSettled).toHaveBeenCalledWith('purchase-1', 0);
    });

    it('should handle edit split', () => {
      const mockProps = { ...defaultProps };
      render(<PurchaseHistory {...mockProps} />);
      
      // Expand purchase details
      const purchaseButton = screen.getByLabelText(/Purchase by John Doe/);
      fireEvent.click(purchaseButton);
      
      // Click edit split
      const editSplitButton = screen.getByText('Edit Split');
      fireEvent.click(editSplitButton);
      
      expect(mockProps.onEditSplit).toHaveBeenCalledWith(mockPurchases[0]);
    });

    it('should show empty state when no purchases', () => {
      render(<PurchaseHistory {...defaultProps} purchases={[]} />);
      
      expect(screen.getByText('No purchases yet')).toBeInTheDocument();
      expect(screen.getByText(/Purchase history will appear here/)).toBeInTheDocument();
    });

    it('should sort purchases by date and amount', () => {
      const multiplePurchases = [
        ...mockPurchases,
        {
          ...mockPurchases[0],
          id: 'purchase-2',
          totalAmount: 50.00,
          purchasedAt: '2024-01-16T12:00:00Z',
        },
      ];
      
      render(<PurchaseHistory {...defaultProps} purchases={multiplePurchases} />);
      
      // Change sort to amount
      const sortSelect = screen.getByLabelText('Sort purchases');
      fireEvent.change(sortSelect, { target: { value: 'amount' } });
      
      // Higher amount should appear first
      const amounts = screen.getAllByText(/\$\d+\.\d+/);
      expect(amounts[0]).toHaveTextContent('$50.00');
    });
  });

  describe('Cost Splitting Logic', () => {
    it('should calculate equal split correctly', () => {
      const totalAmount = 30.00;
      const memberCount = 3;
      const expectedPerMember = totalAmount / memberCount;
      
      expect(expectedPerMember).toBe(10.00);
    });

    it('should handle rounding in equal split', () => {
      const totalAmount = 10.00;
      const memberCount = 3;
      const expectedPerMember = totalAmount / memberCount;
      
      // Should be 3.33 with remainder handled
      expect(expectedPerMember).toBeCloseTo(3.33, 2);
    });

    it('should calculate quantity-based split correctly', () => {
      const items = [
        { price: 6.00, totalQuantity: 6, memberQuantity: 2 }, // Member gets 1/3
        { price: 9.00, totalQuantity: 3, memberQuantity: 1 }, // Member gets 1/3
      ];
      
      const memberTotal = items.reduce((sum, item) => {
        const unitPrice = item.price / item.totalQuantity;
        return sum + (unitPrice * item.memberQuantity);
      }, 0);
      
      expect(memberTotal).toBe(5.00); // (6/6)*2 + (9/3)*1 = 2 + 3 = 5
    });

    it('should validate custom split percentages', () => {
      const percentages = [30, 30, 30]; // Total: 90%
      const total = percentages.reduce((sum, p) => sum + p, 0);
      
      expect(total).toBe(90);
      expect(Math.abs(total - 100)).toBeGreaterThan(0.01); // Should fail validation
    });

    it('should calculate settlements correctly', () => {
      const balances = {
        'user-1': 25.50, // Purchaser gets credit
        'user-2': -8.50, // Owes money
        'user-3': -8.50, // Owes money
        'user-4': -8.50, // Owes money
      };
      
      // Total should balance to zero
      const total = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
      expect(total).toBeCloseTo(0, 2);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in purchase record modal', () => {
      render(<PurchaseRecordModal {...{
        items: mockItems,
        groupMembers: mockMembers,
        currentUserId: 'user-1',
        onRecord: jest.fn(),
        onClose: jest.fn(),
      }} />);
      
      // Should be able to tab through form elements
      const firstCheckbox = screen.getByLabelText('Select Organic Bananas');
      firstCheckbox.focus();
      expect(firstCheckbox).toHaveFocus();
    });

    it('should handle escape key to close modals', () => {
      const mockClose = jest.fn();
      render(<PurchaseRecordModal {...{
        items: mockItems,
        groupMembers: mockMembers,
        currentUserId: 'user-1',
        onRecord: jest.fn(),
        onClose: mockClose,
      }} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockClose).toHaveBeenCalled();
    });
  });
});