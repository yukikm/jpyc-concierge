import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/services/ai/agent";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  walletAddress: z.string().optional(),
  conversationId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = ChatRequestSchema.parse(body);

    const result = await chat(message, history);

    return NextResponse.json({
      response: result.text,
      products: result.products,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "チャット処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
