# Phase 2 タスクリスト - DeFi連携・x402決済

## 進捗サマリー

| カテゴリ | 完了 | 合計 | 進捗 |
|---------|------|------|------|
| DeFiサービス層 | 4 | 4 | 100% |
| DeFi AIツール | 4 | 4 | 100% |
| x402サービス | 3 | 3 | 100% |
| フロントエンド | 2 | 2 | 100% |
| 統合・テスト | 2 | 2 | 100% |
| チャットアクション | 5 | 5 | 100% |
| 実トランザクション実行 | 4 | 4 | 100% |
| 満期償還（Claim）機能 | 4 | 4 | 100% |
| 購入フロー（住所ヒアリング） | 4 | 4 | 100% |
| x402 Facilitator統合 | 4 | 4 | 100% |
| **合計** | **36** | **36** | **100%** |

---

## 1. DeFiサービス層

- [x] 1.1 型定義作成（src/types/defi.ts）
  - Position, LendingRate, DepositParams等

- [x] 1.2 DeFiクライアント作成（src/services/defi/client.ts）
  - getLendingRates, getPositions
  - createDepositTx, createWithdrawTx, createClaimTx

- [x] 1.3 モックデータ作成（src/services/defi/mock.ts）
  - モックポジション、モックレート

- [x] 1.4 定数ファイル作成（src/services/defi/constants.ts）
  - コントラクトアドレス、チェーン設定

## 2. DeFi AIツール

- [x] 2.1 getLendingRatesツール追加
  - 現在のレンディングレートを取得

- [x] 2.2 getPositionsツール追加
  - ユーザーのポジションを取得

- [x] 2.3 prepareDepositツール追加
  - 預け入れトランザクション準備

- [x] 2.4 prepareWithdrawツール追加
  - 引き出しトランザクション準備

## 3. x402サービス

- [x] 3.1 x402型定義（src/services/x402/types.ts）
  - TransferParams, AuthorizationData等

- [x] 3.2 EIP-712ヘルパー（src/services/x402/eip712.ts）
  - TypedData生成関数

- [x] 3.3 x402クライアント（src/services/x402/client.ts）
  - createTransferAuthorization, executeTransfer

## 4. フロントエンド

- [x] 4.1 useDefiフック作成（src/hooks/useDefi.ts）
  - ポジション取得、トランザクション実行

- [x] 4.2 プロンプト更新（src/services/ai/prompts.ts）
  - DeFi機能の説明を追加

## 5. 統合・テスト

- [x] 5.1 AIエージェントにツール統合
  - tools.tsにDeFiツールをエクスポート

- [x] 5.2 動作確認
  - ビルド成功を確認

## 6. チャットアクション（インタラクティブUI）

- [x] 6.1 ChatAction型定義（src/types/chat.ts）
  - LendingActionParams, WithdrawActionParams, PurchaseActionParams
  - ChatMessage.action フィールド追加

- [x] 6.2 LendingActionコンポーネント（src/components/actions/LendingAction.tsx）
  - 金額・満期日・APY表示
  - 実行ボタン・ステータス管理
  - /api/defi/place-order 呼び出し

- [x] 6.3 ChatActionRenderer（src/components/actions/index.tsx）
  - アクションタイプに応じたコンポーネント振り分け

- [x] 6.4 AIエージェント更新
  - agent.ts: toolResultからaction抽出
  - chat/route.ts: actionをレスポンスに含める
  - useChat.ts: message.actionに格納

- [x] 6.5 MessageBubble更新
  - ChatActionRendererの表示追加

## 7. 実トランザクション実行（SDK統合）

- [x] 7.1 useSecuredFinanceフック作成（src/hooks/useSecuredFinance.ts）
  - ウォレット接続時にSDKをwalletClientで初期化
  - placeOrder(): レンディング注文実行
  - unwindPosition(): ポジション解消（早期引き出し）
  - getPositions(): ポジション取得
  - getJPYCBalance(): 残高取得

- [x] 7.2 LendingAction実トランザクション対応
  - useSecuredFinanceフックを使用
  - MetaMask署名→secured.financeに送信

- [x] 7.3 WithdrawAction作成（src/components/actions/WithdrawAction.tsx）
  - ポジション引き出しUI
  - unwindPosition()で実トランザクション実行

- [x] 7.4 prepareWithdrawTool更新
  - WithdrawActionParamsを返す
  - agent.tsでaction抽出対応

## 8. 満期償還（Claim）機能

- [x] 8.1 SDK調査
  - `executeRedemption(currency, maturity)` - 満期後の元本+利息受け取り
  - `unwindPosition(currency, maturity)` - 満期前の早期解約
  - secured.finance SDKには両メソッドが存在することを確認

- [x] 8.2 useSecuredFinanceフック更新（src/hooks/useSecuredFinance.ts）
  - `executeRedemption()` メソッド追加
  - 満期後のポジションに対して元本+利息を受け取り

