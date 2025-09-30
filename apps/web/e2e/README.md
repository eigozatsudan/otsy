# E2E Testing Suite

This directory contains comprehensive end-to-end tests for the Otsukai DX Platform using Playwright.

## Overview

The E2E test suite covers all major user workflows and ensures the application works correctly across different browsers and devices. Tests are organized by feature area and include accessibility, performance, and visual regression testing.

## Test Structure

```
e2e/
├── fixtures/           # Test data and fixtures
│   └── test-data.ts   # User, group, item, and scenario data
├── helpers/           # Test helper functions
│   └── test-helpers.ts # Reusable test utilities
├── *.spec.ts         # Test files organized by feature
├── global-setup.ts   # Global test setup
├── global-teardown.ts # Global test cleanup
└── README.md         # This file
```

## Test Categories

### 1. Group Management (`group-management.spec.ts`)
- Group creation and validation
- Invite code generation and joining
- Group navigation and switching
- Member management and permissions
- Group settings and ownership transfer

### 2. Shopping List Collaboration (`shopping-collaboration.spec.ts`)
- Item management (add, edit, delete)
- Item status changes (todo, purchased, cancelled)
- Real-time collaboration between users
- Category organization
- Complex shopping workflows

### 3. Cost Splitting (`cost-splitting.spec.ts`)
- Purchase recording with receipts
- Equal split calculations with remainder handling
- Quantity-based split calculations
- Custom percentage splits with validation
- Settlement summaries and payment tracking

### 4. Chat and Threading (`chat-threading.spec.ts`)
- Group chat messaging
- Item-specific threaded discussions
- @mentions and notifications
- Image sharing with PII warnings
- Real-time message synchronization
- Typing indicators

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

### Basic Test Execution

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

### Browser-Specific Tests

```bash
# Run tests on specific browsers
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests
npm run test:e2e:mobile
```

### Specialized Test Suites

```bash
# Run accessibility tests only
npm run test:accessibility:e2e

# Run visual regression tests
npm run test:visual

# Run all tests (unit + E2E)
npm run test:all
```

## Test Configuration

### Environment Setup

Tests require a test database and environment variables:

```bash
# Copy environment template
cp .env.example .env.test

# Set test-specific variables
DATABASE_URL=postgresql://user:pass@localhost:5432/otsukai_test
NODE_ENV=test
NEXTAUTH_SECRET=test-secret-key
```

### Database Setup

```bash
# Run migrations for test database
npm run db:migrate:test

# Seed test database with fixtures
npm run db:seed:test

# Reset test database
npm run db:reset:test
```

## Test Data and Fixtures

### Test Users

The test suite uses predefined test users with different roles:

```typescript
// Available test users
testUsers[0] // Alice Johnson (user)
testUsers[1] // Bob Smith (user)  
testUsers[2] // Charlie Brown (user)
testUsers[3] // Admin User (admin)
```

### Test Scenarios

Complex workflows are defined in `testScenarios`:

- `completeShoppingWorkflow`: Full shopping process
- `groupCollaboration`: Multi-user collaboration
- `costSplitting`: Various split calculation scenarios

### Dynamic Test Data

Use `TestDataGenerator` for creating unique test data:

```typescript
const user = TestDataGenerator.generateUser();
const group = TestDataGenerator.generateGroup(ownerId);
const item = TestDataGenerator.generateItem(groupId, createdBy);
```

## Helper Functions

### Authentication Helpers

```typescript
await authHelpers.login(testUser);
await authHelpers.logout();
await authHelpers.register(newUser);
```

### Group Management Helpers

```typescript
const inviteCode = await groupHelpers.createGroup(groupData);
await groupHelpers.joinGroup(inviteCode);
await groupHelpers.selectGroup(groupName);
```

### Shopping List Helpers

```typescript
await shoppingHelpers.addItem(itemData);
await shoppingHelpers.markItemAsPurchased(itemName);
await shoppingHelpers.editItem(itemName, updates);
```

### Real-time Helpers

```typescript
await realTimeHelpers.waitForRealTimeConnection();
await realTimeHelpers.waitForItemUpdate(itemName, status);
await realTimeHelpers.waitForNewMessage(content);
```

