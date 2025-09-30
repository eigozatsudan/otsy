/**
 * Test helper functions for E2E tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { TestUser, TestGroup, TestItem } from '../fixtures/test-data';

/**
 * Authentication helpers
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  async login(user: TestUser): Promise<void> {
    await this.page.goto('/login');
    
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/');
  }

  async register(user: TestUser): Promise<void> {
    await this.page.goto('/register');
    
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="display-name-input"]', user.displayName);
    await this.page.fill('[data-testid="password-input"]', user.password);
    await this.page.fill('[data-testid="confirm-password-input"]', user.password);
    await this.page.click('[data-testid="register-button"]');
    
    // Wait for successful registration
    await this.page.waitForURL('/dashboard');
  }
}

/**
 * Group management helpers
 */
export class GroupHelpers {
  constructor(private page: Page) {}

  async createGroup(group: Partial<TestGroup>): Promise<string> {
    await this.page.click('[data-testid="create-group-button"]');
    
    await this.page.fill('[data-testid="group-name-input"]', group.name || 'Test Group');
    if (group.description) {
      await this.page.fill('[data-testid="group-description-input"]', group.description);
    }
    
    await this.page.click('[data-testid="create-group-submit"]');
    
    // Wait for group creation and get invite code
    await this.page.waitForSelector('[data-testid="invite-code"]');
    const inviteCode = await this.page.textContent('[data-testid="invite-code"]');
    
    return inviteCode || '';
  }

  async joinGroup(inviteCode: string): Promise<void> {
    await this.page.click('[data-testid="join-group-button"]');
    await this.page.fill('[data-testid="invite-code-input"]', inviteCode);
    await this.page.click('[data-testid="join-group-submit"]');
    
    // Wait for successful join
    await expect(this.page.locator('[data-testid="group-joined-message"]')).toBeVisible();
  }

  async selectGroup(groupName: string): Promise<void> {
    await this.page.click(`[data-testid="group-selector"]`);
    await this.page.click(`[data-testid="group-option-${groupName}"]`);
    
    // Wait for group to be selected
    await expect(this.page.locator(`[data-testid="current-group-name"]`)).toContainText(groupName);
  }

  async getInviteCode(): Promise<string> {
    await this.page.click('[data-testid="group-settings-button"]');
    await this.page.click('[data-testid="invite-members-tab"]');
    
    const inviteCode = await this.page.textContent('[data-testid="invite-code"]');
    return inviteCode || '';
  }

  async leaveGroup(): Promise<void> {
    await this.page.click('[data-testid="group-settings-button"]');
    await this.page.click('[data-testid="leave-group-button"]');
    await this.page.click('[data-testid="confirm-leave-group"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
  }
}

/**
 * Shopping list helpers
 */
export class ShoppingListHelpers {
  constructor(private page: Page) {}

  async addItem(item: Partial<TestItem>): Promise<void> {
    await this.page.click('[data-testid="add-item-button"]');
    
    await this.page.fill('[data-testid="item-name-input"]', item.name || 'Test Item');
    await this.page.fill('[data-testid="item-category-input"]', item.category || 'Test Category');
    
    if (item.quantity) {
      await this.page.fill('[data-testid="item-quantity-input"]', item.quantity.toString());
    }
    
    if (item.notes) {
      await this.page.fill('[data-testid="item-notes-input"]', item.notes);
    }
    
    await this.page.click('[data-testid="add-item-submit"]');
    
    // Wait for item to appear in list
    await expect(this.page.locator(`[data-testid="item-${item.name}"]`)).toBeVisible();
  }

  async markItemAsPurchased(itemName: string): Promise<void> {
    const itemLocator = this.page.locator(`[data-testid="item-${itemName}"]`);
    await itemLocator.locator('[data-testid="mark-purchased-button"]').click();
    
    // Wait for status change
    await expect(itemLocator.locator('[data-testid="item-status"]')).toContainText('purchased');
  }

  async markItemAsCancelled(itemName: string): Promise<void> {
    const itemLocator = this.page.locator(`[data-testid="item-${itemName}"]`);
    await itemLocator.locator('[data-testid="mark-cancelled-button"]').click();
    
    // Wait for status change
    await expect(itemLocator.locator('[data-testid="item-status"]')).toContainText('cancelled');
  }

