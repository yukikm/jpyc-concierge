"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import type { PositionDisplay, LendingRateDisplay } from "@/types/defi";

interface LendingOrderParams {
  success: boolean;
  currency: string;
  maturity: number;
  side: number;
  amount: string;
  unitPrice: number;
  estimatedApy: number;
  maturityDate: string;
  error?: string;
}

interface OrderEstimation {
  success: boolean;
  filledAmount: string;
  placedAmount: string;
  orderFee: string;
  coverage: string;
  isInsufficientDeposit: boolean;
  error?: string;
}

interface DepositInfo {
  amount: string;
  maturityDate: string;
  estimatedApy: string;
  maturityMonths: number;
}

interface UseDefiReturn {
  // 状態
  positions: PositionDisplay[];
  rates: LendingRateDisplay[];
  totalInterest: string;
  jpycBalance: string;
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchPositions: () => Promise<void>;
  fetchRates: () => Promise<void>;
  fetchJPYCBalance: () => Promise<void>;
  prepareDeposit: (amount: number, months: number) => Promise<DepositInfo | null>;
  getLendingParams: (amount: number, months: number) => Promise<LendingOrderParams | null>;
  getOrderEstimation: (amount: number, maturity: number, unitPrice: number) => Promise<OrderEstimation | null>;
}

export function useDefi(): UseDefiReturn {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [positions, setPositions] = useState<PositionDisplay[]>([]);
  const [rates, setRates] = useState<LendingRateDisplay[]>([]);
  const [totalInterest, setTotalInterest] = useState("0 JPYC");
  const [jpycBalance, setJpycBalance] = useState("0 JPYC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!isConnected || !address) {
      setError("ウォレットが接続されていません");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/defi/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!response.ok) {
        throw new Error("ポジション取得に失敗しました");
      }

      const data = await response.json();
      setPositions(data.positions || []);
      setTotalInterest(data.totalInterest || "0 JPYC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/defi/rates");

      if (!response.ok) {
        throw new Error("レート取得に失敗しました");
      }

      const data = await response.json();
      setRates(data.rates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchJPYCBalance = useCallback(async () => {
    if (!isConnected || !address) {
      return;
    }

    try {
      const response = await fetch("/api/defi/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (response.ok) {
        const data = await response.json();
        setJpycBalance(data.balanceDisplay || "0 JPYC");
      }
    } catch (err) {
      console.error("Failed to fetch JPYC balance:", err);
    }
  }, [address, isConnected]);

  const prepareDeposit = useCallback(
    async (amount: number, months: number): Promise<DepositInfo | null> => {
      if (!isConnected || !address) {
        setError("ウォレットが接続されていません");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/defi/prepare-deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            amount,
            maturityMonths: months,
          }),
        });

        if (!response.ok) {
          throw new Error("預け入れ準備に失敗しました");
        }

        const data = await response.json();
        return data.depositInfo;
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected]
  );

  const getLendingParams = useCallback(
    async (amount: number, months: number): Promise<LendingOrderParams | null> => {
      if (!isConnected || !address) {
        setError("ウォレットが接続されていません");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // JPYCの18桁に変換
        const amountWei = BigInt(amount) * 10n ** 18n;

        const response = await fetch("/api/defi/lending-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountWei.toString(),
            maturityMonths: months,
          }),
        });

        if (!response.ok) {
          throw new Error("レンディングパラメータの取得に失敗しました");
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected]
  );

  const getOrderEstimation = useCallback(
    async (
      amount: number,
      maturity: number,
      unitPrice: number
    ): Promise<OrderEstimation | null> => {
      if (!isConnected || !address) {
        setError("ウォレットが接続されていません");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const amountWei = BigInt(amount) * 10n ** 18n;

        const response = await fetch("/api/defi/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            amount: amountWei.toString(),
            maturity,
            unitPrice,
          }),
        });

        if (!response.ok) {
          throw new Error("見積もりの取得に失敗しました");
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected]
  );

  return {
    positions,
    rates,
    totalInterest,
    jpycBalance,
    isLoading,
    error,
    fetchPositions,
    fetchRates,
    fetchJPYCBalance,
    prepareDeposit,
    getLendingParams,
    getOrderEstimation,
  };
}

// x402用のフック
interface UseX402Return {
  isLoading: boolean;
  error: string | null;
  prepareTransfer: (
    to: `0x${string}`,
    amount: bigint
  ) => Promise<TransferPrepareResult | null>;
  executeSignedTransfer: (
    signedData: SignedTransferData
  ) => Promise<TransferResult>;
}

interface TransferPrepareResult {
  typedData: unknown;
  params: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;
    validBefore: string;
    nonce: string;
  };
}

interface SignedTransferData {
  params: TransferPrepareResult["params"];
  signature: `0x${string}`;
}

interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useX402(): UseX402Return {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepareTransfer = useCallback(
    async (
      to: `0x${string}`,
      amount: bigint
    ): Promise<TransferPrepareResult | null> => {
      if (!isConnected || !address) {
        setError("ウォレットが接続されていません");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/x402/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: address,
            to,
            amount: amount.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error("送金準備に失敗しました");
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected]
  );

  const executeSignedTransfer = useCallback(
    async (signedData: SignedTransferData): Promise<TransferResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/x402/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signedData),
        });

        if (!response.ok) {
          throw new Error("送金実行に失敗しました");
        }

        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "エラーが発生しました";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    prepareTransfer,
    executeSignedTransfer,
  };
}
