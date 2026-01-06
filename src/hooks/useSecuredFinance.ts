"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { erc20Abi } from "viem";
import {
  SecuredFinanceClient,
  OrderSide,
  WalletSource,
} from "@secured-finance/sf-client";
import { Token } from "@secured-finance/sf-core";

// 通貨タイプ
export type CurrencyType = "JPYC" | "USDC";

// フォールバック用Token定義（SDKから取得できない場合に使用）
const FALLBACK_TOKENS: Record<CurrencyType, Token> = {
  USDC: new Token(6, "USDC", "USD Coin", true, "2"),
  JPYC: new Token(18, "JPYC", "JPY Coin", true, "2"),
};

interface PlaceOrderParams {
  currency?: CurrencyType;
  maturity: number;
  side: OrderSide;
  amount: bigint;
  unitPrice?: number;
}

interface Position {
  currency: CurrencyType;
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
  supportedCurrencies: CurrencyType[];
  placeOrder: (params: PlaceOrderParams) => Promise<string>;
  unwindPosition: (maturity: number, currency?: CurrencyType) => Promise<string>;
  executeRedemption: (maturity: number, currency?: CurrencyType) => Promise<string>;
  getPositions: (currency?: CurrencyType) => Promise<Position[]>;
  getBalance: (currency?: CurrencyType) => Promise<bigint>;
  depositCollateral: (amount: bigint, currency?: CurrencyType) => Promise<string>;
  mintTestToken: (currency?: CurrencyType) => Promise<string>;
  getSDKTokenAddress: (currency?: CurrencyType) => Promise<string | null>;
}

