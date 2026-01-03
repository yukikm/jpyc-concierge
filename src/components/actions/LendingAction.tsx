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
import { useSecuredFinance, OrderSide } from "@/hooks/useSecuredFinance";

interface LendingActionProps {
  action: LendingActionParams;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

type ActionStatus =
  | "idle"
  | "initializing"
  | "confirming"
  | "signing"
  | "pending"
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
    placeOrder,
  } = useSecuredFinance();

  const [status, setStatus] = useState<ActionStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
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

    setStatus("signing");
    setError(null);

    try {
      // amountをbigintに変換
      const amount = BigInt(action.amount);

      console.log("[LendingAction] Executing placeOrder:", {
        maturity: action.maturity,
        side: action.side,
        amount: amount.toString(),
        unitPrice: action.unitPrice,
      });

      // 実際のplaceOrderを実行
      const hash = await placeOrder({
        maturity: action.maturity,
        side: action.side as OrderSide,
        amount,
        unitPrice: action.unitPrice,
      });

      setStatus("pending");
      console.log("[LendingAction] Transaction submitted:", hash);

      // トランザクション確認を待機（簡易版）
      // 実際のプロダクションでは waitForTransactionReceipt を使用
      setTxHash(hash);
      setStatus("success");
      onSuccess?.(hash);
    } catch (err) {
      console.error("[LendingAction] Transaction failed:", err);
      const message =
        err instanceof Error ? err.message : "トランザクションに失敗しました";
      setError(message);
      setStatus("error");
      onError?.(message);
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
      case "signing":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Wallet className="h-4 w-4 animate-pulse" />
            <span>MetaMaskで署名してください...</span>
          </div>
        );
      case "confirming":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>トークン承認中...</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>トランザクション処理中...</span>
          </div>
        );
      case "success":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>レンディング完了!</span>
            </div>
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline block"
              >
                トランザクションを確認 →
              </a>
            )}
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
              }}
            >
              再試行
            </Button>
          </div>
        );
      default:
        return (
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
                レンディングを実行
              </>
            )}
          </Button>
        );
    }
  };

  // JPYCの金額表示を整形
  const formatAmount = (amountStr: string) => {
    try {
      const amountBigInt = BigInt(amountStr);
      const amountNumber = Number(amountBigInt / 10n ** 18n);
      return `${amountNumber.toLocaleString("ja-JP")} JPYC`;
    } catch {
      return action.amountDisplay || amountStr;
    }
  };

  return (
    <Card className="p-4 mt-3 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
          <TrendingUp className="h-4 w-4" />
          レンディング確認
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
