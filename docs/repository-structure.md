# リポジトリ構造定義書

## 1. ディレクトリ概要

```
jpyc-concierge/
├── .github/                    # GitHub設定
├── .steering/                  # 作業単位のドキュメント
├── docs/                       # 永続的ドキュメント
├── prisma/                     # Prismaスキーマ・マイグレーション
├── public/                     # 静的ファイル
├── src/                        # ソースコード
│   ├── app/                    # Next.js App Router
│   ├── components/             # Reactコンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── lib/                    # ユーティリティ・設定
│   ├── services/               # 外部サービス連携
│   ├── stores/                 # 状態管理（Zustand）
│   └── types/                  # 型定義
├── tests/                      # テストファイル
└── 設定ファイル群
```

## 2. 詳細構造

```
jpyc-concierge/
│
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD設定
│
├── .steering/                  # 作業単位のドキュメント
│   └── YYYYMMDD-feature-name/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
│
├── docs/                       # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   └── glossary.md
│
├── prisma/
│   ├── schema.prisma           # データベーススキーマ
│   └── migrations/             # マイグレーションファイル
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
│
├── src/
│   │
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # トップページ（チャット画面）
│   │   ├── globals.css         # グローバルスタイル
│   │   │
│   │   ├── admin/              # 管理者画面
│   │   │   ├── layout.tsx      # 管理者レイアウト
│   │   │   ├── page.tsx        # ログイン画面
│   │   │   └── orders/
│   │   │       ├── page.tsx    # 注文一覧
│   │   │       └── [id]/
│   │   │           └── page.tsx # 注文詳細
│   │   │
│   │   └── api/                # APIエンドポイント
│   │       ├── chat/
│   │       │   └── route.ts    # チャットAPI
│   │       ├── products/
│   │       │   └── search/
│   │       │       └── route.ts # 商品検索API
│   │       ├── orders/
│   │       │   ├── route.ts    # 注文一覧・作成
│   │       │   └── [id]/
│   │       │       └── route.ts # 注文詳細・更新
│   │       └── defi/
│   │           └── balance/
│   │               └── route.ts # DeFi残高API
│   │
│   ├── components/             # Reactコンポーネント
│   │   │
│   │   ├── chat/               # チャット関連
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ProductCard.tsx
│   │   │
│   │   ├── wallet/             # ウォレット関連
│   │   │   ├── WalletButton.tsx
│   │   │   ├── WalletModal.tsx
│   │   │   └── BalanceDisplay.tsx
│   │   │
│   │   ├── admin/              # 管理者画面関連
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── ui/                 # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   │
│   │   └── common/             # 共通コンポーネント
│   │       ├── Header.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorMessage.tsx
│   │
│   ├── hooks/                  # カスタムフック
│   │   ├── useChat.ts          # チャット操作
│   │   ├── useWallet.ts        # ウォレット操作
│   │   ├── useDefi.ts          # DeFi操作
│   │   ├── useOrders.ts        # 注文操作
│   │   └── useX402.ts          # x402決済
│   │
│   ├── lib/                    # ユーティリティ・設定
│   │   ├── api.ts              # APIクライアント
│   │   ├── chains.ts           # チェーン設定
│   │   ├── contracts.ts        # コントラクトアドレス
│   │   ├── prisma.ts           # Prismaクライアント
│   │   ├── utils.ts            # ユーティリティ関数
│   │   └── wagmi.ts            # Wagmi設定
│   │
│   ├── services/               # 外部サービス連携
│   │   │
│   │   ├── ai/                 # AIエージェント
│   │   │   ├── agent.ts        # メインエージェント
│   │   │   ├── prompts.ts      # プロンプト定義
│   │   │   └── tools.ts        # AIツール定義
│   │   │
│   │   ├── rakuten/            # 楽天API
│   │   │   └── client.ts
│   │   │
│   │   ├── secured-finance/    # secured.finance SDK
│   │   │   ├── client.ts       # SDKクライアント
│   │   │   └── utils.ts        # ヘルパー関数
│   │   │
│   │   └── x402/               # x402決済
│   │       ├── client.ts       # x402クライアント
│   │       └── facilitator.ts  # Facilitator連携
│   │
│   ├── stores/                 # 状態管理（Zustand）
│   │   ├── chatStore.ts        # チャット状態
│   │   ├── walletStore.ts      # ウォレット状態
│   │   └── orderStore.ts       # 注文状態
│   │
│   └── types/                  # 型定義
│       ├── chat.ts             # チャット関連型
│       ├── order.ts            # 注文関連型
│       ├── product.ts          # 商品関連型
│       └── defi.ts             # DeFi関連型
│
├── tests/                      # テストファイル
│   ├── unit/                   # ユニットテスト
│   │   ├── services/
│   │   └── utils/
│   └── e2e/                    # E2Eテスト（優先度低）
│       └── chat.spec.ts
│
├── .env.example                # 環境変数サンプル
├── .env.local                  # ローカル環境変数（git除外）
├── .eslintrc.json              # ESLint設定
├── .gitignore                  # Git除外設定
├── .npmrc                      # npm設定（GitHub Packages認証）
├── .prettierrc                 # Prettier設定
├── CLAUDE.md                   # プロジェクトメモリ
├── components.json             # shadcn/ui設定
├── next.config.ts              # Next.js設定
├── package.json                # パッケージ定義
├── pnpm-lock.yaml              # 依存関係ロック
├── postcss.config.js           # PostCSS設定
├── tailwind.config.ts          # Tailwind設定
├── tsconfig.json               # TypeScript設定
└── vitest.config.ts            # Vitest設定
```

