"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WithdrawActionParams } from "@/types/chat";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowDownToLine,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { useSecuredFinance } from "@/hooks/useSecuredFinance";

interface WithdrawActionProps {
  action: WithdrawActionParams;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

type ActionStatus =
  | "idle"
  | "initializing"
  | "signing"
  | "pending"
  | "success"
  | "error";

export default function WithdrawAction({
  action,
  onSuccess,
  onError,
}: WithdrawActionProps) {
  const { address, isConnected } = useAccount();
  const {
    isInitialized,
    isInitializing,
    error: sdkError,
    unwindPosition,
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
      console.log("[WithdrawAction] Executing unwindPosition:", {
        maturity: action.maturity,
      });

      // unwindPositionを実行
      const hash = await unwindPosition(action.maturity);

      setStatus("pending");
      console.log("[WithdrawAction] Transaction submitted:", hash);

      setTxHash(hash);
      setStatus("success");
      onSuccess?.(hash);
    } catch (err) {
      console.error("[WithdrawAction] Transaction failed:", err);
      const message =
        err instanceof Error ? err.message : "引き出しに失敗しました";
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
              <span>引き出し完了!</span>
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
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                SDK初期化中...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                引き出しを実行
              </>
            )}
          </Button>
        );
    }
  };

  return (
    <Card className="p-4 mt-3 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 dark:from-orange-950 dark:to-red-950 dark:border-orange-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
          <ArrowDownToLine className="h-4 w-4" />
          ポジション引き出し
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">現在価値:</div>
          <div className="font-medium">{action.presentValueDisplay}</div>

          <div className="text-gray-600 dark:text-gray-400">発生利息:</div>
          <div className="font-medium text-green-600 dark:text-green-400">
            +{action.accruedInterestDisplay}
          </div>

          <div className="text-gray-600 dark:text-gray-400">満期日:</div>
          <div className="font-medium">{action.maturityDate}</div>

          <div className="text-gray-600 dark:text-gray-400">状態:</div>
          <div className="font-medium">
            {action.isMatured ? (
              <span className="text-green-600">満期済み</span>
            ) : (
              <span className="text-yellow-600">運用中</span>
            )}
          </div>
        </div>

        {!action.isMatured && (
          <div className="flex items-start gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              満期前の引き出しは早期解約となり、手数料が発生する場合があります。
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
          {renderContent()}
        </div>

        {!isConnected && status === "idle" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ※ ウォレットを接続してください
          </p>
        )}
      </div>
    </Card>
  );
}
