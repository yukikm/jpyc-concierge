import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { x402Client, mockExecuteTransfer } from "@/services/x402/client";
import { splitSignature } from "@/services/x402/eip712";

const RequestSchema = z.object({
  params: z.object({
    from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    value: z.string(),
    validAfter: z.string(),
    validBefore: z.string(),
    nonce: z.string(),
  }),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { params, signature } = RequestSchema.parse(body);

    const { v, r, s } = splitSignature(signature as `0x${string}`);

    const signedAuth = {
      params: {
        from: params.from as `0x${string}`,
        to: params.to as `0x${string}`,
        value: BigInt(params.value),
        validAfter: BigInt(params.validAfter),
        validBefore: BigInt(params.validBefore),
        nonce: params.nonce as `0x${string}`,
      },
      signature: signature as `0x${string}`,
      v,
      r,
      s,
    };

    // Facilitatorの状態を確認 (x402 /supported)
    const facilitatorHealthy = await x402Client.checkFacilitatorHealth();

    let result;
    if (facilitatorHealthy) {
      // 実際のFacilitator経由で実行 (x402 /settle)
      console.log("[x402] Using Facilitator /settle endpoint");
      result = await x402Client.executeTransfer(signedAuth);
    } else {
      // モック実行（開発用）
      console.log("[x402] Facilitator /supported not available, using mock");
      result = await mockExecuteTransfer(signedAuth);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        txHash: result.txHash,
        message: "送金が完了しました",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("x402 execute error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to execute transfer" },
      { status: 500 }
    );
  }
}
