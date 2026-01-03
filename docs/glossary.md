# ユビキタス言語定義（用語集）

## 1. ドメイン用語

### 1.1 資産運用関連

| 用語（日本語） | 用語（英語） | 定義 | コード上の命名 |
|--------------|-------------|------|---------------|
| 運用 | Lending | JPYCをDeFiプロトコルに預けて利息を得ること | `lending` |
| 預け入れ | Deposit | 資産をプロトコルに預ける操作 | `deposit` |
| 引き出し | Withdraw | 預けた資産をウォレットに戻す操作 | `withdraw` |
| 利息 | Interest / Yield | 運用によって得られる収益 | `interest`, `yield` |
| 利益請求 | Claim | 発生した利息を受け取る操作 | `claim` |
| 満期 | Maturity | ZC Bondの償還日 | `maturity` |
| 年利 | APR / APY | 年間利回り | `apr`, `apy` |
| 担保 | Collateral | 借り入れの保証として預ける資産 | `collateral` |
| ポジション | Position | 現在保有している運用状態 | `position` |

### 1.2 購入関連

| 用語（日本語） | 用語（英語） | 定義 | コード上の命名 |
|--------------|-------------|------|---------------|
| 商品 | Product | 楽天市場で販売されている商品 | `product` |
| 注文 | Order | ユーザーが購入を決定した商品情報 | `order` |
| 代理購入 | Proxy Purchase | 管理者がユーザーに代わって購入すること | `proxyPurchase` |
| 配送先 | Shipping Address | 商品の届け先住所 | `shippingAddress` |
| 決済 | Payment | 商品代金の支払い | `payment` |

### 1.3 注文ステータス

| ステータス（日本語） | ステータス（英語） | 定義 | コード上の値 |
|-------------------|------------------|------|-------------|
| 注文受付 | Pending | 注文が作成され、管理者の対応待ち | `pending` |
| 発注済み | Ordered | 管理者が楽天で発注完了 | `ordered` |
| 発送済み | Shipped | 商品が発送された | `shipped` |
| 完了 | Completed | 商品が届き、取引完了 | `completed` |
| キャンセル | Cancelled | 注文がキャンセルされた | `cancelled` |

## 2. ブロックチェーン用語

### 2.1 基本用語

| 用語（日本語） | 用語（英語） | 定義 | コード上の命名 |
|--------------|-------------|------|---------------|
| ウォレット | Wallet | 暗号資産を管理するアプリ/ブラウザ拡張 | `wallet` |
| ウォレットアドレス | Wallet Address | 0xで始まる42文字の識別子 | `walletAddress`, `address` |
| トランザクション | Transaction | ブロックチェーン上の操作記録 | `transaction`, `tx` |
| トランザクションハッシュ | Transaction Hash | トランザクションの一意識別子 | `txHash` |
| ガス代 | Gas Fee | トランザクション実行に必要な手数料 | `gasFee` |
| 署名 | Signature | ウォレットによる承認操作 | `signature` |
| コントラクト | Contract | ブロックチェーン上のプログラム | `contract` |
| チェーン | Chain | ブロックチェーンネットワーク | `chain` |

### 2.2 JPYC関連

| 用語 | 定義 | コード上の命名 |
|------|------|---------------|
| JPYC | 日本円に連動したステーブルコイン（1 JPYC = 1円） | `JPYC`, `jpyc` |
| ERC-20 | Ethereumのトークン標準規格 | - |
| EIP-3009 | ガスレス送金を可能にする署名規格 | - |

### 2.3 DeFi関連

| 用語 | 定義 | コード上の命名 |
|------|------|---------------|
| DeFi | 分散型金融（Decentralized Finance） | `defi` |
| Orderbook | 売買注文の一覧（指値注文方式） | `orderBook` |
| Zero-Coupon Bond | 額面より安く購入し、満期時に額面で償還される債券 | `zcBond` |
| Unit Price | ZC Bondの購入価格（9800 = 98円で購入） | `unitPrice` |

### 2.4 x402関連

| 用語 | 定義 | コード上の命名 |
|------|------|---------------|
| x402 | HTTP 402を活用した支払いプロトコル | `x402` |
| Facilitator | x402の決済を仲介するサーバー | `facilitator` |
| ガスレス送金 | ユーザーがガス代を支払わない送金方式 | `gaslessTransfer` |

## 3. システム用語

### 3.1 ユーザー関連

| 用語（日本語） | 用語（英語） | 定義 | コード上の命名 |
|--------------|-------------|------|---------------|
| ユーザー | User | アプリを利用する一般ユーザー | `user` |
| 管理者 | Admin | 代理購入を行う運営者 | `admin` |
| 会話 | Conversation | ユーザーとAIのチャットセッション | `conversation` |
| メッセージ | Message | 会話内の1つの発言 | `message` |

### 3.2 役割（Role）

| 役割 | 定義 | コード上の値 |
|------|------|-------------|
| ユーザー | チャットでメッセージを送信した側 | `user` |
| アシスタント | AIエージェントの応答 | `assistant` |
| システム | システムからの通知 | `system` |