  async editItem(itemName: string, updates: Partial<TestItem>): Promise<void> {
    const itemLocator = this.page.locator(`[data-testid="item-${itemName}"]`);
    await itemLocator.locator('[data-testid="edit-item-button"]').click();
    
    if (updates.name) {
      await this.page.fill('[data-testid="edit-item-name"]', updates.name);
    }
    
    if (updates.quantity) {
      await this.page.fill('[data-testid="edit-item-quantity"]', updates.quantity.toString());
    }
    
    if (updates.notes) {
      await this.page.fill('[data-testid="edit-item-notes"]', updates.notes);
    }
    
    await this.page.click('[data-testid="save-item-changes"]');
    
    // Wait for changes to be saved
    await expect(this.page.locator('[data-testid="item-updated-message"]')).toBeVisible();
  }

  async deleteItem(itemName: string): Promise<void> {
    const itemLocator = this.page.locator(`[data-testid="item-${itemName}"]`);
    await itemLocator.locator('[data-testid="delete-item-button"]').click();
    await this.page.click('[data-testid="confirm-delete-item"]');
    
    // Wait for item to be removed
    await expect(itemLocator).not.toBeVisible();
  }

  async getItemCount(): Promise<number> {
    const items = await this.page.locator('[data-testid^="item-"]').count();
    return items;
  }

  async getItemsByStatus(status: 'todo' | 'purchased' | 'cancelled'): Promise<string[]> {
    const items = await this.page.locator(`[data-testid*="item-"][data-status="${status}"]`).all();
    const itemNames: string[] = [];
    
    for (const item of items) {
      const name = await item.getAttribute('data-item-name');
      if (name) itemNames.push(name);
    }
    
    return itemNames;
  }
}

/**
 * Purchase and cost splitting helpers
 */
export class PurchaseHelpers {
  constructor(private page: Page) {}

  async recordPurchase(items: string[], amount: number, receiptFile?: string): Promise<void> {
    await this.page.click('[data-testid="record-purchase-button"]');
    
    // Select items
    for (const itemName of items) {
      await this.page.check(`[data-testid="purchase-item-${itemName}"]`);
    }
    
    // Enter amount
    await this.page.fill('[data-testid="purchase-amount-input"]', amount.toString());
    
    // Upload receipt if provided
    if (receiptFile) {
      await this.page.setInputFiles('[data-testid="receipt-upload"]', receiptFile);
    }
    
    await this.page.click('[data-testid="record-purchase-submit"]');
    
    // Wait for purchase to be recorded
    await expect(this.page.locator('[data-testid="purchase-recorded-message"]')).toBeVisible();
  }

  async setSplitMethod(method: 'equal' | 'quantity' | 'custom'): Promise<void> {
    await this.page.click(`[data-testid="split-method-${method}"]`);
  }

  async setCustomSplit(userId: string, percentage: number): Promise<void> {
    await this.page.fill(`[data-testid="custom-split-${userId}"]`, percentage.toString());
  }

  async calculateSplits(): Promise<void> {
    await this.page.click('[data-testid="calculate-splits-button"]');
    
    // Wait for calculation to complete
    await expect(this.page.locator('[data-testid="splits-calculated"]')).toBeVisible();
  }

  async getSplitAmount(userId: string): Promise<number> {
    const amountText = await this.page.textContent(`[data-testid="split-amount-${userId}"]`);
    return parseFloat(amountText?.replace('$', '') || '0');
  }

  async confirmSplits(): Promise<void> {
    await this.page.click('[data-testid="confirm-splits-button"]');
    
    // Wait for confirmation
    await expect(this.page.locator('[data-testid="splits-confirmed-message"]')).toBeVisible();
  }
}

/**
 * Chat and messaging helpers
 */
export class ChatHelpers {
  constructor(private page: Page) {}

