# 初回実装タスクリスト

## 進捗サマリー

| カテゴリ | 完了 | 合計 | 進捗 |
|---------|------|------|------|
| 環境セットアップ | 5 | 5 | 100% |
| データベース | 2 | 3 | 67% |
| 型定義 | 3 | 3 | 100% |
| UIコンポーネント | 4 | 4 | 100% |
| チャット機能 | 6 | 6 | 100% |
| ウォレット接続 | 3 | 3 | 100% |
| 商品検索 | 3 | 3 | 100% |
| 管理者機能 | 4 | 4 | 100% |
| **合計** | **30** | **31** | **97%** |

---

## 1. 環境セットアップ

- [x] 1.1 依存関係インストール
  - shadcn/ui, wagmi, viem, zustand, prisma, ai, @ai-sdk/openai, zod
- [x] 1.2 shadcn/ui初期化・コンポーネント追加
  - button, input, card, badge, scroll-area, avatar
- [x] 1.3 環境変数設定（.env.example更新）
- [x] 1.4 Wagmi設定ファイル作成
- [x] 1.5 不要ファイル削除（mastraディレクトリ）

## 2. データベース

- [x] 2.1 Prismaスキーマ定義
- [ ] 2.2 マイグレーション実行（DATABASE_URL設定後に実行）
- [x] 2.3 Prismaクライアント設定（src/lib/prisma.ts）

## 3. 型定義

- [x] 3.1 chat.ts - チャット関連型
- [x] 3.2 order.ts - 注文関連型
- [x] 3.3 product.ts - 商品関連型

## 4. UIコンポーネント

- [x] 4.1 共通コンポーネント（Header, Loading）
- [x] 4.2 チャットコンポーネント
  - ChatContainer, MessageList, MessageBubble, ChatInput, ProductCard
- [x] 4.3 ウォレットコンポーネント
  - WalletButton
- [x] 4.4 管理者コンポーネント
  - LoginForm, OrderList, StatusBadge

## 5. チャット機能

- [x] 5.1 Zustand Store（chatStore.ts）
- [x] 5.2 useChat フック
- [x] 5.3 AIエージェント（services/ai/）
  - agent.ts, prompts.ts, tools.ts
- [x] 5.4 チャットAPI（/api/chat）
- [x] 5.5 チャット画面（app/page.tsx）
- [x] 5.6 プロバイダー設定（providers.tsx）

## 6. ウォレット接続

- [x] 6.1 Wagmi設定（lib/wagmi.ts）
- [x] 6.2 Wagmiフックを直接使用
  - WalletButton: useAccount, useConnect, useDisconnect
  - useSecuredFinance: usePublicClient, useWalletClient, useAccount
- [x] 6.3 WalletButtonコンポーネント実装

## 7. 商品検索

- [x] 7.1 楽天APIクライアント（services/rakuten/client.ts）
- [x] 7.2 AIツールに商品検索を追加
- [x] 7.3 モックデータ対応（RAKUTEN_APP_ID未設定時）

## 8. 管理者機能

- [x] 8.1 管理者認証API（/api/admin/login）
- [x] 8.2 注文API（/api/orders）
- [x] 8.3 管理者ログイン画面
- [x] 8.4 注文一覧画面

---

## 実装メモ

### 完了した内容

- Next.js 15 + React 19 + TypeScript環境構築
- Tailwind CSS v4 + shadcn/uiコンポーネント
- Vercel AI SDK（OpenAI GPT-4o-mini）でのチャット機能
- Wagmi + Viemでのウォレット接続（MetaMask）
- 楽天API連携（モックデータ対応）
- 管理者ダッシュボード（モックデータ対応）

### 保留事項

- DATABASE_URL設定後にPrismaマイグレーション実行
- 実際の楽天API接続（RAKUTEN_APP_ID設定後）
- 実際のOpenAI API接続（OPENAI_API_KEY設定後）

### 環境変数（必要）

```
OPENAI_API_KEY      # OpenAI APIキー
RAKUTEN_APP_ID      # 楽天APIアプリケーションID（任意、未設定時はモックデータ）
DATABASE_URL        # PostgreSQL接続URL（任意、未設定時はモックデータ）
ADMIN_USERNAME      # 管理者ユーザー名（デフォルト: admin）
ADMIN_PASSWORD      # 管理者パスワード（デフォルト: password）
```

### 動作確認

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build
```

### 画面URL

- `/` - チャット画面（ユーザー向け）
- `/admin` - 管理者ログイン
- `/admin/orders` - 注文一覧（管理者向け）