export function useSecuredFinance(): UseSecuredFinanceResult {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const [sfClient, setSfClient] = useState<SecuredFinanceClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SDKから取得した通貨を保存
  const currencyMapRef = useRef<Map<CurrencyType, Token>>(new Map());
  const [supportedCurrencies, setSupportedCurrencies] = useState<CurrencyType[]>([]);

  // 通貨からTokenを取得（SDKの登録通貨を使用）
  const getToken = useCallback((currency: CurrencyType): Token | null => {
    return currencyMapRef.current.get(currency) || null;
  }, []);

  // SDKを初期化
  useEffect(() => {
    const initializeSDK = async () => {
      console.log("[useSecuredFinance] Init check:", {
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        isConnected,
      });

      if (!publicClient || !walletClient || !isConnected) {
        console.log("[useSecuredFinance] Prerequisites not met, skipping init");
        setIsInitialized(false);
        setSfClient(null);
        return;
      }

      setIsInitializing(true);
      setError(null);

      try {
        console.log("[useSecuredFinance] Creating SecuredFinanceClient...");
        const client = new SecuredFinanceClient();

        console.log("[useSecuredFinance] Calling client.init()...");
        await client.init(publicClient, walletClient);

        // SDKから登録済み通貨アドレスを取得し、実際のトークン情報を読み取る
        const newCurrencyMap = new Map<CurrencyType, Token>();
        const availableCurrencies: CurrencyType[] = [];

        try {
          const registeredAddresses = await client.getCurrencies();
          console.log("[useSecuredFinance] SDK registered currency addresses:", registeredAddresses);

          // 各アドレスからトークン情報を取得
          for (const address of registeredAddresses) {
            try {
              // ERC20コントラクトからシンボルとdecimalsを取得
              const [symbol, decimals] = await Promise.all([
                publicClient.readContract({
                  address: address as `0x${string}`,
                  abi: erc20Abi,
                  functionName: "symbol",
                }),
                publicClient.readContract({
                  address: address as `0x${string}`,
                  abi: erc20Abi,
                  functionName: "decimals",
                }),
              ]);

              console.log(`[useSecuredFinance] Found token: ${symbol} (${decimals} decimals) at ${address}`);

              // USDCまたはJPYCの場合はマップに追加
              if (symbol === "USDC" || symbol === "JPYC") {
                const currencyType = symbol as CurrencyType;
                // SDKが認識するTokenオブジェクトを作成
                const token = new Token(
                  decimals,
                  symbol,
                  symbol === "USDC" ? "USD Coin" : "JPY Coin",
                  true,
                  "2"
                );
                newCurrencyMap.set(currencyType, token);
                availableCurrencies.push(currencyType);
                console.log(`[useSecuredFinance] Registered ${currencyType} token`);
              }
            } catch (tokenErr) {
              console.warn(`[useSecuredFinance] Failed to read token at ${address}:`, tokenErr);
            }
          }
        } catch (e) {
          console.warn("[useSecuredFinance] Failed to get currencies from SDK:", e);
        }

        // フォールバック: SDKから通貨が取得できなかった場合
        if (availableCurrencies.length === 0) {
          console.log("[useSecuredFinance] No currencies from SDK, using fallback tokens");
          for (const currencyType of ["USDC", "JPYC"] as CurrencyType[]) {
            newCurrencyMap.set(currencyType, FALLBACK_TOKENS[currencyType]);
            availableCurrencies.push(currencyType);
          }
        }

        currencyMapRef.current = newCurrencyMap;
        setSupportedCurrencies(availableCurrencies);
        console.log("[useSecuredFinance] Available currencies:", availableCurrencies);

        setSfClient(client);
        setIsInitialized(true);
        console.log("[useSecuredFinance] SDK initialized successfully");
      } catch (err) {
        console.error("[useSecuredFinance] Failed to initialize SDK:", err);
        console.error("[useSecuredFinance] Error details:", {
          name: err instanceof Error ? err.name : "Unknown",
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
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

      const currency = params.currency || "USDC";
      const token = getToken(currency);

      if (!token) {
        throw new Error(`Currency ${currency} is not supported. Available: ${supportedCurrencies.join(", ")}`);
      }

      console.log("[useSecuredFinance] Placing order:", {
        currency,
        tokenSymbol: token.symbol,
        maturity: params.maturity,
        side: params.side === OrderSide.LEND ? "LEND" : "BORROW",
        amount: params.amount.toString(),
        unitPrice: params.unitPrice,
      });

      try {
        const txHash = await sfClient.placeOrder(
          token,
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
    [sfClient, isInitialized, getToken, supportedCurrencies]
  );

  // ポジション解消（早期引き出し）
  const unwindPosition = useCallback(
    async (maturity: number, currency: CurrencyType = "USDC"): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized. Please connect your wallet.");
      }

      const token = getToken(currency);
      if (!token) {
        throw new Error(`Currency ${currency} is not supported.`);
      }

      console.log("[useSecuredFinance] Unwinding position:", { currency, maturity });

      try {
        const txHash = await sfClient.unwindPosition(token, maturity);
        console.log("[useSecuredFinance] Position unwound, tx hash:", txHash);
        return txHash;
      } catch (err) {
        console.error("[useSecuredFinance] unwindPosition failed:", err);
        throw err;
      }
    },
    [sfClient, isInitialized, getToken]
  );

  // 満期償還（満期後の元本+利息受け取り）
  const executeRedemption = useCallback(
    async (maturity: number, currency: CurrencyType = "USDC"): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized. Please connect your wallet.");
      }

      const token = getToken(currency);
      if (!token) {
        throw new Error(`Currency ${currency} is not supported.`);
      }

      console.log("[useSecuredFinance] Executing redemption:", { currency, maturity });

      try {
        const txHash = await sfClient.executeRedemption(token, maturity);
        console.log("[useSecuredFinance] Redemption executed, tx hash:", txHash);
        return txHash;
      } catch (err) {
        console.error("[useSecuredFinance] executeRedemption failed:", err);
        throw err;
      }
    },
    [sfClient, isInitialized, getToken]
  );

  // ポジション取得
  const getPositions = useCallback(async (currency: CurrencyType = "USDC"): Promise<Position[]> => {
    if (!sfClient || !isInitialized || !address) {
      return [];
    }

    const token = getToken(currency);
    if (!token) {
      console.warn(`[useSecuredFinance] Currency ${currency} not available for positions`);
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
      const sfPositions = await sfClient.getPositions(address, [token]);

      const positions: Position[] = sfPositions.map((pos) => {
        const maturityTimestamp = Number(pos.maturity);
        const presentValue = pos.presentValue;
        const futureValue = pos.futureValue;
        const interest =
          futureValue > presentValue ? futureValue - presentValue : 0n;

        return {
          currency,
          maturity: maturityTimestamp,
          presentValue,
          futureValue,
          accruedInterest: interest,
          maturityDate: new Date(maturityTimestamp * 1000),
          isMatured: maturityTimestamp * 1000 < Date.now(),
        };
      });

      console.log(
        `[useSecuredFinance] Retrieved ${positions.length} ${currency} positions`
      );
      return positions;
    } catch (err) {
      console.error("[useSecuredFinance] getPositions failed:", err);
      return [];
    }
  }, [sfClient, isInitialized, address, getToken]);

  // 残高取得
  const getBalance = useCallback(async (currency: CurrencyType = "USDC"): Promise<bigint> => {
    if (!sfClient || !isInitialized || !address) {
      return 0n;
    }

    const token = getToken(currency);
    if (!token) {
      return 0n;
    }

    try {
      const balance = await sfClient.getERC20Balance(token, address);
      return balance;
    } catch (err) {
      console.error("[useSecuredFinance] Failed to get balance:", err);
      return 0n;
    }
  }, [sfClient, isInitialized, address, getToken]);

  // 担保預入
  const depositCollateral = useCallback(
    async (amount: bigint, currency: CurrencyType = "USDC"): Promise<string> => {
      if (!sfClient || !isInitialized) {
        throw new Error("SDK not initialized");
      }

      const token = getToken(currency);
      if (!token) {
        throw new Error(`Currency ${currency} is not supported.`);
      }

      try {
        const txHash = await sfClient.depositCollateral(
          token,
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
    [sfClient, isInitialized, getToken]
  );

  // テスト用トークンをmint（Faucet）
  const mintTestToken = useCallback(async (currency: CurrencyType = "USDC"): Promise<string> => {
    if (!sfClient || !isInitialized) {
      throw new Error("SDK not initialized");
    }

    const token = getToken(currency);
    if (!token) {
      throw new Error(`Currency ${currency} is not supported.`);
    }

    try {
      console.log(`[useSecuredFinance] Minting test ${currency}...`);
      const txHash = await sfClient.mintERC20Token(token);
      console.log("[useSecuredFinance] Mint tx hash:", txHash);
      return txHash;
    } catch (err) {
      console.error("[useSecuredFinance] mintTestToken failed:", err);
      throw err;
    }
  }, [sfClient, isInitialized, getToken]);

  // SDKが使用しているトークンアドレスを取得
  const getSDKTokenAddress = useCallback(async (currency: CurrencyType = "USDC"): Promise<string | null> => {
    if (!sfClient || !isInitialized) {
      return null;
    }

    const token = getToken(currency);
    if (!token) {
      return null;
    }

    try {
      const addr = await sfClient.getERC20TokenContractAddress(token);
      return addr;
    } catch (err) {
      console.error("[useSecuredFinance] getSDKTokenAddress failed:", err);
      return null;
    }
  }, [sfClient, isInitialized, getToken]);

  return {
    isInitialized,
    isInitializing,
    error,
    supportedCurrencies,
    placeOrder,
    unwindPosition,
    executeRedemption,
    getPositions,
    getBalance,
    depositCollateral,
    mintTestToken,
    getSDKTokenAddress,
  };
}

// 定数エクスポート
export { OrderSide, WalletSource };
export type { Position, PlaceOrderParams };
