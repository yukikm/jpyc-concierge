import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { SYSTEM_PROMPT } from "./prompts";
import { tools } from "./tools";
import type { Product } from "@/types/product";

interface AgentResponse {
  text: string;
  products?: Product[];
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

  for (const step of result.steps) {
    for (const toolResult of step.toolResults) {
      if (
        toolResult.toolName === "searchProducts" &&
        toolResult.result.success
      ) {
        products = toolResult.result.products;
      }
    }
  }

  return {
    text: result.text,
    products,
  };
}