- [x] 8.3 prepareClaimTool追加（src/services/ai/tools.ts）
  - 満期済みポジションを自動検出
  - ClaimActionParamsを返す

- [x] 8.4 ClaimActionコンポーネント作成（src/components/actions/ClaimAction.tsx）
  - 元本・利息・合計受取額を表示
  - 「利息を受け取る」ボタンで実行
  - executeRedemption()で実トランザクション実行

## 9. 購入フロー（住所ヒアリング）

- [x] 9.1 PurchaseActionParams型拡張（src/types/chat.ts）
  - `shippingName`, `shippingPostalCode`, `shippingAddress` 追加
  - `isReadyToPurchase` フラグ追加

- [x] 9.2 startPurchaseTool追加（src/services/ai/tools.ts）
  - 商品選択後に購入フローを開始
  - 住所情報のヒアリングを促すメッセージを生成
  - `isReadyToPurchase: false` で住所入力待ち状態

- [x] 9.3 confirmPurchaseTool追加（src/services/ai/tools.ts）
  - 住所情報を受け取り購入確認
  - 郵便番号のフォーマット正規化
  - `isReadyToPurchase: true` で購入準備完了

- [x] 9.4 PurchaseActionコンポーネント作成（src/components/actions/PurchaseAction.tsx）
  - 住所入力待ち状態と購入準備完了状態を区別して表示
  - x402署名→Facilitator送金→注文作成の統合フロー
  - walletClient.signTypedData()でEIP-712署名

## 10. x402 Facilitator統合

- [x] 10.1 環境変数の設定
  - `.env.local` に Facilitator URL、運営者アドレスを追加
  - `.env.example` にテンプレートを追加
  - `NEXT_PUBLIC_CHAIN_ID` を環境変数から読み取るように変更

- [x] 10.2 x402クライアント更新（src/services/x402/client.ts）
  - デフォルトFacilitator URLを `http://localhost:4022` に変更
  - 環境変数 `X402_FACILITATOR_URL` から読み取り

- [x] 10.3 PurchaseAction修正（src/components/actions/PurchaseAction.tsx）
  - 直接クライアント呼び出しからAPIルート経由に変更
  - `/api/x402/prepare` → EIP-712 TypedData取得
  - `/api/x402/execute` → Facilitator経由で送金実行

- [x] 10.4 定数ファイル更新（src/services/defi/constants.ts）
  - `CHAIN_ID` を `NEXT_PUBLIC_CHAIN_ID` 環境変数から読み取り

---

## 実装メモ

### 完了した内容

- DeFiサービス層
  - src/types/defi.ts - 型定義
  - src/services/defi/constants.ts - 定数（環境変数対応）
  - src/services/defi/client.ts - DeFiクライアント
  - src/hooks/useSecuredFinance.ts - **実際のSDKを使用**
    - SecuredFinanceClient でレンディング/引き出し/償還を実行
    - ポジション取得、残高取得も実SDK経由

- DeFi AIツール（9ツール）
  - getLendingRates - レート取得
  - getPositions - ポジション取得
  - getAffordableProducts - 利息範囲内商品検索
  - prepareDeposit - 預け入れ準備
  - prepareWithdraw - 早期引き出し準備（満期前のみ）
  - prepareClaim - 満期償還準備（満期後のみ）
  - startPurchase - 購入フロー開始・住所ヒアリング
  - confirmPurchase - 住所確認・購入準備完了

- x402サービス
  - src/services/x402/types.ts - 型定義
  - src/services/x402/eip712.ts - EIP-712ヘルパー
  - src/services/x402/client.ts - x402クライアント

- APIエンドポイント
  - /api/defi/positions - ポジション取得
  - /api/defi/rates - レート取得
  - /api/defi/prepare-deposit - 預け入れ準備
  - /api/x402/prepare - 送金準備
  - /api/x402/execute - 送金実行

- フロントエンド
  - src/hooks/useDefi.ts - DeFi/x402フック
  - プロンプト更新完了

- チャットアクションシステム
  - src/types/chat.ts - ChatAction型定義（Lending/Withdraw/Claim/Purchase）
  - src/components/actions/LendingAction.tsx - レンディング実行UI
  - src/components/actions/WithdrawAction.tsx - 早期引き出しUI
  - src/components/actions/ClaimAction.tsx - 満期償還UI
  - src/components/actions/PurchaseAction.tsx - 購入・決済UI
  - src/components/actions/index.tsx - ChatActionRenderer
  - src/services/ai/agent.ts - action抽出ロジック
  - src/app/api/chat/route.ts - actionをレスポンスに含める
  - src/hooks/useChat.ts - message.actionに格納
  - src/components/chat/MessageBubble.tsx - ChatActionRenderer表示
  - src/app/api/defi/place-order/route.ts - 注文実行API

