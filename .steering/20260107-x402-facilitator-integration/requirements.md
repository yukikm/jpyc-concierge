# x402 Facilitator統合 - 要求定義

## 概要

x402プロトコルを使用したガスレスJPYC送金機能をFacilitator経由で実現する。

## 背景

- JPYCコンシェルジュアプリで商品購入時にJPYC送金が必要
- ユーザーがガス代を払わずに送金できるようにしたい
- EIP-3009 (TransferWithAuthorization) とx402プロトコルを使用

## 要求事項

### 機能要件

1. **x402 Facilitator連携**
   - Facilitatorの `/supported` エンドポイントでヘルスチェック
   - Facilitatorの `/settle` エンドポイントで送金実行
   - x402 v2プロトコル形式に準拠

2. **EIP-712署名**
   - JPYCコントラクトのドメイン情報に合わせた署名生成
   - ウォレット（MetaMask等）での署名UIをサポート

3. **購入フロー**
   - 商品選択 → 住所入力 → 署名 → 送金実行
   - UIでの確認カード表示

### 非機能要件

- Facilitatorが利用不可の場合はモックモードで動作
- エラーメッセージの適切な表示

## 対象環境

- ネットワーク: Sepolia (chainId: 11155111)
- JPYCコントラクト: `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`
- x402バージョン: 2
- Network識別子: `eip155:11155111`
