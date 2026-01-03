import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { x402Client } from "@/services/x402/client";

const RequestSchema = z.object({
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(), // bigintをstring化
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, amount } = RequestSchema.parse(body);

    const amountBigint = BigInt(amount);

    // TransferWithAuthorization用のパラメータを生成
    const params = x402Client.createTransferParams(
      from as `0x${string}`,
      to as `0x${string}`,
      amountBigint
    );

    // 署名用のTypedDataを取得
    const typedData = x402Client.getTypedDataForSigning(params);

    return NextResponse.json({
      success: true,
      typedData,
      params: {
        from: params.from,
        to: params.to,
        value: params.value.toString(),
        validAfter: params.validAfter.toString(),
        validBefore: params.validBefore.toString(),
        nonce: params.nonce,
      },
    });
  } catch (error) {
    console.error("x402 prepare error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to prepare transfer" },
      { status: 500 }
    );
  }
}
