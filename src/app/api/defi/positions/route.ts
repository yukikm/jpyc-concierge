import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defiClient } from "@/services/defi/client";

const RequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = RequestSchema.parse(body);

    const positions = await defiClient.getPositionsDisplay(walletAddress);
    const { totalDisplay } = await defiClient.getTotalAvailableInterest(walletAddress);

    return NextResponse.json({
      success: true,
      positions,
      totalInterest: totalDisplay,
    });
  } catch (error) {
    console.error("Get positions error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to get positions" },
      { status: 500 }
    );
  }
}