### 3.3 アクション

| アクション | 定義 | コード上の値 |
|----------|------|-------------|
| なし | 通常の会話応答 | `none` |
| 預け入れ | DeFiへの預け入れを実行 | `deposit` |
| 引き出し | DeFiからの引き出しを実行 | `withdraw` |
| 利息請求 | 利息の受け取りを実行 | `claim` |
| 購入 | 商品の購入を実行 | `purchase` |

## 4. UI/UX用語

### 4.1 画面要素

| 用語（日本語） | 用語（英語） | 定義 | コード上の命名 |
|--------------|-------------|------|---------------|
| チャット画面 | Chat Screen | メインのチャットインターフェース | `ChatContainer` |
| メッセージバブル | Message Bubble | 個々のメッセージ表示 | `MessageBubble` |
| 商品カード | Product Card | 商品情報を表示するカード | `ProductCard` |
| 入力エリア | Input Area | メッセージ入力欄 | `ChatInput` |
| 残高表示 | Balance Display | ウォレット残高の表示 | `BalanceDisplay` |
| ステータスバッジ | Status Badge | 注文ステータスの表示 | `StatusBadge` |

### 4.2 状態

| 状態（日本語） | 状態（英語） | 定義 | コード上の命名 |
|--------------|-------------|------|---------------|
| 読み込み中 | Loading | データ取得中 | `isLoading` |
| 送信中 | Sending | メッセージ送信中 | `isSending` |
| 接続済み | Connected | ウォレット接続済み | `isConnected` |
| 未接続 | Disconnected | ウォレット未接続 | `!isConnected` |
| エラー | Error | エラー発生 | `error`, `isError` |

## 5. API/データ用語

### 5.1 エンドポイント命名

| パス | 説明 | HTTP メソッド |
|------|------|--------------|
| `/api/chat` | チャットメッセージ送受信 | POST |
| `/api/products/search` | 商品検索 | GET |
| `/api/orders` | 注文一覧/作成 | GET, POST |
| `/api/orders/:id` | 注文詳細/更新 | GET, PATCH |
| `/api/defi/balance` | DeFi残高取得 | GET |

### 5.2 レスポンス構造

| フィールド | 説明 | 型 |
|-----------|------|-----|
| `data` | 成功時のデータ | Object/Array |
| `error` | エラーメッセージ | string |
| `message` | 補足メッセージ | string |

## 6. 省略語・略語

| 略語 | 正式名称 | 意味 |
|------|---------|------|
| SF | Secured Finance | DeFiプロトコル |
| SDK | Software Development Kit | 開発キット |
| API | Application Programming Interface | 外部連携 |
| UI | User Interface | 画面 |
| UX | User Experience | 体験 |
| DB | Database | データベース |
| TX | Transaction | トランザクション |
| APR | Annual Percentage Rate | 年利 |
| APY | Annual Percentage Yield | 年間利回り |
| ZC | Zero-Coupon | ゼロクーポン |

## 7. 命名パターン

### 7.1 関数名

| パターン | 用途 | 例 |
|---------|------|-----|
| `get*` | データ取得 | `getOrders`, `getBalance` |
| `fetch*` | API呼び出し | `fetchProducts`, `fetchPositions` |
| `create*` | 新規作成 | `createOrder`, `createMessage` |
| `update*` | 更新 | `updateOrderStatus` |
| `delete*` | 削除 | `deleteOrder` |
| `handle*` | イベントハンドラ | `handleSubmit`, `handleConnect` |
| `on*` | コールバック関数 | `onClick`, `onStatusChange` |
| `is*` / `has*` / `can*` | 真偽値 | `isLoading`, `hasError`, `canSubmit` |
| `use*` | Reactフック | `useChat`, `useWallet` |

### 7.2 型名

| パターン | 用途 | 例 |
|---------|------|-----|
| `*Props` | コンポーネントProps | `ButtonProps`, `CardProps` |
| `*State` | 状態の型 | `ChatState`, `OrderState` |
| `*Input` | 入力データの型 | `CreateOrderInput` |
| `*Response` | APIレスポンスの型 | `ChatResponse` |
| `*Action` | アクションの型 | `ChatAction` |

## 8. 日英対応表（チャットUI用）

AIエージェントが使用する表現の統一。

| 場面 | 日本語 | 英語（内部） |
|------|--------|------------|
| 挨拶 | こんにちは！JPYCコンシェルジュです | greeting |
| 残高確認 | 現在の残高は○JPYCです | balance_info |
| 運用提案 | ○円を年利○%で運用できます | lending_proposal |
| 商品提案 | こんな商品が見つかりました | product_suggestion |
| 確認 | よろしいですか？ | confirmation |
| 完了 | 完了しました！ | success |
| エラー | 申し訳ありません。○○に失敗しました | error |
| 住所質問 | お届け先の住所を教えてください | address_request |
