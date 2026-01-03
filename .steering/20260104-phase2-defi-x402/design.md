# Phase 2 設計書 - DeFi連携・x402決済

## 概要

Phase 1のMVPに、secured.financeを使ったDeFi運用機能と、x402プロトコルを使ったガスレス決済機能を追加する。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────┬───────────────────┬───────────────────────┤
│   Chat UI       │   DeFi UI         │   Wallet UI           │
│   (既存)         │   (新規)          │   (拡張)              │
└────────┬────────┴─────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Layer                           │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │searchProducts│depositToDefi │getPositions, withdraw    │ │
│  │  (既存)      │   (新規)      │    claim (新規)          │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Rakuten API    │  │ secured.finance │  │ x402 Service   │
│ (既存)         │  │ SDK (新規)      │  │ (新規)         │
└────────────────┘  └───────┬────────┘  └───────┬────────┘
                            │                   │
                            ▼                   ▼
                    ┌───────────────┐   ┌───────────────┐
                    │ Sepolia       │   │ x402          │
                    │ (secured.fin) │   │ Facilitator   │
                    └───────────────┘   └───────────────┘
```

## ディレクトリ構成（追加分）

```
src/
├── services/
│   ├── defi/
│   │   ├── client.ts          # secured.finance SDK wrapper
│   │   ├── types.ts           # DeFi関連型定義
│   │   └── constants.ts       # コントラクトアドレス等
│   └── x402/
│       ├── client.ts          # x402 fetch wrapper
│       ├── types.ts           # x402関連型定義
│       └── eip712.ts          # EIP-712署名ヘルパー
├── hooks/
│   ├── useDefi.ts             # DeFiフック
│   └── useX402.ts             # x402フック
├── types/
│   └── defi.ts                # DeFi関連型定義
└── components/
    └── defi/
        ├── PositionCard.tsx   # ポジション表示
        └── DepositForm.tsx    # 預け入れフォーム（将来用）
```

## コンポーネント設計

### 1. DeFiサービス (`src/services/defi/`)

#### client.ts

```typescript
// secured.finance SDKとの通信を担当
export class DefiClient {
  // 現在のレンディングレートを取得
  async getLendingRates(currency: string): Promise<LendingRate[]>;

  // ユーザーのポジションを取得
  async getPositions(address: string): Promise<Position[]>;

  // Deposit トランザクション生成
  async createDepositTx(params: DepositParams): Promise<TransactionRequest>;

  // Withdraw トランザクション生成
  async createWithdrawTx(params: WithdrawParams): Promise<TransactionRequest>;

  // Claim トランザクション生成
  async createClaimTx(params: ClaimParams): Promise<TransactionRequest>;
}
```

#### types.ts

```typescript
export interface Position {
  id: string;
  currency: string;           // "JPYC"
  principal: bigint;          // 元本
  accruedInterest: bigint;    // 発生利息
  maturityDate: Date;         // 満期日
  apy: number;                // 年利率
  status: "active" | "matured";
}

export interface LendingRate {
  maturityDate: Date;
  apy: number;
  minAmount: bigint;
}

export interface DepositParams {
  amount: bigint;
  maturityDate: Date;
  userAddress: string;
}
```

### 2. x402サービス (`src/services/x402/`)

#### client.ts

```typescript
// x402プロトコルでのガスレス送金
export class X402Client {
  // EIP-712署名を使ったtransferWithAuthorization
  async createTransferAuthorization(params: TransferParams): Promise<AuthorizationData>;

  // Facilitator経由で送金実行
  async executeTransfer(signedAuth: SignedAuthorization): Promise<TransferResult>;
}
```

#### eip712.ts

```typescript
// EIP-712署名用のTypedData生成
export function buildTransferAuthorizationTypedData(params: TransferAuthParams): TypedDataDefinition;
```

### 3. AIツール追加

```typescript
// src/services/ai/tools.ts に追加

// DeFiレート取得
export const getLendingRatesTool = tool({
  description: "現在のJPYCレンディングレートを取得します",
  parameters: z.object({}),
  execute: async () => { /* ... */ }
});

// ポジション取得
export const getPositionsTool = tool({
  description: "ユーザーのDeFiポジションを取得します",
  parameters: z.object({
    walletAddress: z.string()
  }),
  execute: async ({ walletAddress }) => { /* ... */ }
});

