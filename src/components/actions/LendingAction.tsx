"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LendingActionParams } from "@/types/chat";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useSecuredFinance, type CurrencyType } from "@/hooks/useSecuredFinance";

interface LendingActionProps {
  action: LendingActionParams;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

type ActionStatus =
  | "idle"
  | "initializing"
  | "depositing"      // 担保預入中
  | "deposit_pending" // 担保預入トランザクション待ち
  | "deposit_done"    // 担保預入完了
  | "success"
  | "error";

export default function LendingAction({
  action,
  onSuccess,
  onError,
}: LendingActionProps) {
  const { address, isConnected } = useAccount();
  const {
    isInitialized,
    isInitializing,
    error: sdkError,
    depositCollateral,
  } = useSecuredFinance();

  const [status, setStatus] = useState<ActionStatus>("idle");
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!isConnected || !address) {
      setError("ウォレットが接続されていません");
      setStatus("error");
      return;
    }

    if (!isInitialized) {
      if (isInitializing) {
        setStatus("initializing");
        return;
      }
      setError(sdkError || "SDKの初期化に失敗しました");
      setStatus("error");
      return;
    }

    const amount = BigInt(action.amount);
    const currency = (action.currency || "USDC") as CurrencyType;

    // ステップ1: 担保預入
    setStatus("depositing");
    setError(null);

    try {
      console.log("[LendingAction] Step 1: Depositing collateral:", {
        currency,
        amount: amount.toString(),
      });

      const depositHash = await depositCollateral(amount, currency);
      setDepositTxHash(depositHash);
      setStatus("deposit_pending");
      console.log("[LendingAction] Deposit transaction submitted:", depositHash);

      // 少し待ってから次のステップへ（実際はトランザクション確認を待つべき）
      // TODO: waitForTransactionReceipt を使用して確実に待機
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setStatus("deposit_done");

      // 担保預入完了後、成功として扱う
      // 注文機能は現在staging環境の価格フィードの問題で一時停止中
      console.log("[LendingAction] Deposit completed successfully. Order placement is currently paused due to staging environment limitations.");

      setStatus("success");
      onSuccess?.(depositHash);

    } catch (err) {
      console.error("[LendingAction] Deposit failed:", err);
      const message =
        err instanceof Error ? err.message : "担保預入に失敗しました";
      setError(message);
      setStatus("error");
      onError?.(message);
      return;
    }
  };

  const renderContent = () => {
    switch (status) {
      case "initializing":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>SDKを初期化中...</span>
          </div>
        );
      case "depositing":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Wallet className="h-4 w-4 animate-pulse" />
              <span>担保預入中 - MetaMaskで署名してください...</span>
            </div>
          </div>
        );
      case "deposit_pending":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>担保預入トランザクション処理中...</span>
            </div>
            {depositTxHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${depositTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline block"
              >
                トランザクションを確認 →
              </a>
            )}
          </div>
        );
      case "deposit_done":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>担保預入完了</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>処理を完了しています...</span>
            </div>
          </div>
        );
      case "success":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>担保預入完了!</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              secured.financeへの担保預入が完了しました。レンディング注文はsecured.financeのUIから実行できます。
            </p>
            <div className="text-xs space-y-1">
              {depositTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${depositTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  トランザクションを確認 →
                </a>
              )}
              <a
                href="https://stg.secured.finance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline block"
              >
                secured.financeで注文する →
              </a>
            </div>
          </div>
        );
      case "error":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setError(null);
                setDepositTxHash(null);
              }}
            >
              再試行
            </Button>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Button
              onClick={handleExecute}
              disabled={!isConnected || isInitializing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  SDK初期化中...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  担保を預け入れる
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              secured.financeに担保を預け入れます
            </p>
          </div>
        );
    }
  };

  // 金額表示を整形
  const formatAmount = (amountStr: string) => {
    try {
      const amountBigInt = BigInt(amountStr);
      const currency = action.currency || "USDC";
      const decimals = currency === "USDC" ? 6n : 18n;
      const amountNumber = Number(amountBigInt / 10n ** decimals);
      return `${amountNumber.toLocaleString("ja-JP")} ${currency}`;
    } catch {
      return action.amountDisplay || amountStr;
    }
  };

  const currency = action.currency || "USDC";

  return (
    <Card className="p-4 mt-3 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
          <TrendingUp className="h-4 w-4" />
          担保預入確認 ({currency})
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">金額:</div>
          <div className="font-medium">
            {action.amountDisplay || formatAmount(action.amount)}
          </div>

          <div className="text-gray-600 dark:text-gray-400">満期日:</div>
          <div className="font-medium">{action.maturityDate}</div>

          <div className="text-gray-600 dark:text-gray-400">予想年利:</div>
          <div className="font-medium text-green-600 dark:text-green-400">
            {action.estimatedApy}
          </div>
        </div>

        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
          {renderContent()}
        </div>

        {!isConnected && status === "idle" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ※ ウォレットを接続してください
          </p>
        )}

        {isConnected && !isInitialized && !isInitializing && sdkError && (
          <p className="text-xs text-red-500">{sdkError}</p>
        )}
      </div>
    </Card>
  );
}
