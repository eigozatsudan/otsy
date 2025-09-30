/**
 * E2E tests for cost splitting calculation workflows
 */

import { test, expect } from '@playwright/test';
import { 
  AuthHelpers, 
  GroupHelpers, 
  ShoppingListHelpers, 
  PurchaseHelpers,
  UtilityHelpers 
} from './helpers/test-helpers';
import { testUsers, testScenarios } from './fixtures/test-data';

test.describe('Cost Splitting Calculations', () => {
  let authHelpers: AuthHelpers;
  let groupHelpers: GroupHelpers;
  let shoppingHelpers: ShoppingListHelpers;
  let purchaseHelpers: PurchaseHelpers;
  let utilityHelpers: UtilityHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    groupHelpers = new GroupHelpers(page);
    shoppingHelpers = new ShoppingListHelpers(page);
    purchaseHelpers = new PurchaseHelpers(page);
    utilityHelpers = new UtilityHelpers(page);
  });

  test.describe('Purchase Recording', () => {
    test('should record purchase with receipt', async ({ page }) => {
      // Setup group and items
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Purchase Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items to purchase
      await shoppingHelpers.addItem({ name: 'Milk', category: 'Dairy', quantity: 2 });
      await shoppingHelpers.addItem({ name: 'Bread', category: 'Bakery', quantity: 1 });

      // Record purchase
      await purchaseHelpers.recordPurchase(['Milk', 'Bread'], 8.50);

      // Verify purchase was recorded
      await expect(page.locator('[data-testid="purchase-recorded-message"]')).toContainText('Purchase recorded successfully');
      
      // Verify items are marked as purchased
      await expect(page.locator('[data-testid="item-Milk"] [data-testid="item-status"]')).toContainText('purchased');
      await expect(page.locator('[data-testid="item-Bread"] [data-testid="item-status"]')).toContainText('purchased');
    });

    test('should validate purchase amount', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Validation Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      await shoppingHelpers.addItem({ name: 'Test Item', category: 'Test' });

      // Try to record purchase with invalid amount
      await page.click('[data-testid="record-purchase-button"]');
      await page.check('[data-testid="purchase-item-Test Item"]');
      await page.fill('[data-testid="purchase-amount-input"]', '-5.00');
      await page.click('[data-testid="record-purchase-submit"]');

      // Verify validation error
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('Amount must be greater than 0');
    });

    test('should require at least one item selection', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Item Selection Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      await shoppingHelpers.addItem({ name: 'Test Item', category: 'Test' });

      // Try to record purchase without selecting items
      await page.click('[data-testid="record-purchase-button"]');
      await page.fill('[data-testid="purchase-amount-input"]', '10.00');
      await page.click('[data-testid="record-purchase-submit"]');

      // Verify validation error
      await expect(page.locator('[data-testid="items-error"]')).toContainText('Please select at least one item');
    });
  });

  test.describe('Equal Split Calculations', () => {
    test('should calculate equal splits correctly', async ({ page, context }) => {
      // Setup group with multiple members
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Equal Split Test' });
      
      // Add second member
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Back to first user for purchase
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Equal Split Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items and record purchase
      await shoppingHelpers.addItem({ name: 'Shared Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Shared Item'], 30.00);

      // Set equal split method
      await purchaseHelpers.setSplitMethod('equal');
      await purchaseHelpers.calculateSplits();

      // Verify equal split calculation (30.00 / 2 = 15.00 each)
      const user1Split = await purchaseHelpers.getSplitAmount(testUsers[0].id);
      const user2Split = await purchaseHelpers.getSplitAmount(testUsers[1].id);

      expect(user1Split).toBe(15.00);
      expect(user2Split).toBe(15.00);

      await utilityHelpers.takeScreenshot('equal-split-calculation');
    });

    test('should handle remainder distribution in equal splits', async ({ page, context }) => {
      // Setup group with 3 members
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Remainder Test' });
      
      // Add two more members
      for (let i = 1; i < 3; i++) {
        await authHelpers.logout();
        await authHelpers.login(testUsers[i]);
        await page.goto('/dashboard');
        await groupHelpers.joinGroup(inviteCode);
      }

      // Back to first user
      await authHelpers.logout();
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Remainder Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Record purchase with amount that doesn't divide evenly
      await shoppingHelpers.addItem({ name: 'Remainder Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Remainder Item'], 10.01);

      await purchaseHelpers.setSplitMethod('equal');
      await purchaseHelpers.calculateSplits();

      // Verify remainder distribution (10.01 / 3 = 3.34, 3.34, 3.33)
      const splits = [
        await purchaseHelpers.getSplitAmount(testUsers[0].id),
        await purchaseHelpers.getSplitAmount(testUsers[1].id),
        await purchaseHelpers.getSplitAmount(testUsers[2].id),
      ];

      // Total should equal original amount
      const total = splits.reduce((sum, split) => sum + split, 0);
      expect(Math.abs(total - 10.01)).toBeLessThan(0.01);

      // Verify proper remainder distribution
      expect(splits.filter(split => split === 3.34)).toHaveLength(2);
      expect(splits.filter(split => split === 3.33)).toHaveLength(1);
    });
  });

  test.describe('Quantity-Based Split Calculations', () => {
    test('should calculate quantity-based splits correctly', async ({ page, context }) => {
      // Setup group with multiple members
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Quantity Split Test' });
      
      // Add second member
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Back to first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Quantity Split Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items with different quantities
      await shoppingHelpers.addItem({ name: 'Item A', category: 'Test', quantity: 2 });
      await shoppingHelpers.addItem({ name: 'Item B', category: 'Test', quantity: 4 });

      // Record purchase
      await purchaseHelpers.recordPurchase(['Item A', 'Item B'], 24.00);

      // Set quantity-based split
      await purchaseHelpers.setSplitMethod('quantity');
      await purchaseHelpers.calculateSplits();

      // Verify quantity-based calculation
      // Total quantity: 6 items, User 1: 2 items (33.33%), User 2: 4 items (66.67%)
      // $24.00 * 33.33% = $8.00, $24.00 * 66.67% = $16.00
      const user1Split = await purchaseHelpers.getSplitAmount(testUsers[0].id);
      const user2Split = await purchaseHelpers.getSplitAmount(testUsers[1].id);

      expect(Math.abs(user1Split - 8.00)).toBeLessThan(0.01);
      expect(Math.abs(user2Split - 16.00)).toBeLessThan(0.01);
    });

    test('should handle zero quantity items in quantity splits', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Zero Quantity Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add item with zero quantity
      await shoppingHelpers.addItem({ name: 'Zero Item', category: 'Test', quantity: 0 });
      await purchaseHelpers.recordPurchase(['Zero Item'], 10.00);

      await purchaseHelpers.setSplitMethod('quantity');

      // Should show warning about zero quantities
      await expect(page.locator('[data-testid="zero-quantity-warning"]')).toContainText('Items with zero quantity will be excluded from quantity-based splits');
    });
  });

  test.describe('Custom Split Calculations', () => {
    test('should calculate custom percentage splits', async ({ page, context }) => {
      // Setup group with multiple members
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Custom Split Test' });
      
      // Add second member
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Back to first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Custom Split Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Record purchase
      await shoppingHelpers.addItem({ name: 'Custom Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Custom Item'], 50.00);

      // Set custom split (60% / 40%)
      await purchaseHelpers.setSplitMethod('custom');
      await purchaseHelpers.setCustomSplit(testUsers[0].id, 60);
      await purchaseHelpers.setCustomSplit(testUsers[1].id, 40);
      await purchaseHelpers.calculateSplits();

      // Verify custom split calculation
      const user1Split = await purchaseHelpers.getSplitAmount(testUsers[0].id);
      const user2Split = await purchaseHelpers.getSplitAmount(testUsers[1].id);

      expect(user1Split).toBe(30.00); // 50.00 * 60%
      expect(user2Split).toBe(20.00); // 50.00 * 40%
    });

    test('should validate custom split percentages', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Custom Validation Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      await shoppingHelpers.addItem({ name: 'Validation Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Validation Item'], 25.00);

      // Set custom split with invalid percentages (total > 100%)
      await purchaseHelpers.setSplitMethod('custom');
      await purchaseHelpers.setCustomSplit(testUsers[0].id, 70);
      await purchaseHelpers.setCustomSplit(testUsers[1].id, 50);

      // Try to calculate splits
      await page.click('[data-testid="calculate-splits-button"]');

      // Verify validation error
      await expect(page.locator('[data-testid="percentage-error"]')).toContainText('Total percentage must equal 100%');
    });

    test('should auto-adjust remaining percentage', async ({ page, context }) => {
      // Setup group with 3 members
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Auto Adjust Test' });
      
      // Add two more members
      for (let i = 1; i < 3; i++) {
        await authHelpers.logout();
        await authHelpers.login(testUsers[i]);
        await page.goto('/dashboard');
        await groupHelpers.joinGroup(inviteCode);
      }

      // Back to first user
      await authHelpers.logout();
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Auto Adjust Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      await shoppingHelpers.addItem({ name: 'Auto Adjust Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Auto Adjust Item'], 30.00);

      // Set custom split for first two users, leave third auto-calculated
      await purchaseHelpers.setSplitMethod('custom');
      await purchaseHelpers.setCustomSplit(testUsers[0].id, 40);
      await purchaseHelpers.setCustomSplit(testUsers[1].id, 30);
      
      // Third user should auto-adjust to 30%
      await expect(page.locator(`[data-testid="custom-split-${testUsers[2].id}"]`)).toHaveValue('30');
    });
  });

  test.describe('Complex Splitting Scenarios', () => {
    test('should handle cost splitting scenario from test data', async ({ page, context }) => {
      const scenario = testScenarios.costSplitting;
      
      // Setup group with all users
      await authHelpers.login(scenario.users[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Complex Splitting Test' });
      
      // Add all users to group
      for (let i = 1; i < scenario.users.length; i++) {
        await authHelpers.logout();
        await authHelpers.login(scenario.users[i]);
        await page.goto('/dashboard');
        await groupHelpers.joinGroup(inviteCode);
      }

      // Back to first user
      await authHelpers.logout();
      await authHelpers.login(scenario.users[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Complex Splitting Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Test each purchase scenario
      for (const purchase of scenario.purchases) {
        await shoppingHelpers.addItem({ 
          name: `Item for ${purchase.description}`, 
          category: 'Test' 
        });

        await purchaseHelpers.recordPurchase([`Item for ${purchase.description}`], purchase.amount);

        // Set appropriate split method
        await purchaseHelpers.setSplitMethod(purchase.splitType);

        if (purchase.splitType === 'quantity' && purchase.quantities) {
          // Set quantities for quantity-based split
          for (let i = 0; i < purchase.quantities.length; i++) {
            await page.fill(`[data-testid="quantity-${scenario.users[i].id}"]`, purchase.quantities[i].toString());
          }
        } else if (purchase.splitType === 'custom' && purchase.percentages) {
          // Set percentages for custom split
          for (let i = 0; i < purchase.percentages.length; i++) {
            await purchaseHelpers.setCustomSplit(scenario.users[i].id, purchase.percentages[i]);
          }
        }

        await purchaseHelpers.calculateSplits();

        // Verify expected splits
        for (let i = 0; i < purchase.expectedSplits.length; i++) {
          const actualSplit = await purchaseHelpers.getSplitAmount(scenario.users[i].id);
          expect(Math.abs(actualSplit - purchase.expectedSplits[i])).toBeLessThan(0.01);
        }

        await purchaseHelpers.confirmSplits();
        await utilityHelpers.takeScreenshot(`${purchase.splitType}-split-confirmed`);
      }
    });

    test('should handle multiple purchases with different split methods', async ({ page, context }) => {
      // Setup group
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Multiple Purchases Test' });
      
      // Add second member
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Back to first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Multiple Purchases Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // First purchase - equal split
      await shoppingHelpers.addItem({ name: 'Equal Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Equal Item'], 20.00);
      await purchaseHelpers.setSplitMethod('equal');
      await purchaseHelpers.calculateSplits();
      await purchaseHelpers.confirmSplits();

      // Second purchase - custom split
      await shoppingHelpers.addItem({ name: 'Custom Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Custom Item'], 30.00);
      await purchaseHelpers.setSplitMethod('custom');
      await purchaseHelpers.setCustomSplit(testUsers[0].id, 70);
      await purchaseHelpers.setCustomSplit(testUsers[1].id, 30);
      await purchaseHelpers.calculateSplits();
      await purchaseHelpers.confirmSplits();

      // Verify settlement summary shows combined totals
      await page.click('[data-testid="view-settlement-summary"]');
      
      // User 1 owes: $10 (equal) + $21 (custom) = $31
      // User 2 owes: $10 (equal) + $9 (custom) = $19
      const user1Total = await page.textContent(`[data-testid="settlement-total-${testUsers[0].id}"]`);
      const user2Total = await page.textContent(`[data-testid="settlement-total-${testUsers[1].id}"]`);
      
      expect(user1Total).toContain('$31.00');
      expect(user2Total).toContain('$19.00');
    });
  });

  test.describe('Settlement and Payment Tracking', () => {
    test('should show settlement summary', async ({ page, context }) => {
      // Setup and create purchases
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Settlement Test' });
      
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Settlement Test');
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Record purchase
      await shoppingHelpers.addItem({ name: 'Settlement Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Settlement Item'], 40.00);
      await purchaseHelpers.setSplitMethod('equal');
      await purchaseHelpers.calculateSplits();
      await purchaseHelpers.confirmSplits();

      // View settlement summary
      await page.click('[data-testid="view-settlement-summary"]');

      // Verify settlement details
      await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-spent"]')).toContainText('$40.00');
      await expect(page.locator('[data-testid="your-share"]')).toContainText('$20.00');
      
      // Since user 1 paid $40 but owes $20, they should be owed $20
      await expect(page.locator('[data-testid="amount-owed-to-you"]')).toContainText('$20.00');
    });

    test('should mark settlements as paid', async ({ page }) => {
      // Setup settlement scenario
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Payment Tracking Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Create scenario where user owes money
      await shoppingHelpers.addItem({ name: 'Payment Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Payment Item'], 30.00);
      await purchaseHelpers.setSplitMethod('custom');
      await purchaseHelpers.setCustomSplit(testUsers[0].id, 100); // User 1 pays nothing
      await purchaseHelpers.calculateSplits();
      await purchaseHelpers.confirmSplits();

      // Mark payment as made
      await page.click('[data-testid="view-settlement-summary"]');
      await page.click('[data-testid="mark-payment-made"]');
      await page.fill('[data-testid="payment-amount"]', '30.00');
      await page.click('[data-testid="confirm-payment"]');

      // Verify payment is recorded
      await expect(page.locator('[data-testid="payment-recorded"]')).toContainText('Payment of $30.00 recorded');
      await expect(page.locator('[data-testid="balance-owed"]')).toContainText('$0.00');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard accessible for cost splitting', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Keyboard Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      await shoppingHelpers.addItem({ name: 'Keyboard Item', category: 'Test' });

      // Test keyboard navigation through purchase recording
      await page.keyboard.press('Tab'); // Focus record purchase button
      await expect(page.locator('[data-testid="record-purchase-button"]')).toBeFocused();
      
      await page.keyboard.press('Enter'); // Open purchase modal
      await expect(page.locator('[data-testid="purchase-item-Keyboard Item"]')).toBeFocused();
      
      // Navigate through purchase form
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="purchase-amount-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="split-method-equal"]')).toBeFocused();
    });

    test('should announce split calculations to screen readers', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Screen Reader Split Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      await shoppingHelpers.addItem({ name: 'Announced Item', category: 'Test' });
      await purchaseHelpers.recordPurchase(['Announced Item'], 20.00);
      await purchaseHelpers.setSplitMethod('equal');
      await purchaseHelpers.calculateSplits();

      // Check for calculation announcement
      await expect(page.locator('[aria-live="polite"]')).toContainText('Split calculation completed');
    });
  });
});