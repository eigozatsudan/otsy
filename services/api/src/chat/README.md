# リアルタイム通信システム

Otsyプラットフォームのリアルタイム通信システムは、WebSocketとプッシュ通知を使用してユーザーとショッパー間のシームレスなコミュニケーションを提供します。

## 機能概要

### チャットシステム
- **リアルタイムメッセージング**: WebSocketによる即座のメッセージ配信
- **マルチメディア対応**: テキスト、画像、システムメッセージ
- **既読管理**: メッセージの既読状態追跡
- **タイピングインジケーター**: リアルタイムタイピング状態表示
- **オンライン状態**: ユーザーのオンライン/オフライン状態管理

### プッシュ通知
- **Web Push API**: ブラウザネイティブ通知
- **通知設定**: ユーザー個別の通知設定管理
- **バッチ通知**: 複数ユーザーへの一括通知
- **通知履歴**: 送信済み通知の履歴管理

## アーキテクチャ

### WebSocket通信
```
Client (Browser) ←→ Socket.IO ←→ NestJS Gateway ←→ Chat Service ←→ Database
```

### プッシュ通知
```
Server → Web Push Service → Browser → User
```

## API エンドポイント

### チャット管理

#### チャット作成
```http
POST /v1/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": "order-uuid",
  "user_id": "user-uuid",
  "shopper_id": "shopper-uuid",
  "initial_message": "Hello! Ready to start shopping."
}
```

#### マイチャット一覧
```http
GET /v1/chat/my-chats?page=1&limit=20
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "chats": [
    {
      "id": "chat-uuid",
      "order_id": "order-uuid",
      "user_id": "user-uuid",
      "shopper_id": "shopper-uuid",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z",
      "last_message": {
        "id": "message-uuid",
        "content": "Latest message",
        "type": "text",
        "sender_role": "user",
        "created_at": "2024-01-01T12:00:00Z"
      },
      "unread_count": 2
    }
  ],
  "total": 5
}
```

#### メッセージ送信
```http
POST /v1/chat/{chat_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello! How are you?",
  "type": "text",
  "attachment_url": "https://example.com/image.jpg",
  "attachment_type": "image/jpeg",
  "metadata": {
    "custom_field": "value"
  }
}
```

#### メッセージ履歴取得
```http
GET /v1/chat/{chat_id}/messages?page=1&limit=50
Authorization: Bearer <token>
```

#### 既読マーク
```http
PUT /v1/chat/{chat_id}/messages/read
Authorization: Bearer <token>
Content-Type: application/json

{
  "message_ids": ["message-uuid-1", "message-uuid-2"]
}
```

### プッシュ通知

#### 通知購読
```http
POST /v1/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "p256dh-key",
    "auth": "auth-key"
  }
}
```

#### 通知設定取得
```http
GET /v1/notifications/preferences
Authorization: Bearer <token>
```

#### 通知設定更新
```http
PUT /v1/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_updates": true,
  "chat_messages": true,
  "promotional": false,
  "system_alerts": true
}
```

#### VAPID公開鍵取得
```http
GET /v1/notifications/vapid-public-key
```

## WebSocket イベント

### 接続管理

#### 接続
```javascript
const socket = io('/chat', {
  auth: { token: 'jwt-token' },
  transports: ['websocket']
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
  // { userId: 'user-id', role: 'user', timestamp: '...' }
});
```

#### チャット参加
```javascript
socket.emit('join_chat', { chat_id: 'chat-uuid' });

socket.on('chat_history', (data) => {
  console.log('Chat history:', data.messages);
});

socket.on('user_joined', (data) => {
  console.log('User joined:', data.userId);
});
```

### メッセージング

#### メッセージ送信
```javascript
socket.emit('send_message', {
  chatId: 'chat-uuid',
  message: {
    content: 'Hello!',
    type: 'text'
  }
});
```

#### メッセージ受信
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // Display message in UI
});
```

#### タイピングインジケーター
```javascript
// タイピング開始
socket.emit('typing_indicator', {
  chat_id: 'chat-uuid',
  action: 'start'
});

// タイピング停止
socket.emit('typing_indicator', {
  chat_id: 'chat-uuid',
  action: 'stop'
});

