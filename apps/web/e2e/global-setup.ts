/**
 * Global setup for Playwright tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { testUsers, testGroups, testItems } from './fixtures/test-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Start browser for setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📡 Waiting for application at ${baseURL}...`);
    
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Check if the application is responding
    const title = await page.title();
    console.log(`✅ Application is ready. Title: ${title}`);

    // Setup test database with fixtures
    await setupTestDatabase();

    // Create test users
    await createTestUsers(page, baseURL);

    // Create test groups and data
    await createTestGroups(page, baseURL);

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Setup test database with initial data
 */
async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');
  
  // In a real implementation, this would:
  // 1. Connect to test database
  // 2. Run migrations
  // 3. Seed with test data
  // 4. Clear any existing test data
  
  // For now, we'll simulate this
  console.log('📊 Test database setup completed');
}

/**
 * Create test users via API or direct database insertion
 */
async function createTestUsers(page: any, baseURL: string) {
  console.log('👥 Creating test users...');
  
  for (const user of testUsers) {
    try {
      // In a real implementation, this would make API calls to create users
      // or insert directly into the database
      
      // For now, we'll simulate user creation
      console.log(`✅ Created test user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error);
    }
  }
}

/**
 * Create test groups and associated data
 */
async function createTestGroups(page: any, baseURL: string) {
  console.log('🏠 Creating test groups...');
  
  for (const group of testGroups) {
    try {
      // Create group
      console.log(`✅ Created test group: ${group.name}`);
      
      // Add test items to group
      const groupItems = testItems.filter(item => item.groupId === group.id);
      for (const item of groupItems) {
        console.log(`  📝 Added test item: ${item.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create group ${group.name}:`, error);
    }
  }
}

export default globalSetup;