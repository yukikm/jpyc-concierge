"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Gift } from "lucide-react";
import type { ClaimActionParams } from "@/types/chat";
import { useSecuredFinance } from "@/hooks/useSecuredFinance";

interface ClaimActionProps {
  action: ClaimActionParams;
}

type ClaimStatus = "idle" | "executing" | "success" | "error";

export default function ClaimAction({ action }: ClaimActionProps) {
  const [status, setStatus] = useState<ClaimStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { executeRedemption, isInitialized, isInitializing } =
    useSecuredFinance();

  const handleClaim = async () => {
    if (!isInitialized) {
      setErrorMessage("ウォレットを接続してください");
      setStatus("error");
      return;
    }

    setStatus("executing");
    setErrorMessage(null);

    try {
      const hash = await executeRedemption(action.maturity);
      setTxHash(hash);
      setStatus("success");
    } catch (error) {
      console.error("Claim error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "受け取りに失敗しました"
      );
      setStatus("error");
    }
  };

  return (
    <Card className="p-4 mt-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-green-900 dark:text-green-100">
              満期償還
            </h4>
            <Badge variant="secondary" className="bg-green-200 text-green-800">
              受取可能
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-zinc-500">元本</span>
              <p className="font-medium">{action.principalDisplay}</p>
            </div>
            <div>
              <span className="text-zinc-500">利息</span>
              <p className="font-medium text-green-600">
                +{action.interestDisplay}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">合計受取額</span>
              <p className="font-semibold text-lg">{action.totalDisplay}</p>
            </div>
            <div>
              <span className="text-zinc-500">満期日</span>
              <p className="font-medium">{action.maturityDate}</p>
            </div>
          </div>

          {status === "idle" && (
            <Button
              onClick={handleClaim}
              disabled={isInitializing || !isInitialized}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  初期化中...
                </>
              ) : !isInitialized ? (
                "ウォレットを接続してください"
              ) : (
                "利息を受け取る"
              )}
            </Button>
          )}

          {status === "executing" && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <span className="text-sm text-zinc-600">
                トランザクションを実行中...
              </span>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-md bg-green-100 p-3 dark:bg-green-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  受け取り完了
                </span>
              </div>
              {txHash && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 break-all">
                  Tx: {txHash}
                </p>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md bg-red-100 p-3 dark:bg-red-900">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-200">
                  エラー
                </span>
              </div>
              {errorMessage && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus("idle")}
                className="mt-2"
              >
                再試行
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
