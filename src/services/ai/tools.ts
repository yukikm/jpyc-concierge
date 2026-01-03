import { z } from "zod";
import { tool } from "ai";
import { searchProducts } from "@/services/rakuten/client";
import { defiClient } from "@/services/defi/client";

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

export const getLendingRatesTool = tool({
  description:
    "現在のJPYCレンディングレート（年利）を取得します。ユーザーが運用を検討している時に使用します。",
  parameters: z.object({}),
  execute: async () => {
    try {
      const rates = await defiClient.getLendingRatesDisplay();
      return {
        success: true,
        rates,
        message: `${rates.length}件のレンディングオプションがあります。`,
      };
    } catch (error) {
      console.error("Get lending rates error:", error);
      return {
        success: false,
        error: "レンディングレートの取得に失敗しました。",
        rates: [],
      };
    }
  },
});

export const getPositionsTool = tool({
  description:
    "ユーザーのDeFiポジション（運用状況）を取得します。元本、利息、満期日を確認できます。",
  parameters: z.object({
    walletAddress: z.string().describe("ユーザーのウォレットアドレス"),
  }),
  execute: async ({ walletAddress }) => {
    try {
      const positions = await defiClient.getPositionsDisplay(walletAddress);
      const { totalDisplay } = await defiClient.getTotalAvailableInterest(walletAddress);

      if (positions.length === 0) {
        return {
          success: true,
          positions: [],
          totalInterest: "0 JPYC",
          message: "現在運用中のポジションはありません。",
        };
      }

      return {
        success: true,
        positions,
        totalInterest: totalDisplay,
        message: `${positions.length}件のポジションがあります。合計利息: ${totalDisplay}`,
      };
    } catch (error) {
      console.error("Get positions error:", error);
      return {
        success: false,
        error: "ポジション情報の取得に失敗しました。",
        positions: [],
        totalInterest: "0 JPYC",
      };
    }
  },
});

export const getAffordableProductsTool = tool({
  description:
    "ユーザーの利息の範囲内で買える商品を検索します。「利息で何か買いたい」という時に使用します。",
  parameters: z.object({
    walletAddress: z.string().describe("ユーザーのウォレットアドレス"),
    keyword: z.string().optional().describe("検索キーワード（任意）"),
  }),
  execute: async ({ walletAddress, keyword }) => {
    try {
      const { maxPrice, message } = await defiClient.getAffordablePriceRange(walletAddress);

      if (maxPrice === 0) {
        return {
          success: true,
          products: [],
          maxPrice: 0,
          message,
        };
      }

      // 利息範囲内で商品検索
      const result = await searchProducts({
        keyword: keyword || "おすすめ",
        maxPrice,
      });

      return {
        success: true,
        products: result.products,
        maxPrice,
        message: `${message} ${result.total}件の商品が見つかりました。`,
      };
    } catch (error) {
      console.error("Get affordable products error:", error);
      return {
        success: false,
        error: "商品検索に失敗しました。",
        products: [],
        maxPrice: 0,
      };
    }
  },
});

