# @otsukai/ui

Otsukai DXプラットフォーム用の共有UIコンポーネントライブラリです。

## 概要

このパッケージは、ユーザーWebアプリ、買い物代行者Webアプリ、管理者Webアプリで共通して使用されるUIコンポーネントを提供します。

## 特徴

- **一貫性のあるデザイン**: 全アプリケーション間で統一されたUI/UX
- **TypeScript完全対応**: 型安全性とIntelliSenseサポート
- **Tailwind CSS**: ユーティリティファーストのスタイリング
- **アクセシビリティ**: WCAG準拠のアクセシブルなコンポーネント
- **レスポンシブデザイン**: モバイルファーストのレスポンシブ対応
- **Storybook**: コンポーネントのドキュメントと開発環境

## インストール

```bash
# pnpm workspace内で自動的にインストールされます
pnpm install
```

## 使用方法

```tsx
import { Button, Card, OrderCard } from '@otsukai/ui';

function MyComponent() {
  return (
    <Card>
      <OrderCard
        id="order-123"
        customerName="田中太郎"
        status="pending"
        total={1200}
        items={[
          { id: '1', name: 'りんご', quantity: 3, price: 150 }
        ]}
        createdAt="2024-01-15T10:00:00Z"
      />
      <Button variant="primary">
        注文を確認
      </Button>
    </Card>
  );
}
```

## コンポーネント一覧

### 基本UIコンポーネント

- **Button**: 各種バリエーションのボタンコンポーネント
- **Input**: テキスト入力フィールド
- **Textarea**: 複数行テキスト入力
- **Card**: コンテンツカード
- **Badge**: ステータス表示バッジ
- **Modal**: モーダルダイアログ
- **Alert**: アラート・通知コンポーネント
- **LoadingSpinner**: ローディング表示

### ビジネス固有コンポーネント

- **OrderCard**: 注文情報カード
- **StatusIndicator**: ステータス表示インジケーター
- **StatusTimeline**: ステータス進行表示

### レイアウトコンポーネント

- **Header**: アプリケーションヘッダー
- **Sidebar**: サイドバーナビゲーション

### フォームコンポーネント

- **FormField**: 統一されたフォームフィールド
- **SearchInput**: 検索入力フィールド

## ユーティリティ

### フォーマット関数

```tsx
import { formatCurrency, formatDate, formatRelativeTime } from '@otsukai/ui';

formatCurrency(1200); // "¥1,200"
formatDate(new Date()); // "2024年1月15日"
formatRelativeTime(new Date(Date.now() - 60000)); // "1分前"
```

### スタイリングユーティリティ

```tsx
import { cn } from '@otsukai/ui';

// Tailwindクラスの結合と競合解決
const className = cn('bg-blue-500', 'bg-red-500'); // "bg-red-500"
```

## デザインシステム

### カラーパレット

- **Primary**: ブルー系（#3b82f6）
- **Success**: グリーン系（#22c55e）
- **Warning**: イエロー系（#f59e0b）
- **Error**: レッド系（#ef4444）

### タイポグラフィ

- **フォント**: Inter（日本語はシステムフォント）
- **サイズ**: text-sm, text-base, text-lg, text-xl, text-2xl

### スペーシング

- **基本単位**: 4px（Tailwindの標準）
- **コンポーネント間**: 16px（space-y-4）
- **セクション間**: 24px（space-y-6）

## Storybook

コンポーネントのドキュメントと開発環境：

```bash
# Storybookの起動
pnpm storybook

# Storybookのビルド
pnpm build-storybook
```

http://localhost:6006 でStorybookにアクセスできます。

## 開発ガイドライン

### 新しいコンポーネントの追加

1. `src/components/` 内に適切なカテゴリフォルダを作成
2. TypeScriptでコンポーネントを実装
3. Storybookストーリーを作成
4. `src/index.ts` にエクスポートを追加

### スタイリング規則

- Tailwind CSSのユーティリティクラスを使用
- カスタムCSSは最小限に抑制
- `cn()` 関数でクラスの結合と競合解決
- レスポンシブデザインを考慮

### アクセシビリティ

- セマンティックなHTML要素を使用
- ARIA属性の適切な設定
- キーボードナビゲーション対応
- スクリーンリーダー対応

## ビルドとデプロイ

```bash
# TypeScriptコンパイル
pnpm build

# 型チェック
pnpm type-check

# リンティング
pnpm lint
```

## 依存関係

- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Storybook 7+

## ライセンス

このプロジェクトはプライベートライセンスです。