- 実トランザクション実行
  - src/hooks/useSecuredFinance.ts - フロントエンド用SDK初期化
    - placeOrder() - レンディング注文
    - unwindPosition() - 早期解約（満期前）
    - executeRedemption() - 満期償還（満期後）
  - LendingAction.tsx - レンディング実行UI
  - WithdrawAction.tsx - 早期解約実行UI
  - ClaimAction.tsx - 満期償還実行UI
  - PurchaseAction.tsx - x402署名・送金・注文作成UI

### secured.finance SDK

GitHub Packages認証を設定済み。**実際のSDKを使用して本番接続**。

```bash
# 使用パッケージ
@secured-finance/sf-client: 0.2.0-beta.201
@secured-finance/sf-graph-client: 0.2.0-beta.200
@secured-finance/sf-core: 0.2.0-beta.187
```

**フロントエンド（useSecuredFinance.ts）で実SDKを使用：**
- `SecuredFinanceClient.init(publicClient, walletClient)` でウォレット接続時に初期化
- `placeOrder()` - レンディング注文実行
- `unwindPosition()` - 満期前の早期引き出し
- `executeRedemption()` - 満期後の元本+利息受け取り
- `getPositions()` - ポジション一覧取得
- `getERC20Balance()` - JPYC残高取得

### x402

Facilitator統合完了。以下の設定で動作：
- Facilitator URL: `http://localhost:4022`
- 運営者ウォレット: `0xEE8b59794Ee3A6aeeCE9aa09a118bB6ba1029e3c`

PurchaseActionからAPIルート経由でFacilitatorに接続：
1. `/api/x402/prepare` - EIP-712 TypedData生成
2. クライアントでウォレット署名
3. `/api/x402/execute` - Facilitatorに送金リクエスト

Facilitator未起動時はモック実行にフォールバック。

### 環境変数

```bash
# .env.local に追加

# Blockchain
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_JPYC_ADDRESS="0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB"

# x402 Facilitator
X402_FACILITATOR_URL="http://localhost:4022"
NEXT_PUBLIC_OPERATOR_ADDRESS="0xEE8b59794Ee3A6aeeCE9aa09a118bB6ba1029e3c"

# secured.finance
NEXT_PUBLIC_SF_ENV="staging"
```

| 変数名 | 用途 | クライアント側 |
|--------|------|---------------|
| `NEXT_PUBLIC_CHAIN_ID` | チェーンID（Sepolia: 11155111） | ✓ |
| `NEXT_PUBLIC_JPYC_ADDRESS` | JPYCトークンコントラクトアドレス | ✓ |
| `NEXT_PUBLIC_OPERATOR_ADDRESS` | 運営者ウォレットアドレス（送金先） | ✓ |
| `X402_FACILITATOR_URL` | x402 Facilitator URL | サーバーのみ |
| `NEXT_PUBLIC_SF_ENV` | secured.finance環境（staging/production） | ✓ |

### チャットでのテスト例

```
# 運用開始
「運用したい」 → レンディングレートを表示
「10000 JPYCを3ヶ月運用したい」 → 預け入れ準備 + LendingActionボタン表示

# 運用状況確認
「運用状況は？」 → ポジション一覧を表示

# 早期引き出し（満期前）
「引き出したい」 → WithdrawActionボタン表示

# 満期償還（満期後）
「利息を受け取りたい」 → ClaimActionボタン表示
「満期になったポジションはある？」 → 満期済みポジションを確認

# 利息ショッピング
「利息で何か買える？」 → 利息範囲内で商品検索

# 購入フロー
「チョコレートが欲しい」 → 商品一覧を表示
「これを買いたい」 → 住所ヒアリング開始
「山田太郎、1500001、東京都渋谷区...」 → 購入確認ボタン表示
```

### チャットアクションのテスト

```
# レンディング
1. 「10000 JPYCを3ヶ月運用したい」と入力
2. AIがprepareDepositToolを実行
3. メッセージ下部にLendingActionコンポーネントが表示される
   - 金額: 10,000 JPYC
   - 満期日: 2026/04/01
   - 予想年利: 5.0%
   - [レンディングを実行] ボタン
4. ボタンをクリック → ウォレット署名 → 完了

# 満期償還
1. 「利息を受け取りたい」と入力
2. AIがprepareClaimToolを実行
3. 満期済みポジションがあれば ClaimActionコンポーネントが表示される
   - 元本: 10,000 JPYC
   - 利息: 500 JPYC
   - 合計受取額: 10,500 JPYC
   - [利息を受け取る] ボタン
4. ボタンをクリック → executeRedemption → 完了

# 購入
1. 商品を検索して「これを買いたい」と入力
2. AIがstartPurchaseToolを実行 → 住所をヒアリング
3. ユーザーが住所情報を入力
4. AIがconfirmPurchaseToolを実行 → PurchaseActionコンポーネント表示
   - 商品名・価格
   - お届け先情報
   - [購入する] ボタン
5. ボタンをクリック → x402署名 → 送金 → 注文作成 → 完了
```
