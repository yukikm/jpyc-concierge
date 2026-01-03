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

// Facilitatorへのリクエスト
export interface FacilitatorRequest {
  tokenAddress: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  value: string; // bigintをstring化
  validAfter: string;
  validBefore: string;
  nonce: string;
  v: number;
  r: string;
  s: string;
}

// Facilitatorからのレスポンス
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
