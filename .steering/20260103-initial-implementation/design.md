# 初回実装設計書

## 1. 実装アプローチ

### 1.1 実装順序

```
1. 環境セットアップ・依存関係インストール
   ↓
2. データベーススキーマ定義（Prisma）
   ↓
3. 型定義（types/）
   ↓
4. UIコンポーネント（shadcn/ui）
   ↓
5. チャット機能（フロント→バック）
   ↓
6. ウォレット接続
   ↓
7. 商品検索API
   ↓
8. 管理者ダッシュボード
```

### 1.2 ディレクトリ構造（MVP）

```
src/
├── app/
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # チャット画面
│   ├── globals.css          # グローバルスタイル
│   ├── providers.tsx        # プロバイダー（Wagmi, Query）
│   │
│   ├── admin/
│   │   ├── page.tsx         # ログイン画面
│   │   └── orders/
│   │       └── page.tsx     # 注文一覧
│   │
│   └── api/
│       ├── chat/
│       │   └── route.ts     # チャットAPI
│       ├── products/
│       │   └── search/
│       │       └── route.ts # 商品検索API
│       ├── orders/
│       │   └── route.ts     # 注文API
│       └── admin/
│           └── login/
│               └── route.ts # 管理者認証API
│
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── ProductCard.tsx
│   │
│   ├── wallet/
│   │   ├── WalletButton.tsx
│   │   └── BalanceDisplay.tsx
│   │
│   ├── admin/
│   │   ├── LoginForm.tsx
│   │   ├── OrderList.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── common/
│   │   ├── Header.tsx
│   │   └── Loading.tsx
│   │
│   └── ui/                  # shadcn/ui
│
├── hooks/
│   ├── useChat.ts
│   └── useWallet.ts
│
├── lib/
│   ├── prisma.ts
│   ├── utils.ts
│   └── wagmi.ts
│
├── services/
│   ├── ai/
│   │   ├── agent.ts
│   │   ├── prompts.ts
│   │   └── tools.ts
│   │
│   └── rakuten/
│       └── client.ts
│
├── stores/
│   └── chatStore.ts
│
└── types/
    ├── chat.ts
    ├── order.ts
    └── product.ts
```

## 2. コンポーネント設計

### 2.1 チャット画面

