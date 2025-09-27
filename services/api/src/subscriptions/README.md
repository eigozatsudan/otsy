# サブスクリプション・優先マッチングシステム

Otsyプラットフォームのサブスクリプションシステムは、ユーザーに段階的なサービス向上と優先マッチング機能を提供します。

## 機能概要

### サブスクリプション階層
- **Free**: 基本的な注文機能（月5回まで）
- **Basic**: 月20回注文、10%配送料割引、優先サポート
- **Premium**: 月50回注文、20%割引、優先マッチング、時間帯保証
- **VIP**: 無制限注文、30%割引、専用サポート、即日配送保証

### 優先マッチングシステム
- **互換性スコア**: ショッパーとの適合度を100点満点で評価
- **地理的最適化**: 距離と配送時間を考慮した最適マッチング
- **設定ベースマッチング**: ユーザーとショッパーの設定に基づく自動マッチング
- **リアルタイム可用性**: オンライン状態と現在の注文数を考慮

### サービスクレジット
- **遅延補償**: 配送遅延時の自動クレジット付与
- **品質保証**: 初回利用者への全額返金保証
- **有効期限管理**: 6ヶ月の有効期限とFIFO使用

## API エンドポイント

### サブスクリプション管理

#### サブスクリプション作成
```http
POST /v1/subscriptions
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "tier": "premium",
  "preferred_time_slots": ["morning", "evening"],
  "default_priority": "express",
  "preferred_store_types": ["supermarket", "pharmacy"],
  "max_delivery_distance": 15,
  "auto_accept_orders": false
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
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-02-01T00:00:00Z",
  "preferred_time_slots": ["morning", "evening"],
  "default_priority": "express",
  "orders_this_period": 15,
  "orders_limit": 50,
  "priority_orders_used": 3,
  "priority_orders_limit": 10,
  "service_credits": 500
}
```

#### サブスクリプション使用状況
```http
GET /v1/subscriptions/usage
Authorization: Bearer <user_token>
```

#### サブスクリプションアップグレード
```http
POST /v1/subscriptions/upgrade
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "new_tier": "vip",
  "prorate": true
}
```

#### サブスクリプションキャンセル
```http
POST /v1/subscriptions/cancel
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "reason": "Moving to different area",
  "feedback": "Great service, but no longer needed",
  "cancel_immediately": false
}
```

### マッチングシステム

#### ショッパー検索
```http
POST /v1/matching/find-shoppers
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "order_id": "order-uuid",
  "priority": "express",
  "max_distance": 20,
  "preferred_time_slot": "morning",
  "min_shopper_rating": 4.0,
  "subscriber_only": true
}
```

**レスポンス:**
```json
[
  {
    "shopper_id": "shopper-uuid",
    "shopper_name": "田中 太郎",
    "shopper_rating": 4.8,
    "distance": 2.3,
    "estimated_delivery_time": 45,
    "compatibility_score": 92,
    "is_preferred_shopper": true,
    "subscription_tier": "premium",
    "reasons": [
      "Rating: 24.0",
      "Success rate: 19.2",
      "Distance: 17.7",
      "Time slot: 15.0",
      "Online bonus: 5"
    ]
  }
]
```

#### 自動アサイン
```http
POST /v1/matching/auto-assign/{order_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "priority": "urgent",
  "max_distance": 25
}
```

### ショッパー設定

#### ショッパー設定取得
```http
GET /v1/matching/shopper/preferences
Authorization: Bearer <shopper_token>
```

#### ショッパー設定更新
```http
PUT /v1/matching/shopper/preferences
Authorization: Bearer <shopper_token>
Content-Type: application/json

{
  "available_time_slots": ["morning", "afternoon"],
  "preferred_store_types": ["supermarket", "convenience"],
  "max_delivery_distance": 25,
  "max_concurrent_orders": 3,
  "accepts_urgent_orders": true,
  "accepts_large_orders": true,
  "min_order_value": 500,
  "max_order_value": 10000
}
```

#### 可用性設定
```http
POST /v1/matching/shopper/set-availability
Authorization: Bearer <shopper_token>
Content-Type: application/json

{
  "is_available": false,
  "unavailable_until": "2024-01-15T18:00:00Z",
  "reason": "Personal appointment"
}
```

### 評価システム

