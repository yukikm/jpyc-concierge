"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import {
  SecuredFinanceClient,
  OrderSide,
  WalletSource,
} from "@secured-finance/sf-client";
import { Token } from "@secured-finance/sf-core";

// JPYC Token定義
const JPYC_DECIMALS = 18;
const JPYC_TOKEN = new Token(JPYC_DECIMALS, "JPYC", "JPY Coin", true, "1");

interface PlaceOrderParams {
  maturity: number;
  side: OrderSide;
  amount: bigint;
  unitPrice?: number;
}

interface Position {
  maturity: number;
  presentValue: bigint;
  futureValue: bigint;
  accruedInterest: bigint;
  maturityDate: Date;
  isMatured: boolean;
}

interface UseSecuredFinanceResult {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  placeOrder: (params: PlaceOrderParams) => Promise<string>;
  unwindPosition: (maturity: number) => Promise<string>;
  executeRedemption: (maturity: number) => Promise<string>;
  getPositions: () => Promise<Position[]>;
  getJPYCBalance: () => Promise<bigint>;
  depositCollateral: (amount: bigint) => Promise<string>;
}

export function useSecuredFinance(): UseSecuredFinanceResult {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const [sfClient, setSfClient] = useState<SecuredFinanceClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SDKを初期化
  useEffect(() => {
    const initializeSDK = async () => {
      if (!publicClient || !walletClient || !isConnected) {
        setIsInitialized(false);
        setSfClient(null);
        return;
      }

      setIsInitializing(true);
      setError(null);

      try {
        const client = new SecuredFinanceClient();
        await client.init(publicClient, walletClient);
        setSfClient(client);
        setIsInitialized(true);
        console.log("[useSecuredFinance] SDK initialized with wallet");
      } catch (err) {
        console.error("[useSecuredFinance] Failed to initialize SDK:", err);
        setError(
          err instanceof Error ? err.message : "SDK initialization failed"
        );
        setIsInitialized(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSDK();
  }, [publicClient, walletClient, isConnected]);

  // placeOrder実行
  const placeOrder = useCallback(
    async (params: PlaceOrderParams): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized. Please connect your wallet.");
      }

      console.log("[useSecuredFinance] Placing order:", {
        maturity: params.maturity,
        side: params.side === OrderSide.LEND ? "LEND" : "BORROW",
        amount: params.amount.toString(),
        unitPrice: params.unitPrice,
      });

      try {
        const txHash = await sfClient.placeOrder(
          JPYC_TOKEN,
          params.maturity,
          params.side,
          params.amount,
          WalletSource.METAMASK,
          params.unitPrice || 0,
          undefined,
          (isApproved) => {
            console.log(
              "[useSecuredFinance] Approval status:",
              isApproved ? "Approved" : "Pending"
            );
          }
        );

        console.log("[useSecuredFinance] Order placed, tx hash:", txHash);
        return txHash;
      } catch (err) {
        console.error("[useSecuredFinance] placeOrder failed:", err);
        throw err;
      }
    },
    [sfClient, isInitialized]
  );

  // ポジション解消（早期引き出し）
  const unwindPosition = useCallback(
    async (maturity: number): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized. Please connect your wallet.");
      }

      console.log("[useSecuredFinance] Unwinding position:", { maturity });

      try {
        const txHash = await sfClient.unwindPosition(JPYC_TOKEN, maturity);
        console.log("[useSecuredFinance] Position unwound, tx hash:", txHash);
        return txHash;
      } catch (err) {
        console.error("[useSecuredFinance] unwindPosition failed:", err);
        throw err;
      }
    },
    [sfClient, isInitialized]
  );

  // 満期償還（満期後の元本+利息受け取り）
  const executeRedemption = useCallback(
    async (maturity: number): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized. Please connect your wallet.");
      }

      console.log("[useSecuredFinance] Executing redemption:", { maturity });

      try {
        const txHash = await sfClient.executeRedemption(JPYC_TOKEN, maturity);
        console.log("[useSecuredFinance] Redemption executed, tx hash:", txHash);
        return txHash;
      } catch (err) {
        console.error("[useSecuredFinance] executeRedemption failed:", err);
        throw err;
      }
    },
    [sfClient, isInitialized]
  );

  // ポジション取得
  const getPositions = useCallback(async (): Promise<Position[]> => {
    if (!sfClient || !isInitialized || !address) {
      return [];
    }

    try {
      // まず使用している通貨を取得
      const usedCurrencies = await sfClient.getUsedCurrenciesForOrders(address);

      if (usedCurrencies.length === 0) {
        console.log("[useSecuredFinance] No positions found");
        return [];
      }

      // ポジションを取得
      const sfPositions = await sfClient.getPositions(address, [JPYC_TOKEN]);

      const positions: Position[] = sfPositions.map((pos) => {
        const maturityTimestamp = Number(pos.maturity);
        const presentValue = pos.presentValue;
        const futureValue = pos.futureValue;
        const interest =
          futureValue > presentValue ? futureValue - presentValue : 0n;

        return {
          maturity: maturityTimestamp,
          presentValue,
          futureValue,
          accruedInterest: interest,
          maturityDate: new Date(maturityTimestamp * 1000),
          isMatured: maturityTimestamp * 1000 < Date.now(),
        };
      });

      console.log(
        `[useSecuredFinance] Retrieved ${positions.length} positions`
      );
      return positions;
    } catch (err) {
      console.error("[useSecuredFinance] getPositions failed:", err);
      return [];
    }
  }, [sfClient, isInitialized, address]);

  // JPYC残高取得
  const getJPYCBalance = useCallback(async (): Promise<bigint> => {
    if (!sfClient || !isInitialized || !address) {
      return 0n;
    }

    try {
      const balance = await sfClient.getERC20Balance(JPYC_TOKEN, address);
      return balance;
    } catch (err) {
      console.error("[useSecuredFinance] Failed to get balance:", err);
      return 0n;
    }
  }, [sfClient, isInitialized, address]);

  // 担保預入
  const depositCollateral = useCallback(
    async (amount: bigint): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized");
      }

      try {
        const txHash = await sfClient.depositCollateral(
          JPYC_TOKEN,
          amount,
          undefined,
          (isApproved) => {
            console.log(
              "[useSecuredFinance] Collateral approval:",
              isApproved ? "Approved" : "Pending"
            );
          }
        );
        return txHash;
      } catch (err) {
        console.error("[useSecuredFinance] depositCollateral failed:", err);
        throw err;
      }
    },
    [sfClient, isInitialized]
  );

  return {
    isInitialized,
    isInitializing,
    error,
    placeOrder,
    unwindPosition,
    executeRedemption,
    getPositions,
    getJPYCBalance,
    depositCollateral,
  };
}

// 定数エクスポート
export { OrderSide, WalletSource, JPYC_TOKEN };
export type { Position, PlaceOrderParams };
