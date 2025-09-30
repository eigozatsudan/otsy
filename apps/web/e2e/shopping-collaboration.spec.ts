/**
 * E2E tests for shopping list collaboration workflows
 */

import { test, expect } from '@playwright/test';
import { 
  AuthHelpers, 
  GroupHelpers, 
  ShoppingListHelpers, 
  RealTimeHelpers,
  UtilityHelpers 
} from './helpers/test-helpers';
import { testUsers, testScenarios } from './fixtures/test-data';

test.describe('Shopping List Collaboration', () => {
  let authHelpers: AuthHelpers;
  let groupHelpers: GroupHelpers;
  let shoppingHelpers: ShoppingListHelpers;
  let realTimeHelpers: RealTimeHelpers;
  let utilityHelpers: UtilityHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    groupHelpers = new GroupHelpers(page);
    shoppingHelpers = new ShoppingListHelpers(page);
    realTimeHelpers = new RealTimeHelpers(page);
    utilityHelpers = new UtilityHelpers(page);
  });

  test.describe('Item Management', () => {
    test('should add items to shopping list', async ({ page }) => {
      // Setup: Login and create/join group
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ 
        name: 'Grocery Shopping',
        description: 'Weekly grocery list'
      });

      // Navigate to shopping list
      await page.goto(`/groups/${inviteCode}/shopping`);
      await utilityHelpers.waitForLoadingToComplete();

      // Add multiple items
      const items = [
        { name: 'Milk', category: 'Dairy', quantity: 2, notes: 'Organic preferred' },
        { name: 'Bread', category: 'Bakery', quantity: 1, notes: 'Whole wheat' },
        { name: 'Apples', category: 'Produce', quantity: 6 },
      ];

      for (const item of items) {
        await shoppingHelpers.addItem(item);
        
        // Verify item appears in list
        await expect(page.locator(`[data-testid="item-${item.name}"]`)).toBeVisible();
        await expect(page.locator(`[data-testid="item-${item.name}"] [data-testid="item-category"]`)).toContainText(item.category);
        await expect(page.locator(`[data-testid="item-${item.name}"] [data-testid="item-quantity"]`)).toContainText(item.quantity.toString());
      }

      // Verify total item count
      const itemCount = await shoppingHelpers.getItemCount();
      expect(itemCount).toBe(items.length);

      await utilityHelpers.takeScreenshot('shopping-list-with-items');
    });

    test('should edit existing items', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Edit Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add initial item
      await shoppingHelpers.addItem({ name: 'Original Item', category: 'Test', quantity: 1 });

      // Edit the item
      await shoppingHelpers.editItem('Original Item', {
        name: 'Updated Item',
        quantity: 3,
        notes: 'Updated notes'
      });

      // Verify changes
      await expect(page.locator('[data-testid="item-Updated Item"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-Updated Item"] [data-testid="item-quantity"]')).toContainText('3');
      await expect(page.locator('[data-testid="item-Updated Item"] [data-testid="item-notes"]')).toContainText('Updated notes');
    });

    test('should delete items from list', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Delete Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items
      await shoppingHelpers.addItem({ name: 'Item to Keep', category: 'Test' });
      await shoppingHelpers.addItem({ name: 'Item to Delete', category: 'Test' });

      // Verify both items exist
      expect(await shoppingHelpers.getItemCount()).toBe(2);

      // Delete one item
      await shoppingHelpers.deleteItem('Item to Delete');

      // Verify item was removed
      expect(await shoppingHelpers.getItemCount()).toBe(1);
      await expect(page.locator('[data-testid="item-Item to Keep"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-Item to Delete"]')).not.toBeVisible();
    });

    test('should categorize items properly', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Category Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items in different categories
      const categorizedItems = [
        { name: 'Milk', category: 'Dairy' },
        { name: 'Cheese', category: 'Dairy' },
        { name: 'Bread', category: 'Bakery' },
        { name: 'Apples', category: 'Produce' },
      ];

      for (const item of categorizedItems) {
        await shoppingHelpers.addItem(item);
      }

      // Verify items are grouped by category
      await expect(page.locator('[data-testid="category-Dairy"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-Dairy"] [data-testid^="item-"]')).toHaveCount(2);
      
      await expect(page.locator('[data-testid="category-Bakery"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-Bakery"] [data-testid^="item-"]')).toHaveCount(1);
      
      await expect(page.locator('[data-testid="category-Produce"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-Produce"] [data-testid^="item-"]')).toHaveCount(1);
    });
  });

  test.describe('Item Status Management', () => {
    test('should mark items as purchased', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Purchase Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items
      await shoppingHelpers.addItem({ name: 'Test Item 1', category: 'Test' });
      await shoppingHelpers.addItem({ name: 'Test Item 2', category: 'Test' });

      // Mark first item as purchased
      await shoppingHelpers.markItemAsPurchased('Test Item 1');

      // Verify status change
      const purchasedItems = await shoppingHelpers.getItemsByStatus('purchased');
      expect(purchasedItems).toContain('Test Item 1');
      
      const todoItems = await shoppingHelpers.getItemsByStatus('todo');
      expect(todoItems).toContain('Test Item 2');
      expect(todoItems).not.toContain('Test Item 1');
    });

    test('should mark items as cancelled', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Cancel Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add item
      await shoppingHelpers.addItem({ name: 'Cancellable Item', category: 'Test' });

      // Mark as cancelled
      await shoppingHelpers.markItemAsCancelled('Cancellable Item');

      // Verify status
      const cancelledItems = await shoppingHelpers.getItemsByStatus('cancelled');
      expect(cancelledItems).toContain('Cancellable Item');
    });

    test('should restore cancelled items', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Restore Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add and cancel item
      await shoppingHelpers.addItem({ name: 'Restorable Item', category: 'Test' });
      await shoppingHelpers.markItemAsCancelled('Restorable Item');

      // Restore item
      const itemLocator = page.locator('[data-testid="item-Restorable Item"]');
      await itemLocator.locator('[data-testid="restore-item-button"]').click();

      // Verify restoration
      const todoItems = await shoppingHelpers.getItemsByStatus('todo');
      expect(todoItems).toContain('Restorable Item');
    });
  });

  test.describe('Real-time Collaboration', () => {
    test('should sync item changes across multiple users', async ({ page, context }) => {
      // Setup: Create group with first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Real-time Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);
      
      // Wait for real-time connection
      await realTimeHelpers.waitForRealTimeConnection();

      // Open second browser context for second user
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();
      
      if (secondPage) {
        const secondAuthHelpers = new AuthHelpers(secondPage);
        const secondGroupHelpers = new GroupHelpers(secondPage);
        const secondShoppingHelpers = new ShoppingListHelpers(secondPage);
        const secondRealTimeHelpers = new RealTimeHelpers(secondPage);

        // Second user joins group
        await secondAuthHelpers.login(testUsers[1]);
        await secondPage.goto('/dashboard');
        await secondGroupHelpers.joinGroup(inviteCode);
        await secondPage.goto(`/groups/${inviteCode}/shopping`);
        await secondRealTimeHelpers.waitForRealTimeConnection();

        // First user adds item
        await shoppingHelpers.addItem({ name: 'Collaborative Item', category: 'Test' });

        // Second user should see the item appear
        await expect(secondPage.locator('[data-testid="item-Collaborative Item"]')).toBeVisible();

        // Second user marks item as purchased
        await secondShoppingHelpers.markItemAsPurchased('Collaborative Item');

        // First user should see status change
        await realTimeHelpers.waitForItemUpdate('Collaborative Item', 'purchased');

        await secondContext?.close();
      }
    });

    test('should handle concurrent item additions', async ({ page, context }) => {
      // Setup group with multiple users
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Concurrent Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);
      await realTimeHelpers.waitForRealTimeConnection();

      // Second user context
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();
      
      if (secondPage) {
        const secondAuthHelpers = new AuthHelpers(secondPage);
        const secondGroupHelpers = new GroupHelpers(secondPage);
        const secondShoppingHelpers = new ShoppingListHelpers(secondPage);

        await secondAuthHelpers.login(testUsers[1]);
        await secondPage.goto('/dashboard');
        await secondGroupHelpers.joinGroup(inviteCode);
        await secondPage.goto(`/groups/${inviteCode}/shopping`);

        // Both users add items simultaneously
        const [, ] = await Promise.all([
          shoppingHelpers.addItem({ name: 'User 1 Item', category: 'Test' }),
          secondShoppingHelpers.addItem({ name: 'User 2 Item', category: 'Test' }),
        ]);

        // Both items should appear for both users
        await expect(page.locator('[data-testid="item-User 1 Item"]')).toBeVisible();
        await expect(page.locator('[data-testid="item-User 2 Item"]')).toBeVisible();
        
        await expect(secondPage.locator('[data-testid="item-User 1 Item"]')).toBeVisible();
        await expect(secondPage.locator('[data-testid="item-User 2 Item"]')).toBeVisible();

        await secondContext?.close();
      }
    });

    test('should show connection status', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Connection Status Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Verify connection status indicator
      await expect(page.locator('[data-testid="connection-status-connected"]')).toBeVisible();
      
      // Test reconnection functionality
      await page.click('[data-testid="connection-status-reconnect"]');
      await expect(page.locator('[data-testid="connection-status-connecting"]')).toBeVisible();
      await expect(page.locator('[data-testid="connection-status-connected"]')).toBeVisible();
    });
  });

  test.describe('Complex Collaboration Scenarios', () => {
    test('should handle complete shopping workflow', async ({ page }) => {
      const scenario = testScenarios.completeShoppingWorkflow;
      
      await authHelpers.login(scenario.users[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({
        name: scenario.group.name,
        description: scenario.group.description
      });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add all items from scenario
      for (const item of scenario.items) {
        await shoppingHelpers.addItem(item);
      }

      // Verify all items were added
      expect(await shoppingHelpers.getItemCount()).toBe(scenario.items.length);

      // Mark some items as purchased
      await shoppingHelpers.markItemAsPurchased('Milk');
      await shoppingHelpers.markItemAsPurchased('Eggs');

      // Verify status changes
      const purchasedItems = await shoppingHelpers.getItemsByStatus('purchased');
      expect(purchasedItems).toContain('Milk');
      expect(purchasedItems).toContain('Eggs');

      // Take final screenshot
      await utilityHelpers.takeScreenshot('complete-shopping-workflow');
    });

    test('should handle group collaboration scenario', async ({ page, context }) => {
      const scenario = testScenarios.groupCollaboration;
      
      // Setup group with multiple users
      await authHelpers.login(scenario.users[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({
        name: scenario.group.name,
        description: scenario.group.description
      });

      // Add all users to group
      for (let i = 1; i < scenario.users.length; i++) {
        await authHelpers.logout();
        await authHelpers.login(scenario.users[i]);
        await page.goto('/dashboard');
        await groupHelpers.joinGroup(inviteCode);
      }

      // Back to first user for item management
      await authHelpers.logout();
      await authHelpers.login(scenario.users[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup(scenario.group.name);
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items collaboratively
      for (const item of scenario.items) {
        await shoppingHelpers.addItem(item);
      }

      // Verify collaborative setup
      expect(await shoppingHelpers.getItemCount()).toBe(scenario.items.length);
      
      // Verify different categories are represented
      await expect(page.locator('[data-testid="category-Bakery"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-Meat"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-Dairy"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-Produce"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Accessibility Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Test keyboard navigation through add item form
      await page.keyboard.press('Tab'); // Focus add item button
      await expect(page.locator('[data-testid="add-item-button"]')).toBeFocused();
      
      await page.keyboard.press('Enter'); // Open add item form
      await expect(page.locator('[data-testid="item-name-input"]')).toBeFocused();
      
      // Navigate through form fields
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="item-category-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="item-quantity-input"]')).toBeFocused();
    });

    test('should announce item changes to screen readers', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Screen Reader Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add item and verify announcement
      await shoppingHelpers.addItem({ name: 'Announced Item', category: 'Test' });
      
      // Check for aria-live announcement
      await expect(page.locator('[aria-live="polite"]')).toContainText('Announced Item added to shopping list');

      // Mark as purchased and verify announcement
      await shoppingHelpers.markItemAsPurchased('Announced Item');
      await expect(page.locator('[aria-live="polite"]')).toContainText('Announced Item was purchased');
    });

    test('should have proper ARIA labels for shopping list', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'ARIA Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Check ARIA labels on key elements
      await expect(page.locator('[data-testid="add-item-button"]')).toHaveAttribute('aria-label', 'Add new item to shopping list');
      await expect(page.locator('[data-testid="shopping-list"]')).toHaveAttribute('aria-label', 'Shopping list items');
      
      // Add item and check item-specific ARIA labels
      await shoppingHelpers.addItem({ name: 'ARIA Test Item', category: 'Test' });
      
      const itemLocator = page.locator('[data-testid="item-ARIA Test Item"]');
      await expect(itemLocator.locator('[data-testid="mark-purchased-button"]')).toHaveAttribute('aria-label', 'Mark ARIA Test Item as purchased');
      await expect(itemLocator.locator('[data-testid="edit-item-button"]')).toHaveAttribute('aria-label', 'Edit ARIA Test Item');
    });
  });
});