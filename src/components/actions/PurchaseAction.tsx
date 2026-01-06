"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ShoppingCart,
  MapPin,
} from "lucide-react";
import type { PurchaseActionParams } from "@/types/chat";
import { useAccount, useWalletClient } from "wagmi";

interface PurchaseActionProps {
  action: PurchaseActionParams;
}

type PurchaseStatus = "idle" | "signing" | "executing" | "success" | "error";

export default function PurchaseAction({ action }: PurchaseActionProps) {
  const [status, setStatus] = useState<PurchaseStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // 運営者ウォレットアドレス（環境変数から取得）
  const OPERATOR_ADDRESS =
    (process.env.NEXT_PUBLIC_OPERATOR_ADDRESS as `0x${string}`) ||
    "0x0000000000000000000000000000000000000000";

  const handlePurchase = async () => {
    if (!isConnected || !address || !walletClient) {
      setErrorMessage("ウォレットを接続してください");
      setStatus("error");
      return;
    }

    if (!action.isReadyToPurchase) {
      setErrorMessage("住所情報が入力されていません");
      setStatus("error");
      return;
    }

    setStatus("signing");
    setErrorMessage(null);

    try {
      // x402署名用パラメータをAPIから取得
      const amount = BigInt(action.price) * 10n ** 18n;
      const prepareResponse = await fetch("/api/x402/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: address,
          to: OPERATOR_ADDRESS,
          amount: amount.toString(),
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error("送金パラメータの準備に失敗しました");
      }

      const prepareResult = await prepareResponse.json();
      if (!prepareResult.success) {
        throw new Error(prepareResult.error || "送金パラメータの準備に失敗しました");
      }

      const { typedData, params } = prepareResult;

      // EIP-712署名（walletClientを直接使用）
      // EIP-712のTypedDataは動的な構造のため、型キャストが必要
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const signature = await walletClient.signTypedData({
        account: address,
        domain: typedData.domain as any,
        types: typedData.types as any,
        primaryType: "TransferWithAuthorization" as const,
        message: typedData.message as any,
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */

      setStatus("executing");

      // APIルート経由でFacilitatorに送金を実行
      const executeResponse = await fetch("/api/x402/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params,
          signature,
        }),
      });

      const executeResult = await executeResponse.json();

      if (!executeResult.success) {
        throw new Error(executeResult.error || "送金に失敗しました");
      }

      // 注文を作成
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          productName: action.productName,
          productImageUrl: action.productImageUrl,
          productUrl: action.productUrl,
          price: action.price,
          shippingPostalCode: action.shippingPostalCode,
          shippingAddress: action.shippingAddress,
          shippingName: action.shippingName,
          txHash: executeResult.txHash,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("注文の作成に失敗しました");
      }

      setTxHash(executeResult.txHash || null);
      setStatus("success");
    } catch (error) {
      console.error("Purchase error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "購入に失敗しました"
      );
      setStatus("error");
    }
  };

  // 住所情報が揃っていない場合
  if (!action.isReadyToPurchase) {
    return (
      <Card className="p-4 mt-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">
              住所入力待ち
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              お届け先の住所を教えてください
            </p>
            <div className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded border">
              <p className="font-medium">{action.productName}</p>
              <p className="text-sm text-zinc-500">{action.priceDisplay}</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mt-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              購入確認
            </h4>
            <Badge variant="secondary" className="bg-blue-200 text-blue-800">
              購入準備完了
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="p-2 bg-white dark:bg-zinc-800 rounded border">
              <p className="font-medium">{action.productName}</p>
              <p className="text-lg font-semibold text-blue-600">
                {action.priceDisplay}
              </p>
            </div>

            <div className="p-2 bg-white dark:bg-zinc-800 rounded border">
              <p className="text-xs text-zinc-500 mb-1">お届け先</p>
              <p className="font-medium">{action.shippingName} 様</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                〒{action.shippingPostalCode}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {action.shippingAddress}
              </p>
            </div>
          </div>

          {status === "idle" && (
            <Button
              onClick={handlePurchase}
              disabled={!isConnected}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {!isConnected ? "ウォレットを接続してください" : "購入する"}
            </Button>
          )}

          {status === "signing" && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-zinc-600">
                ウォレットで署名してください...
              </span>
            </div>
          )}

          {status === "executing" && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-zinc-600">
                送金・注文を処理中...
              </span>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-md bg-green-100 p-3 dark:bg-green-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  注文完了
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                商品が発送されましたらお知らせします。
              </p>
              {txHash && (
                <p className="mt-1 text-xs text-zinc-500 break-all">
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
