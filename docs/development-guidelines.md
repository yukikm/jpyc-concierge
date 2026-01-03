# 開発ガイドライン

## 1. コーディング規約

### 1.1 TypeScript

#### 型定義

```typescript
// Good: 明示的な型定義
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

// Good: 型推論が明確な場合は省略可
const messages = useState<ChatMessage[]>([]);

// Bad: any型の使用
const data: any = response.json();
```

#### null/undefined

```typescript
// Good: Optional chainingとnullish coalescing
const name = user?.name ?? "Guest";

// Good: 型ガード
if (order?.status === "completed") {
  // orderはnon-null
}

// Bad: 非nullアサーション（!）の多用
const name = user!.name; // 避ける
```

#### 非同期処理

```typescript
// Good: async/await
async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error("Failed to fetch");
    return response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

// Bad: 未処理のPromise
fetch("/api/orders"); // awaitがない
```

### 1.2 React

#### コンポーネント定義

```typescript
// Good: 関数コンポーネント + 型定義
interface Props {
  message: ChatMessage;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, onDelete }: Props) {
  return (
    <div className={cn("p-4", message.role === "user" ? "bg-blue-100" : "bg-gray-100")}>
      {message.content}
    </div>
  );
}

// Bad: React.FC（propsの型推論が弱い）
const MessageBubble: React.FC<Props> = ({ message }) => { ... }
```

#### フック使用

```typescript
// Good: カスタムフックで抽象化
function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    try {
      // ...
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage };
}

// Good: useMemoとuseCallbackは必要な時のみ
const expensiveValue = useMemo(() => computeExpensive(data), [data]);
const handleClick = useCallback(() => onClick(id), [id, onClick]);
```

#### 条件付きレンダリング

```typescript
// Good: 早期リターン
if (isLoading) return <Loading />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;

// Good: 論理AND
{isVisible && <Modal />}

// Bad: 三項演算子のネスト
{isLoading ? <Loading /> : error ? <Error /> : <Content />}
```

### 1.3 インポート順序

```typescript
// 1. React/Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. 外部ライブラリ
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// 3. 内部モジュール（@/エイリアス）
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api";

// 4. 型定義
import type { ChatMessage } from "@/types/chat";

// 5. スタイル（必要な場合）
import styles from "./styles.module.css";
```

## 2. 命名規則

### 2.1 ファイル名

| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `ChatContainer.tsx` |
| フック | camelCase + use | `useChat.ts` |
| ユーティリティ | camelCase | `utils.ts` |
| 型定義 | camelCase | `chat.ts` |
| API Route | `route.ts` | `app/api/chat/route.ts` |

### 2.2 変数・関数名

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数 | camelCase | `isLoading`, `errorMessage` |
| 関数 | camelCase + 動詞 | `fetchOrders`, `handleSubmit` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 型/インターフェース | PascalCase | `ChatMessage`, `OrderStatus` |
| Enum | PascalCase | `OrderStatus.Pending` |

### 2.3 コンポーネントProps

```typescript
// Good: 明確な命名
interface ButtonProps {
  onClick: () => void;      // イベントハンドラはon + 動詞
  isDisabled?: boolean;     // 真偽値はis/has/can
  children: React.ReactNode;
}

// Good: コールバックの命名
interface OrderCardProps {
  order: Order;
  onStatusChange: (status: OrderStatus) => void;
  onDelete: (id: string) => void;
}
```

## 3. スタイリング規約

### 3.1 Tailwind CSS

```tsx
// Good: ユーティリティクラスを直接使用
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  送信
</button>

// Good: 条件付きクラスはcn関数
import { cn } from "@/lib/utils";

<div className={cn(
  "p-4 rounded",
  isActive && "bg-blue-100",
  isError && "border-red-500"
)}>

// Good: 長いクラス名は改行
<div
  className={cn(
    "flex items-center justify-between",
    "p-4 rounded-lg border",
    "hover:shadow-md transition-shadow"
  )}
>
```

### 3.2 レスポンシブ対応

