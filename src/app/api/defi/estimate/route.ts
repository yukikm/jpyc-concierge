import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defiClient } from "@/services/defi/client";

const RequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(), // bigintはstringで受け取る
  maturity: z.number(),
  unitPrice: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, maturity, unitPrice } = RequestSchema.parse(body);

    const estimation = await defiClient.getOrderEstimation({
      walletAddress,
      amount: BigInt(amount),
      maturity,
      unitPrice,
    });

    return NextResponse.json(estimation);
  } catch (error) {
    console.error("Get order estimation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to get order estimation" },
      { status: 500 }
    );
  }
}
