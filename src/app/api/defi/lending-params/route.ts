import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defiClient } from "@/services/defi/client";

const RequestSchema = z.object({
  amount: z.string(), // bigintはstringで受け取る
  maturityMonths: z.number().min(1).max(24),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, maturityMonths } = RequestSchema.parse(body);

    const params = await defiClient.getLendingOrderParams({
      amount: BigInt(amount),
      maturityMonths,
    });

    return NextResponse.json(params);
  } catch (error) {
    console.error("Get lending params error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to get lending parameters" },
      { status: 500 }
    );
  }
}
