# トラブルシューティングガイド

## 既知の問題と解決方法

### 1. TypeScript型エラー

#### 問題: `Cannot find module 'zustand'` などの依存関係エラー
**解決方法:**
```bash
# ルートディレクトリで依存関係を再インストール
pnpm install

# 特定のワークスペースで依存関係を確認
pnpm -F @otsukai/admin-web install
```

#### 問題: `Parameter implicitly has 'any' type`
**解決方法:**
- TypeScript設定で `noImplicitAny: false` を一時的に設定
- または明示的に型を指定

### 2. ビルドエラー

#### 問題: UIパッケージのビルドが失敗する
**解決方法:**
```bash
# UIパッケージをクリーンビルド
pnpm -F @otsukai/ui clean
pnpm -F @otsukai/ui build
```

#### 問題: Tailwind CSSクラスが適用されない
**解決方法:**
- `postcss.config.js` が存在することを確認
- `tailwind.config.js` の `content` パスが正しいことを確認

### 3. 開発環境の問題

#### 問題: Hot reloadが動作しない
**解決方法:**
```bash
# 開発サーバーを再起動
pnpm dev
```

#### 問題: 環境変数が読み込まれない
**解決方法:**
- `.env.local` ファイルが正しい場所にあることを確認
- Next.jsでは `NEXT_PUBLIC_` プレフィックスが必要

### 4. API関連の問題

#### 問題: CORS エラー
**解決方法:**
- APIサーバーのCORS設定を確認
- 開発環境では `next.config.js` でプロキシ設定を追加

#### 問題: 認証トークンが保存されない
**解決方法:**
- ブラウザのlocalStorageを確認
- Zustand persistの設定を確認

### 5. Storybook関連の問題

#### 問題: Storybookが起動しない
**解決方法:**
```bash
# Storybookの依存関係を再インストール
pnpm -F @otsukai/ui install
pnpm -F @otsukai/ui storybook
```

## 推奨される開発フロー

1. **初期セットアップ:**
```bash
pnpm install
pnpm build
```

2. **開発開始:**
```bash
# 全サービスを同時に起動
pnpm dev

# または個別に起動
pnpm -F @otsukai/api dev
pnpm -F @otsukai/user-web dev
pnpm -F @otsukai/shopper-web dev
pnpm -F @otsukai/admin-web dev
```

3. **型チェック:**
```bash
pnpm type-check
```

4. **リンティング:**
```bash
pnpm lint
```

## パフォーマンス最適化

### 1. バンドルサイズの最適化
- 不要なライブラリのインポートを避ける
- Tree shakingを活用する
- Dynamic importを使用する

### 2. 画像最適化
- Next.js Image コンポーネントを使用
- WebP形式を優先
- 適切なサイズ指定

### 3. API最適化
- レスポンスキャッシュの活用
- ページネーションの実装
- 不要なデータの除外

## セキュリティ考慮事項

### 1. 認証・認可
- JWTトークンの適切な管理
- リフレッシュトークンの実装
- セッションタイムアウトの設定

### 2. データ保護
- 機密データの暗号化
- XSS対策の実装
- CSRF保護の有効化

### 3. API セキュリティ
- レート制限の実装
- 入力値検証
- SQLインジェクション対策

## デプロイメント

### 1. 本番環境の準備
```bash
# 本番ビルド
pnpm build

# 型チェックとリンティング
pnpm type-check
pnpm lint
```

### 2. 環境変数の設定
- 本番用の環境変数を設定
- シークレットキーの管理
- データベース接続情報

### 3. モニタリング
- エラートラッキングの設定
- パフォーマンス監視
- ログ管理

## サポート

問題が解決しない場合は、以下を確認してください：

1. Node.jsのバージョン（18.0.0以上）
2. pnpmのバージョン（最新版推奨）
3. 依存関係の整合性
4. 環境変数の設定

詳細なログとエラーメッセージを含めて報告してください。