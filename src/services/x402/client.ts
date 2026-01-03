// x402クライアント
// ガスレス送金のためのFacilitator連携

import type {
  TransferAuthParams,
  SignedAuthorization,
  FacilitatorRequest,
  FacilitatorResponse,
  TransferResult,
} from "./types";
import {
  buildTransferAuthorizationTypedData,
  generateNonce,
  calculateValidBefore,
  splitSignature,
} from "./eip712";
import { JPYC_ADDRESS } from "@/services/defi/constants";

// Facilitator URL
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "http://localhost:3002";

export class X402Client {
  private facilitatorUrl: string;

  constructor(facilitatorUrl?: string) {
    this.facilitatorUrl = facilitatorUrl || FACILITATOR_URL;
  }

  /**
   * TransferWithAuthorization用のパラメータを生成
   */
  createTransferParams(
    from: `0x${string}`,
    to: `0x${string}`,
    amount: bigint,
    validMinutes: number = 30
  ): TransferAuthParams {
    return {
      from,
      to,
      value: amount,
      validAfter: 0n, // 即時有効
      validBefore: calculateValidBefore(validMinutes),
      nonce: generateNonce(),
    };
  }

  /**
   * EIP-712署名用のTypedDataを取得
   */
  getTypedDataForSigning(params: TransferAuthParams) {
    return buildTransferAuthorizationTypedData(params);
  }

  /**
   * 署名済みデータを構築
   */
  buildSignedAuthorization(
    params: TransferAuthParams,
    signature: `0x${string}`
  ): SignedAuthorization {
    const { v, r, s } = splitSignature(signature);
    return {
      params,
      signature,
      v,
      r,
      s,
    };
  }

  /**
   * Facilitator経由で送金を実行
   */
  async executeTransfer(
    signedAuth: SignedAuthorization
  ): Promise<TransferResult> {
    const request: FacilitatorRequest = {
      tokenAddress: JPYC_ADDRESS,
      from: signedAuth.params.from,
      to: signedAuth.params.to,
      value: signedAuth.params.value.toString(),
      validAfter: signedAuth.params.validAfter.toString(),
      validBefore: signedAuth.params.validBefore.toString(),
      nonce: signedAuth.params.nonce,
      v: signedAuth.v,
      r: signedAuth.r,
      s: signedAuth.s,
    };

    try {
      const response = await fetch(`${this.facilitatorUrl}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Facilitator error: ${error}`,
        };
      }

      const result: FacilitatorResponse = await response.json();
      return {
        success: result.success,
        txHash: result.txHash,
        error: result.error,
      };
    } catch (error) {
      console.error("x402 transfer error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "送金の実行に失敗しました。",
      };
    }
  }

  /**
   * Facilitatorの状態を確認
   */
  async checkFacilitatorHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// シングルトンインスタンス
export const x402Client = new X402Client();

// モック実行（Facilitator未起動時のフォールバック）
export async function mockExecuteTransfer(
  signedAuth: SignedAuthorization
): Promise<TransferResult> {
  console.log("[Mock] Executing x402 transfer:", {
    from: signedAuth.params.from,
    to: signedAuth.params.to,
    value: signedAuth.params.value.toString(),
  });

  // 模擬遅延
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // モックトランザクションハッシュ
  const mockTxHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}` as `0x${string}`;

  return {
    success: true,
    txHash: mockTxHash,
  };
}