## 3. ディレクトリ説明

### 3.1 src/app/

Next.js App Routerのルーティング構造。

| パス | 説明 |
|------|------|
| `/` | チャット画面（メイン） |
| `/admin` | 管理者ログイン |
| `/admin/orders` | 注文一覧 |
| `/admin/orders/[id]` | 注文詳細 |
| `/api/chat` | チャットAPI |
| `/api/products/search` | 商品検索API |
| `/api/orders` | 注文API |
| `/api/defi/balance` | DeFi残高API |

### 3.2 src/components/

Reactコンポーネントを機能別に整理。

| ディレクトリ | 説明 |
|-------------|------|
| `chat/` | チャットUI関連コンポーネント |
| `wallet/` | ウォレット接続関連コンポーネント |
| `admin/` | 管理者画面専用コンポーネント |
| `ui/` | shadcn/uiからインストールしたコンポーネント |
| `common/` | アプリ全体で使う共通コンポーネント |

### 3.3 src/services/

外部サービスとの連携ロジック。

| ディレクトリ | 説明 |
|-------------|------|
| `ai/` | OpenAI APIを使ったAIエージェント |
| `rakuten/` | 楽天商品検索API連携 |
| `secured-finance/` | secured.finance SDK連携 |
| `x402/` | x402プロトコル・Facilitator連携 |

### 3.4 src/hooks/

カスタムReactフック。

| ファイル | 説明 |
|---------|------|
| `useChat.ts` | チャット送受信、履歴管理 |
| `useWallet.ts` | ウォレット接続・残高取得 |
| `useDefi.ts` | secured.finance操作 |
| `useOrders.ts` | 注文CRUD操作 |
| `useX402.ts` | x402決済操作 |

### 3.5 src/stores/

Zustandによる状態管理。

| ファイル | 説明 |
|---------|------|
| `chatStore.ts` | 会話履歴、入力状態 |
| `walletStore.ts` | 接続状態、残高キャッシュ |
| `orderStore.ts` | 注文一覧キャッシュ |

### 3.6 src/lib/

ユーティリティと設定ファイル。

| ファイル | 説明 |
|---------|------|
| `api.ts` | fetch ラッパー、APIクライアント |
| `chains.ts` | ブロックチェーン設定（Sepolia等） |
| `contracts.ts` | コントラクトアドレス定義 |
| `prisma.ts` | Prismaクライアントのシングルトン |
| `utils.ts` | 汎用ユーティリティ（cn関数等） |
| `wagmi.ts` | Wagmi設定、コネクタ定義 |

### 3.7 src/types/

TypeScript型定義。

| ファイル | 説明 |
|---------|------|
| `chat.ts` | `ChatMessage`, `ChatAction`, `ChatResponse` |
| `order.ts` | `Order`, `OrderStatus`, `CreateOrderInput` |
| `product.ts` | `Product`, `ProductSearchResult` |
| `defi.ts` | `Position`, `DefiBalance`, `Maturity` |

## 4. ファイル命名規則

### 4.1 コンポーネント

- **PascalCase**: `ChatContainer.tsx`, `MessageBubble.tsx`
- 1ファイル1コンポーネント
- default exportを使用

### 4.2 フック

- **camelCase**: `useChat.ts`, `useWallet.ts`
- `use`プレフィックス必須

### 4.3 ユーティリティ・サービス

- **camelCase**: `client.ts`, `utils.ts`
- named exportを使用

### 4.4 型定義

- **camelCase**: `chat.ts`, `order.ts`
- named exportを使用
- 型名はPascalCase: `ChatMessage`, `Order`

### 4.5 API Routes

- `route.ts`固定（Next.js App Router規約）
- ディレクトリ名がパスになる

