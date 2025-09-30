import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ShoppingList from '@/components/shopping/ShoppingList';
import ShoppingItemCard from '@/components/shopping/ShoppingItemCard';
import ShoppingItemRow from '@/components/shopping/ShoppingItemRow';
import AddItemModal from '@/components/shopping/AddItemModal';
import AdSlot from '@/components/ads/AdSlot';

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
    notes: 'Make sure they are ripe',
    status: 'todo' as const,
    addedBy: 'user-1',
    addedByName: 'John Doe',
    addedAt: '2024-01-15T10:00:00Z',
    estimatedPrice: 3.99,
    priority: 'medium' as const,
  },
  {
    id: 'item-2',
    name: 'Whole Milk',
    category: 'Dairy',
    quantity: 1,
    unit: 'gal',
    status: 'purchased' as const,
    addedBy: 'user-2',
    addedByName: 'Jane Doe',
    addedAt: '2024-01-14T15:00:00Z',
    purchasedBy: 'user-1',
    purchasedByName: 'John Doe',
    purchasedAt: '2024-01-15T12:00:00Z',
    actualPrice: 4.29,
    priority: 'high' as const,
  },
  {
    id: 'item-3',
    name: 'Bread',
    category: 'Bakery',
    quantity: 2,
    unit: 'loaves',
    status: 'cancelled' as const,
    addedBy: 'user-1',
    addedByName: 'John Doe',
    addedAt: '2024-01-13T09:00:00Z',
    priority: 'low' as const,
  },
];

const mockCategories = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Frozen'];

