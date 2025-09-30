/**
 * Test fixtures and data for E2E tests
 */

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  password: string;
  role: 'user' | 'admin';
}

export interface TestGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  ownerId: string;
  members: string[];
}

export interface TestItem {
  id: string;
  groupId: string;
  name: string;
  category: string;
  quantity: number;
  notes?: string;
  status: 'todo' | 'purchased' | 'cancelled';
  createdBy: string;
}

export interface TestPurchase {
  id: string;
  groupId: string;
  items: string[];
  amount: number;
  purchasedBy: string;
  receiptUrl?: string;
  splits: TestSplit[];
}

export interface TestSplit {
  userId: string;
  amount: number;
  percentage: number;
}

export interface TestMessage {
  id: string;
  groupId: string;
  content: string;
  senderId: string;
  itemId?: string;
  timestamp: string;
}

/**
 * Test user fixtures
 */
export const testUsers: TestUser[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    password: 'password123',
    role: 'user',
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    password: 'password123',
    role: 'user',
  },
  {
    id: 'user-3',
    email: 'charlie@example.com',
    displayName: 'Charlie Brown',
    password: 'password123',
    role: 'user',
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    displayName: 'Admin User',
    password: 'admin123',
    role: 'admin',
  },
];

/**
 * Test group fixtures
 */
export const testGroups: TestGroup[] = [
  {
    id: 'group-1',
    name: 'Family Shopping',
    description: 'Weekly grocery shopping for the family',
    inviteCode: 'FAM123SHOP45',
    ownerId: 'user-1',
    members: ['user-1', 'user-2'],
  },
  {
    id: 'group-2',
    name: 'Office Supplies',
    description: 'Office supply purchases',
    inviteCode: 'OFF456SUPP78',
    ownerId: 'user-2',
    members: ['user-2', 'user-3'],
  },
];

/**
 * Test item fixtures
 */
export const testItems: TestItem[] = [
  {
    id: 'item-1',
    groupId: 'group-1',
    name: 'Milk',
    category: 'Dairy',
    quantity: 2,
    notes: 'Organic if available',
    status: 'todo',
    createdBy: 'user-1',
  },
  {
    id: 'item-2',
    groupId: 'group-1',
    name: 'Bread',
    category: 'Bakery',
    quantity: 1,
    notes: 'Whole wheat',
    status: 'purchased',
    createdBy: 'user-2',
  },
  {
    id: 'item-3',
    groupId: 'group-1',
    name: 'Apples',
    category: 'Produce',
    quantity: 6,
    status: 'todo',
    createdBy: 'user-1',
  },
];

/**
 * Test purchase fixtures
 */
export const testPurchases: TestPurchase[] = [
  {
    id: 'purchase-1',
    groupId: 'group-1',
    items: ['item-2'],
    amount: 3.50,
    purchasedBy: 'user-2',
    splits: [
      { userId: 'user-1', amount: 1.75, percentage: 50 },
      { userId: 'user-2', amount: 1.75, percentage: 50 },
    ],
  },
];

/**
 * Test message fixtures
 */
export const testMessages: TestMessage[] = [
  {
    id: 'message-1',
    groupId: 'group-1',
    content: 'I can pick up the milk on my way home',
    senderId: 'user-2',
    itemId: 'item-1',
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: 'message-2',
    groupId: 'group-1',
    content: 'Great! Thanks @Bob',
    senderId: 'user-1',
    timestamp: '2024-01-15T10:35:00Z',
  },
];

/**
 * Helper functions for generating test data
 */
export class TestDataGenerator {
  private static counter = 1000;

  static generateUser(overrides: Partial<TestUser> = {}): TestUser {
    const id = `test-user-${this.counter++}`;
    return {
      id,
      email: `user${this.counter}@test.com`,
      displayName: `Test User ${this.counter}`,
      password: 'testpass123',
      role: 'user',
      ...overrides,
    };
  }

  static generateGroup(ownerId: string, overrides: Partial<TestGroup> = {}): TestGroup {
    const id = `test-group-${this.counter++}`;
    return {
      id,
      name: `Test Group ${this.counter}`,
      description: `Test group description ${this.counter}`,
      inviteCode: this.generateInviteCode(),
      ownerId,
      members: [ownerId],
      ...overrides,
    };
  }

  static generateItem(groupId: string, createdBy: string, overrides: Partial<TestItem> = {}): TestItem {
    const id = `test-item-${this.counter++}`;
    return {
      id,
      groupId,
      name: `Test Item ${this.counter}`,
      category: 'Test Category',
      quantity: 1,
      status: 'todo',
      createdBy,
      ...overrides,
    };
  }

  static generatePurchase(groupId: string, purchasedBy: string, items: string[], overrides: Partial<TestPurchase> = {}): TestPurchase {
    const id = `test-purchase-${this.counter++}`;
    return {
      id,
      groupId,
      items,
      amount: 10.00,
      purchasedBy,
      splits: [],
      ...overrides,
    };
  }

  static generateMessage(groupId: string, senderId: string, overrides: Partial<TestMessage> = {}): TestMessage {
    const id = `test-message-${this.counter++}`;
    return {
      id,
      groupId,
      content: `Test message ${this.counter}`,
      senderId,
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static resetCounter(): void {
    this.counter = 1000;
  }
}

/**
 * Test scenarios for complex workflows
 */
export const testScenarios = {
  /**
   * Complete shopping workflow scenario
   */
  completeShoppingWorkflow: {
    users: [testUsers[0], testUsers[1]],
    group: testGroups[0],
    items: [
      { name: 'Milk', category: 'Dairy', quantity: 2 },
      { name: 'Bread', category: 'Bakery', quantity: 1 },
      { name: 'Eggs', category: 'Dairy', quantity: 12 },
    ],
    purchases: [
      { items: ['Milk', 'Eggs'], amount: 8.50 },
      { items: ['Bread'], amount: 3.00 },
    ],
  },

  /**
   * Group collaboration scenario
   */
  groupCollaboration: {
    users: testUsers.slice(0, 3),
    group: {
      name: 'Weekend BBQ Planning',
      description: 'Planning supplies for weekend BBQ',
    },
    items: [
      { name: 'Hamburger Buns', category: 'Bakery', quantity: 8 },
      { name: 'Ground Beef', category: 'Meat', quantity: 2 },
      { name: 'Cheese Slices', category: 'Dairy', quantity: 1 },
      { name: 'Lettuce', category: 'Produce', quantity: 1 },
      { name: 'Tomatoes', category: 'Produce', quantity: 4 },
    ],
    messages: [
      'Should we get turkey burgers too?',
      'Good idea! I\'ll add them to the list',
      'Don\'t forget the condiments!',
    ],
  },

  /**
   * Cost splitting scenario
   */
  costSplitting: {
    users: testUsers.slice(0, 3),
    purchases: [
      {
        description: 'Equal split scenario',
        amount: 30.00,
        splitType: 'equal',
        expectedSplits: [10.00, 10.00, 10.00],
      },
      {
        description: 'Quantity-based split scenario',
        amount: 24.00,
        splitType: 'quantity',
        quantities: [2, 1, 3],
        expectedSplits: [8.00, 4.00, 12.00],
      },
      {
        description: 'Custom split scenario',
        amount: 50.00,
        splitType: 'custom',
        percentages: [40, 30, 30],
        expectedSplits: [20.00, 15.00, 15.00],
      },
    ],
  },
};