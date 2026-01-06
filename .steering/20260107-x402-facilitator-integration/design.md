# x402 Facilitator統合 - 設計書

## アーキテクチャ

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   フロントエンド   │────▶│    API Routes    │────▶│   Facilitator   │
│  (PurchaseAction) │     │ /api/x402/*      │     │ localhost:4022  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                │
         │ EIP-712署名                                    │ TransferWithAuthorization
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│   ウォレット      │                              │  JPYCコントラクト │
│   (MetaMask)     │                              │    (Sepolia)    │
└─────────────────┘                              └─────────────────┘
```

## x402プロトコル仕様

### バージョンとネットワーク

```typescript
const X402_VERSION = 2;
const SCHEME = "exact";
const NETWORK = "eip155:11155111";  // Sepolia
```

### PaymentRequirements構造

```typescript
interface PaymentRequirements {
  scheme: "exact";
  network: "eip155:11155111";
  asset: string;              // JPYCアドレス
  amount: string;             // wei単位の金額
  payTo: `0x${string}`;       // 受取先アドレス
  maxTimeoutSeconds: number;
  extra: {
    name: string;             // EIP-712ドメイン名
    version: string;          // EIP-712ドメインバージョン
  };
}
```

### PaymentPayload構造 (v2)

```typescript
interface PaymentPayload {
  x402Version: 2;
  resource: {
    url: string;
    method: "POST";
  };
  accepted: PaymentRequirements;
  payload: {
    signature: `0x${string}`;
    authorization: {
      from: `0x${string}`;
      to: `0x${string}`;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: `0x${string}`;
    };
  };
}
```

## EIP-712署名

### ドメイン情報

JPYCコントラクト (FiatTokenV1) のEIP-712ドメイン:

```typescript
const domain = {
  name: "JPY Coin",
  version: "1",              // FiatTokenV1のVERSION定数
  chainId: 11155111,         // Sepolia
  verifyingContract: "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB"
};
```

### TransferWithAuthorization型

```typescript
const types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
};
```

## ファイル構成

```
src/services/x402/
├── client.ts      # X402Clientクラス（Facilitator通信）
├── eip712.ts      # EIP-712 TypedData生成
├── types.ts       # 型定義
└── index.ts       # エクスポート

src/app/api/x402/
├── prepare/route.ts   # 署名用パラメータ生成
└── execute/route.ts   # Facilitator経由で送金実行

src/components/actions/
└── PurchaseAction.tsx  # 購入UIコンポーネント
```

## エンドポイント

### Facilitator `/supported`

- ヘルスチェック用
- サポートするscheme/networkの一覧を返す

### Facilitator `/settle`

- 送金実行
- リクエスト: `{ paymentPayload, paymentRequirements }`
- レスポンス: `{ success, txHash, network, errorReason }`

## 金額計算

JPYCは18 decimalsのERC-20トークン:

```typescript
// 円からwei変換
const amount = BigInt(priceInYen) * 10n ** 18n;
// 例: 3480円 → 3480000000000000000000 wei → 3480 JPYC
```
