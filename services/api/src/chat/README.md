# Group Communication System

This module implements a comprehensive group communication system for the Otsukai DX platform, supporting both general group chat and item-specific threaded discussions.

## Features

### ✅ Implemented Features

1. **Group Chat** - General communication within groups
2. **Item Threads** - Discussions linked to specific shopping items
3. **@Mentions** - Mention other group members with notifications
4. **Real-time Messaging** - Server-Sent Events (SSE) for live updates
5. **Message Search** - Search across group messages and item threads
6. **Typing Indicators** - Show when users are typing
7. **Message History** - Paginated message retrieval
8. **Message Deletion** - Authors and group creators can delete messages

### 🔧 Core Components

#### MessagesService
- `sendMessage()` - Send messages to groups or item threads
- `getGroupMessages()` - Retrieve general group chat messages
- `getItemThread()` - Get messages for specific item discussions
- `searchMessages()` - Search messages with filtering
- `deleteMessage()` - Delete messages with permission checks
- `processMentions()` - Extract and resolve @mentions

#### RealtimeService
- `subscribeToGroup()` - Subscribe to group events via SSE
- `subscribeToItemThread()` - Subscribe to item thread events
- `subscribeToMentions()` - Subscribe to mention notifications
- `broadcastMessage()` - Broadcast new messages to subscribers
- `broadcastTyping()` - Send typing indicators
- `broadcastMention()` - Send mention notifications

#### Controllers
- **MessagesController** - REST API endpoints for messaging
- **RealtimeController** - SSE endpoints for real-time features

## API Endpoints

### Messages API

```
POST   /messages/groups/:groupId                    # Send message
GET    /messages/groups/:groupId                    # Get group messages
GET    /messages/groups/:groupId/items/:itemId/thread # Get item thread
GET    /messages/groups/:groupId/threads            # Get all item threads
GET    /messages/groups/:groupId/search             # Search messages
DELETE /messages/:messageId                         # Delete message
GET    /messages/groups/:groupId/stats              # Get message stats
```

### Real-time API (Server-Sent Events)

```
GET /realtime/groups/:groupId/events               # Subscribe to group events
GET /realtime/groups/:groupId/items/:itemId/events # Subscribe to item thread events
GET /realtime/mentions                             # Subscribe to mentions
POST /realtime/groups/:groupId/typing              # Send typing indicator
GET /realtime/heartbeat                            # Keep connections alive
```

## Usage Examples

### Sending a Group Message

```typescript
POST /messages/groups/group123
{
  "body": "Hey everyone, should we add organic milk to the list?"
}
```

### Sending an Item Thread Message

```typescript
POST /messages/groups/group123
{
  "body": "I think the organic version is worth the extra cost",
  "item_id": "item456"
}
```

### Mentioning Users

```typescript
POST /messages/groups/group123
{
  "body": "Hey @Alice, what do you think about this brand?"
}
```

### Real-time Subscription (JavaScript)

```javascript
const eventSource = new EventSource('/realtime/groups/group123/events');

eventSource.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('New message:', message);
});

eventSource.addEventListener('mention', (event) => {
  const mention = JSON.parse(event.data);
  console.log('You were mentioned:', mention);
});

eventSource.addEventListener('typing', (event) => {
  const typing = JSON.parse(event.data);
  console.log(`${typing.user_name} is typing...`);
});
```

### Sending Typing Indicators

```typescript
POST /realtime/groups/group123/typing
{
  "is_typing": true,
  "item_id": "item456" // optional, for item threads
}
```

## Database Schema

The system uses the `Message` model from the Prisma schema:

```prisma
model Message {
  id         String   @id @default(uuid())
  group_id   String
  item_id    String?  // nullable for threaded discussions
  author_id  String
  body       String
  image_url  String?
  created_at DateTime @default(now())

  // Relations
  group  Group @relation(fields: [group_id], references: [id], onDelete: Cascade)
  item   Item? @relation("ItemMessages", fields: [item_id], references: [id], onDelete: Cascade)
  author User  @relation("MessageAuthor", fields: [author_id], references: [id], onDelete: Cascade)
}
```

## Security & Permissions

- **Group Membership Required** - Users must be group members to send/view messages
- **Message Deletion** - Only message authors or group creators can delete messages
- **Item Validation** - Item threads are validated to ensure items belong to the group
- **Real-time Filtering** - SSE events are filtered by group membership and permissions

## Testing

The system includes comprehensive unit tests:

- **MessagesService** - 20 test cases covering all functionality
- **RealtimeService** - 7 test cases for real-time features
- **Edge Cases** - Permission checks, validation, error handling
- **Integration** - Real-time event filtering and broadcasting

Run tests with:
```bash
npm test -- --testPathPattern=messages.service.spec.ts
npm test -- --testPathPattern=realtime.service.spec.ts
```

## Performance Considerations

- **Pagination** - All message endpoints support pagination
- **Filtering** - Real-time events are efficiently filtered by group/item
- **Indexing** - Database queries are optimized with proper indexes
- **Connection Management** - SSE connections include heartbeat for reliability

## Future Enhancements

- **Message Reactions** - Add emoji reactions to messages
- **File Attachments** - Support for file uploads in messages
- **Message Threading** - Reply chains within item discussions
- **Push Notifications** - Mobile push notifications for mentions
- **Message Encryption** - End-to-end encryption for sensitive discussions