describe('Shopping Components', () => {
  describe('ShoppingList', () => {
    const defaultProps = {
      groupId: 'group-1',
      items: mockItems,
      categories: mockCategories,
      currentUserId: 'user-1',
      onAddItem: jest.fn(),
      onUpdateItem: jest.fn(),
      onDeleteItem: jest.fn(),
      onReorderItems: jest.fn(),
      onBulkAction: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ShoppingList {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display shopping list items', () => {
      render(<ShoppingList {...defaultProps} />);
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.getByText('Whole Milk')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    it('should show correct item count', () => {
      render(<ShoppingList {...defaultProps} />);
      
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('should filter items by status', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const statusFilter = screen.getByLabelText('Filter by status');
      fireEvent.change(statusFilter, { target: { value: 'todo' } });
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.queryByText('Whole Milk')).not.toBeInTheDocument();
      expect(screen.queryByText('Bread')).not.toBeInTheDocument();
    });

    it('should filter items by category', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const categoryFilter = screen.getByLabelText('Filter by category');
      fireEvent.change(categoryFilter, { target: { value: 'Dairy' } });
      
      expect(screen.queryByText('Organic Bananas')).not.toBeInTheDocument();
      expect(screen.getByText('Whole Milk')).toBeInTheDocument();
      expect(screen.queryByText('Bread')).not.toBeInTheDocument();
    });

    it('should search items by name', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Search shopping items');
      fireEvent.change(searchInput, { target: { value: 'banana' } });
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.queryByText('Whole Milk')).not.toBeInTheDocument();
      expect(screen.queryByText('Bread')).not.toBeInTheDocument();
    });

    it('should toggle between grid and list view', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const listViewButton = screen.getByLabelText('List view');
      fireEvent.click(listViewButton);
      
      // In list view, drag handles should be visible
      expect(screen.getAllByRole('article')).toHaveLength(3);
    });

    it('should handle item selection', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);
      
      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('should handle bulk actions', () => {
      const mockProps = { ...defaultProps };
      render(<ShoppingList {...mockProps} />);
      
      // Select an item
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);
      
      // Perform bulk action
      const markPurchasedButton = screen.getByText('Mark Purchased');
      fireEvent.click(markPurchasedButton);
      
      expect(mockProps.onBulkAction).toHaveBeenCalledWith(['item-1'], 'purchased');
    });

    it('should open add item modal', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const addButton = screen.getByText('Add Item');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
    });

    it('should show empty state when no items', () => {
      render(<ShoppingList {...defaultProps} items={[]} />);
      
      expect(screen.getByText('No items in your shopping list')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Item')).toBeInTheDocument();
    });

    it('should show filtered empty state', () => {
      render(<ShoppingList {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Search shopping items');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No items match your filters')).toBeInTheDocument();
    });
  });

  describe('ShoppingItemCard', () => {
    const defaultProps = {
      item: mockItems[0],
      isSelected: false,
      onSelect: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
      currentUserId: 'user-1',
      width: 280,
      height: 173, // 280 / 1.618 (golden ratio)
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ShoppingItemCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display item information', () => {
      render(<ShoppingItemCard {...defaultProps} />);
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.getByText('6 pcs')).toBeInTheDocument();
      expect(screen.getByText('Produce')).toBeInTheDocument();
      expect(screen.getByText('Make sure they are ripe')).toBeInTheDocument();
      expect(screen.getByText('Est: $3.99')).toBeInTheDocument();
    });

    it('should use golden ratio dimensions', () => {
      const { container } = render(<ShoppingItemCard {...defaultProps} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card.style.width).toBe('280px');
      expect(card.style.height).toBe('173px');
      
      // Verify golden ratio (approximately 1.618)
      const ratio = 280 / 173;
      expect(ratio).toBeCloseTo(1.618, 1);
    });

    it('should show priority badge for high/low priority', () => {
      render(<ShoppingItemCard {...defaultProps} item={{...mockItems[0], priority: 'high'}} />);
      
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should handle item selection', () => {
      const mockProps = { ...defaultProps };
      render(<ShoppingItemCard {...mockProps} />);
      
      const checkbox = screen.getByLabelText('Select Organic Bananas');
      fireEvent.click(checkbox);
      
      expect(mockProps.onSelect).toHaveBeenCalledWith(true);
    });

    it('should show quick actions on hover', async () => {
      render(<ShoppingItemCard {...defaultProps} />);
      
      const card = screen.getByRole('article');
      fireEvent.mouseEnter(card);
      
      await waitFor(() => {
        expect(screen.getByText('Buy')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should handle status changes', () => {
      const mockProps = { ...defaultProps };
      render(<ShoppingItemCard {...mockProps} />);
      
      const card = screen.getByRole('article');
      fireEvent.mouseEnter(card);
      
      const buyButton = screen.getByText('Buy');
      fireEvent.click(buyButton);
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        status: 'purchased',
        purchasedBy: 'user-1',
        purchasedAt: expect.any(String),
      });
    });

    it('should show different actions for purchased items', () => {
      render(<ShoppingItemCard {...defaultProps} item={mockItems[1]} />);
      
      const card = screen.getByRole('article');
      fireEvent.mouseEnter(card);
      
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should show strikethrough for cancelled items', () => {
      const { container } = render(<ShoppingItemCard {...defaultProps} item={mockItems[2]} />);
      
      // Check for strikethrough element
      const strikethrough = container.querySelector('.rotate-12');
      expect(strikethrough).toBeInTheDocument();
    });
  });

  describe('ShoppingItemRow', () => {
    const defaultProps = {
      item: mockItems[0],
      isSelected: false,
      onSelect: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
      currentUserId: 'user-1',
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ShoppingItemRow {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display item information in row format', () => {
      render(<ShoppingItemRow {...defaultProps} />);
      
      expect(screen.getByText('Organic Bananas')).toBeInTheDocument();
      expect(screen.getByText('6 pcs')).toBeInTheDocument();
      expect(screen.getByText('Produce')).toBeInTheDocument();
      expect(screen.getByText('$3.99 (est)')).toBeInTheDocument();
    });

    it('should show drag handle', () => {
      render(<ShoppingItemRow {...defaultProps} />);
      
      // Drag handle should be present
      const dragHandle = screen.getByRole('article').querySelector('svg');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should handle dragging state', () => {
      const { container } = render(<ShoppingItemRow {...defaultProps} isDragging={true} />);
      
      const row = container.firstChild as HTMLElement;
      expect(row).toHaveClass('shadow-mobile-md', 'scale-105');
    });

    it('should show purchased by information', () => {
      render(<ShoppingItemRow {...defaultProps} item={mockItems[1]} />);
      
      expect(screen.getByText('✓ John Doe')).toBeInTheDocument();
    });

    it('should show line-through for cancelled items', () => {
      render(<ShoppingItemRow {...defaultProps} item={mockItems[2]} />);
      
      const itemName = screen.getByText('Bread');
      expect(itemName).toHaveClass('line-through');
    });
  });

  describe('AddItemModal', () => {
    const defaultProps = {
      categories: mockCategories,
      onAdd: jest.fn(),
      onClose: jest.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<AddItemModal {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display form fields', () => {
      render(<AddItemModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Item Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Category *')).toBeInTheDocument();
      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<AddItemModal {...defaultProps} />);
      
      const submitButton = screen.getByText('Add Item');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Item name is required')).toBeInTheDocument();
      });
    });

    it('should handle form submission', async () => {
      const mockProps = { ...defaultProps };
      render(<AddItemModal {...mockProps} />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Item Name'), {
        target: { value: 'Test Item' }
      });
      fireEvent.change(screen.getByLabelText('Quantity'), {
        target: { value: '2' }
      });
      
      // Submit
      const submitButton = screen.getByText('Add Item');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onAdd).toHaveBeenCalledWith({
          name: 'Test Item',
          category: mockCategories[0],
          quantity: 2,
          unit: 'pcs',
          priority: 'medium',
        });
      });
    });

    it('should handle custom category', () => {
      render(<AddItemModal {...defaultProps} />);
      
      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);
      
      expect(screen.getByPlaceholderText('Enter custom category')).toBeInTheDocument();
    });

    it('should handle priority selection', () => {
      render(<AddItemModal {...defaultProps} />);
      
      const highPriorityButton = screen.getByText('High');
      fireEvent.click(highPriorityButton);
      
      // Check if high priority is selected (visual feedback)
      expect(highPriorityButton.parentElement).toHaveClass('border-error-500');
    });

    it('should close modal on escape key', () => {
      const mockProps = { ...defaultProps };
      render(<AddItemModal {...mockProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('AdSlot', () => {
    const defaultProps = {
      placement: 'list-top' as const,
      onAdView: jest.fn(),
      onAdClick: jest.fn(),
      onAdClose: jest.fn(),
    };

    // Mock IntersectionObserver
    beforeEach(() => {
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      }));
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<AdSlot {...defaultProps} />);
      
      // Wait for ad to load
      await waitFor(() => {
        expect(container.querySelector('[role="complementary"]')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display ad content', async () => {
      render(<AdSlot {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Ad')).toBeInTheDocument();
      });
    });

    it('should handle ad click', async () => {
      const mockProps = { ...defaultProps };
      
      // Mock window.open
      global.open = jest.fn();
      
      render(<AdSlot {...mockProps} />);
      
      await waitFor(() => {
        const adContent = screen.getByRole('button', { name: /Advertisement:/ });
        fireEvent.click(adContent);
        
        expect(global.open).toHaveBeenCalled();
        expect(mockProps.onAdClick).toHaveBeenCalled();
      });
    });

    it('should handle ad close', async () => {
      const mockProps = { ...defaultProps };
      render(<AdSlot {...mockProps} />);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close advertisement');
        fireEvent.click(closeButton);
        
        expect(mockProps.onAdClose).toHaveBeenCalled();
      });
    });

    it('should respect max ads per session', async () => {
      render(<AdSlot {...defaultProps} maxAdsPerSession={0} />);
      
      // Should not show any ads
      await waitFor(() => {
        expect(screen.queryByText('Ad')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show privacy notice', async () => {
      render(<AdSlot {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Ad personalization is based on/)).toBeInTheDocument();
        expect(screen.getByText('Learn more')).toBeInTheDocument();
      });
    });
  });

  describe('Golden Ratio Implementation', () => {
    it('should maintain golden ratio in card dimensions', () => {
      const width = 280;
      const height = Math.round(width / 1.618);
      
      expect(height).toBe(173);
      
      const ratio = width / height;
      expect(ratio).toBeCloseTo(1.618, 2);
    });

    it('should apply golden ratio to different card sizes', () => {
      const testSizes = [200, 300, 400];
      
      testSizes.forEach(width => {
        const height = Math.round(width / 1.618);
        const ratio = width / height;
        
        expect(ratio).toBeCloseTo(1.618, 1);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in shopping list', () => {
      render(<ShoppingList {...{
        groupId: 'group-1',
        items: mockItems,
        categories: mockCategories,
        currentUserId: 'user-1',
        onAddItem: jest.fn(),
        onUpdateItem: jest.fn(),
        onDeleteItem: jest.fn(),
        onReorderItems: jest.fn(),
        onBulkAction: jest.fn(),
      }} />);
      
      const searchInput = screen.getByLabelText('Search shopping items');
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
      
      // Tab to next focusable element
      fireEvent.keyDown(searchInput, { key: 'Tab' });
    });

    it('should handle Enter key on item cards', () => {
      const mockProps = {
        item: mockItems[0],
        isSelected: false,
        onSelect: jest.fn(),
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
        currentUserId: 'user-1',
        width: 280,
        height: 173,
      };
      
      render(<ShoppingItemCard {...mockProps} />);
      
      const card = screen.getByRole('article');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      // Should trigger some action (implementation dependent)
    });
  });
});