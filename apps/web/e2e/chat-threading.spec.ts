/**
 * E2E tests for chat and threading functionality
 */

import { test, expect } from '@playwright/test';
import { 
  AuthHelpers, 
  GroupHelpers, 
  ShoppingListHelpers, 
  ChatHelpers,
  RealTimeHelpers,
  UtilityHelpers 
} from './helpers/test-helpers';
import { testUsers, testScenarios } from './fixtures/test-data';

test.describe('Chat and Threading Functionality', () => {
  let authHelpers: AuthHelpers;
  let groupHelpers: GroupHelpers;
  let shoppingHelpers: ShoppingListHelpers;
  let chatHelpers: ChatHelpers;
  let realTimeHelpers: RealTimeHelpers;
  let utilityHelpers: UtilityHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    groupHelpers = new GroupHelpers(page);
    shoppingHelpers = new ShoppingListHelpers(page);
    chatHelpers = new ChatHelpers(page);
    realTimeHelpers = new RealTimeHelpers(page);
    utilityHelpers = new UtilityHelpers(page);
  });

  test.describe('Group Chat', () => {
    test('should send and receive messages in group chat', async ({ page }) => {
      // Setup group
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Chat Test Group' });
      await page.goto(`/groups/${inviteCode}/chat`);
      await realTimeHelpers.waitForRealTimeConnection();

      // Send message
      const messageContent = 'Hello everyone! This is a test message.';
      await chatHelpers.sendMessage(messageContent);

      // Verify message appears
      await expect(page.locator(`[data-testid*="message-"]:has-text("${messageContent}")`)).toBeVisible();
      
      // Verify message metadata
      const messageLocator = page.locator(`[data-testid*="message-"]:has-text("${messageContent}")`);
      await expect(messageLocator.locator('[data-testid="message-sender"]')).toContainText(testUsers[0].displayName);
      await expect(messageLocator.locator('[data-testid="message-timestamp"]')).toBeVisible();

      await utilityHelpers.takeScreenshot('group-chat-message');
    });

    test('should handle message history and pagination', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Message History Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Send multiple messages
      const messages = [
        'First message',
        'Second message',
        'Third message',
        'Fourth message',
        'Fifth message',
      ];

      for (const message of messages) {
        await chatHelpers.sendMessage(message);
        await page.waitForTimeout(100); // Small delay to ensure order
      }

      // Verify all messages are visible
      for (const message of messages) {
        await expect(page.locator(`[data-testid*="message-"]:has-text("${message}")`)).toBeVisible();
      }

      // Verify message order (newest at bottom)
      const messageElements = await page.locator('[data-testid^="message-"]').all();
      expect(messageElements.length).toBe(messages.length);

      // Check that last message is the most recent
      const lastMessageText = await messageElements[messageElements.length - 1].textContent();
      expect(lastMessageText).toContain('Fifth message');
    });

    test('should show typing indicators', async ({ page, context }) => {
      // Setup group with two users
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Typing Indicator Test' });
      
      // Add second user
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Back to first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Typing Indicator Test');
      await page.goto(`/groups/${inviteCode}/chat`);
      await realTimeHelpers.waitForRealTimeConnection();

      // Second user context
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();
      
      if (secondPage) {
        const secondAuthHelpers = new AuthHelpers(secondPage);
        const secondGroupHelpers = new GroupHelpers(secondPage);
        const secondChatHelpers = new ChatHelpers(secondPage);

        await secondAuthHelpers.login(testUsers[1]);
        await secondPage.goto('/dashboard');
        await secondGroupHelpers.selectGroup('Typing Indicator Test');
        await secondPage.goto(`/groups/${inviteCode}/chat`);

        // Second user starts typing
        await secondPage.fill('[data-testid="message-input"]', 'I am typing...');

        // First user should see typing indicator
        await expect(page.locator('[data-testid="typing-indicator"]')).toContainText(`${testUsers[1].displayName} is typing...`);

        // Second user stops typing (clears input)
        await secondPage.fill('[data-testid="message-input"]', '');

        // Typing indicator should disappear
        await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();

        await secondContext?.close();
      }
    });

    test('should handle @mentions with notifications', async ({ page, context }) => {
      // Setup group with multiple users
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Mention Test Group' });
      
      // Add second user
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Back to first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Mention Test Group');
      await page.goto(`/groups/${inviteCode}/chat`);

      // Send message with mention
      await chatHelpers.mentionUser(testUsers[1].displayName);
      await page.fill('[data-testid="message-input"]', `@${testUsers[1].displayName} Can you pick up milk?`);
      await page.click('[data-testid="send-message-button"]');

      // Verify mention is highlighted in message
      const messageLocator = page.locator(`[data-testid*="message-"]:has-text("Can you pick up milk?")`);
      await expect(messageLocator.locator('[data-testid="mention"]')).toContainText(`@${testUsers[1].displayName}`);

      // Second user should receive mention notification
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();
      
      if (secondPage) {
        const secondAuthHelpers = new AuthHelpers(secondPage);
        await secondAuthHelpers.login(testUsers[1]);
        await secondPage.goto('/dashboard');

        // Should see mention notification
        await expect(secondPage.locator('[data-testid="mention-notification"]')).toContainText('You were mentioned');
        
        await secondContext?.close();
      }
    });
  });

  test.describe('Item-Specific Threading', () => {
    test('should create and switch between item threads', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Threading Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items
      await shoppingHelpers.addItem({ name: 'Milk', category: 'Dairy' });
      await shoppingHelpers.addItem({ name: 'Bread', category: 'Bakery' });

      // Navigate to chat
      await page.goto(`/groups/${inviteCode}/chat`);

      // Switch to milk thread
      await page.click('[data-testid="item-thread-Milk"]');
      await expect(page.locator('[data-testid="current-thread"]')).toContainText('Milk');

      // Send message in milk thread
      await chatHelpers.sendMessage('Should we get organic milk?', 'Milk');
      
      // Verify message appears in milk thread
      await expect(page.locator('[data-testid="thread-Milk"] [data-testid*="message-"]')).toContainText('Should we get organic milk?');

      // Switch to bread thread
      await page.click('[data-testid="item-thread-Bread"]');
      await expect(page.locator('[data-testid="current-thread"]')).toContainText('Bread');

      // Send message in bread thread
      await chatHelpers.sendMessage('Whole wheat or white bread?', 'Bread');

      // Verify message appears in bread thread
      await expect(page.locator('[data-testid="thread-Bread"] [data-testid*="message-"]')).toContainText('Whole wheat or white bread?');

      // Switch back to milk thread - should not see bread message
      await page.click('[data-testid="item-thread-Milk"]');
      await expect(page.locator('[data-testid="thread-Milk"] [data-testid*="message-"]')).not.toContainText('Whole wheat or white bread?');
    });

    test('should show thread indicators on items', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Thread Indicator Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add item
      await shoppingHelpers.addItem({ name: 'Test Item', category: 'Test' });

      // Go to chat and send message in item thread
      await page.goto(`/groups/${inviteCode}/chat`);
      await chatHelpers.sendMessage('Discussion about this item', 'Test Item');

      // Go back to shopping list
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Verify thread indicator on item
      const itemLocator = page.locator('[data-testid="item-Test Item"]');
      await expect(itemLocator.locator('[data-testid="thread-indicator"]')).toBeVisible();
      await expect(itemLocator.locator('[data-testid="message-count"]')).toContainText('1');
    });

    test('should handle thread navigation from shopping list', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Thread Navigation Test' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add item
      await shoppingHelpers.addItem({ name: 'Navigation Item', category: 'Test' });

      // Click thread button on item
      const itemLocator = page.locator('[data-testid="item-Navigation Item"]');
      await itemLocator.locator('[data-testid="open-thread-button"]').click();

      // Should navigate to chat with item thread selected
      await expect(page).toHaveURL(new RegExp(`/groups/${inviteCode}/chat`));
      await expect(page.locator('[data-testid="current-thread"]')).toContainText('Navigation Item');
    });
  });

  test.describe('Image and File Sharing', () => {
    test('should send image messages', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Image Test Group' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Send image message (using test image file)
      const testImagePath = 'e2e/fixtures/test-image.jpg';
      await chatHelpers.sendImageMessage(testImagePath, 'Test receipt image');

      // Verify image message appears
      await expect(page.locator('[data-testid*="message-image-"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-caption"]')).toContainText('Test receipt image');

      // Verify image can be clicked to view full size
      await page.click('[data-testid*="message-image-"]');
      await expect(page.locator('[data-testid="image-modal"]')).toBeVisible();
    });

    test('should show PII warning for receipt images', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'PII Warning Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Start image upload
      await page.click('[data-testid="image-upload-button"]');
      
      // Should show PII warning
      await expect(page.locator('[data-testid="pii-warning"]')).toContainText('Warning: Images may contain personal information');
      await expect(page.locator('[data-testid="pii-warning"]')).toContainText('Please review before sharing');

      // Accept warning and proceed
      await page.check('[data-testid="pii-acknowledged"]');
      await expect(page.locator('[data-testid="image-upload-input"]')).toBeEnabled();
    });

    test('should handle image upload errors', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Upload Error Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Try to upload invalid file type
      await page.click('[data-testid="image-upload-button"]');
      await page.check('[data-testid="pii-acknowledged"]');
      
      // Upload non-image file
      await page.setInputFiles('[data-testid="image-upload-input"]', 'e2e/fixtures/test-document.txt');

      // Should show error
      await expect(page.locator('[data-testid="upload-error"]')).toContainText('Please select a valid image file');
    });
  });

  test.describe('Real-time Chat Updates', () => {
    test('should sync messages across multiple users in real-time', async ({ page, context }) => {
      // Setup group with two users
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Real-time Chat Test' });
      
      // Add second user
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // First user goes to chat
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Real-time Chat Test');
      await page.goto(`/groups/${inviteCode}/chat`);
      await realTimeHelpers.waitForRealTimeConnection();

      // Second user context
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();
      
      if (secondPage) {
        const secondAuthHelpers = new AuthHelpers(secondPage);
        const secondGroupHelpers = new GroupHelpers(secondPage);
        const secondChatHelpers = new ChatHelpers(secondPage);
        const secondRealTimeHelpers = new RealTimeHelpers(secondPage);

        await secondAuthHelpers.login(testUsers[1]);
        await secondPage.goto('/dashboard');
        await secondGroupHelpers.selectGroup('Real-time Chat Test');
        await secondPage.goto(`/groups/${inviteCode}/chat`);
        await secondRealTimeHelpers.waitForRealTimeConnection();

        // First user sends message
        const message1 = 'Hello from user 1!';
        await chatHelpers.sendMessage(message1);

        // Second user should see message immediately
        await expect(secondPage.locator(`[data-testid*="message-"]:has-text("${message1}")`)).toBeVisible();

        // Second user replies
        const message2 = 'Hello back from user 2!';
        await secondChatHelpers.sendMessage(message2);

        // First user should see reply
        await expect(page.locator(`[data-testid*="message-"]:has-text("${message2}")`)).toBeVisible();

        await secondContext?.close();
      }
    });

    test('should handle connection recovery in chat', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Connection Recovery Test' });
      await page.goto(`/groups/${inviteCode}/chat`);
      await realTimeHelpers.waitForRealTimeConnection();

      // Simulate connection loss
      await page.evaluate(() => {
        // Close SSE connection
        window.dispatchEvent(new Event('offline'));
      });

      // Should show disconnected status
      await expect(page.locator('[data-testid="connection-status-disconnected"]')).toBeVisible();

      // Simulate connection recovery
      await page.evaluate(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should reconnect
      await realTimeHelpers.waitForRealTimeConnection();
      await expect(page.locator('[data-testid="connection-status-connected"]')).toBeVisible();
    });
  });

  test.describe('Chat Search and Filtering', () => {
    test('should search through message history', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Search Test Group' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Send multiple messages
      const messages = [
        'Let\'s buy some milk',
        'Don\'t forget the bread',
        'We need eggs too',
        'Milk is on sale today',
        'Should we get organic milk?',
      ];

      for (const message of messages) {
        await chatHelpers.sendMessage(message);
      }

      // Search for "milk"
      await page.fill('[data-testid="chat-search-input"]', 'milk');
      await page.click('[data-testid="chat-search-button"]');

      // Should show only messages containing "milk"
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-results"] [data-testid*="message-"]')).toHaveCount(3);
      
      // Verify search highlights
      const searchResults = page.locator('[data-testid="search-results"] [data-testid*="message-"]');
      await expect(searchResults.first()).toContainText('milk');
    });

    test('should filter messages by thread', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Filter Test Group' });
      await page.goto(`/groups/${inviteCode}/shopping`);

      // Add items
      await shoppingHelpers.addItem({ name: 'Milk', category: 'Dairy' });
      await shoppingHelpers.addItem({ name: 'Bread', category: 'Bakery' });

      // Go to chat and send messages in different threads
      await page.goto(`/groups/${inviteCode}/chat`);
      
      await chatHelpers.sendMessage('General group message');
      await chatHelpers.sendMessage('Discussion about milk', 'Milk');
      await chatHelpers.sendMessage('Discussion about bread', 'Bread');

      // Filter by milk thread
      await page.click('[data-testid="filter-by-thread"]');
      await page.click('[data-testid="thread-filter-Milk"]');

      // Should show only milk thread messages
      await expect(page.locator('[data-testid*="message-"]:has-text("Discussion about milk")')).toBeVisible();
      await expect(page.locator('[data-testid*="message-"]:has-text("Discussion about bread")')).not.toBeVisible();
      await expect(page.locator('[data-testid*="message-"]:has-text("General group message")')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard accessible for chat', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Keyboard Chat Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Focus message input
      await expect(page.locator('[data-testid="message-input"]')).toBeFocused();
      
      // Type message
      await page.keyboard.type('Test keyboard message');
      
      // Send with Enter
      await page.keyboard.press('Enter');
      
      // Verify message was sent
      await expect(page.locator('[data-testid*="message-"]:has-text("Test keyboard message")')).toBeVisible();
    });

    test('should announce new messages to screen readers', async ({ page, context }) => {
      // Setup group with two users
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Screen Reader Chat Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Second user sends message
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();
      
      if (secondPage) {
        const secondAuthHelpers = new AuthHelpers(secondPage);
        const secondChatHelpers = new ChatHelpers(secondPage);

        await secondAuthHelpers.login(testUsers[1]);
        await secondPage.goto('/dashboard');
        await secondPage.goto(`/groups/${inviteCode}/chat`);
        
        await secondChatHelpers.sendMessage('New message for announcement');

        // First user should hear announcement
        await expect(page.locator('[aria-live="polite"]')).toContainText('New message: New message for announcement');

        await secondContext?.close();
      }
    });

    test('should have proper ARIA labels for chat interface', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'ARIA Chat Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Check ARIA labels
      await expect(page.locator('[data-testid="message-input"]')).toHaveAttribute('aria-label', 'Type your message');
      await expect(page.locator('[data-testid="send-message-button"]')).toHaveAttribute('aria-label', 'Send message');
      await expect(page.locator('[data-testid="chat-messages"]')).toHaveAttribute('aria-label', 'Chat messages');
      await expect(page.locator('[data-testid="thread-list"]')).toHaveAttribute('aria-label', 'Discussion threads');
    });

    test('should support screen reader navigation of message history', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Message Navigation Test' });
      await page.goto(`/groups/${inviteCode}/chat`);

      // Send multiple messages
      await chatHelpers.sendMessage('First message');
      await chatHelpers.sendMessage('Second message');
      await chatHelpers.sendMessage('Third message');

      // Check message structure for screen readers
      const messages = page.locator('[data-testid^="message-"]');
      
      // Each message should have proper structure
      await expect(messages.first().locator('[data-testid="message-sender"]')).toHaveAttribute('aria-label', expect.stringContaining('Message from'));
      await expect(messages.first().locator('[data-testid="message-content"]')).toHaveAttribute('aria-label', 'Message content');
      await expect(messages.first().locator('[data-testid="message-timestamp"]')).toHaveAttribute('aria-label', expect.stringContaining('Sent at'));
    });
  });
});