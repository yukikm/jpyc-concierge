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
| **合計** | **24** | **24** | **100%** |

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

---

## 実装メモ

### 完了した内容

- DeFiサービス層（モックデータ対応）
  - src/types/defi.ts - 型定義
  - src/services/defi/constants.ts - 定数
  - src/services/defi/mock.ts - モックデータ
  - src/services/defi/client.ts - DeFiクライアント

- DeFi AIツール（6ツール追加）
  - getLendingRates - レート取得
  - getPositions - ポジション取得
  - getAffordableProducts - 利息範囲内商品検索
  - prepareDeposit - 預け入れ準備
  - prepareWithdraw - 引き出し準備

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
  - src/types/chat.ts - ChatAction型定義（Lending/Withdraw/Purchase）
  - src/components/actions/LendingAction.tsx - レンディング実行UI
  - src/components/actions/index.tsx - ChatActionRenderer
  - src/services/ai/agent.ts - action抽出ロジック
  - src/app/api/chat/route.ts - actionをレスポンスに含める
  - src/hooks/useChat.ts - message.actionに格納
  - src/components/chat/MessageBubble.tsx - ChatActionRenderer表示
  - src/app/api/defi/place-order/route.ts - 注文実行API

- 実トランザクション実行
  - src/hooks/useSecuredFinance.ts - フロントエンド用SDK初期化・placeOrder/unwindPosition実行フック
  - LendingAction.tsx更新 - useSecuredFinanceフックを使用して実トランザクション実行
  - WithdrawAction.tsx作成 - ポジション引き出し（早期解約）実行UI
  - ウォレット接続時にSDKをwalletClientで初期化
  - placeOrder()でMetaMask署名→secured.financeに送信
  - unwindPosition()で早期解約トランザクション実行

### secured.finance SDK

GitHub Packages認証を設定済み。SDKは正式に統合済み。

```bash
# 使用パッケージ
@secured-finance/sf-client: 0.2.0-beta.201
@secured-finance/sf-graph-client: 0.2.0-beta.200
@secured-finance/sf-core: 0.2.0-beta.187
```

SDKを使用してSecuredFinanceClientを初期化し、以下の機能を実装：
- `getOrderBookDetailsPerCurrency()` でレンディングレートを取得
- `getPositions()` でユーザーポジションを取得
- `getMaturities()` で利用可能な満期日を取得
- SDK初期化失敗時はモックデータにフォールバック

### x402

Facilitatorサーバーがない場合はモック実行にフォールバック。
本番環境では別途Facilitatorサーバーの起動が必要。

### 環境変数

```bash
# .env.local に追加（任意）
NEXT_PUBLIC_SF_ENV="staging"
X402_FACILITATOR_URL="http://localhost:3002"
NEXT_PUBLIC_JPYC_ADDRESS="0x..."
```

### チャットでのテスト例

```
「運用したい」 → レンディングレートを表示
「運用状況は？」 → モックポジションを表示
「利息で何か買える？」 → 利息範囲内で商品検索
「10000 JPYCを3ヶ月運用したい」 → 預け入れ準備 + LendingActionボタン表示
```

### チャットアクションのテスト

```
1. 「10000 JPYCを3ヶ月運用したい」と入力
2. AIがprepareDepositToolを実行
3. メッセージ下部にLendingActionコンポーネントが表示される
   - 金額: 10,000 JPYC
   - 満期日: 2026/04/01
   - 予想年利: 5.0%
   - [レンディングを実行] ボタン
4. ボタンをクリック → ウォレット署名 → 完了
```