```
┌─────────────────────────────────────────────┐
│  Header                                     │
│  ┌───────────────────────────────────────┐  │
│  │ JPYC Concierge    [Wallet Button]     │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ChatContainer                              │
│  ┌───────────────────────────────────────┐  │
│  │ MessageList                           │  │
│  │ ┌─────────────────────────────────┐   │  │
│  │ │ MessageBubble (AI)              │   │  │
│  │ └─────────────────────────────────┘   │  │
│  │          ┌─────────────────────────┐  │  │
│  │          │ MessageBubble (User)    │  │  │
│  │          └─────────────────────────┘  │  │
│  │ ┌─────────────────────────────────┐   │  │
│  │ │ ProductCard (商品提案時)         │   │  │
│  │ └─────────────────────────────────┘   │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ ChatInput                             │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 コンポーネント責務

| コンポーネント | 責務 |
|---------------|------|
| Header | ロゴ表示、ウォレットボタン配置 |
| ChatContainer | チャット全体のレイアウト管理 |
| MessageList | メッセージ一覧の表示、スクロール管理 |
| MessageBubble | 個別メッセージの表示（AI/User切り替え） |
| ChatInput | メッセージ入力、送信ボタン |
| ProductCard | 商品情報のカード表示 |
| WalletButton | 接続/切断ボタン、アドレス表示 |
| BalanceDisplay | JPYC残高表示 |

## 3. API設計

### 3.1 POST /api/chat

**リクエスト:**
```typescript
{
  message: string;
  walletAddress?: string;
  conversationId?: string;
}
```

**レスポンス:**
```typescript
{
  response: string;
  conversationId: string;
  products?: Product[];  // 商品検索時のみ
}
```

### 3.2 GET /api/products/search

**クエリパラメータ:**
```
keyword: string
maxPrice?: number
page?: number (default: 1)
```

**レスポンス:**
```typescript
{
  products: Product[];
  total: number;
}
```

### 3.3 注文API

**GET /api/orders**
```typescript
// Response
{
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

**POST /api/orders**
```typescript
// Request
{
  productName: string;
  productImageUrl?: string;
  productUrl: string;
  price: number;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingName: string;
  walletAddress: string;
}
```

**PATCH /api/orders/:id**
```typescript
// Request
{
  status: 'pending' | 'ordered' | 'shipped' | 'completed' | 'cancelled';
}
```

## 4. AIエージェント設計

### 4.1 システムプロンプト

```
あなたはJPYCコンシェルジュです。
ユーザーのJPYC運用と楽天市場での買い物をサポートします。

【現在対応可能な機能】
- 商品検索: 楽天市場から商品を検索
- 利用方法の案内

【準備中の機能】
- DeFi運用（secured.finance）
- x402決済

ユーザーからの質問に親切に回答してください。
商品検索を依頼された場合は、searchProducts ツールを使用してください。
```

### 4.2 ツール定義

```typescript
const tools = {
  searchProducts: {
    description: "楽天市場から商品を検索します",
    parameters: {
      keyword: { type: "string", description: "検索キーワード" },
      maxPrice: { type: "number", description: "最大価格（円）", optional: true }
    }
  }
};
```

## 5. データベーススキーマ

### 5.1 Prismaスキーマ

```prisma
model User {
  id            String         @id @default(cuid())
  walletAddress String         @unique
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  conversations Conversation[]
  orders        Order[]
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
  orders    Order[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String       // 'user' | 'assistant'
  content        String
  metadata       Json?
  createdAt      DateTime     @default(now())
}

model Order {
  id                 String        @id @default(cuid())
  userId             String
  user               User          @relation(fields: [userId], references: [id])
  conversationId     String?
  conversation       Conversation? @relation(fields: [conversationId], references: [id])
  productName        String
  productImageUrl    String?
  productUrl         String
  price              Int
  shippingPostalCode String
  shippingAddress    String
  shippingName       String
  txHash             String?
  status             String        @default("pending")
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
}
```

## 6. 状態管理

### 6.1 Zustand Store（chatStore）

```typescript
interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setConversationId: (id: string) => void;
  clearMessages: () => void;
}
```

## 7. ウォレット連携

### 7.1 Wagmi設定

```typescript
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});
```

### 7.2 JPYC残高取得

MVP段階ではモック値を返す。Phase 2でコントラクト連携。

## 8. 変更するファイル

### 新規作成

| ファイル | 説明 |
|---------|------|
| prisma/schema.prisma | DBスキーマ |
| src/app/providers.tsx | プロバイダー |
| src/app/page.tsx | チャット画面 |
| src/app/admin/page.tsx | 管理者ログイン |
| src/app/admin/orders/page.tsx | 注文一覧 |
| src/app/api/chat/route.ts | チャットAPI |
| src/app/api/products/search/route.ts | 商品検索API |
| src/app/api/orders/route.ts | 注文API |
| src/app/api/admin/login/route.ts | 管理者認証 |
| src/components/chat/* | チャットコンポーネント |
| src/components/wallet/* | ウォレットコンポーネント |
| src/components/admin/* | 管理者コンポーネント |
| src/components/common/* | 共通コンポーネント |
| src/hooks/useChat.ts | チャットフック |
| src/lib/prisma.ts | Prismaクライアント |
| src/lib/wagmi.ts | Wagmi設定 |
| src/services/ai/* | AIエージェント |
| src/services/rakuten/client.ts | 楽天APIクライアント |
| src/stores/chatStore.ts | チャット状態 |
| src/types/* | 型定義 |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| src/app/layout.tsx | プロバイダーでラップ |
| src/app/globals.css | 必要に応じてスタイル追加 |
| package.json | 依存関係追加 |
| .env.example | 環境変数追加 |

### 削除

| ファイル | 理由 |
|---------|------|
| src/mastra/* | Mastra不使用（Vercel AI SDKに統一） |

## 9. 影響範囲

- 既存のmastraディレクトリは削除（weather関連のサンプルコード）
- package.jsonに新規依存関係を追加
- 環境変数の追加が必要