  async sendMessage(content: string, itemId?: string): Promise<void> {
    if (itemId) {
      // Switch to item-specific thread
      await this.page.click(`[data-testid="item-thread-${itemId}"]`);
    }
    
    await this.page.fill('[data-testid="message-input"]', content);
    await this.page.click('[data-testid="send-message-button"]');
    
    // Wait for message to appear
    await expect(this.page.locator(`[data-testid*="message-"]:has-text("${content}")`)).toBeVisible();
  }

  async sendImageMessage(imagePath: string, caption?: string): Promise<void> {
    await this.page.setInputFiles('[data-testid="image-upload"]', imagePath);
    
    if (caption) {
      await this.page.fill('[data-testid="image-caption"]', caption);
    }
    
    await this.page.click('[data-testid="send-image-button"]');
    
    // Wait for image message to appear
    await expect(this.page.locator('[data-testid*="message-image-"]')).toBeVisible();
  }

  async mentionUser(username: string): Promise<void> {
    await this.page.fill('[data-testid="message-input"]', `@${username} `);
    
    // Wait for mention dropdown and select user
    await this.page.click(`[data-testid="mention-option-${username}"]`);
  }

  async getMessageCount(): Promise<number> {
    return await this.page.locator('[data-testid^="message-"]').count();
  }

  async getLastMessage(): Promise<string> {
    const messages = this.page.locator('[data-testid^="message-"]');
    const lastMessage = messages.last();
    return await lastMessage.textContent() || '';
  }
}

/**
 * Accessibility helpers
 */
export class AccessibilityHelpers {
  constructor(private page: Page) {}

  async checkKeyboardNavigation(startElement: string, expectedElements: string[]): Promise<void> {
    await this.page.focus(startElement);
    
    for (const element of expectedElements) {
      await this.page.keyboard.press('Tab');
      await expect(this.page.locator(element)).toBeFocused();
    }
  }

  async checkAriaLabels(elements: { selector: string; expectedLabel: string }[]): Promise<void> {
    for (const { selector, expectedLabel } of elements) {
      const element = this.page.locator(selector);
      await expect(element).toHaveAttribute('aria-label', expectedLabel);
    }
  }

  async checkColorContrast(selector: string): Promise<void> {
    // This would integrate with axe-core or similar accessibility testing tools
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    
    // In a real implementation, you would use axe-core to check contrast ratios
    // For now, we'll just verify the element is visible
  }

  async checkScreenReaderAnnouncements(): Promise<void> {
    // Check for aria-live regions
    await expect(this.page.locator('[aria-live="polite"]')).toBeAttached();
    await expect(this.page.locator('[aria-live="assertive"]')).toBeAttached();
  }
}

/**
 * Real-time updates helpers
 */
export class RealTimeHelpers {
  constructor(private page: Page) {}

  async waitForRealTimeConnection(): Promise<void> {
    // Wait for SSE connection to be established
    await expect(this.page.locator('[data-testid="connection-status-connected"]')).toBeVisible();
  }

  async waitForItemUpdate(itemName: string, expectedStatus: string): Promise<void> {
    const itemLocator = this.page.locator(`[data-testid="item-${itemName}"]`);
    await expect(itemLocator.locator('[data-testid="item-status"]')).toContainText(expectedStatus);
  }

  async waitForNewMessage(messageContent: string): Promise<void> {
    await expect(this.page.locator(`[data-testid*="message-"]:has-text("${messageContent}")`)).toBeVisible();
  }

  async waitForMemberUpdate(memberName: string, action: 'joined' | 'left'): Promise<void> {
    const expectedText = action === 'joined' ? `${memberName} joined the group` : `${memberName} left the group`;
    await expect(this.page.locator(`[data-testid="member-update"]:has-text("${expectedText}")`)).toBeVisible();
  }
}

/**
 * General utility helpers
 */
export class UtilityHelpers {
  constructor(private page: Page) {}

  async waitForLoadingToComplete(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async waitForToast(message: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="toast"]:has-text("${message}")`)).toBeVisible();
  }

  async dismissToast(): Promise<void> {
    await this.page.click('[data-testid="toast-dismiss"]');
    await expect(this.page.locator('[data-testid="toast"]')).not.toBeVisible();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  async refresh(): Promise<void> {
    await this.page.reload();
  }
}