```tsx
// Good: モバイルファースト
<div className="p-2 md:p-4 lg:p-6">
  <h1 className="text-lg md:text-xl lg:text-2xl">
    タイトル
  </h1>
</div>

// Good: グリッドレイアウト
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### 3.3 カラーパレット

```tsx
// プロジェクトで使用する色（Tailwind設定で定義）
const colors = {
  primary: "blue-500",      // メインアクション
  secondary: "gray-500",    // 補助
  success: "green-500",     // 成功
  warning: "yellow-500",    // 警告
  error: "red-500",         // エラー
};
```

## 4. テスト規約

### 4.1 テスト戦略

#### テストピラミッド

```
        /\
       /  \
      / E2E \        <- 少数（クリティカルパスのみ）
     /--------\
    /Integration\    <- 中程度（API・DB連携）
   /--------------\
  /    Unit Tests   \ <- 多数（ビジネスロジック中心）
 /--------------------\
```

#### テスト対象の優先度

| 優先度 | 対象 | 理由 |
|--------|------|------|
| 高 | ビジネスロジック（services/） | バグ影響が大きい |
| 高 | API Routes | 外部インターフェース |
| 中 | カスタムフック（hooks/） | 状態管理の複雑さ |
| 中 | ユーティリティ関数（lib/） | 再利用性が高い |
| 低 | UIコンポーネント | 視覚的なテストが効果的 |

#### カバレッジ目標（デモ版）

| 種類 | 目標 | 備考 |
|------|------|------|
| ユニットテスト | 60% | services/, lib/ を重点 |
| 統合テスト | 主要APIのみ | /api/chat, /api/orders |
| E2Eテスト | クリティカルパス1-2本 | チャット→購入フロー |

### 4.2 テストファイル配置

```
tests/
├── unit/
│   ├── services/
│   │   ├── rakuten.test.ts
│   │   └── defi.test.ts
│   ├── lib/
│   │   └── format.test.ts
│   └── hooks/
│       └── useChat.test.ts
├── integration/
│   └── api/
│       ├── chat.test.ts
│       └── orders.test.ts
└── e2e/
    └── purchase-flow.spec.ts
```

### 4.3 テスト命名

```typescript
// Good: 日本語で何をテストしているか明確に
describe("useChat", () => {
  it("メッセージ送信後にローディング状態がfalseになる", async () => {
    // ...
  });

  it("エラー時にエラーメッセージが設定される", async () => {
    // ...
  });
});
```

### 4.4 テストパターン

```typescript
// Arrange-Act-Assert
it("商品検索で結果が返される", async () => {
  // Arrange
  const keyword = "チョコレート";

  // Act
  const result = await searchProducts(keyword);

  // Assert
  expect(result.products).toHaveLength(3);
  expect(result.products[0].name).toContain("チョコ");
});
```

### 4.5 モック戦略

#### 外部APIのモック

```typescript
// tests/mocks/openai.ts
import { vi } from "vitest";

export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "モックレスポンス" } }],
      }),
    },
  },
};

// テストで使用
vi.mock("openai", () => ({
  default: vi.fn(() => mockOpenAI),
}));
```

#### データベースのモック

```typescript
// tests/mocks/prisma.ts
import { vi } from "vitest";

export const mockPrisma = {
  order: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  conversation: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));
```

#### ブロックチェーンのモック

```typescript
// tests/mocks/viem.ts
import { vi } from "vitest";

export const mockPublicClient = {
  readContract: vi.fn(),
  simulateContract: vi.fn(),
};

export const mockWalletClient = {
  writeContract: vi.fn().mockResolvedValue("0xtxhash..."),
};
```

### 4.6 テスト実行

```bash
# ユニットテスト
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage

# E2Eテスト
npm run test:e2e
```

## 5. Git規約

### 5.1 コミットメッセージ

```
<type>: <subject>

<body>

<footer>
```

#### Type一覧

| Type | 説明 |
|------|------|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメント |
| style | フォーマット（コード動作に影響なし） |
| refactor | リファクタリング |
| test | テスト追加・修正 |
| chore | ビルド・ツール設定 |

#### 例

```
feat: チャット画面に商品カード表示を追加

- ProductCardコンポーネントを作成
- MessageBubble内で商品情報を表示
- 画像・価格・詳細リンクを含む

Closes #123
```

### 5.2 ブランチ命名

```
feature/chat-ui
feature/defi-integration
fix/wallet-connection-error
docs/update-readme
```

### 5.3 プルリクエスト

```markdown
## 概要
チャット画面に商品カード表示機能を追加

## 変更内容
- ProductCardコンポーネントを新規作成
- MessageBubbleで商品情報を表示

## スクリーンショット
（スクリーンショットを貼付）

## テスト方法
1. チャットで「チョコレートが欲しい」と入力
2. 商品カードが表示されることを確認

