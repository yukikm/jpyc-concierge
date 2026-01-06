# 要求内容

## 概要

Phase2で実装されたUSDCレンディング機能を完成させ、実際に動作可能な状態にする。

## 背景

Phase2でUSDCレンディングの基盤実装（型定義、フック、UIコンポーネント）は完了しているが、以下の問題が残っている:

1. `USDC_ADDRESS`がプレースホルダー（`0x0000...`）のままで、実際のコントラクトアドレスが設定されていない
2. secured.finance Staging環境でUSDCがサポートされているかの検証が未実施
3. エンドツーエンドでの動作確認が未実施

## 実装対象の機能

### 1. USDCアドレス設定

- ~~Circle公式のSepolia USDCアドレス（`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`）を設定~~
- **変更**: secured.finance Staging専用USDC（`0x1291070C5f838DCCDddc56312893d3EfE9B372a8`）を使用
- 環境変数 `NEXT_PUBLIC_USDC_ADDRESS` を `.env.local` に追加
- `constants.ts` のデフォルト値を更新

### 2. secured.finance USDC対応確認

- SDK初期化時にUSDCトークンが正しく認識されるか確認
- USDCでのレンディングレート取得が可能か検証
- USDCでの注文実行が可能か検証

### 3. エンドツーエンド動作確認

- ウォレット接続 → USDC残高取得
- レンディングレート表示
- レンディング実行（UIからの操作）
- ポジション表示

## 受け入れ条件

### USDCアドレス設定
- [x] `NEXT_PUBLIC_USDC_ADDRESS` が `.env.local` に設定されている
- [x] `constants.ts` のデフォルト値がsecured.finance Staging用アドレスに更新されている
- [x] 型エラー・ビルドエラーがない

### AIツール・システムプロンプト
- [x] システムプロンプトでUSDC/JPYCの区別を明記
- [x] `getLendingRatesTool` に currency パラメータ追加
- [x] `prepareDepositTool` に currency パラメータ追加
- [x] `DefiClient` で通貨別にレート/パラメータを取得

### secured.finance USDC対応
- [ ] SDK初期化ログでUSDCアドレスが表示される
- [ ] USDCのレンディングレートが取得できる（または未対応の場合は明確なエラーメッセージ）
- **現状**: コントラクト関数（`getOrderBookDetails`, `getMaturities`）がrevertする

### エンドツーエンド動作
- [x] チャットで「USDCの金利は？」と聞いてレートが返る（モックデータにフォールバック）
- [x] チャットで「100 USDCを運用したい」でLendingActionが表示される
- [ ] 実際のトランザクション実行が成功する

## 成功指標

- USDCレンディング機能が実際に使用可能な状態になる
- または、secured.finance Staging環境での制約が明確になり、対応方針が決まる

## スコープ外

以下はこのフェーズでは実装しません:

- 本番環境（Mainnet）対応
- 他のステーブルコイン（DAI, USDT等）の追加
- secured.finance SDK以外のDeFiプロトコル連携

## 参照ドキュメント

- `docs/product-requirements.md` - プロダクト要求定義書
- `docs/architecture.md` - アーキテクチャ設計書
- `.steering/20260104-phase2-defi-x402/tasklist.md` - Phase2タスクリスト

---

## 現在のブロッカーと調査事項

### ブロッカー: SDKコントラクト関数のrevert

secured.finance SDKを通じてUSDCのOrderBook情報を取得しようとすると、コントラクト関数がrevertする。

**エラーログ**:
```
[DefiClient] Failed to get USDC lending rates from SDK:
Error [ContractFunctionExecutionError]: The contract function "getOrderBookDetails" reverted.

[DefiClient] Failed to get USDC lending order params:
Error [ContractFunctionExecutionError]: The contract function "getMaturities" reverted.
```

**追加エラー（nonces）**:
```
The contract function "nonces" returned no data ("0x").
address: 0x0000000000000000000000000000000000000000
```
→ SDKが作成したTokenオブジェクトからコントラクトアドレスを解決できていない

### 調査が必要な項目

1. **SDKの`getCurrencies()`が返すアドレス**
   - ブラウザコンソールで `[useSecuredFinance] SDK registered currency addresses:` を確認
   - 各アドレスのERC20シンボルを確認

2. **secured.finance Staging UIでの確認**
   - https://stg.secured.finance/ にアクセス
   - 利用可能な通貨一覧を確認
   - USDCが実際にサポートされているか確認

3. **SDKのバージョンと互換性**
   - 現在: `@secured-finance/sf-client@0.2.0-beta.201`
   - Staging環境のコントラクトと互換性があるか

### 暫定対応

SDKからの取得に失敗した場合、モックデータにフォールバックする実装済み:
- レート表示: モックデータで表示
- 実際のトランザクション: 現時点では失敗する可能性あり

### 次のステップ

1. ブラウザコンソールでSDKのログを確認し、登録済み通貨アドレスを特定
2. secured.finance Staging UIで利用可能な通貨を確認
3. 上記結果に基づいて対応方針を決定:
   - USDCがサポートされている場合: Tokenオブジェクトの作成方法を修正
   - USDCがサポートされていない場合: JPYCのみの対応に限定、または別環境を検討
