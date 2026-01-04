// DeFi関連の定数

// Chain ID（環境変数から取得、デフォルトはSepolia）
export const CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || "11155111",
  10
);

// JPYC Token Address (Sepolia)
// 実際のアドレスは環境変数で上書き可能
export const JPYC_ADDRESS =
  (process.env.NEXT_PUBLIC_JPYC_ADDRESS as `0x${string}`) ||
  "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB"; // Sepolia JPYC

// secured.finance Contract Addresses (Sepolia Staging)
export const SF_CONTRACTS = {
  lendingMarket:
    "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: 実際のアドレスに置換
  tokenVault: "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

// secured.finance環境
export const SF_ENV = process.env.NEXT_PUBLIC_SF_ENV || "staging";
export const SF_SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SF_SUBGRAPH_URL ||
  "https://api.thegraph.com/subgraphs/name/secured-finance/sf-sepolia";

// 通貨設定
export const SUPPORTED_CURRENCIES = ["JPYC"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// デフォルト値
export const DEFAULT_MIN_DEPOSIT = 1000n * 10n ** 18n; // 1,000 JPYC
export const JPYC_DECIMALS = 18;

// フォーマットヘルパー
export function formatJPYC(amount: bigint): string {
  const value = Number(amount / 10n ** 18n);
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function parseJPYC(amount: number): bigint {
  return BigInt(Math.floor(amount)) * 10n ** 18n;
}
