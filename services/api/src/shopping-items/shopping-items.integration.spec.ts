import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShoppingItemsService } from './shopping-items.service';
import { ShoppingItemsModule } from './shopping-items.module';

describe('ShoppingItemsService Integration', () => {
    let app: INestApplication;
    let service: ShoppingItemsService;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ShoppingItemsModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        service = moduleFixture.get<ShoppingItemsService>(ShoppingItemsService);
        prisma = moduleFixture.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up test data
        await prisma.item.deleteMany();
        await prisma.groupMember.deleteMany();
        await prisma.group.deleteMany();
        await prisma.user.deleteMany();
    });

    describe('Shopping Items Management Integration', () => {
        it('should create and manage shopping items in a group', async () => {
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
            const item1 = await service.createItem(user1.id, group.id, {
                name: 'Milk',
                category: 'Dairy',
                quantity: '1L',
                note: 'Low fat preferred',
            });

            const item2 = await service.createItem(user2.id, group.id, {
                name: 'Bread',
                category: 'Bakery',
                quantity: '1 loaf',
            });

            expect(item1).toMatchObject({
                name: 'Milk',
                category: 'Dairy',
                quantity: '1L',
                status: 'todo',
                creator_name: 'User One',
            });

            expect(item2).toMatchObject({
                name: 'Bread',
                category: 'Bakery',
                quantity: '1 loaf',
                status: 'todo',
                creator_name: 'User Two',
            });

            // Get group items
            const items = await service.getGroupItems(user1.id, group.id);
            expect(items).toHaveLength(2);

            // Filter by category
            const dairyItems = await service.getGroupItems(user1.id, group.id, {
                category: 'Dairy',
            });
            expect(dairyItems).toHaveLength(1);
            expect(dairyItems[0].name).toBe('Milk');

            // Search items
            const searchResults = await service.getGroupItems(user1.id, group.id, {
                search: 'milk',
            });
            expect(searchResults).toHaveLength(1);
            expect(searchResults[0].name).toBe('Milk');
        });

        it('should update item status and track history', async () => {
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
            const item1 = await service.createItem(user.id, group.id, {
                name: 'Milk',
                category: 'Dairy',
            });

            const item2 = await service.createItem(user.id, group.id, {
                name: 'Bread',
                category: 'Bakery',
            });

            // Update item status to purchased
            const updatedItem = await service.updateItemStatus(user.id, item1.id, {
                status: 'purchased',
            });

            expect(updatedItem.status).toBe('purchased');

            // Get todo items (should only have bread)
            const todoItems = await service.getGroupItems(user.id, group.id, {
                status: 'todo',
            });
            expect(todoItems).toHaveLength(1);
            expect(todoItems[0].name).toBe('Bread');

            // Get purchased items
            const purchasedItems = await service.getGroupItems(user.id, group.id, {
                status: 'purchased',
            });
            expect(purchasedItems).toHaveLength(1);
            expect(purchasedItems[0].name).toBe('Milk');

            // Get item history
            const history = await service.getItemHistory(user.id, group.id);
            expect(history).toHaveLength(1);
            expect(history[0].name).toBe('Milk');
            expect(history[0].status).toBe('purchased');
        });

        it('should handle bulk status updates', async () => {
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

            // Create multiple items
            const item1 = await service.createItem(user.id, group.id, {
                name: 'Milk',
                category: 'Dairy',
            });

            const item2 = await service.createItem(user.id, group.id, {
                name: 'Bread',
                category: 'Bakery',
            });

            const item3 = await service.createItem(user.id, group.id, {
                name: 'Eggs',
                category: 'Dairy',
            });

            // Bulk update status
            const result = await service.bulkUpdateStatus(
                user.id,
                group.id,
                [item1.id, item2.id],
                'purchased'
            );

            expect(result).toEqual({
                message: '2 items updated successfully',
                updated_count: 2,
            });

            // Verify updates
            const purchasedItems = await service.getGroupItems(user.id, group.id, {
                status: 'purchased',
            });
            expect(purchasedItems).toHaveLength(2);

            const todoItems = await service.getGroupItems(user.id, group.id, {
                status: 'todo',
            });
            expect(todoItems).toHaveLength(1);
            expect(todoItems[0].name).toBe('Eggs');
        });

        it('should get unique categories from group items', async () => {
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

            // Create items with different categories
            await service.createItem(user.id, group.id, {
                name: 'Milk',
                category: 'Dairy',
            });

            await service.createItem(user.id, group.id, {
                name: 'Cheese',
                category: 'Dairy',
            });

            await service.createItem(user.id, group.id, {
                name: 'Bread',
                category: 'Bakery',
            });

            await service.createItem(user.id, group.id, {
                name: 'Apples',
                category: 'Fruits',
            });

            // Get categories
            const categories = await service.getGroupCategories(user.id, group.id);

            expect(categories).toEqual(['Bakery', 'Dairy', 'Fruits']);
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

            // user2 should not be able to access group items
            await expect(service.getGroupItems(user2.id, group.id)).rejects.toThrow(
                'You are not a member of this group'
            );

            await expect(
                service.createItem(user2.id, group.id, { name: 'Milk' })
            ).rejects.toThrow('You are not a member of this group');
        });
    });
});