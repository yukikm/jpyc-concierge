// DeFi関連の定数

// Chain ID（環境変数から取得、デフォルトはSepolia）
export const CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || "11155111",
  10
);

// JPYC Token Address (Sepolia)
// EIP-3009 TransferWithAuthorization対応のJPYC v2
export const JPYC_ADDRESS =
  (process.env.NEXT_PUBLIC_JPYC_ADDRESS as `0x${string}`) ||
  "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB";

// USDC Token Address (Sepolia)
// secured.finance Staging環境で使用されるUSDCアドレス
// 本番環境ではCircle公式USDC (0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238) を使用
export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`) ||
  "0x1291070C5f838DCCDddc56312893d3EfE9B372a8";

// secured.finance Contract Addresses (Sepolia Staging)
export const SF_CONTRACTS = {
  lendingMarket:
    "0x0000000000000000000000000000000000000000" as `0x${string}`,
  tokenVault: "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

// secured.finance環境
export const SF_ENV = process.env.NEXT_PUBLIC_SF_ENV || "staging";
export const SF_SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SF_SUBGRAPH_URL ||
  "https://api.thegraph.com/subgraphs/name/secured-finance/sf-sepolia";

// 通貨設定
export const SUPPORTED_CURRENCIES = ["JPYC", "USDC"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// デフォルト値
export const DEFAULT_MIN_DEPOSIT_JPYC = 1000n * 10n ** 18n; // 1,000 JPYC
export const DEFAULT_MIN_DEPOSIT_USDC = 10n * 10n ** 6n; // 10 USDC
export const JPYC_DECIMALS = 18;
export const USDC_DECIMALS = 6;

// フォーマットヘルパー
export function formatJPYC(amount: bigint): string {
  const value = Number(amount / 10n ** 18n);
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function parseJPYC(amount: number): bigint {
  return BigInt(Math.floor(amount)) * 10n ** 18n;
}
