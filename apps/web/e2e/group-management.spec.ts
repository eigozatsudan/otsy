/**
 * E2E tests for group creation and management workflows
 */

import { test, expect } from '@playwright/test';
import { AuthHelpers, GroupHelpers, UtilityHelpers } from './helpers/test-helpers';
import { testUsers, TestDataGenerator } from './fixtures/test-data';

test.describe('Group Management', () => {
  let authHelpers: AuthHelpers;
  let groupHelpers: GroupHelpers;
  let utilityHelpers: UtilityHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    groupHelpers = new GroupHelpers(page);
    utilityHelpers = new UtilityHelpers(page);
  });

  test.describe('Group Creation', () => {
    test('should create a new group successfully', async ({ page }) => {
      // Login as test user
      await authHelpers.login(testUsers[0]);
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      await utilityHelpers.waitForLoadingToComplete();

      // Create new group
      const groupData = {
        name: 'Test Family Group',
        description: 'A test group for family shopping',
      };

      const inviteCode = await groupHelpers.createGroup(groupData);

      // Verify group was created
      expect(inviteCode).toHaveLength(12);
      await expect(page.locator('[data-testid="current-group-name"]')).toContainText(groupData.name);
      
      // Verify invite code is displayed
      await expect(page.locator('[data-testid="invite-code"]')).toContainText(inviteCode);
      
      // Take screenshot for verification
      await utilityHelpers.takeScreenshot('group-created');
    });

    test('should validate required fields when creating group', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Try to create group without name
      await page.click('[data-testid="create-group-button"]');
      await page.click('[data-testid="create-group-submit"]');

      // Verify validation error
      await expect(page.locator('[data-testid="group-name-error"]')).toContainText('Group name is required');
    });

    test('should generate unique invite codes for different groups', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Create first group
      const inviteCode1 = await groupHelpers.createGroup({ name: 'Group 1' });
      
      // Create second group
      const inviteCode2 = await groupHelpers.createGroup({ name: 'Group 2' });

      // Verify codes are different
      expect(inviteCode1).not.toBe(inviteCode2);
      expect(inviteCode1).toHaveLength(12);
      expect(inviteCode2).toHaveLength(12);
    });
  });

  test.describe('Group Joining', () => {
    test('should join group using invite code', async ({ page, context }) => {
      // Create group with first user
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({
        name: 'Shared Shopping Group',
        description: 'Group for shared shopping',
      });

      // Logout first user
      await authHelpers.logout();

      // Login as second user and join group
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      
      await groupHelpers.joinGroup(inviteCode);

      // Verify user joined successfully
      await expect(page.locator('[data-testid="group-joined-message"]')).toContainText('Successfully joined group');
      
      // Verify group appears in user's group list
      await groupHelpers.selectGroup('Shared Shopping Group');
      await expect(page.locator('[data-testid="current-group-name"]')).toContainText('Shared Shopping Group');
    });

    test('should show error for invalid invite code', async ({ page }) => {
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');

      // Try to join with invalid code
      await page.click('[data-testid="join-group-button"]');
      await page.fill('[data-testid="invite-code-input"]', 'INVALID12345');
      await page.click('[data-testid="join-group-submit"]');

      // Verify error message
      await expect(page.locator('[data-testid="join-group-error"]')).toContainText('Invalid invite code');
    });

    test('should not allow joining same group twice', async ({ page }) => {
      // Setup: Create group and join it
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Test Group' });
      
      // Try to join the same group again
      await groupHelpers.joinGroup(inviteCode);

      // Verify appropriate message
      await expect(page.locator('[data-testid="already-member-message"]')).toContainText('You are already a member of this group');
    });
  });

  test.describe('Group Navigation', () => {
    test('should switch between multiple groups', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Create multiple groups
      const group1Code = await groupHelpers.createGroup({ name: 'Family Shopping' });
      const group2Code = await groupHelpers.createGroup({ name: 'Office Supplies' });

      // Switch to first group
      await groupHelpers.selectGroup('Family Shopping');
      await expect(page.locator('[data-testid="current-group-name"]')).toContainText('Family Shopping');

      // Switch to second group
      await groupHelpers.selectGroup('Office Supplies');
      await expect(page.locator('[data-testid="current-group-name"]')).toContainText('Office Supplies');

      // Verify group-specific content is loaded
      await expect(page.locator('[data-testid="group-description"]')).toBeVisible();
    });

    test('should show empty state when no groups exist', async ({ page }) => {
      // Create new user with no groups
      const newUser = TestDataGenerator.generateUser();
      await authHelpers.register(newUser);

      // Verify empty state
      await expect(page.locator('[data-testid="no-groups-message"]')).toContainText('You haven\'t joined any groups yet');
      await expect(page.locator('[data-testid="create-first-group-button"]')).toBeVisible();
    });
  });

  test.describe('Group Settings', () => {
    test('should update group information', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Create group
      await groupHelpers.createGroup({ name: 'Original Name', description: 'Original description' });

      // Update group information
      await page.click('[data-testid="group-settings-button"]');
      await page.fill('[data-testid="group-name-input"]', 'Updated Name');
      await page.fill('[data-testid="group-description-input"]', 'Updated description');
      await page.click('[data-testid="save-group-settings"]');

      // Verify updates
      await expect(page.locator('[data-testid="current-group-name"]')).toContainText('Updated Name');
      await utilityHelpers.waitForToast('Group settings updated');
    });

    test('should manage group members', async ({ page, context }) => {
      // Create group with owner
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Member Management Test' });

      // Add second user to group
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Login back as owner and check members
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Member Management Test');
      
      await page.click('[data-testid="group-settings-button"]');
      await page.click('[data-testid="members-tab"]');

      // Verify both members are listed
      await expect(page.locator('[data-testid="member-list"]')).toContainText(testUsers[0].displayName);
      await expect(page.locator('[data-testid="member-list"]')).toContainText(testUsers[1].displayName);

      // Verify owner has admin controls
      await expect(page.locator(`[data-testid="remove-member-${testUsers[1].id}"]`)).toBeVisible();
    });

    test('should allow group owner to remove members', async ({ page }) => {
      // Setup group with multiple members (similar to previous test)
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Remove Member Test' });

      // Add and then remove member
      await page.click('[data-testid="group-settings-button"]');
      await page.click('[data-testid="members-tab"]');
      
      // Simulate member removal (in real test, would have actual member to remove)
      await page.click(`[data-testid="remove-member-${testUsers[1].id}"]`);
      await page.click('[data-testid="confirm-remove-member"]');

      // Verify member was removed
      await utilityHelpers.waitForToast('Member removed from group');
    });
  });

  test.describe('Group Leaving', () => {
    test('should allow member to leave group', async ({ page }) => {
      // Setup: Join a group as non-owner
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Leave Test Group' });
      
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);

      // Leave the group
      await groupHelpers.leaveGroup();

      // Verify user is back at dashboard and group is not in list
      await expect(page.locator('[data-testid="current-group-name"]')).not.toContainText('Leave Test Group');
    });

    test('should handle ownership transfer when owner leaves', async ({ page }) => {
      // Create group with owner and member
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      
      const inviteCode = await groupHelpers.createGroup({ name: 'Ownership Transfer Test' });
      
      // Add member
      await authHelpers.logout();
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.joinGroup(inviteCode);
      await authHelpers.logout();

      // Owner leaves group
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Ownership Transfer Test');
      await groupHelpers.leaveGroup();

      // Verify ownership transferred
      await authHelpers.login(testUsers[1]);
      await page.goto('/dashboard');
      await groupHelpers.selectGroup('Ownership Transfer Test');
      
      await page.click('[data-testid="group-settings-button"]');
      await expect(page.locator('[data-testid="group-owner-indicator"]')).toContainText('You are the owner');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Test keyboard navigation through group creation flow
      await page.keyboard.press('Tab'); // Focus create group button
      await expect(page.locator('[data-testid="create-group-button"]')).toBeFocused();
      
      await page.keyboard.press('Enter'); // Open create group modal
      await expect(page.locator('[data-testid="group-name-input"]')).toBeFocused();
      
      // Navigate through form fields
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="group-description-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="create-group-submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Check ARIA labels on key elements
      await expect(page.locator('[data-testid="create-group-button"]')).toHaveAttribute('aria-label', 'Create new group');
      await expect(page.locator('[data-testid="join-group-button"]')).toHaveAttribute('aria-label', 'Join existing group');
      
      // Open group creation modal and check form labels
      await page.click('[data-testid="create-group-button"]');
      await expect(page.locator('[data-testid="group-name-input"]')).toHaveAttribute('aria-label', 'Group name');
      await expect(page.locator('[data-testid="group-description-input"]')).toHaveAttribute('aria-label', 'Group description');
    });

    test('should announce group changes to screen readers', async ({ page }) => {
      await authHelpers.login(testUsers[0]);
      await page.goto('/dashboard');

      // Create group and verify announcement
      await groupHelpers.createGroup({ name: 'Announcement Test Group' });
      
      // Check for aria-live region with announcement
      await expect(page.locator('[aria-live="polite"]')).toContainText('Group created successfully');
    });
  });
});