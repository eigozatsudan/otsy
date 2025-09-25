# サブスクリプション・優先マッチングシステム

おつかいDXプラットフォームのサブスクリプション管理と優先マッチングシステムは、ユーザーの利用体験を向上させ、プレミアムサービスを提供します。

## 機能概要

### サブスクリプション管理
- **階層制サブスクリプション**: Free、Basic、Premium、VIPの4段階
- **柔軟な特典システム**: 各階層に応じた特典とサービス制限
- **サービスクレジット**: SLA違反時の補償システム
- **自動課金管理**: 月額課金とアップグレード/ダウングレード

### 優先マッチングシステム
- **スマートマッチング**: 複数要因を考慮した最適ショッパー選択
- **ショッパー評価システム**: 5段階評価とカテゴリ別評価
- **時間枠保証**: プレミアムユーザー向け配達時間保証
- **ショッパー設定管理**: 作業時間、配達範囲、注文設定

## サブスクリプション階層

### Free (無料)
```json
{
  "monthly_fee": 0,
  "benefits": {
    "priority_matching": false,
    "guaranteed_time_slots": 0,
    "free_deliveries": 0,
    "premium_shoppers": false,
    "dedicated_support": false,
    "service_credits_multiplier": 1.0,
    "max_concurrent_orders": 1,
    "early_access_features": false
  }
}
```

### Basic (¥980/月)
```json
{
  "monthly_fee": 980,
  "benefits": {
    "priority_matching": true,
    "guaranteed_time_slots": 4,
    "free_deliveries": 2,
    "premium_shoppers": false,
    "dedicated_support": false,
    "service_credits_multiplier": 1.2,
    "max_concurrent_orders": 2,
    "early_access_features": false
  }
}
```

### Premium (¥1,980/月)
```json
{
  "monthly_fee": 1980,
  "benefits": {
    "priority_matching": true,
    "guaranteed_time_slots": 12,
    "free_deliveries": 5,
    "premium_shoppers": true,
    "dedicated_support": true,
    "service_credits_multiplier": 1.5,
    "max_concurrent_orders": 3,
    "early_access_features": true
  }
}
```

### VIP (¥3,980/月)
```json
{
  "monthly_fee": 3980,
  "benefits": {
    "priority_matching": true,
    "guaranteed_time_slots": 24,
    "free_deliveries": 10,
    "premium_shoppers": true,
    "dedicated_support": true,
    "service_credits_multiplier": 2.0,
    "max_concurrent_orders": 5,
    "early_access_features": true
  }
}
```

## API エンドポイント

### サブスクリプション管理

#### サブスクリプション作成
```http
POST /v1/subscriptions
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "tier": "premium",
  "start_date": "2024-01-01T00:00:00Z",
  "payment_method_id": "pm_xxx",
  "promo_code": "WELCOME2024"
}
```

#### マイサブスクリプション取得
```http
GET /v1/subscriptions/my-subscription
Authorization: Bearer <user_token>
```

**レスポンス:**
```json
{
  "id": "sub-uuid",
  "user_id": "user-uuid",
  "tier": "premium",
  "status": "active",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-02-01T00:00:00Z",
  "next_billing_date": "2024-02-01T00:00:00Z",
  "monthly_fee": 1980,
  "benefits": {
    "priority_matching": true,
    "guaranteed_time_slots": 12,
    "free_deliveries": 5,
    "premium_shoppers": true,
    "dedicated_support": true,
    "service_credits_multiplier": 1.5,
    "max_concurrent_orders": 3,
    "early_access_features": true
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### サブスクリプション更新
```http
PUT /v1/subscriptions/my-subscription
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "tier": "vip"
}
```

#### サブスクリプション解約
```http
DELETE /v1/subscriptions/my-subscription
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "reason": "サービスを利用しなくなったため"
}
```

### サービスクレジット

#### サービスクレジット残高取得
```http
GET /v1/subscriptions/service-credits
Authorization: Bearer <user_token>
```

**レスポンス:**
```json
{
  "credits": [
    {
      "id": "credit-uuid",
      "amount": 1500,
      "original_amount": 1000,
      "reason": "sla_violation",
      "description": "配達遅延による補償",
      "expires_at": "2025-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_balance": 2500
}
```

#### サービスクレジット使用
```http
POST /v1/subscriptions/service-credits/use
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "order_id": "order-uuid",
  "amount": 500
}
```

### 特典確認

#### 機能アクセス確認
```http
GET /v1/subscriptions/benefits/check/premium_shoppers
Authorization: Bearer <user_token>
```

#### 制限値取得
```http
GET /v1/subscriptions/benefits/limit/max_concurrent_orders
Authorization: Bearer <user_token>
```

#### 同時注文制限確認
```http
GET /v1/subscriptions/concurrent-orders/check
Authorization: Bearer <user_token>
```

### マッチングシステム

#### ショッパー設定管理
```http
PUT /v1/matching/shopper/preferences
Authorization: Bearer <shopper_token>
Content-Type: application/json

{
  "max_distance_km": 15,
  "max_concurrent_orders": 3,
  "preferred_store_chains": ["セブンイレブン", "ファミリーマート"],
  "excluded_categories": ["アルコール", "タバコ"],
  "min_order_value": 1000,
  "accepts_premium_orders": true,
  "accepts_bulk_orders": false,
  "working_hours": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" },
    "wednesday": { "start": "09:00", "end": "18:00" },
    "thursday": { "start": "09:00", "end": "18:00" },
    "friday": { "start": "09:00", "end": "18:00" },
    "saturday": { "start": "10:00", "end": "16:00" },
    "sunday": { "start": "休み", "end": "休み" }
  }
}
```

#### ショッパー評価
```http
POST /v1/matching/ratings
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "order_id": "order-uuid",
  "rating": 5,
  "comment": "とても丁寧で迅速な対応でした",
  "would_recommend": true,
  "rating_categories": {
    "communication": 5,
    "item_quality": 5,
    "timeliness": 4,
    "professionalism": 5
  }
}
```

#### 時間枠保証リクエスト
```http
POST /v1/matching/time-slot-guarantee
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "requested_date": "2024-01-15T00:00:00Z",
  "time_slot": "10:00-12:00",
  "special_instructions": "玄関先に置いてください"
}
```

## マッチングアルゴリズム

### スコア計算要因

#### 距離要因 (0-25点)
- ショッパーと配達先の距離
- 近距離ほど高スコア

#### 評価要因 (0-25点)
- ショッパーの平均評価
- 評価数も考慮（新人ショッパーには基本点付与）

#### 可用性要因 (0-20点)
- 現在の注文数と最大受注数の比率
- 空きが多いほど高スコア

#### 設定適合要因 (0-15点)
- ショッパーの設定と注文内容の適合度
- 除外カテゴリ、最小注文金額、プレミアム注文対応など

#### サブスクリプション要因 (0-10点)
- ユーザーの優先マッチング権限
- ショッパーのプレミアム対応可否

#### 経験要因 (0-5点)
- 完了注文数に基づく経験値
- 10注文完了で満点

### マッチング例
```javascript
{
  "shopperId": "shopper-uuid",
  "score": 87.5,
  "factors": {
    "distance": 22.0,    // 2km (近距離)
    "rating": 23.0,      // 4.6/5.0 (高評価)
    "availability": 16.0, // 2/3注文 (余裕あり)
    "preference": 12.0,   // 設定適合
    "subscription": 10.0, // プレミアムマッチング
    "experience": 4.5     // 9注文完了
  }
}
```

## サービスクレジットシステム

### 付与理由
- **配達遅延**: 約束時間を30分以上超過
- **品質問題**: 商品の品質に問題があった場合
- **ショッパーキャンセル**: ショッパー都合でのキャンセル
- **システムエラー**: プラットフォーム側の問題
- **SLA違反**: サービスレベル合意違反
- **補償**: その他の補償

### 計算方法
```
最終クレジット = 基本金額 × サブスクリプション倍率