// Deposit準備
export const prepareDepositTool = tool({
  description: "DeFi預け入れトランザクションを準備します",
  parameters: z.object({
    amount: z.number(),
    maturityDays: z.number()
  }),
  execute: async ({ amount, maturityDays }) => { /* ... */ }
});

// Withdraw準備
export const prepareWithdrawTool = tool({
  description: "DeFi引き出しトランザクションを準備します",
  parameters: z.object({
    positionId: z.string()
  }),
  execute: async ({ positionId }) => { /* ... */ }
});
```

## チャットアクションシステム

AIがトランザクション実行用のインタラクティブコンポーネントをチャット内に埋め込む仕組み。

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chat Action Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ユーザー: "10000 JPYCを3ヶ月運用したい"                          │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────┐                                          │
│  │ AI Agent         │ prepareDepositTool 実行                   │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼ toolResult.action                                  │
│  ┌──────────────────┐                                          │
│  │ agent.ts         │ ChatAction を抽出                         │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼ response.action                                    │
│  ┌──────────────────┐                                          │
│  │ /api/chat        │ action をレスポンスに含める                │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼ data.action                                        │
│  ┌──────────────────┐                                          │
│  │ useChat.ts       │ message.action に格納                     │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │ MessageBubble    │ ChatActionRenderer を表示                 │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────────────────────────┐                  │
│  │ LendingAction Component                  │                  │
│  │ ┌────────────────────────────────────┐   │                  │
│  │ │ 金額: 10,000 JPYC                  │   │                  │
│  │ │ 満期日: 2026/04/01                 │   │                  │
│  │ │ 予想年利: 5.0%                     │   │                  │
│  │ │ [レンディングを実行] ボタン         │   │                  │
│  │ └────────────────────────────────────┘   │                  │
│  └────────┬─────────────────────────────────┘                  │
│           │ クリック                                            │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │ /api/defi/       │ トランザクション実行                       │
│  │ place-order      │ → ウォレット署名 → 完了                   │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### ファイル構成

```
src/
├── types/
│   └── chat.ts                 # ChatAction型定義
│       ├── LendingActionParams   # レンディング用パラメータ
│       ├── WithdrawActionParams  # 引き出し用パラメータ
│       └── PurchaseActionParams  # 購入用パラメータ
├── components/
│   └── actions/
│       ├── index.tsx           # ChatActionRenderer（振り分け）
│       └── LendingAction.tsx   # レンディング実行UI
├── services/
│   └── ai/
│       ├── tools.ts            # prepareDepositTool（actionを返す）
│       └── agent.ts            # actionを抽出
├── hooks/
│   └── useChat.ts              # actionをメッセージに格納
└── app/
    └── api/
        └── defi/
            └── place-order/    # 注文実行API
                └── route.ts
```

### 型定義

```typescript
// src/types/chat.ts
export interface LendingActionParams {
  type: "lending";
  amount: string;           // wei単位
  amountDisplay: string;    // "10,000 JPYC"
  maturity: number;         // timestamp
  maturityDate: string;     // "2026/04/01"
  unitPrice: number;
  estimatedApy: string;     // "5.0%"
  side: number;             // 0 = LEND
}

export type ChatAction =
  | LendingActionParams
  | WithdrawActionParams
  | PurchaseActionParams;
```

### トランザクション実行フック

```typescript
// src/hooks/useSecuredFinance.ts
export function useSecuredFinance(): UseSecuredFinanceResult {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // ウォレット接続時にSDKを初期化
  useEffect(() => {
    if (!publicClient || !walletClient) return;

    const client = new SecuredFinanceClient();
    await client.init(publicClient, walletClient);
    // ...
  }, [publicClient, walletClient]);

  // placeOrder実行（実際のトランザクション）
  const placeOrder = async (params) => {
    const txHash = await sfClient.placeOrder(
      JPYC_TOKEN,
      params.maturity,
      params.side,
      params.amount,
      WalletSource.METAMASK,
      params.unitPrice
    );
    return txHash;
  };

  return { isInitialized, placeOrder, ... };
}
```

## データフロー

### Deposit フロー（チャットアクション経由）

```
1. ユーザー: 「10000 JPYCを3ヶ月運用したい」
2. AIエージェント: prepareDeposit() でトランザクション準備
3. ツール結果: action オブジェクトを含むレスポンス
4. agent.ts: toolResultからactionを抽出
5. chat API: actionをレスポンスに含めて返却
6. フロントエンド: MessageBubble内にLendingActionを表示
7. ユーザー: 「レンディングを実行」ボタンをクリック
8. フロントエンド: /api/defi/place-order → MetaMask署名
9. 完了: トランザクションハッシュを表示
```

### 運用状況確認フロー

```
1. ユーザー: 「運用状況を教えて」
2. AIエージェント: getPositions(walletAddress) でポジション取得
3. AIエージェント: ポジション一覧を整形して表示
   - 元本、発生利息、満期日、APY
