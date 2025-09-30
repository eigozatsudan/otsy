import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from './groups.service';
import { GroupsModule } from './groups.module';

describe('GroupsService Integration', () => {
    let app: INestApplication;
    let service: GroupsService;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [GroupsModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        service = moduleFixture.get<GroupsService>(GroupsService);
        prisma = moduleFixture.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up test data
        await prisma.groupMember.deleteMany();
        await prisma.group.deleteMany();
        await prisma.user.deleteMany();
    });

    describe('Group Management Integration', () => {
        it('should create a group and add creator as owner', async () => {
            // Create a test user first
            const user = await prisma.user.create({
                data: {
                    email: 'test@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Test User',
                },
            });

            const createGroupDto = {
                name: 'Test Group',
                description: 'Test Description',
            };

            const result = await service.createGroup(user.id, createGroupDto);

            expect(result).toMatchObject({
                name: 'Test Group',
                description: 'Test Description',
                created_by: user.id,
                member_count: 1,
                my_role: 'owner',
            });

            expect(result.invite_code).toHaveLength(12);
            expect(result.invite_code).toMatch(/^[A-Z0-9]+$/);

            // Verify the group was created in the database
            const dbGroup = await prisma.group.findUnique({
                where: { id: result.id },
                include: { members: true },
            });

            expect(dbGroup).toBeTruthy();
            expect(dbGroup.members).toHaveLength(1);
            expect(dbGroup.members[0].role).toBe('owner');
            expect(dbGroup.members[0].user_id).toBe(user.id);
        });

        it('should allow joining a group with invite code', async () => {
            // Create users
            const owner = await prisma.user.create({
                data: {
                    email: 'owner@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Owner User',
                },
            });

            const member = await prisma.user.create({
                data: {
                    email: 'member@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Member User',
                },
            });

            // Create group
            const group = await service.createGroup(owner.id, {
                name: 'Test Group',
                description: 'Test Description',
            });

            // Join group with invite code
            const joinResult = await service.joinGroup(member.id, {
                invite_code: group.invite_code,
            });

            expect(joinResult).toMatchObject({
                id: group.id,
                name: 'Test Group',
                my_role: 'member',
                member_count: 2,
            });

            // Verify membership in database
            const membership = await prisma.groupMember.findUnique({
                where: {
                    user_id_group_id: {
                        user_id: member.id,
                        group_id: group.id,
                    },
                },
            });

            expect(membership).toBeTruthy();
            expect(membership.role).toBe('member');
        });

        it('should get group members correctly', async () => {
            // Create users
            const owner = await prisma.user.create({
                data: {
                    email: 'owner@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Owner User',
                },
            });

            const member = await prisma.user.create({
                data: {
                    email: 'member@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Member User',
                },
            });

            // Create group and add member
            const group = await service.createGroup(owner.id, {
                name: 'Test Group',
            });

            await service.joinGroup(member.id, {
                invite_code: group.invite_code,
            });

            // Get members
            const members = await service.getGroupMembers(owner.id, group.id);

            expect(members).toHaveLength(2);

            // Owner should be first (sorted by role)
            expect(members[0]).toMatchObject({
                user_id: owner.id,
                display_name: 'Owner User',
                role: 'owner',
            });

            expect(members[1]).toMatchObject({
                user_id: member.id,
                display_name: 'Member User',
                role: 'member',
            });
        });

        it('should handle ownership transfer when owner leaves', async () => {
            // Create users
            const owner = await prisma.user.create({
                data: {
                    email: 'owner@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Owner User',
                },
            });

            const member = await prisma.user.create({
                data: {
                    email: 'member@example.com',
                    password_hash: 'hashed_password',
                    display_name: 'Member User',
                },
            });

            // Create group and add member
            const group = await service.createGroup(owner.id, {
                name: 'Test Group',
            });

            await service.joinGroup(member.id, {
                invite_code: group.invite_code,
            });

            // Owner leaves group
            await service.leaveGroup(owner.id, group.id);

            // Check that member became owner
            const memberMembership = await prisma.groupMember.findUnique({
                where: {
                    user_id_group_id: {
                        user_id: member.id,
                        group_id: group.id,
                    },
                },
            });

            expect(memberMembership.role).toBe('owner');

            // Check that owner is no longer a member
            const ownerMembership = await prisma.groupMember.findUnique({
                where: {
                    user_id_group_id: {
                        user_id: owner.id,
                        group_id: group.id,
                    },
                },
            });

            expect(ownerMembership).toBeNull();
        });
    });
});