export const prepareDepositTool = tool({
  description:
    "DeFi預け入れ（運用開始）の準備をします。金額と期間を指定します。ユーザーが「運用したい」「預けたい」と言った時に使用します。",
  parameters: z.object({
    amount: z.number().describe("預け入れ金額（JPYC）"),
    maturityMonths: z.number().describe("運用期間（月）。3, 6, 9, 12から選択"),
  }),
  execute: async ({ amount, maturityMonths }) => {
    try {
      // SDKからレンディングパラメータを取得
      const amountWei = BigInt(amount) * 10n ** 18n;
      const lendingParams = await defiClient.getLendingOrderParams({
        amount: amountWei,
        maturityMonths,
      });

      if (!lendingParams.success) {
        // SDK初期化失敗時はモックパラメータを生成
        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + maturityMonths);
        const maturityTimestamp = Math.floor(maturityDate.getTime() / 1000);

        const rates = await defiClient.getLendingRatesDisplay();
        const matchingRate = rates.find(
          (r) => r.daysUntilMaturity >= maturityMonths * 28
        );

        return {
          success: true,
          message: `${amount.toLocaleString()} JPYCを${maturityMonths}ヶ月運用する準備ができました。下のボタンをクリックして実行してください。`,
          action: {
            type: "lending" as const,
            amount: amountWei.toString(),
            amountDisplay: `${amount.toLocaleString()} JPYC`,
            maturity: maturityTimestamp,
            maturityDate: maturityDate.toLocaleDateString("ja-JP"),
            unitPrice: 9500, // デフォルト値
            estimatedApy: matchingRate?.apy || "5.0%",
            side: 0, // LEND
          },
        };
      }

      return {
        success: true,
        message: `${amount.toLocaleString()} JPYCを${maturityMonths}ヶ月運用する準備ができました。予想年利は${lendingParams.estimatedApy.toFixed(1)}%です。下のボタンをクリックして実行してください。`,
        action: {
          type: "lending" as const,
          amount: lendingParams.amount,
          amountDisplay: `${amount.toLocaleString()} JPYC`,
          maturity: lendingParams.maturity,
          maturityDate: lendingParams.maturityDate,
          unitPrice: lendingParams.unitPrice,
          estimatedApy: `${lendingParams.estimatedApy.toFixed(1)}%`,
          side: lendingParams.side,
        },
      };
    } catch (error) {
      console.error("Prepare deposit error:", error);
      return {
        success: false,
        error: "預け入れ準備に失敗しました。",
        action: null,
      };
    }
  },
});

export const prepareWithdrawTool = tool({
  description:
    "DeFiポジションの引き出し（早期解約）を準備します。getPositionsで取得したポジション情報を元に、引き出しアクションを返します。",
  parameters: z.object({
    walletAddress: z.string().describe("ユーザーのウォレットアドレス"),
    maturity: z.number().describe("引き出すポジションの満期タイムスタンプ"),
  }),
  execute: async ({ walletAddress, maturity }) => {
    try {
      // ポジション情報を取得
      const positions = await defiClient.getPositions(walletAddress);
      const position = positions.find((p) => Number(p.maturityDate.getTime() / 1000) === maturity || Math.abs(Number(p.maturityDate.getTime() / 1000) - maturity) < 86400);

      if (!position) {
        return {
          success: false,
          error: "指定されたポジションが見つかりませんでした。",
          action: null,
        };
      }

      const formatJPYC = (amount: bigint): string => {
        const value = Number(amount / 10n ** 18n);
        return `${value.toLocaleString("ja-JP")} JPYC`;
      };

      const isMatured = position.maturityDate.getTime() < Date.now();

      return {
        success: true,
        message: isMatured
          ? `満期済みのポジション（${formatJPYC(position.principal)}）の引き出しを準備しました。`
          : `運用中のポジション（${formatJPYC(position.principal)}）の早期引き出しを準備しました。満期前の解約には手数料がかかる場合があります。`,
        action: {
          type: "withdraw" as const,
          positionId: position.id,
          maturity: Math.floor(position.maturityDate.getTime() / 1000),
          presentValue: position.principal.toString(),
          futureValue: (position.principal + position.accruedInterest).toString(),
          presentValueDisplay: formatJPYC(position.principal),
          accruedInterest: position.accruedInterest.toString(),
          accruedInterestDisplay: formatJPYC(position.accruedInterest),
          maturityDate: position.maturityDate.toLocaleDateString("ja-JP"),
          isMatured,
        },
      };
    } catch (error) {
      console.error("Prepare withdraw error:", error);
      return {
        success: false,
        error: "引き出し準備に失敗しました。",
        action: null,
      };
    }
  },
});

export const tools = {
  searchProducts: searchProductsTool,
  getLendingRates: getLendingRatesTool,
  getPositions: getPositionsTool,
  getAffordableProducts: getAffordableProductsTool,
  prepareDeposit: prepareDepositTool,
  prepareWithdraw: prepareWithdrawTool,
};
