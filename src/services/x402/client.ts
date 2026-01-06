// x402クライアント
// ガスレス送金のためのFacilitator連携

import type {
  TransferAuthParams,
  SignedAuthorization,
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  TransferResult,
} from "./types";
import {
  buildTransferAuthorizationTypedData,
  generateNonce,
  calculateValidBefore,
  splitSignature,
} from "./eip712";
import { JPYC_ADDRESS } from "@/services/defi/constants";

// x402 constants
// Sepolia (eip155:11155111) supports x402Version 2
const X402_VERSION = 2;
const SCHEME = "exact";
const NETWORK = "eip155:11155111";

// EIP-712 domain info for JPYC token
// FiatTokenV1実装コントラクトのVERSIONは"1"
const EIP712_DOMAIN_NAME = "JPY Coin";
const EIP712_DOMAIN_VERSION = "1";

// Facilitator URL
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "http://localhost:4022";

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
   * PaymentRequirementsを構築
   * extra に EIP-712 domain info (name, version) を含める
   */
  buildPaymentRequirements(
    payTo: `0x${string}`,
    amount: bigint
  ): PaymentRequirements {
    return {
      scheme: SCHEME,
      network: NETWORK,
      asset: JPYC_ADDRESS,
      amount: amount.toString(),
      payTo,
      maxTimeoutSeconds: 30,
      extra: {
        name: EIP712_DOMAIN_NAME,
        version: EIP712_DOMAIN_VERSION,
      },
    };
  }

  /**
   * PaymentPayloadを構築 (x402 v2形式)
   */
  buildPaymentPayload(
    signedAuth: SignedAuthorization,
    resourceUrl: string = "https://jpyc-concierge.local/transfer"
  ): PaymentPayload {
    const paymentRequirements = this.buildPaymentRequirements(
      signedAuth.params.to,
      signedAuth.params.value
    );

    return {
      x402Version: X402_VERSION,
      resource: {
        url: resourceUrl,
        method: "POST",
      },
      accepted: paymentRequirements,
      payload: {
        signature: signedAuth.signature,
        authorization: {
          from: signedAuth.params.from,
          to: signedAuth.params.to,
          value: signedAuth.params.value.toString(),
          validAfter: signedAuth.params.validAfter.toString(),
          validBefore: signedAuth.params.validBefore.toString(),
          nonce: signedAuth.params.nonce,
        },
      },
    };
  }

  /**
   * Facilitator経由で送金を実行 (x402 /settle)
   */
  async executeTransfer(
    signedAuth: SignedAuthorization
  ): Promise<TransferResult> {
    const paymentPayload = this.buildPaymentPayload(signedAuth);
    const paymentRequirements = this.buildPaymentRequirements(
      signedAuth.params.to,
      signedAuth.params.value
    );

    try {
      const response = await fetch(`${this.facilitatorUrl}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentPayload, paymentRequirements }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Facilitator error: ${error}`,
        };
      }

      const result: SettleResponse = await response.json();
      return {
        success: result.success,
        txHash: result.txHash,
        error: result.errorReason,
      };
    } catch (error) {
      console.error("x402 settle error:", error);
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
   * Facilitatorの状態を確認 (x402 /supported)
   */
  async checkFacilitatorHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/supported`, {
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
