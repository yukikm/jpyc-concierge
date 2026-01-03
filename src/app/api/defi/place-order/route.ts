import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(), // bigintはstringで受け取る
  maturity: z.number(),
  unitPrice: z.number(),
  side: z.number(), // 0 = LEND, 1 = BORROW
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, maturity, unitPrice, side } = RequestSchema.parse(body);

    // 注: 実際のplaceOrderはウォレット署名が必要なため、
    // クライアントサイドで実行する必要がある。
    // このAPIは注文パラメータの検証とログ記録に使用。

    console.log(`[PlaceOrder] Received order request:`, {
      walletAddress,
      amount,
      maturity,
      unitPrice,
      side: side === 0 ? "LEND" : "BORROW",
    });

    // 現在はモック実装 - 実際にはフロントエンドでSDKのplaceOrderを呼び出す
    // このAPIは成功を返し、フロントエンドにウォレット操作を促す
    return NextResponse.json({
      success: true,
      requiresWalletAction: true,
      message: "ウォレットでトランザクションを承認してください",
      orderParams: {
        walletAddress,
        amount,
        maturity,
        unitPrice,
        side,
      },
    });
  } catch (error) {
    console.error("Place order error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to place order" },
      { status: 500 }
    );
  }
}