## Accessibility Testing

### Automated Accessibility Checks

Tests include automated accessibility validation:

- WCAG AA compliance checking
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility
- ARIA label verification

### Manual Accessibility Tests

```typescript
// Keyboard navigation
await accessibilityHelpers.checkKeyboardNavigation(
  startElement, 
  expectedElements
);

// ARIA labels
await accessibilityHelpers.checkAriaLabels([
  { selector: '[data-testid="button"]', expectedLabel: 'Click me' }
]);
```

## Visual Regression Testing

Visual tests capture screenshots and compare against baselines:

```typescript
// Take screenshot for comparison
await utilityHelpers.takeScreenshot('feature-name');

// Visual regression test
test('should match visual baseline', async ({ page }) => {
  await page.goto('/feature');
  await expect(page).toHaveScreenshot('feature-baseline.png');
});
```

## Performance Testing

Performance tests use Lighthouse integration:

```bash
# Run Lighthouse CI
npm run lighthouse:ci

# Performance budgets are configured in lighthouserc.js
```

## CI/CD Integration

### GitHub Actions Workflow

The test suite runs automatically on:
- Push to main/develop branches
- Pull requests
- Daily scheduled runs (2 AM UTC)

### Test Matrix

Tests run across multiple configurations:
- Browsers: Chromium, Firefox, WebKit
- Devices: Desktop, Mobile Chrome, Mobile Safari
- Test types: Functional, Accessibility, Performance, Visual

### Artifacts

Test results are uploaded as artifacts:
- Playwright HTML reports
- Test screenshots and videos
- Accessibility reports
- Lighthouse performance reports

## Debugging Tests

### Local Debugging

```bash
# Debug specific test
npx playwright test group-management.spec.ts --debug

# Debug with browser UI
npx playwright test --ui

# Run single test in headed mode
npx playwright test -g "should create group" --headed
```

### CI Debugging

When tests fail in CI:

1. Download test artifacts from GitHub Actions
2. Review HTML reports for detailed failure information
3. Check screenshots/videos for visual debugging
4. Review console logs in test output

### Common Issues

**Database Connection Issues**
```bash
# Ensure test database is running
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# Reset test database
npm run db:reset:test
```

**Timing Issues**
```typescript
// Use proper waits instead of timeouts
await expect(page.locator('[data-testid="element"]')).toBeVisible();

// Wait for network requests
await page.waitForLoadState('networkidle');
```

**Element Not Found**
```typescript
// Use data-testid attributes for reliable selection
await page.click('[data-testid="submit-button"]');

// Wait for element to be available
await page.waitForSelector('[data-testid="element"]');
```

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Keep tests independent** - each test should work in isolation
4. **Use proper setup/teardown** in beforeEach/afterEach hooks

### Test Data Management

1. **Use fixtures** for consistent test data
2. **Generate unique data** to avoid conflicts
3. **Clean up test data** after tests complete
4. **Use realistic data** that matches production scenarios

### Assertions

1. **Use specific assertions** that clearly indicate what's being tested
2. **Wait for conditions** instead of using fixed timeouts
3. **Test user-visible behavior** rather than implementation details
4. **Include accessibility checks** in functional tests

### Performance

1. **Run tests in parallel** when possible
2. **Use page object patterns** for reusable functionality
3. **Minimize test setup time** with efficient fixtures
4. **Cache browser contexts** when appropriate

## Contributing

When adding new tests:

1. **Follow existing patterns** in test organization and naming
2. **Add helper functions** for reusable functionality
3. **Include accessibility tests** for new features
4. **Update test data fixtures** as needed
5. **Document complex test scenarios** in comments

### Test Checklist

- [ ] Test covers happy path and edge cases
- [ ] Includes accessibility validation
- [ ] Uses proper data-testid selectors
- [ ] Includes error handling scenarios
- [ ] Works across different browsers
- [ ] Includes mobile testing if applicable
- [ ] Has proper cleanup/teardown
- [ ] Uses realistic test data

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse Performance Budgets](https://web.dev/lighthouse-performance-budgets/)