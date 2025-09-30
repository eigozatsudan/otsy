import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasesService } from './purchases.service';
import { PurchasesModule } from './purchases.module';

describe('PurchasesService Integration', () => {
  let app: INestApplication;
  let service: PurchasesService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PurchasesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<PurchasesService>(PurchasesService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.split.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.item.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Purchase Management Integration', () => {
    it('should create and manage purchases with items', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password_hash: 'hashed_password',
          display_name: 'User One',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          display_name: 'User Two',
        },
      });

      // Create test group
      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
          description: 'Test Description',
          invite_code: 'TESTCODE123',
          created_by: user1.id,
        },
      });

      // Add users to group
      await prisma.groupMember.createMany({
        data: [
          {
            user_id: user1.id,
            group_id: group.id,
            role: 'owner',
          },
          {
            user_id: user2.id,
            group_id: group.id,
            role: 'member',
          },
        ],
      });

      // Create shopping items
      const item1 = await prisma.item.create({
        data: {
          group_id: group.id,
          name: 'Milk',
          category: 'Dairy',
          quantity: '1L',
          status: 'todo',
          created_by: user1.id,
        },
      });

      const item2 = await prisma.item.create({
        data: {
          group_id: group.id,
          name: 'Bread',
          category: 'Bakery',
          quantity: '1 loaf',
          status: 'todo',
          created_by: user2.id,
        },
      });

      // Create purchase
      const purchase = await service.createPurchase(user1.id, group.id, {
        total_amount: 450,
        currency: 'JPY',
        note: 'Grocery shopping',
        items: [
          { item_id: item1.id, quantity: 2, unit_price: 150 },
          { item_id: item2.id, quantity: 1, unit_price: 150 },
        ],
      });

      expect(purchase).toMatchObject({
        group_id: group.id,
        purchased_by: user1.id,
        purchaser_name: 'User One',
        total_amount: 450,
        currency: 'JPY',
        note: 'Grocery shopping',
      });

      expect(purchase.items).toHaveLength(2);
      expect(purchase.items[0]).toMatchObject({
        item_id: item1.id,
        item_name: 'Milk',
        quantity: 2,
        unit_price: 150,
      });

      // Verify items are marked as purchased
      const updatedItem1 = await prisma.item.findUnique({
        where: { id: item1.id },
      });
      const updatedItem2 = await prisma.item.findUnique({
        where: { id: item2.id },
      });

      expect(updatedItem1.status).toBe('purchased');
      expect(updatedItem2.status).toBe('purchased');
    });

    it('should get group purchases with filtering', async () => {
      // Create test user and group
      const user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          password_hash: 'hashed_password',
          display_name: 'Test User',
        },
      });

      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
          invite_code: 'TESTCODE123',
          created_by: user.id,
        },
      });

      await prisma.groupMember.create({
        data: {
          user_id: user.id,
          group_id: group.id,
          role: 'owner',
        },
      });

      // Create items
      const item1 = await prisma.item.create({
        data: {
          group_id: group.id,
          name: 'Milk',
          status: 'todo',
          created_by: user.id,
        },
      });

      const item2 = await prisma.item.create({
        data: {
          group_id: group.id,
          name: 'Bread',
          status: 'todo',
          created_by: user.id,
        },
      });

      // Create purchases
      const purchase1 = await service.createPurchase(user.id, group.id, {
        total_amount: 300,
        items: [{ item_id: item1.id, quantity: 1, unit_price: 300 }],
      });

      const purchase2 = await service.createPurchase(user.id, group.id, {
        total_amount: 1500,
        items: [{ item_id: item2.id, quantity: 1, unit_price: 1500 }],
      });

      // Get all purchases
      const allPurchases = await service.getGroupPurchases(user.id, group.id);
      expect(allPurchases).toHaveLength(2);

      // Filter by amount range
      const expensivePurchases = await service.getGroupPurchases(user.id, group.id, {
        min_amount: 1000,
      });
      expect(expensivePurchases).toHaveLength(1);
      expect(expensivePurchases[0].total_amount).toBe(1500);

      const cheapPurchases = await service.getGroupPurchases(user.id, group.id, {
        max_amount: 500,
      });
      expect(cheapPurchases).toHaveLength(1);
      expect(cheapPurchases[0].total_amount).toBe(300);
    });

    it('should update and delete purchases by purchaser only', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password_hash: 'hashed_password',
          display_name: 'User One',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          display_name: 'User Two',
        },
      });

      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
          invite_code: 'TESTCODE123',
          created_by: user1.id,
        },
      });

      await prisma.groupMember.createMany({
        data: [
          {
            user_id: user1.id,
            group_id: group.id,
            role: 'owner',
          },
          {
            user_id: user2.id,
            group_id: group.id,
            role: 'member',
          },
        ],
      });

      const item = await prisma.item.create({
        data: {
          group_id: group.id,
          name: 'Milk',
          status: 'todo',
          created_by: user1.id,
        },
      });

      // Create purchase by user1
      const purchase = await service.createPurchase(user1.id, group.id, {
        total_amount: 300,
        note: 'Original note',
        items: [{ item_id: item.id, quantity: 1, unit_price: 300 }],
      });

      // Update purchase by user1 (should succeed)
      const updatedPurchase = await service.updatePurchase(user1.id, purchase.id, {
        total_amount: 350,
        note: 'Updated note',
      });

      expect(updatedPurchase.total_amount).toBe(350);
      expect(updatedPurchase.note).toBe('Updated note');

      // Try to update by user2 (should fail)
      await expect(
        service.updatePurchase(user2.id, purchase.id, {
          total_amount: 400,
        })
      ).rejects.toThrow('Only the purchaser can update this purchase');

      // Try to delete by user2 (should fail)
      await expect(service.deletePurchase(user2.id, purchase.id)).rejects.toThrow(
        'Only the purchaser can delete this purchase'
      );

      // Delete by user1 (should succeed)
      const result = await service.deletePurchase(user1.id, purchase.id);
      expect(result.message).toBe('Purchase deleted successfully');

      // Verify purchase is deleted
      const deletedPurchase = await prisma.purchase.findUnique({
        where: { id: purchase.id },
      });
      expect(deletedPurchase).toBeNull();

      // Verify item status is reverted to todo
      const revertedItem = await prisma.item.findUnique({
        where: { id: item.id },
      });
      expect(revertedItem.status).toBe('todo');
    });

    it('should generate purchase statistics', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password_hash: 'hashed_password',
          display_name: 'User One',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          display_name: 'User Two',
        },
      });

      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
          invite_code: 'TESTCODE123',
          created_by: user1.id,
        },
      });

      await prisma.groupMember.createMany({
        data: [
          {
            user_id: user1.id,
            group_id: group.id,
            role: 'owner',
          },
          {
            user_id: user2.id,
            group_id: group.id,
            role: 'member',
          },
        ],
      });

      // Create items
      const items = await Promise.all([
        prisma.item.create({
          data: {
            group_id: group.id,
            name: 'Item 1',
            status: 'todo',
            created_by: user1.id,
          },
        }),
        prisma.item.create({
          data: {
            group_id: group.id,
            name: 'Item 2',
            status: 'todo',
            created_by: user1.id,
          },
        }),
        prisma.item.create({
          data: {
            group_id: group.id,
            name: 'Item 3',
            status: 'todo',
            created_by: user2.id,
          },
        }),
      ]);

      // Create purchases by different users
      await service.createPurchase(user1.id, group.id, {
        total_amount: 1000,
        items: [{ item_id: items[0].id, quantity: 1, unit_price: 1000 }],
      });

      await service.createPurchase(user1.id, group.id, {
        total_amount: 1500,
        items: [{ item_id: items[1].id, quantity: 1, unit_price: 1500 }],
      });

      await service.createPurchase(user2.id, group.id, {
        total_amount: 800,
        items: [{ item_id: items[2].id, quantity: 1, unit_price: 800 }],
      });

      // Get statistics
      const stats = await service.getGroupPurchaseStats(user1.id, group.id);

      expect(stats).toMatchObject({
        total_purchases: 3,
        total_amount: 3300,
      });

      expect(stats.purchases_by_member).toHaveLength(2);
      
      const user1Stats = stats.purchases_by_member.find(p => p.user_id === user1.id);
      const user2Stats = stats.purchases_by_member.find(p => p.user_id === user2.id);

      expect(user1Stats).toMatchObject({
        user_name: 'User One',
        purchase_count: 2,
        total_amount: 2500,
      });

      expect(user2Stats).toMatchObject({
        user_name: 'User Two',
        purchase_count: 1,
        total_amount: 800,
      });

      expect(stats.recent_purchases).toHaveLength(3);
    });

    it('should enforce group membership for all operations', async () => {
      // Create users and group
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password_hash: 'hashed_password',
          display_name: 'User One',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          display_name: 'User Two',
        },
      });

      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
          invite_code: 'TESTCODE123',
          created_by: user1.id,
        },
      });

      // Only add user1 to group
      await prisma.groupMember.create({
        data: {
          user_id: user1.id,
          group_id: group.id,
          role: 'owner',
        },
      });

      const item = await prisma.item.create({
        data: {
          group_id: group.id,
          name: 'Milk',
          status: 'todo',
          created_by: user1.id,
        },
      });

      // user2 should not be able to access group purchases
      await expect(service.getGroupPurchases(user2.id, group.id)).rejects.toThrow(
        'You are not a member of this group'
      );

      await expect(
        service.createPurchase(user2.id, group.id, {
          total_amount: 300,
          items: [{ item_id: item.id, quantity: 1 }],
        })
      ).rejects.toThrow('You are not a member of this group');

      await expect(service.getGroupPurchaseStats(user2.id, group.id)).rejects.toThrow(
        'You are not a member of this group'
      );
    });
  });
});