## チェックリスト
- [ ] 型エラーがないことを確認
- [ ] Lintエラーがないことを確認
- [ ] 動作確認済み
```

### 5.4 マージ戦略

```
main（本番相当）
  │
  ├── feature/xxx ─────────────┐
  │                            │ Squash Merge
  ├── feature/yyy ─────────────┤
  │                            ▼
  └───────────────────────────[main]
```

| 戦略 | 使用場面 |
|------|----------|
| Squash Merge | feature → main（推奨） |
| Merge Commit | 大きな機能ブランチ |
| Rebase | ローカルでの履歴整理 |

#### マージ前チェック

```bash
# 1. mainの最新を取得
git fetch origin main

# 2. mainとの差分確認
git diff origin/main...HEAD

# 3. コンフリクト事前確認
git merge origin/main --no-commit --no-ff
git merge --abort  # 確認後に中止

# 4. テスト実行
npm run test
npm run build
```

### 5.5 禁止操作

| 操作 | 理由 | 例外 |
|------|------|------|
| `git push --force` to main | 履歴破壊 | なし |
| `git push --force` to shared branch | 他者の作業を消失 | 単独作業ブランチのみ可 |
| `git reset --hard` on shared branch | コミット消失 | ローカルのみ可 |
| `git rebase` on pushed branch | 履歴改変 | 単独作業ブランチのみ可 |

#### Force Push が必要な場合

```bash
# 安全なforce push（他者が上書きしていないか確認）
git push --force-with-lease origin feature/my-branch
```

## 6. エラーハンドリング

### 6.1 API Route

```typescript
// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const orderSchema = z.object({
  productName: z.string().min(1),
  price: z.number().positive(),
  shippingAddress: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = orderSchema.parse(body);

    const order = await createOrder(validated);
    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 6.2 フロントエンド

```typescript
// hooks/useOrders.ts
export function useOrders() {
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: CreateOrderInput) => {
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "注文の作成に失敗しました");
      }

      return response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      console.error("Order creation error:", err);
      throw err;
    }
  };

  return { createOrder, error };
}
```

## 7. セキュリティ

### 7.1 環境変数

```typescript
// Good: サーバーサイドでのみ使用
// lib/env.ts
export const env = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  databaseUrl: process.env.DATABASE_URL!,
};

// Bad: クライアントに露出
// NEXT_PUBLIC_* 以外はクライアントで使用不可
```

### 7.2 入力バリデーション

```typescript
// Good: Zodでバリデーション
const addressSchema = z.object({
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/),
  address: z.string().min(1).max(200),
  name: z.string().min(1).max(50),
});

// APIで使用
const validated = addressSchema.parse(input);
```

### 7.3 XSS対策

```tsx
// Good: Reactはデフォルトでエスケープ
<p>{userInput}</p>

// Bad: dangerouslySetInnerHTMLは避ける
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## 8. パフォーマンス

### 8.1 コンポーネント最適化

```typescript
// Good: React.memoは再レンダリングが頻繁な場合のみ
const ProductCard = React.memo(function ProductCard({ product }: Props) {
  return <div>...</div>;
});

// Good: 大量データはvirtualization
import { useVirtualizer } from "@tanstack/react-virtual";
```

### 8.2 データフェッチ

```typescript
// Good: SWRでキャッシュ・再検証
import useSWR from "swr";

