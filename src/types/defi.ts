// DeFi関連の型定義

export interface Position {
  id: string;
  currency: string;
  principal: bigint; // 元本（wei単位）
  accruedInterest: bigint; // 発生利息（wei単位）
  maturityDate: Date;
  apy: number; // 年利率（%）
  status: "active" | "matured";
}

export interface LendingRate {
  maturityDate: Date;
  apy: number; // 年利率（%）
  minAmount: bigint; // 最小預入額（wei単位）
}

export interface DepositParams {
  amount: bigint;
  maturityDate: Date;
  userAddress: string;
}

export interface WithdrawParams {
  positionId: string;
  userAddress: string;
}

export interface ClaimParams {
  positionId: string;
  userAddress: string;
}

// フロントエンド表示用の型（bigintをstringに変換）
export interface PositionDisplay {
  id: string;
  currency: string;
  principal: string; // 表示用（例: "100,000 JPYC"）
  principalRaw: string; // 生値（例: "100000"）
  accruedInterest: string;
  accruedInterestRaw: string;
  maturityDate: string;
  apy: string;
  status: "active" | "matured";
  daysUntilMaturity: number;
}

export interface LendingRateDisplay {
  maturityDate: string;
  apy: string;
  minAmount: string;
  daysUntilMaturity: number;
}

// トランザクション関連
export interface TransactionRequest {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export interface DefiOperationResult {
  success: boolean;
  txHash?: string;
  error?: string;
}