#### ショッパー評価
```http
POST /v1/matching/rate-shopper/{order_id}
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "overall_rating": 5,
  "communication_rating": 5,
  "accuracy_rating": 4,
  "timeliness_rating": 5,
  "comment": "Excellent service! Very professional and fast.",
  "tags": ["friendly", "fast", "accurate"]
}
```

#### ショッパー評価取得
```http
GET /v1/matching/shopper/{shopper_id}/ratings?page=1&limit=10
Authorization: Bearer <token>
```

#### ショッパー統計
```http
GET /v1/matching/shopper/{shopper_id}/stats
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "total_orders": 156,
  "avg_rating": 4.7,
  "success_rate": 98.5,
  "avg_delivery_time": 42,
  "total_earnings": 234500,
  "rating_breakdown": {
    "5_star": 78,
    "4_star": 12,
    "3_star": 2,
    "2_star": 0,
    "1_star": 0
  }
}
```

### サービスクレジット

#### クレジット追加（管理者）
```http
POST /v1/subscriptions/admin/service-credits/{user_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 500,
  "reason": "delivery_delay",
  "description": "Order was delayed by 30 minutes",
  "order_id": "order-uuid"
}
```

#### マイクレジット取得
```http
GET /v1/subscriptions/service-credits
Authorization: Bearer <user_token>
```

## サブスクリプション階層詳細

### Free階層
```json
{
  "name": "Free",
  "price_monthly": 0,
  "orders_per_month": 5,
  "priority_orders_per_month": 0,
  "delivery_fee_discount": 0,
  "priority_matching": false,
  "guaranteed_time_slots": false,
  "dedicated_support": false,
  "service_credits_on_delay": 0,
  "max_concurrent_orders": 1,
  "features": [
    "Basic order placement",
    "Standard delivery"
  ]
}
```

### Basic階層
```json
{
  "name": "Basic",
  "price_monthly": 980,
  "orders_per_month": 20,
  "priority_orders_per_month": 2,
  "delivery_fee_discount": 10,
  "priority_matching": false,
  "guaranteed_time_slots": false,
  "dedicated_support": false,
  "service_credits_on_delay": 100,
  "max_concurrent_orders": 2,
  "features": [
    "20 orders/month",
    "10% delivery discount",
    "Priority support"
  ]
}
```

### Premium階層
```json
{
  "name": "Premium",
  "price_monthly": 1980,
  "orders_per_month": 50,
  "priority_orders_per_month": 10,
  "delivery_fee_discount": 20,
  "priority_matching": true,
  "guaranteed_time_slots": true,
  "dedicated_support": true,
  "service_credits_on_delay": 200,
  "max_concurrent_orders": 3,
  "features": [
    "50 orders/month",
    "20% delivery discount",
    "Priority matching",
    "Guaranteed time slots"
  ]
}
```

### VIP階層
```json
{
  "name": "VIP",
  "price_monthly": 3980,
  "orders_per_month": -1,
  "priority_orders_per_month": -1,
  "delivery_fee_discount": 30,
  "priority_matching": true,
  "guaranteed_time_slots": true,
  "dedicated_support": true,
  "service_credits_on_delay": 500,
  "max_concurrent_orders": 5,
  "features": [
    "Unlimited orders",
    "30% delivery discount",
    "VIP matching",
    "Dedicated support",
    "Same-day guarantee"
  ]
}
```

## マッチングアルゴリズム

### 互換性スコア計算

#### 評価要素（合計100点）
1. **ショッパー評価** (0-25点): `(rating / 5) * 25`
2. **成功率** (0-20点): `(success_rate / 100) * 20`
3. **距離** (0-20点): `max(0, 20 - (distance / max_distance) * 20)`
4. **時間帯適合性** (0-15点): 設定マッチで15点、不一致で0点
5. **店舗タイプ適合性** (0-10点): `(matching_types / total_types) * 10`
6. **注文金額適合性** (0-10点): 設定範囲内で10点、範囲外で減点
7. **オンライン状態ボーナス** (0-5点): オンラインで5点
8. **可用性ボーナス** (0-5点): `max(0, 5 - current_orders)`

#### サブスクリプション優先度
- **VIP/Premium**: サブスクリプション持ちショッパーを優先
- **Basic**: 標準マッチング
- **Free**: 標準マッチング