## 5. インポートパス

`tsconfig.json`でパスエイリアスを設定。

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 使用例

```typescript
// Good
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api";

// Bad
import { ChatContainer } from "../../../components/chat/ChatContainer";
```

### 5.1 依存関係ルール

各ディレクトリ間のインポート方向を定義。逆方向の依存は禁止。

```
┌─────────────────────────────────────────────────────────────┐
│                    依存関係図                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  app/                                                       │
│    ├──→ components/                                         │
│    ├──→ hooks/                                              │
│    ├──→ lib/                                                │
│    └──→ types/                                              │
│                                                             │
│  components/                                                │
│    ├──→ hooks/                                              │
│    ├──→ lib/                                                │
│    ├──→ types/                                              │
│    └──→ ui/ (shadcn)                                        │
│                                                             │
│  hooks/                                                     │
│    ├──→ services/                                           │
│    ├──→ stores/                                             │
│    ├──→ lib/                                                │
│    └──→ types/                                              │
│                                                             │
│  services/                                                  │
│    ├──→ lib/                                                │
│    └──→ types/                                              │
│                                                             │
│  stores/                                                    │
│    └──→ types/                                              │
│                                                             │
│  lib/                                                       │
│    └──→ types/                                              │
│                                                             │
│  types/                                                     │
│    └──→ なし（最下層）                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**禁止パターン:**

| 禁止 | 理由 |
|------|------|
| `services/` → `hooks/` | サービスは純粋なロジック層。React依存を避ける |
| `services/` → `components/` | UIに依存しない |
| `stores/` → `hooks/` | ストアはフックから利用される側 |
| `lib/` → `services/` | libは汎用ユーティリティ。特定サービスに依存しない |
| `types/` → 任意 | 型定義は最下層。他に依存しない |

## 6. 設定ファイル

### 6.1 .npmrc

secured.finance SDKのインストールに必要。

```
@secured-finance:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 6.2 .env.example

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jpyc_concierge"

# AI (OpenAI)
OPENAI_API_KEY="sk-..."

# Rakuten
RAKUTEN_APP_ID="..."

# Blockchain
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_JPYC_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_SF_SUBGRAPH_URL="https://..."

# x402
X402_FACILITATOR_URL="http://localhost:3002"
X402_FACILITATOR_PRIVATE_KEY="0x..."

# Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="..."
```

## 7. Git管理

### 7.1 .gitignore

```
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Build
.next/
out/
dist/

# Database
prisma/migrations/dev/

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

### 7.2 ブランチ戦略

| ブランチ | 用途 |
|---------|------|
| `main` | 本番用、安定版 |
| `develop` | 開発統合 |
| `feature/*` | 機能開発 |
| `fix/*` | バグ修正 |

## 8. スケーリング戦略

プロジェクトの成長に伴う構造の拡張方針。

### 8.1 コンポーネントの分割

| 状況 | 対応 |
|------|------|
| 1つのディレクトリに10+ファイル | サブディレクトリで機能別に分割 |
| 共通パターンが3回以上出現 | `common/` に抽出 |
| 特定ページ専用コンポーネント | `app/[page]/components/` に配置 |

**例: チャット機能の拡張**
```
components/chat/
├── ChatContainer.tsx
├── MessageList.tsx
├── messages/           # メッセージ関連を分割
│   ├── MessageBubble.tsx
│   ├── SystemMessage.tsx
│   └── ToolConfirmation.tsx
├── input/              # 入力関連を分割
│   ├── ChatInput.tsx
│   └── VoiceInput.tsx
└── cards/              # カード表示を分割
    ├── ProductCard.tsx
    └── DefiCard.tsx
```

### 8.2 サービスの追加

新しい外部サービス連携時は以下の構造を作成:

```
services/[service-name]/
├── client.ts           # APIクライアント
├── types.ts            # サービス固有の型（必要な場合）
└── utils.ts            # ヘルパー関数（必要な場合）
```

### 8.3 機能モジュール化

大規模化時はFeature-based構造への移行を検討:

```
src/
├── features/           # 機能別モジュール
│   ├── chat/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── defi/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   └── orders/
│       ├── components/
│       ├── hooks/
│       └── types.ts
├── shared/             # 共有リソース
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── app/                # ルーティングのみ
```

### 8.4 移行の判断基準

| 指標 | 閾値 | アクション |
|------|------|----------|
| 総ファイル数 | 100+ | Feature-based構造を検討 |
| 単一ディレクトリのファイル | 15+ | サブディレクトリで分割 |
| 重複コード | 3回以上 | 共通化・抽象化 |
| コンポーネント行数 | 300+ | 分割を検討 |
