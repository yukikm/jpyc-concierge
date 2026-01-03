import { NextResponse } from "next/server";
import { defiClient } from "@/services/defi/client";

export async function GET() {
  try {
    const rates = await defiClient.getLendingRatesDisplay();

    return NextResponse.json({
      success: true,
      rates,
    });
  } catch (error) {
    console.error("Get rates error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to get lending rates" },
      { status: 500 }
    );
  }
}