function useOrders() {
  const { data, error, mutate } = useSWR("/api/orders", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
  return { orders: data, error, refresh: mutate };
}
```

### 8.3 画像最適化

```tsx
// Good: next/imageを使用
import Image from "next/image";

<Image
  src={product.imageUrl}
  alt={product.name}
  width={200}
  height={200}
  placeholder="blur"
/>
```

## 9. コードレビュー

### 9.1 レビュープロセス

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PR作成    │ ──▶ │ レビュー依頼 │ ──▶ │  レビュー   │ ──▶ │   マージ    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  セルフレビュー      通知・アサイン      指摘対応           squash merge
```

### 9.2 レビュールール

| 項目 | ルール |
|------|--------|
| レビュアー数 | 最低1名（デモ版は自己レビュー可） |
| レビュー期限 | 24時間以内に初回レビュー |
| 承認要件 | 1 Approve + CI通過 |
| 変更要求時 | 対応後に再レビュー依頼 |

### 9.3 レビュー観点

#### 機能面
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

#### コード品質
- [ ] 型定義が適切か（anyを使っていないか）
- [ ] 命名規則に従っているか
- [ ] コンポーネントが適切に分割されているか
- [ ] 不要なコンソールログがないか

#### パフォーマンス
- [ ] 再レンダリングの最適化が必要な箇所はないか
- [ ] 不要なAPI呼び出しがないか
- [ ] 大きなバンドルサイズ増加がないか

#### セキュリティ
- [ ] セキュリティ上の問題がないか
- [ ] 機密情報がハードコードされていないか
- [ ] 入力バリデーションが適切か

#### UI/UX
- [ ] レスポンシブ対応がされているか
- [ ] アクセシビリティが考慮されているか
- [ ] ローディング・エラー状態が適切か

### 9.4 レビューコメントの書き方

```markdown
# 種類を明示
[must] セキュリティ上の問題があります。入力をサニタイズしてください。
[should] この処理はカスタムフックに抽出した方が再利用性が上がります。
[nit] typo: "mesage" -> "message"
[question] この実装にした理由を教えてください。
```

| 種類 | 意味 | 対応 |
|------|------|------|
| `[must]` | 必須修正 | マージ前に対応必須 |
| `[should]` | 推奨 | 対応推奨、議論可 |
| `[nit]` | 軽微 | 対応任意 |
| `[question]` | 質問 | 回答のみでOK |

### 9.5 セルフレビューチェックリスト

PR作成前に自身で確認:

```bash
# 1. 型チェック
npm run type-check

# 2. リント
npm run lint

# 3. テスト
npm run test

# 4. ビルド確認
npm run build

# 5. 差分確認
git diff origin/main...HEAD
```

## 10. 環境セットアップ

### 10.1 前提条件

| ツール | バージョン | 確認コマンド |
|--------|-----------|-------------|
| Node.js | 20.x以上 | `node -v` |
| npm | 10.x以上 | `npm -v` |
| Git | 2.x以上 | `git --version` |

### 10.2 初期セットアップ手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/your-org/jpyc-concierge.git
cd jpyc-concierge

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env.local
# .env.local を編集して必要な値を設定

# 4. データベースのセットアップ
npx prisma generate
npx prisma db push

# 5. 開発サーバーの起動
npm run dev
```

### 10.3 環境変数一覧

`.env.local` に設定する環境変数:

```bash
# 必須: OpenAI API
OPENAI_API_KEY=sk-...

# 必須: データベース
DATABASE_URL="file:./dev.db"

# 必須: ブロックチェーン
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...

# オプション: 楽天API（商品検索用）
RAKUTEN_APP_ID=...
RAKUTEN_AFFILIATE_ID=...

# オプション: x402 Facilitator
X402_FACILITATOR_URL=https://...
X402_PRIVATE_KEY=0x...

# オプション: 管理者認証
ADMIN_API_KEY=...
```

### 10.4 開発用コマンド一覧

```bash
# 開発サーバー
npm run dev          # 開発サーバー起動（http://localhost:3000）

# ビルド・検証
npm run build        # 本番ビルド
npm run start        # 本番モードで起動
npm run lint         # ESLintチェック
npm run type-check   # TypeScript型チェック

# テスト
npm run test         # ユニットテスト実行
npm run test:watch   # ウォッチモードでテスト
npm run test:coverage # カバレッジ付きテスト
npm run test:e2e     # E2Eテスト実行

# データベース
npx prisma studio    # Prisma Studio（DBビューア）
npx prisma db push   # スキーマをDBに反映
npx prisma generate  # Prismaクライアント生成
npx prisma migrate dev # マイグレーション作成・適用
```

### 10.5 推奨IDE設定

#### VS Code推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### VS Code設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 10.6 トラブルシューティング

#### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `npm install` 失敗 | Node.jsバージョン不一致 | `nvm use 20` で切り替え |
| Prismaエラー | クライアント未生成 | `npx prisma generate` 実行 |
| 型エラー多発 | 依存関係不整合 | `rm -rf node_modules && npm install` |
| 環境変数未読込 | .env.local未作成 | `cp .env.example .env.local` |
| ビルド失敗 | キャッシュ破損 | `rm -rf .next && npm run build` |

#### ログ確認

```bash
# Next.js詳細ログ
DEBUG=* npm run dev

# Prismaクエリログ
# prisma/schema.prismaに追加:
# generator client {
#   provider = "prisma-client-js"
#   log = ["query", "info", "warn", "error"]
# }
```