例：
- Free: 1000円 × 1.0 = 1000円
- Basic: 1000円 × 1.2 = 1200円  
- Premium: 1000円 × 1.5 = 1500円
- VIP: 1000円 × 2.0 = 2000円
```

### 使用ルール
- 注文時に自動適用または手動選択
- 古いクレジットから優先使用
- 有効期限は1年間
- 部分使用可能

## SLA (Service Level Agreement)

### 配達時間保証
- **Basic**: 指定時間±30分
- **Premium**: 指定時間±15分  
- **VIP**: 指定時間±10分

### 応答時間保証
- **Free**: チャット応答24時間以内
- **Basic**: チャット応答12時間以内
- **Premium**: チャット応答6時間以内、専用サポート
- **VIP**: チャット応答2時間以内、専用サポート

### 違反時の補償
```javascript
const compensationRules = {
  delivery_delay: {
    "30-60min": 200,
    "60-120min": 500,
    "120min+": 1000
  },
  quality_issue: {
    minor: 300,
    major: 800,
    severe: 1500
  },
  shopper_cancellation: {
    "< 2hours": 500,
    "< 30min": 1000
  }
};
```

## 管理機能

### サブスクリプション統計
```http
GET /v1/subscriptions/admin/stats
Authorization: Bearer <admin_token>
```

**レスポンス:**
```json
{
  "total_subscribers": 1250,
  "subscribers_by_tier": {
    "free": 800,
    "basic": 300,
    "premium": 120,
    "vip": 30
  },
  "monthly_revenue": 485400,
  "service_credits_issued": 125000,
  "service_credits_count": 89
}
```

### マッチング統計
```http
GET /v1/matching/admin/stats
Authorization: Bearer <admin_token>
```

### SLA違反処理
```http
POST /v1/subscriptions/admin/sla-violation
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "order_id": "order-uuid",
  "violation_type": "delivery_delay",
  "compensation_amount": 500
}
```

## セキュリティ

### アクセス制御
- JWT認証による API アクセス制御
- ロールベースアクセス制御 (RBAC)
- サブスクリプション特典の適切な検証

### データ保護
- 決済情報の暗号化
- 個人情報の適切な匿名化
- 監査ログによる操作追跡

### 不正利用防止
- サービスクレジットの重複付与防止
- 異常なアップグレード/ダウングレードの検出
- 不正評価の検出と対策

## パフォーマンス最適化

### マッチングアルゴリズム
- インデックス最適化による高速検索
- キャッシュによる計算結果の再利用
- 非同期処理による応答時間短縮

### データベース設計
- 適切なインデックス設計
- パーティショニングによる大量データ対応
- 読み取り専用レプリカの活用

## 監視・アラート

### 重要メトリクス
- サブスクリプション解約率
- マッチング成功率
- 平均マッチング時間
- SLA違反発生率

### アラート設定
- 解約率の異常上昇
- マッチング失敗率の上昇
- サービスクレジット大量発行
- システムエラー発生

## 今後の拡張予定

### サブスクリプション機能
- [ ] 年間プラン割引
- [ ] 企業向けプラン
- [ ] ファミリープラン
- [ ] 学生割引プラン

### マッチング機能
- [ ] AI による需要予測
- [ ] 動的価格設定
- [ ] ショッパーのスキル認定
- [ ] 地域別特化マッチング

### 分析機能
- [ ] ユーザー行動分析
- [ ] 収益最適化分析
- [ ] チャーン予測モデル
- [ ] LTV (Life Time Value) 分析