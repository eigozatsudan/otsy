# Otsy Admin Web Application

管理者向けのWebアプリケーションです。注文管理、ユーザー管理、買い物代行者管理、支払い管理、システム設定などの機能を提供します。

## 機能

### 🏠 ダッシュボード
- システム全体の統計情報表示
- 最近の注文一覧
- リアルタイムデータ更新

### 📦 注文管理
- 全注文の一覧表示とフィルタリング
- 注文詳細の確認
- 注文ステータスの更新
- レシート画像の確認

### 👥 ユーザー管理
- 顧客と買い物代行者の管理
- ユーザーアカウントの有効化/無効化
- ユーザー統計情報の表示

### 🛒 買い物代行者管理
- 買い物代行者のパフォーマンス確認
- 評価とレビューの管理
- 稼働状況の監視

### 💳 支払い管理
- 支払いトランザクションの管理
- Stripe決済の確定と返金処理
- 支払い統計の表示

### ⚙️ システム設定
- サービス料金の設定
- 営業時間の管理
- 支払い方法の設定
- 運用ルールの設定

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Authentication**: JWT Token based

## 開発環境のセットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 開発サーバーの起動:
```bash
npm run dev
```

3. ブラウザで http://localhost:3002 にアクセス

## ビルドとデプロイ

```bash
# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start
```

## 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Otsy Admin
```

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # 管理画面ページ
│   ├── login/            # ログインページ
│   └── layout.tsx        # ルートレイアウト
├── components/           # 再利用可能なコンポーネント
│   ├── layout/          # レイアウトコンポーネント
│   └── ui/              # UIコンポーネント
├── lib/                 # ユーティリティとAPI
│   ├── api.ts          # APIクライアント
│   └── utils.ts        # ユーティリティ関数
├── store/              # 状態管理
│   └── auth.ts         # 認証ストア
└── styles/             # スタイルファイル
    └── globals.css     # グローバルスタイル
```

## 主要なページ

- `/` - ホーム（認証状態に応じてリダイレクト）
- `/login` - 管理者ログイン
- `/dashboard` - ダッシュボード
- `/dashboard/orders` - 注文管理
- `/dashboard/orders/[id]` - 注文詳細
- `/dashboard/users` - ユーザー管理
- `/dashboard/shoppers` - 買い物代行者管理
- `/dashboard/payments` - 支払い管理
- `/dashboard/settings` - システム設定

## 認証

- JWT トークンベースの認証
- ミドルウェアによる保護されたルートの管理
- 自動ログアウト機能

## レスポンシブデザイン

- モバイルファーストのデザイン
- タブレットとデスクトップに対応
- サイドバーの折りたたみ機能

## セキュリティ

- CSRF保護
- XSS対策
- 認証トークンの安全な管理
- 管理者権限の検証