// x402決済関連の型定義

// TransferWithAuthorization用のパラメータ
export interface TransferAuthParams {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: `0x${string}`;
}

// EIP-712署名済みデータ
export interface SignedAuthorization {
  params: TransferAuthParams;
  signature: `0x${string}`;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
}

// x402 ResourceInfo
export interface ResourceInfo {
  url: string;
  method?: string;
}

// x402 PaymentRequirements
export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: `0x${string}`;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

// x402 PaymentPayload (v2)
export interface PaymentPayload {
  x402Version: number;
  resource: ResourceInfo;
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

// Facilitator /settle リクエスト
export interface SettleRequest {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}

// Facilitator /settle レスポンス
export interface SettleResponse {
  success: boolean;
  txHash?: `0x${string}`;
  network?: string;
  errorReason?: string;
}

// Facilitator /verify レスポンス
export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
}

// Facilitatorからのレスポンス（後方互換）
export interface FacilitatorResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

// x402送金結果
export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// EIP-712 TypedData定義
export interface TransferWithAuthorizationTypedData {
  types: {
    EIP712Domain: Array<{ name: string; type: string }>;
    TransferWithAuthorization: Array<{ name: string; type: string }>;
  };
  primaryType: "TransferWithAuthorization";
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  message: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
  };
}