```

### Withdraw フロー（早期引き出し）

```
1. ユーザー: 「ポジションを引き出したい」
2. AIエージェント: getPositions() でポジション一覧を取得・表示
3. ユーザー: 引き出すポジションを選択
4. AIエージェント: prepareWithdraw(walletAddress, maturity) で準備
5. ツール結果: WithdrawActionParams を含むレスポンス
6. agent.ts: toolResultからactionを抽出
7. chat API: actionをレスポンスに含めて返却
8. フロントエンド: MessageBubble内にWithdrawActionを表示
   - 現在価値、発生利息、満期日、満期状態を表示
   - 満期前の場合は早期解約の警告を表示
9. ユーザー: 「引き出しを実行」ボタンをクリック
10. useSecuredFinance: sfClient.unwindPosition(JPYC_TOKEN, maturity) 実行
11. MetaMask: 署名リクエスト表示
12. 完了: トランザクションハッシュを表示
```

### x402決済フロー

```
1. ユーザー: 商品購入を決定
2. AIエージェント: prepareX402Transfer() でEIP-712データ準備
3. フロントエンド: MetaMaskでTypedData署名
4. サービス: Facilitator経由で送金実行
5. AIエージェント: 送金完了を確認・表示
```

## 環境変数

```bash
# .env.local に追加

# secured.finance
NEXT_PUBLIC_SF_ENV="staging"  # staging | production
NEXT_PUBLIC_SF_SUBGRAPH_URL="https://api.thegraph.com/subgraphs/name/secured-finance/..."

# x402
X402_FACILITATOR_URL="http://localhost:3002"

# JPYC Contract (Sepolia)
NEXT_PUBLIC_JPYC_ADDRESS="0x..."
```

## セキュリティ考慮事項

1. **秘密鍵の取り扱い**
   - サーバーサイドで秘密鍵を保持しない
   - 全ての署名はクライアントサイド（MetaMask）で実行

2. **金額バリデーション**
   - 利息範囲内の購入かをサーバーサイドで検証
   - オーバーフロー対策（bigint使用）

3. **トランザクション確認**
   - トランザクション実行前に内容を明示的に表示
   - 二重送信防止

## 実装の段階

### Phase 2a: DeFi基盤（今回）

- secured.finance SDKの統合（モックで代替可能）
- AIツールの追加
- ポジション表示機能

### Phase 2b: x402決済（次回）

- EIP-712署名の実装
- Facilitator連携
- 決済フローの完成

## 依存関係

```bash
# secured.finance SDK（GitHub Packages認証必要）
# 認証不可の場合はモックで対応
@secured-finance/sf-client
@secured-finance/sf-graph-client

# x402（npm公開パッケージ）
@x402/fetch
```

## モック対応

secured.finance SDKがGitHub Packages認証を必要とするため、
認証なしでも動作するようにモックデータを提供する。

```typescript
// src/services/defi/mock.ts
export const mockPositions: Position[] = [
  {
    id: "pos-1",
    currency: "JPYC",
    principal: 100000n * 10n ** 18n,  // 100,000 JPYC
    accruedInterest: 500n * 10n ** 18n, // 500 JPYC
    maturityDate: new Date("2026-03-01"),
    apy: 5.0,
    status: "active"
  }
];

export const mockLendingRates: LendingRate[] = [
  { maturityDate: new Date("2026-03-01"), apy: 5.0, minAmount: 1000n * 10n ** 18n },
  { maturityDate: new Date("2026-06-01"), apy: 6.5, minAmount: 1000n * 10n ** 18n },
  { maturityDate: new Date("2026-12-01"), apy: 8.0, minAmount: 1000n * 10n ** 18n },
];
```
