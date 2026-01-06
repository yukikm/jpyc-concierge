# 設計書

## アーキテクチャ概要

Phase2の既存アーキテクチャをそのまま活用。変更は最小限で、主に設定値の追加のみ。

```
┌─────────────────────────────────────────────────────────────────┐
│                      変更対象                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  .env.local                                                     │
│  └── NEXT_PUBLIC_USDC_ADDRESS を追加                            │
│                                                                 │
│  src/services/defi/constants.ts                                 │
│  └── USDC_ADDRESS のデフォルト値を更新                           │
│                                                                 │
│  (検証のみ - コード変更なし)                                      │
│  └── useSecuredFinance.ts - USDC動作確認                        │
│  └── AIツール - USDCレート取得確認                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## コンポーネント設計

### 1. 環境変数設定

**責務**:
- USDCコントラクトアドレスの環境依存管理
- 開発/ステージング/本番での柔軟な切り替え

**実装の要点**:
- Circle公式のSepolia USDCアドレス: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- `.env.local` と `.env.example` の両方を更新

### 2. 定数ファイル更新

**責務**:
- アプリ全体で使用するブロックチェーン関連定数の管理
- 環境変数がない場合のフォールバック値提供

**実装の要点**:
- `USDC_ADDRESS` のデフォルト値をCircle公式アドレスに変更
- コメントでアドレスの出典を明記

## データフロー

### USDCレンディング実行フロー

```
1. ユーザーがチャットで「100 USDCを運用したい」と入力
2. AIが prepareDepositTool を実行（currency: "USDC"）
3. LendingAction コンポーネントが表示される
4. ユーザーが「レンディングを実行」をクリック
5. useSecuredFinance.placeOrder() が呼ばれる
6. SDK が USDC トークンで注文を作成
7. MetaMask で署名
8. トランザクション送信・確認
```

## エラーハンドリング戦略

### secured.finance がUSDC未対応の場合

1. SDK初期化時にエラーログを出力
2. `getBalance()` で0が返る可能性
3. `placeOrder()` 実行時にSDKエラーが発生

**対応方針**:
- エラー内容をログに記録
- ユーザーには「現在USDCは利用できません」と表示
- JPYCへのフォールバックを検討（将来対応）

## テスト戦略

### 手動テスト

1. **SDK初期化確認**
   - ブラウザコンソールで `[useSecuredFinance] SDK USDC address:` を確認
   - 正しいアドレスが表示されればOK

2. **レート取得確認**
   - チャットで「USDCの金利は？」と入力
   - レートが表示されるか確認

3. **レンディング実行確認**
   - チャットで「100 USDCを運用したい」と入力
   - LendingAction が表示されるか確認
   - 実行ボタンでトランザクションが作成されるか確認

## 依存ライブラリ

新規追加なし。Phase2で導入済みのものを使用。

```json
{
  "dependencies": {
    "@secured-finance/sf-client": "0.2.0-beta.201",
    "@secured-finance/sf-core": "0.2.0-beta.187"
  }
}
```

## ディレクトリ構造

変更されるファイル:

```
jpyc-concierge/
├── .env.local                    # 更新: NEXT_PUBLIC_USDC_ADDRESS追加
├── .env.example                  # 更新: NEXT_PUBLIC_USDC_ADDRESS追加
└── src/
    └── services/
        └── defi/
            └── constants.ts      # 更新: USDC_ADDRESSデフォルト値
```

## 実装の順序

1. `.env.local` に `NEXT_PUBLIC_USDC_ADDRESS` を追加
2. `.env.example` を更新（ドキュメント用）
3. `constants.ts` の `USDC_ADDRESS` デフォルト値を更新
4. ビルド確認（`pnpm build`）
5. 動作確認（開発サーバー起動 → チャットでテスト）

## セキュリティ考慮事項

- USDCアドレスは公開情報のため、環境変数に `NEXT_PUBLIC_` プレフィックスを使用しても問題なし
- Circle公式アドレスを使用することで、フィッシングコントラクトへの誤接続を防止

## パフォーマンス考慮事項

- 変更は設定値のみのため、パフォーマンスへの影響なし

## 将来の拡張性

- 本番環境（Mainnet）移行時は、環境変数で異なるUSDCアドレスを指定可能
- 他のERC-20トークン追加時も同様のパターンで対応可能

---

## 追加設計: SDK統合の問題と対応

### 発見された問題

#### 1. Staging環境固有のトークンアドレス

secured.finance Staging環境は、一般的なテストネットトークンではなく、専用にデプロイされたトークンを使用している:

| 通貨 | Staging環境アドレス | 備考 |
|------|---------------------|------|
| USDC | `0x1291070C5f838DCCDddc56312893d3EfE9B372a8` | Circle公式ではない |
| JPYC | `0xe7c3d8c9a439fede00d2600032d5db0be71c3c29` | Staging専用 |

Circle公式Sepolia USDC (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`) を使用すると、EIP-3009の`nonces`関数が見つからずエラーになる。

