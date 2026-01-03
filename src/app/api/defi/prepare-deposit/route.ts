import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defiClient } from "@/services/defi/client";

const RequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.number().positive(),
  maturityMonths: z.number().min(1).max(24),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, maturityMonths } = RequestSchema.parse(body);

    // 満期日を計算
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + maturityMonths);

    // レートを取得して対応するAPYを見つける
    const rates = await defiClient.getLendingRatesDisplay();
    const matchingRate = rates.find(
      (r) => r.daysUntilMaturity >= maturityMonths * 28
    );

    const depositInfo = {
      amount: `${amount.toLocaleString()} JPYC`,
      maturityDate: maturityDate.toLocaleDateString("ja-JP"),
      estimatedApy: matchingRate?.apy || "5.0%",
      maturityMonths,
      walletAddress,
    };

    return NextResponse.json({
      success: true,
      depositInfo,
      message: `${amount.toLocaleString()} JPYCを${maturityMonths}ヶ月運用する準備ができました。`,
    });
  } catch (error) {
    console.error("Prepare deposit error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to prepare deposit" },
      { status: 500 }
    );
  }
}
