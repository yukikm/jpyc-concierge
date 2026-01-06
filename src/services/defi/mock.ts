// DeFiサービスのモックデータ
import type {
  Position,
  LendingRate,
  PositionDisplay,
  LendingRateDisplay,
} from "@/types/defi";
import { formatJPYC } from "./constants";

// モックポジション
export const mockPositions: Position[] = [
  {
    id: "pos-mock-1",
    currency: "JPYC",
    principal: 100000n * 10n ** 18n, // 100,000 JPYC
    accruedInterest: 1250n * 10n ** 18n, // 1,250 JPYC (3ヶ月 @ 5% APY)
    maturityDate: new Date("2026-03-01"),
    apy: 5.0,
    status: "active",
  },
  {
    id: "pos-mock-2",
    currency: "JPYC",
    principal: 50000n * 10n ** 18n, // 50,000 JPYC
    accruedInterest: 0n,
    maturityDate: new Date("2025-12-15"),
    apy: 4.5,
    status: "matured",
  },
];

// モックレンディングレート
export const mockLendingRates: LendingRate[] = [
  {
    maturityDate: new Date("2026-03-01"),
    apy: 5.0,
    minAmount: 1000n * 10n ** 18n,
  },
  {
    maturityDate: new Date("2026-06-01"),
    apy: 6.5,
    minAmount: 1000n * 10n ** 18n,
  },
  {
    maturityDate: new Date("2026-09-01"),
    apy: 7.5,
    minAmount: 1000n * 10n ** 18n,
  },
  {
    maturityDate: new Date("2026-12-01"),
    apy: 8.0,
    minAmount: 1000n * 10n ** 18n,
  },
];

// Position を表示用に変換
export function toPositionDisplay(position: Position): PositionDisplay {
  const now = new Date();
  const maturityDate = new Date(position.maturityDate);
  const daysUntilMaturity = Math.ceil(
    (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: position.id,
    currency: position.currency,
    principal: `${formatJPYC(position.principal)} JPYC`,
    principalRaw: (position.principal / 10n ** 18n).toString(),
    accruedInterest: `${formatJPYC(position.accruedInterest)} JPYC`,
    accruedInterestRaw: (position.accruedInterest / 10n ** 18n).toString(),
    maturityDate: maturityDate.toLocaleDateString("ja-JP"),
    apy: `${position.apy.toFixed(1)}%`,
    status: position.status,
    daysUntilMaturity: Math.max(0, daysUntilMaturity),
  };
}

// 通貨に応じた金額フォーマット
function formatAmount(amount: bigint, currency: string): string {
  if (currency === "USDC") {
    const value = Number(amount / 10n ** 6n);
    return `${new Intl.NumberFormat("ja-JP").format(value)} USDC`;
  }
  return `${formatJPYC(amount)} JPYC`;
}

// LendingRate を表示用に変換
export function toLendingRateDisplay(rate: LendingRate, currency: string = "JPYC"): LendingRateDisplay {
  const now = new Date();
  const maturityDate = new Date(rate.maturityDate);
  const daysUntilMaturity = Math.ceil(
    (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    maturityDate: maturityDate.toLocaleDateString("ja-JP"),
    apy: `${rate.apy.toFixed(1)}%`,
    minAmount: formatAmount(rate.minAmount, currency),
    daysUntilMaturity,
  };
}

// モック遅延（リアルなAPI呼び出しをシミュレート）
export async function mockDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