#### 2. SDKのToken-Address マッピング問題

`sf-core`の`Token`クラスはアドレスを持たない:

```typescript
class Token extends BaseCurrency {
  readonly decimals: number;
  readonly symbol: string;
  readonly name: string;
  readonly hasPermit: boolean;
  readonly eip712Version?: string;
  // アドレスフィールドがない！
}
```

SDKは内部レジストリでシンボル→アドレスをマッピングしているが、手動で作成したTokenオブジェクトは認識されない場合がある。

### 対応策

#### A. 動的トークン検出（実装済み）

```typescript
// SDKから登録済みアドレスを取得
const registeredAddresses = await client.getCurrencies();

// 各アドレスからERC20情報を読み取り
for (const address of registeredAddresses) {
  const [symbol, decimals] = await Promise.all([
    publicClient.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
    publicClient.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
  ]);

  // USDCまたはJPYCならTokenオブジェクトを作成
  if (symbol === "USDC" || symbol === "JPYC") {
    const token = new Token(decimals, symbol, name, true, "2");
    currencyMap.set(symbol, token);
  }
}
```

#### B. AIツールへの通貨パラメータ追加（実装済み）

```typescript
// システムプロンプト
**重要**: secured.financeでは**USDC**と**JPYC**の両方で運用できます。
- ユーザーが「USDC」と言った場合は、必ず currency="USDC" を指定
- ユーザーが「JPYC」と言った場合は、currency="JPYC" を指定

// getLendingRatesTool
execute: async ({ currency = "USDC" }) => {
  const rates = await defiClient.getLendingRatesDisplay(currency);
  // ...
}

// prepareDepositTool
execute: async ({ amount, maturityMonths, currency = "USDC" }) => {
  const lendingParams = await defiClient.getLendingOrderParams({
    amount, maturityMonths, currency,
  });
  // ...
}
```

### 残る技術的課題

1. **コントラクト関数のrevert**
   - `getOrderBookDetails(USDC)` → revert
   - `getMaturities(USDC)` → revert

   原因の可能性:
   - SDKがTokenシンボルをbytes32に変換する際の不一致
   - Staging環境でUSDCのOrderBookが未開設

2. **デバッグに必要な情報**
   - `getCurrencies()` が返すアドレス一覧
   - 各アドレスの実際のシンボル
   - secured.finance Staging UIでの利用可能通貨

### アーキテクチャ図（更新版）

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USDCレンディングフロー                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ユーザー入力: "100 USDCを運用したい"                                 │
│       ↓                                                             │
│  AIエージェント (prompts.ts)                                         │
│  - currency="USDC" を判定                                           │
│       ↓                                                             │
│  getLendingRatesTool (currency="USDC")                              │
│       ↓                                                             │
│  DefiClient.getLendingRates("USDC")                                 │
│  - USDC_TOKEN を使用                                                │
│  - SDK: getOrderBookDetailsPerCurrency(USDC_TOKEN)                  │
│       ↓ ← ここでrevertが発生                                        │
│  モックデータにフォールバック                                         │
│       ↓                                                             │
│  prepareDepositTool (currency="USDC")                               │
│       ↓                                                             │
│  LendingAction コンポーネント                                        │
│  - Step 1: depositCollateral(USDC)                                  │
│  - Step 2: placeOrder(USDC)                                         │
│       ↓                                                             │
│  useSecuredFinance フック                                           │
│  - 動的にToken情報を取得                                             │
│  - SDK経由でトランザクション実行                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 変更されたファイル一覧

```
src/
├── services/
│   ├── ai/
│   │   ├── prompts.ts          # USDC/JPYC区別の指示を追加
│   │   └── tools.ts            # currency パラメータ追加
│   └── defi/
│       ├── client.ts           # USDC_TOKEN追加、currency対応
│       ├── constants.ts        # USDC_DECIMALS追加
│       └── mock.ts             # toLendingRateDisplay にcurrency追加
├── hooks/
│   └── useSecuredFinance.ts    # 動的通貨検出、erc20Abi使用
└── components/
    └── actions/
        └── LendingAction.tsx   # 2ステップフロー（deposit→order）
```
