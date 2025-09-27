# 決済システム (Stripe統合)

Otsyプラットフォームの決済システムは、Stripeを使用して安全で信頼性の高い決済処理を提供します。

## 機能概要

### 決済フロー
1. **事前認証**: 注文確定時に見積金額の120%を事前認証
2. **手動キャプチャ**: レシート承認後に実際の金額をキャプチャ
3. **返金処理**: 問題発生時やキャンセル時の返金対応
4. **初回保証**: 初回利用者への全額返金保証

### 対応決済手段
- クレジットカード (Visa, Mastercard, JCB, American Express)
- デビットカード
- コンビニ決済 (今後対応予定)
- 銀行振込 (今後対応予定)

## API エンドポイント

### ユーザー向けエンドポイント

#### 決済インテント作成
```http
POST /v1/payments/create-intent
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "order_id": "order-uuid",
  "amount": 1200,
  "description": "注文の決済",
  "metadata": {
    "custom_field": "value"
  }
}
```

**レスポンス:**
```json
{
  "id": "payment-uuid",
  "client_secret": "pi_xxx_secret_xxx",
  "status": "pending",
  "amount": 1200
}
```

#### 決済確認
```http
POST /v1/payments/{payment_id}/confirm
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "payment_method_id": "pm_xxx",
  "return_url": "https://app.example.com/return"
}
```

#### マイ決済履歴
```http
GET /v1/payments/my-payments
Authorization: Bearer <user_token>
```

### システム向けエンドポイント

#### 決済キャプチャ
```http
POST /v1/payments/{payment_id}/capture
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount_to_capture": 1000
}
```

#### 注文の決済サマリー
```http
GET /v1/payments/orders/{order_id}/summary
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "order_id": "order-uuid",
  "estimate_amount": 1000,
  "authorized_amount": 1200,
  "captured_amount": 1000,
  "refunded_amount": 0,
  "net_amount": 1000,
  "payment_status": "paid",
  "payments": [
    {
      "id": "payment-uuid",
      "status": "captured",
      "amount": 1000,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 管理者向けエンドポイント

#### 返金処理
```http
POST /v1/payments/{payment_id}/refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 500,
  "reason": "requested_by_customer",
  "description": "商品不備による返金",
  "metadata": {
    "support_ticket": "ticket-123"
  }
}
```

#### 初回保証返金
```http
POST /v1/payments/orders/{order_id}/first-time-guarantee
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "user_id": "user-uuid"
}
```

#### 決済統計
```http
GET /v1/payments/stats/overview
Authorization: Bearer <admin_token>
```

## 決済統合サービス

`PaymentIntegrationService`は注文システムとの統合を簡素化します：

### 自動認証
```typescript
await paymentIntegration.authorizeOrderPayment(orderId, userId);
```

### 自動キャプチャ
```typescript
await paymentIntegration.captureOrderPayment(orderId, actualAmount);
```

### 返金処理
```typescript
await paymentIntegration.refundOrderPayment(
  orderId,
  RefundReason.QUALITY_ISSUE,
  actorId,
  'admin',
  amount,
  '商品品質問題による返金'
);
```

## Webhook処理

Stripeからのwebhookイベントを処理します：

```http
POST /v1/payments/webhook
Stripe-Signature: <signature>
Content-Type: application/json
```

### 対応イベント
- `payment_intent.succeeded`: 決済成功
- `payment_intent.payment_failed`: 決済失敗
- `charge.dispute.created`: チャージバック発生

## 設定

### 環境変数
```bash
# Stripe設定
STRIPE_SECRET_KEY=sk_test_xxx  # 本番環境では sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# 通貨設定（固定）
PAYMENT_CURRENCY=jpy
```

### Stripe設定
1. Stripeダッシュボードでwebhookエンドポイントを設定
2. 以下のイベントを有効化：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`

## セキュリティ

### 認証・認可
- JWT認証による API アクセス制御
- ロールベースアクセス制御 (RBAC)
- 決済データへの適切なアクセス権限管理

### データ保護
- Stripe PCI DSS準拠による安全な決済処理
- 機密情報のログ出力禁止
- webhook署名検証による不正リクエスト防止

### 監査ログ
すべての決済操作は`order_audit_log`テーブルに記録：
- 決済インテント作成
- 決済確認
- キャプチャ実行
- 返金処理

## エラーハンドリング

### 一般的なエラー
- `400 Bad Request`: 無効なリクエストパラメータ
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 権限不足
- `404 Not Found`: 決済・注文が見つからない
- `500 Internal Server Error`: Stripe API エラー

### Stripe固有エラー
- カード拒否
- 不十分な残高
- 期限切れカード
- 3Dセキュア認証が必要

## テスト

### 単体テスト
```bash
npm run test -- payments.service.spec.ts
```

### E2Eテスト
```bash
npm run test:e2e -- payments.e2e-spec.ts
```

### Stripeテストカード
```
# 成功するカード
4242424242424242

# 3Dセキュア認証が必要
4000002500003155

# 拒否されるカード
4000000000000002
```

## 監視・アラート

### 重要メトリクス
- 決済成功率
- 平均決済処理時間
- 返金率
- チャージバック率

### アラート条件
- 決済成功率が95%を下回る
- webhook処理エラーが発生
- 異常な返金パターンを検出

## 今後の拡張予定

### 決済手段追加
- [ ] コンビニ決済 (Stripe Terminal)
- [ ] 銀行振込
- [ ] PayPay等のQR決済
- [ ] Apple Pay / Google Pay

### 機能拡張
- [ ] 分割払い対応
- [ ] 定期決済 (サブスクリプション)
- [ ] ポイント・クーポン連携
- [ ] 決済手数料の動的計算

## トラブルシューティング

### よくある問題

#### Webhook署名エラー
```
Error: Invalid webhook signature
```
**解決方法**: `STRIPE_WEBHOOK_SECRET`の設定を確認

#### 決済キャプチャ失敗
```
Error: Payment is not authorized for capture
```
**解決方法**: 決済ステータスが`authorized`であることを確認

#### 返金処理エラー
```
Error: Payment is not captured and cannot be refunded
```
**解決方法**: 決済がキャプチャ済みであることを確認

### ログ確認
```bash
# 決済関連ログ
grep "payment" logs/app.log

# Stripeエラーログ
grep "Stripe" logs/error.log
```