// タイピング状態受信
socket.on('typing_indicator', (data) => {
  if (data.action === 'start') {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

#### 既読状態
```javascript
socket.emit('mark_messages_read', {
  chatId: 'chat-uuid',
  messageIds: ['msg-1', 'msg-2']
});

socket.on('messages_read', (data) => {
  updateMessageReadStatus(data.messageIds);
});
```

### システムイベント

#### 注文更新通知
```javascript
socket.on('order_update', (data) => {
  console.log('Order updated:', data.update);
  showOrderUpdateNotification(data.update);
});
```

#### レシート共有
```javascript
socket.on('receipt_shared', (data) => {
  console.log('Receipt shared:', data.receiptUrl);
  displaySharedReceipt(data.receiptUrl);
});
```

## プッシュ通知実装

### クライアント側実装

#### Service Worker登録
```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'reply') {
    // Open chat interface
    clients.openWindow(`/chat/${data.chatId}`);
  } else if (action === 'view_order') {
    // Open order details
    clients.openWindow(`/orders/${data.orderId}`);
  }
});
```

#### 通知購読
```javascript
async function subscribeToNotifications() {
  // Service Worker登録
  const registration = await navigator.serviceWorker.register('/sw.js');
  
  // VAPID公開鍵取得
  const response = await fetch('/v1/notifications/vapid-public-key');
  const { publicKey } = await response.json();
  
  // プッシュ通知購読
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey
  });
  
  // サーバーに購読情報送信
  await fetch('/v1/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(subscription)
  });
}
```

### 通知テンプレート

#### 新着メッセージ
```javascript
{
  title: "New message from 田中さん",
  body: "商品について質問があります",
  icon: "/icons/chat-notification.png",
  tag: "chat-123",
  data: {
    type: "chat_message",
    chatId: "chat-123",
    messageId: "msg-456"
  },
  actions: [
    { action: "reply", title: "Reply", icon: "/icons/reply.png" },
    { action: "view_order", title: "View Order", icon: "/icons/order.png" }
  ]
}
```

#### 注文更新
```javascript
{
  title: "Order Update",
  body: "Your order status has been updated to: Shopping",
  icon: "/icons/order-update.png",
  tag: "order-789",
  data: {
    type: "order_update",
    orderId: "order-789",
    status: "shopping"
  },
  actions: [
    { action: "view_order", title: "View Order", icon: "/icons/view.png" }
  ]
}
```

## 設定

### 環境変数
```bash
# VAPID設定（Web Push用）
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@otsy.app

# JWT設定（WebSocket認証用）
JWT_SECRET=your-jwt-secret
```

### VAPID鍵生成
```bash
# web-pushライブラリを使用
npx web-push generate-vapid-keys

# または
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

## セキュリティ

### WebSocket認証
- JWT トークンによる接続時認証
- チャットルームへのアクセス権限チェック
- ロールベースアクセス制御

### プッシュ通知セキュリティ
- VAPID署名による送信者認証
- エンドポイント検証
- 無効な購読の自動削除

### データ保護
- メッセージの暗号化（HTTPS/WSS）
- 個人情報の適切な匿名化
- 監査ログによる操作追跡

## パフォーマンス最適化

### WebSocket最適化
- 接続プール管理
- 自動再接続機能
- ハートビート機能

### 通知最適化
- バッチ処理による効率化
- 重複通知の防止
- TTL設定による配信保証

### データベース最適化
- メッセージのページネーション
- インデックス最適化
- 古いメッセージのアーカイブ

## 監視・メトリクス

### WebSocket メトリクス
- 同時接続数
- メッセージ送信レート
- 接続エラー率
- 平均応答時間

### 通知メトリクス
- 通知送信成功率
- 配信遅延時間
- 購読者数の推移
- 通知タイプ別統計

### アラート設定
- WebSocket接続数異常
- 通知送信失敗率上昇
- メッセージ配信遅延
- システムエラー発生

## トラブルシューティング

### よくある問題

#### WebSocket接続エラー
```
Error: WebSocket connection failed
```
**解決方法**: 
- JWT トークンの有効性確認
- CORS設定の確認
- ファイアウォール設定確認

#### プッシュ通知が届かない
```
Error: Push subscription invalid
```
**解決方法**:
- VAPID鍵の設定確認
- Service Worker登録確認
- ブラウザ通知許可確認

#### メッセージが表示されない
**解決方法**:
- チャットルーム参加状態確認
- WebSocketイベントリスナー確認
- ネットワーク接続確認

### ログ確認
```bash
# WebSocket関連ログ
grep "WebSocket\|Socket.IO" logs/app.log

# 通知関連ログ
grep "notification\|push" logs/app.log

# チャット関連ログ
grep "chat\|message" logs/app.log
```

## 今後の拡張予定

### 機能拡張
- [ ] 音声メッセージ対応
- [ ] ビデオ通話機能
- [ ] ファイル共有機能
- [ ] メッセージ検索機能
- [ ] チャットボット統合

### パフォーマンス改善
- [ ] Redis による WebSocket スケーリング
- [ ] メッセージキューイング
- [ ] CDN による画像配信最適化
- [ ] プッシュ通知のバッチ処理改善

### 分析機能
- [ ] チャット分析ダッシュボード
- [ ] ユーザーエンゲージメント分析
- [ ] 通知効果測定
- [ ] A/Bテスト機能