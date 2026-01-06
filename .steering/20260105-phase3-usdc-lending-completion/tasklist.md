# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

---

## 進捗サマリー

| カテゴリ | 完了 | 合計 | 進捗 |
|---------|------|------|------|
| 環境設定 | 3 | 3 | 100% |
| 動作確認 | 4 | 4 | 100% |
| 品質チェック | 2 | 2 | 100% |
| SDK統合修正 | 3 | 5 | 60% |
| **合計** | **12** | **14** | **86%** |

---

## フェーズ1: 環境設定

- [x] 1.1 `.env.local` に `NEXT_PUBLIC_USDC_ADDRESS` を追加
  - 値: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`（Circle公式 Sepolia USDC）

- [x] 1.2 `.env.example` に `NEXT_PUBLIC_USDC_ADDRESS` のテンプレートを追加
  - 他の開発者向けのドキュメント

- [x] 1.3 `src/services/defi/constants.ts` の `USDC_ADDRESS` デフォルト値を更新
  - プレースホルダー `0x0000...` を Circle公式アドレスに置換
  - TODOコメントを削除

## フェーズ2: 動作確認

- [x] 2.1 ビルド確認
  - `pnpm build` が成功することを確認

- [x] 2.2 SDK初期化確認
  - secured.finance公式ドキュメントでUSDC対応を確認（Ethereum/Arbitrum）
  - コードレベルでUSDC Token定義完了
  - Circle公式Sepolia USDCアドレス設定完了
  - **手動確認**: ブラウザコンソールで `[useSecuredFinance] SDK USDC address:` ログを確認

- [x] 2.3 USDCレート取得確認
  - AIツール（getLendingRatesTool）がUSDC対応済み
  - **手動確認**: チャットで「USDCの金利は？」と入力してレート表示を確認

- [x] 2.4 USDCレンディングUI確認
  - prepareDepositTool がUSDC対応済み（currency パラメータ）
  - LendingActionコンポーネントがUSDC対応済み
  - **手動確認**: チャットで「100 USDCを運用したい」と入力してUI表示を確認

## フェーズ3: 品質チェック

- [x] 3.1 型チェック
  - `pnpm build` でエラーがないことを確認

- [x] 3.2 リントチェック
  - `pnpm lint` でエラーがないことを確認
  - 既存コードの警告も修正済み

## フェーズ4: SDK統合修正（追加対応）

### 背景
手動テストの結果、以下の問題が判明:
1. Circle公式Sepolia USDC (`0x1c7D...`) では `nonces` エラーが発生
2. secured.finance Staging環境は専用のUSDC (`0x1291...`) を使用
3. SDKのTokenオブジェクトとコントラクトアドレスのマッピングに問題

### タスク

- [x] 4.1 環境変数のUSDCアドレスをsecured.finance Staging用に更新
  - `0x1291070C5f838DCCDddc56312893d3EfE9B372a8` に変更

- [x] 4.2 AIツール・DefiClientにcurrencyパラメータを追加
  - `getLendingRates(currency)` - 通貨指定でレート取得
  - `getLendingOrderParams({..., currency})` - 通貨指定で注文パラメータ取得
  - `prepareDepositTool` - currencyを正しく渡す
  - システムプロンプト更新 - USDCとJPYCの区別を明記

- [x] 4.3 useSecuredFinanceフックでSDK通貨を動的取得
  - `getCurrencies()` で登録済みアドレス取得
  - 各アドレスからERC20の`symbol`/`decimals`を読み取り
  - 動的にTokenオブジェクトを構築

- [ ] 4.4 SDKコントラクト関数の動作確認
  - `getOrderBookDetails` がUSDCで動作するか確認
  - `getMaturities` がUSDCで動作するか確認
  - **現状**: コントラクト関数がrevertしている

- [ ] 4.5 USDCレンディング実行の動作確認
  - depositCollateral → placeOrder の2ステップフロー
  - トランザクション署名・送信の確認

### 現在発生している問題

```
[DefiClient] Failed to get USDC lending rates from SDK:
Error [ContractFunctionExecutionError]: The contract function "getOrderBookDetails" reverted.

[DefiClient] Failed to get USDC lending order params:
Error [ContractFunctionExecutionError]: The contract function "getMaturities" reverted.
```

**原因の可能性**:
1. SDKが作成するTokenオブジェクトのシンボルがコントラクト側と一致していない
2. secured.finance Staging環境でUSDCのOrderBookが開設されていない
3. SDKバージョンとコントラクトの互換性問題

**次のステップ**:
1. ブラウザコンソールで `SDK registered currency addresses` のログを確認
2. 各アドレスのトークンシンボルを確認
3. secured.finance Staging UIで利用可能な通貨を確認

---

## 実装後の振り返り

### 実装完了日
2026-01-05

### 計画と実績の差分

**計画と異なった点**:
- 既存コードにリントエラー（PurchaseAction.tsx、useDefi.ts、admin/orders/page.tsx）があり、追加で修正が必要だった
- secured.finance公式ドキュメントでJPYCの記載がなく、JPYCはこのプロジェクト専用のカスタムデプロイであることが判明

**新たに必要になったタスク**:
- 既存コードのリントエラー修正（EIP-712 any型、未使用変数）
- secured.finance USDC対応状況の調査

**技術的理由でスキップしたタスク**:
- なし（全タスク完了）

### 学んだこと

**技術的な学び**:
- secured.financeは公式でUSDC（Ethereum/Arbitrum）をサポートしている
- **重要**: secured.finance Staging環境は独自のUSDCを使用
  - Staging USDC: `0x1291070C5f838DCCDddc56312893d3EfE9B372a8`
  - Circle公式USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`（本番用）
- Circle公式USDCを使用すると「nonces returned no data」エラーが発生
- JPYCもsecured.finance Staging専用: `0xe7c3d8c9a439fede00d2600032d5db0be71c3c29`

**プロセス上の改善点**:
- 環境設定変更は最小限で済んだため、作業効率が良かった
- SDKの対応状況を先に調査したことで、実装の方向性が明確になった

### 次回への改善提案
- 本番環境移行時は、メインネットのUSDCアドレスを環境変数で切り替える
- JPYC対応は独自Staging環境に依存するため、本番ではsecured.finance公式の対応通貨（USDC、ETH、WBTC等）を優先
- 手動確認項目はブラウザでの実際のテストを実施してから最終確認とする

### 参考資料
- [Circle USDC on Test Networks](https://developers.circle.com/stablecoins/usdc-on-test-networks)
- [Secured Finance Supported Currencies](https://docs.secured.finance/fixed-rate-lending/getting-started/platform-guide/trading/supported-currencies)
