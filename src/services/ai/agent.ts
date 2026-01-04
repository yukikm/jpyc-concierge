import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { SYSTEM_PROMPT } from "./prompts";
import { tools } from "./tools";
import type { Product } from "@/types/product";
import type { ChatAction } from "@/types/chat";

interface AgentResponse {
  text: string;
  products?: Product[];
  action?: ChatAction;
}

export async function chat(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AgentResponse> {
  const messages = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 3,
  });

  let products: Product[] | undefined;
  let action: ChatAction | undefined;

  // ツール結果からアクションを抽出するツール名リスト
  const actionTools = [
    "prepareDeposit",
    "prepareWithdraw",
    "prepareClaim",
    "startPurchase",
    "confirmPurchase",
  ];

  for (const step of result.steps) {
    for (const toolResult of step.toolResults) {
      // 商品検索ツールから商品を抽出
      if (
        toolResult.toolName === "searchProducts" &&
        toolResult.result.success
      ) {
        products = toolResult.result.products;
      }
      // getAffordableProductsツールからも商品を抽出
      if (
        toolResult.toolName === "getAffordableProducts" &&
        toolResult.result.success &&
        toolResult.result.products
      ) {
        products = toolResult.result.products;
      }
      // アクションを返すツールから抽出
      if (
        actionTools.includes(toolResult.toolName) &&
        toolResult.result.success
      ) {
        const result = toolResult.result as { success: boolean; action?: ChatAction };
        if (result.action) {
          action = result.action;
        }
      }
    }
  }

  return {
    text: result.text,
    products,
    action,
  };
}
