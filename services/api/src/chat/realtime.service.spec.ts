import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { MessageResponseDto } from './dto/message.dto';

describe('RealtimeService', () => {
    let service: RealtimeService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RealtimeService],
        }).compile();

        service = module.get<RealtimeService>(RealtimeService);
    });

    describe('subscribeToGroup', () => {
        it('should filter events for the correct group and exclude sender', (done) => {
            const groupId = 'group1';
            const userId = 'user1';
            const otherUserId = 'user2';

            const subscription = service.subscribeToGroup(groupId, userId);

            let eventCount = 0;
            subscription.subscribe(event => {
                eventCount++;
                expect(event.groupId).toBe(groupId);
                expect(event.userId).toBe(otherUserId);
                expect(event.type).toBe('message');

                if (eventCount === 1) {
                    done();
                }
            });

            // This should be filtered out (same user)
            service.broadcastMessage({
                id: 'msg1',
                group_id: groupId,
                author_id: userId,
                author_name: 'User One',
                body: 'Hello',
                created_at: new Date(),
            } as MessageResponseDto, userId);

            // This should come through
            service.broadcastMessage({
                id: 'msg2',
                group_id: groupId,
                author_id: otherUserId,
                author_name: 'User Two',
                body: 'Hi there',
                created_at: new Date(),
            } as MessageResponseDto, otherUserId);
        });

        it('should filter out events from different groups', (done) => {
            const groupId = 'group1';
            const userId = 'user1';
            const otherUserId = 'user2';

            const subscription = service.subscribeToGroup(groupId, userId);

            let eventReceived = false;
            subscription.subscribe(event => {
                eventReceived = true;
                expect(event.groupId).toBe(groupId);
            });

            // This should be filtered out (different group)
            service.broadcastMessage({
                id: 'msg1',
                group_id: 'different-group',
                author_id: otherUserId,
                author_name: 'User Two',
                body: 'Hello',
                created_at: new Date(),
            } as MessageResponseDto, otherUserId);

            // Wait a bit to ensure no event was received
            setTimeout(() => {
                expect(eventReceived).toBe(false);
                done();
            }, 100);
        });
    });

    describe('subscribeToItemThread', () => {
        it('should filter events for specific item thread', (done) => {
            const groupId = 'group1';
            const itemId = 'item1';
            const userId = 'user1';
            const otherUserId = 'user2';

            const subscription = service.subscribeToItemThread(groupId, itemId, userId);

            subscription.subscribe(event => {
                expect(event.groupId).toBe(groupId);
                expect(event.itemId).toBe(itemId);
                expect(event.userId).toBe(otherUserId);
                done();
            });

            // This should come through
            service.broadcastMessage({
                id: 'msg1',
                group_id: groupId,
                item_id: itemId,
                author_id: otherUserId,
                author_name: 'User Two',
                body: 'About this item',
                created_at: new Date(),
            } as MessageResponseDto, otherUserId);
        });
    });

    describe('broadcastTyping', () => {
        it('should broadcast typing indicator', (done) => {
            const groupId = 'group1';
            const userId = 'user1';
            const userName = 'User One';

            const subscription = service.subscribeToGroup(groupId, 'user2');

            subscription.subscribe(event => {
                expect(event.type).toBe('typing');
                expect(event.groupId).toBe(groupId);
                expect(event.userId).toBe(userId);
                expect(event.data.user_name).toBe(userName);
                expect(event.data.is_typing).toBe(true);
                done();
            });

            service.broadcastTyping(groupId, undefined, userId, userName, true);
        });
    });

    describe('broadcastMention', () => {
        it('should broadcast mention notification', (done) => {
            const mentionedUserId = 'user2';

            const subscription = service.subscribeToMentions(mentionedUserId);

            subscription.subscribe(event => {
                expect(event.type).toBe('mention');
                expect(event.data.mentionedUserId).toBe(mentionedUserId);
                expect(event.data.message.body).toContain('@user2');
                done();
            });

            const message = {
                id: 'msg1',
                group_id: 'group1',
                author_id: 'user1',
                author_name: 'User One',
                body: 'Hey @user2, check this out!',
                created_at: new Date(),
            } as MessageResponseDto;

            service.broadcastMention('group1', undefined, mentionedUserId, message);
        });
    });

    describe('broadcastUserJoined', () => {
        it('should broadcast user joined event', (done) => {
            const groupId = 'group1';
            const userId = 'user1';
            const userName = 'User One';

            const subscription = service.subscribeToGroup(groupId, 'user2');

            subscription.subscribe(event => {
                expect(event.type).toBe('user_joined');
                expect(event.groupId).toBe(groupId);
                expect(event.userId).toBe(userId);
                expect(event.data.user_name).toBe(userName);
                done();
            });

            service.broadcastUserJoined(groupId, userId, userName);
        });
    });

    describe('broadcastUserLeft', () => {
        it('should broadcast user left event', (done) => {
            const groupId = 'group1';
            const userId = 'user1';
            const userName = 'User One';

            const subscription = service.subscribeToGroup(groupId, 'user2');

            subscription.subscribe(event => {
                expect(event.type).toBe('user_left');
                expect(event.groupId).toBe(groupId);
                expect(event.userId).toBe(userId);
                expect(event.data.user_name).toBe(userName);
                done();
            });

            service.broadcastUserLeft(groupId, userId, userName);
        });
    });
});