### 地理的最適化
```javascript
// Haversine距離計算
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球の半径（km）
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### 配送時間推定
```javascript
function estimateDeliveryTime(distance, avgDeliveryTime) {
  const shoppingTime = 30; // 基本買い物時間（分）
  const travelTime = distance * 3; // 移動時間（km当たり3分）
  const baseEstimate = shoppingTime + travelTime;
  
  // ショッパーの過去実績で調整
  if (avgDeliveryTime > 0) {
    return Math.round((baseEstimate + avgDeliveryTime) / 2);
  }
  
  return Math.round(baseEstimate);
}
```

## 管理機能

### 管理者統計
```http
GET /v1/subscriptions/admin/stats
Authorization: Bearer <admin_token>
```

**レスポンス:**
```json
{
  "total_subscriptions": 1250,
  "active_subscriptions": 1180,
  "subscriptions_by_tier": {
    "free": 450,
    "basic": 520,
    "premium": 180,
    "vip": 30
  },
  "monthly_revenue": 1456000,
  "churn_rate": 5.2
}
```

### マッチング統計
```http
GET /v1/matching/analytics/matching-stats
Authorization: Bearer <admin_token>
```

**レスポンス:**
```json
{
  "total_matches": 5420,
  "successful_matches": 5180,
  "success_rate": 95.6,
  "avg_matching_time": 8.5,
  "top_shoppers": [
    {
      "id": "shopper-1",
      "name": "田中 太郎",
      "total_orders": 156,
      "avg_rating": 4.8
    }
  ]
}
```

### サブスクリプション更新処理
```http
POST /v1/subscriptions/admin/process-renewals
Authorization: Bearer <admin_token>
```

## 自動化機能

### サブスクリプション更新
- **月次更新**: 期間終了時の自動更新
- **使用量リセット**: 注文回数・優先注文回数のリセット
- **請求処理**: Stripe連携による自動請求

### サービスクレジット管理
- **自動付与**: 配送遅延時の自動クレジット付与
- **有効期限管理**: 6ヶ月後の自動失効
- **FIFO使用**: 古いクレジットから優先使用

### マッチング最適化
- **リアルタイム更新**: ショッパーの可用性リアルタイム追跡
- **動的調整**: 需要に応じたマッチング基準の動的調整
- **緊急マッチング**: 通常マッチング失敗時の拡張検索

## パフォーマンス最適化

### データベース最適化
- **インデックス**: 地理的検索用のGiSTインデックス
- **キャッシュ**: ショッパー評価・統計のRedisキャッシュ
- **分割**: 大量データの時系列分割

### アルゴリズム最適化
- **並列処理**: 複数ショッパーの同時評価
- **早期終了**: 十分なマッチが見つかった時点での処理終了
- **バッチ処理**: 複数注文の一括マッチング

## セキュリティ

### アクセス制御
- **ロールベース**: ユーザー・ショッパー・管理者の権限分離
- **データ保護**: 個人情報の適切な匿名化
- **監査ログ**: 全ての重要操作の記録

### 不正防止
- **評価操作防止**: 同一注文の重複評価防止
- **サブスクリプション不正**: 重複サブスクリプションの防止
- **クレジット不正**: サービスクレジットの不正使用防止

## 監視・アラート

### KPI監視
- **サブスクリプション解約率**: 月次解約率の監視
- **マッチング成功率**: リアルタイムマッチング成功率
- **ショッパー稼働率**: アクティブショッパーの割合
- **収益指標**: ARR、ARPU、LTVの追跡

### アラート設定
- **解約率上昇**: 解約率が閾値を超えた場合
- **マッチング失敗**: マッチング成功率低下
- **ショッパー不足**: 利用可能ショッパー数不足
- **システム負荷**: API応答時間の悪化

## 今後の拡張予定

### 機能拡張
- [ ] 企業向けサブスクリプション
- [ ] 家族プラン・グループプラン
- [ ] ポイント・リワードプログラム
- [ ] AI予測による需要予測マッチング

### 分析機能
- [ ] 機械学習による最適マッチング
- [ ] 予測分析ダッシュボード
- [ ] A/Bテスト機能
- [ ] カスタマーセグメンテーション

### 国際化
- [ ] 多通貨対応
- [ ] 地域別価格設定
- [ ] 現地決済手段対応
- [ ] 多言語サポート