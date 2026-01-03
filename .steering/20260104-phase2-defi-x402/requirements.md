# Phase 2 要求書 - DeFi連携・x402決済

## 概要

Phase 1で構築したMVPに、DeFi運用機能（secured.finance）とガスレス決済機能（x402）を追加する。

## 機能スコープ

### 1. DeFi連携（secured.finance）

| 機能 | 説明 | 優先度 |
|------|------|--------|
| 運用開始（Deposit） | JPYCを預けてレンディング開始 | 必須 |
| 運用状況確認 | ポジション・利息・満期日の確認 | 必須 |
| 引き出し（Withdraw） | 満期前のポジション解消 | 必須 |
| 満期償還（Claim） | 満期到達時の元本+利息受け取り | 必須 |

### 2. x402決済

| 機能 | 説明 | 優先度 |
|------|------|--------|
| EIP-712署名 | TransferWithAuthorization用の署名 | 必須 |
| ガスレス送金 | Facilitator経由でJPYC送金 | 必須 |

## ユーザーストーリー

### US-P2-001: JPYCを運用する

```
ユーザーとして、
チャットで「運用したい」と伝え、金額を指定することで、
JPYCをsecured.financeに預けて利息を得たい。
```

### US-P2-002: 運用状況を確認する

```
ユーザーとして、
チャットで「運用状況は？」と聞くことで、
現在の運用額・利息・満期日を知りたい。
```

### US-P2-003: 利息で商品を買う

```
ユーザーとして、
チャットで「利息で何か買える？」と聞くことで、
利息の範囲内で買える商品を提案してほしい。
```

### US-P2-004: x402で決済する

```
ユーザーとして、
商品購入時にガス代なしでJPYCを送金したい。
```

## 技術要件

### secured.finance SDK

```bash
# GitHub Packages認証が必要
@secured-finance:registry=https://npm.pkg.github.com

# パッケージ
@secured-finance/sf-client
@secured-finance/sf-graph-client
@secured-finance/sf-core
```

### x402

```bash
# Coinbaseのx402パッケージ
@x402/fetch
```

### チェーン設定

- テストネット: Sepolia (chainId: 11155111)
- secured.finance: https://stg.secured.finance
- JPYC Faucet: テストネット用JPYCを取得

## 環境変数（追加）

```
# secured.finance
NEXT_PUBLIC_SF_SUBGRAPH_URL="https://..."

# x402 Facilitator
X402_FACILITATOR_URL="http://localhost:3002"
```

## 受け入れ条件

### AC-P2-001: Deposit

- [x] チャットで運用意思を伝えられる
- [x] 金額をヒアリングできる
- [x] 現在の最良レートを表示できる
- [x] チャット内にLendingActionボタンを表示できる
- [x] MetaMask承認後、預け入れが完了する（useSecuredFinanceフック実装済み）

### AC-P2-002: 運用状況確認

- [x] ポジション一覧を取得できる
- [x] 元本・利息・満期日を表示できる

### AC-P2-003: Withdraw

- [x] 満期前でもポジション解消できる（unwindPosition実装済み）
- [x] 予想受取額を表示できる
- [x] WithdrawActionコンポーネントで実際のトランザクション実行可能

### AC-P2-004: x402決済

- [x] EIP-712署名データを生成できる
- [ ] ガスレスで送金が完了する（Facilitatorサーバー必要）

### AC-P2-005: チャットアクション（追加）

- [x] AIツールからアクションオブジェクトを返せる
- [x] チャットメッセージにインタラクティブUIを埋め込める
- [x] LendingActionコンポーネントで金額・満期・APYを表示できる
- [x] 実行ボタンからトランザクションを開始できる
