# JPYC Concierge

AIとのチャットでECサイトでの商品購入・ステーブルコイン運用を実現するコンシェルジュアプリケーション。
ステーブルコインを「決済」として利用でき、暗号通貨投資経験がない人でもAIチャットでガイドしながらチャット経由でDeFiを利用できる。
現在はECサイトとして楽天市場、DeFiとしてsecured.financeをデモ環境で接続。

## リンク

### Sepoliaチェーン上でのJPYC送金用に修正したx402のリポジトリURL

https://github.com/yukikm/x402-jpyc

### ピッチデッキ

https://www.canva.com/design/DAG2-6ozMK0/ko3zrGwpvqAd41BW-BZqDg/view?utm_content=DAG2-6ozMK0&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h62c3c8797a

### デモ動画

https://www.loom.com/share/f2d615c0c7fb41548b09a4d4b5bf2fbd

## 必要条件

- Node.js 20.x 以上
- pnpm 9.x 以上
- PostgreSQL 14 以上
- MetaMask（または互換ウォレット）

## x402 Facilitatorセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yukikm/x402-jpyc.git
cd x402-jpyc/examples/typescript
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env-local`をコピーして`.env.local`を作成します。

```bash
cp facilitator/.env-local facilitator/.env.local
```

`.env.local`を編集して必要な値を設定します。

### 4. 開発サーバーの起動

```bash
cd facilitator
pnpm dev
```

## JPYCコンシェルジュセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yukikm/jpyc-concierge.git
cd jpyc-concierge
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成します。

```bash
cp .env.example .env.local
```

`.env.local`を編集して必要な値を設定します。

### 4. データベースのセットアップ

PostgreSQLを起動し、データベースを作成します。

```bash
# Prismaクライアントの生成
pnpm db:generate

# データベーススキーマの適用
pnpm db:push
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開きます。

## 使用方法

1. MetaMaskをSepoliaテストネットに接続
2. ウォレットを接続
3. チャットで「100 USDCをレンディングしたい」などと入力
4. 表示される指示に従って操作

## 主な機能

- **AIチャット**: 自然言語での操作
- **担保預入**: secured.financeへの担保預入
- **商品購入**: 楽天市場の商品検索・購入（x402決済）

## 開発コマンド

```bash
# 開発サーバー
pnpm dev

# ビルド
pnpm build

# 本番サーバー
pnpm start

# Lint
pnpm lint

# Prisma Studio（DB管理UI）
pnpm db:studio
```

## 技術スタック

- **フレームワーク**: Next.js 16
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma
- **AI**: OpenAI GPT-4 (via Vercel AI SDK)
- **ブロックチェーン**: Ethereum Sepolia + wagmi + viem
- **DeFi**: secured.finance SDK
- **楽天市場**: Rakuten Web Service

## ネットワーク設定

現在、Sepolia テストネット（Chain ID: 11155111）を使用しています。

### テスト用トークンの取得

- **Sepolia ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)
- **Sepoliaチェーン上のテスト用JPYC**: [JPYC Faucet](https://faucet.jpyc.jp/)
- **secured.financeテストネット環境用USDC**: [secured.finance faucet](https://stg.secured.finance/faucet/)
