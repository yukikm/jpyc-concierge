import { z } from "zod";
import { tool } from "ai";
import { searchProducts } from "@/services/rakuten/client";

export const searchProductsTool = tool({
  description:
    "楽天市場から商品を検索します。キーワードと最大価格を指定できます。",
  parameters: z.object({
    keyword: z.string().describe("検索キーワード（例: チョコレート、お菓子）"),
    maxPrice: z
      .number()
      .optional()
      .describe("最大価格（円）。指定しない場合は制限なし"),
  }),
  execute: async ({ keyword, maxPrice }) => {
    try {
      const result = await searchProducts({ keyword, maxPrice });
      return {
        success: true,
        products: result.products,
        total: result.total,
      };
    } catch (error) {
      console.error("Product search error:", error);
      return {
        success: false,
        error: "商品検索に失敗しました。もう一度お試しください。",
        products: [],
        total: 0,
      };
    }
  },
});

export const tools = {
  searchProducts: searchProductsTool,
};
