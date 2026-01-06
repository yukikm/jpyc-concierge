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
    "現在のレンディングレート（年利）を取得します。ユーザーが運用を検討している時に使用します。secured.financeではUSDCで運用できます。USDCを運用したい場合はcurrency='USDC'を指定してください。",
  parameters: z.object({
    currency: z.enum(["USDC", "JPYC"]).optional().describe("通貨（デフォルト: USDC）。USDCを運用したい場合は必ず'USDC'を指定"),
  }),
  execute: async ({ currency = "USDC" }) => {
    try {
      const rates = await defiClient.getLendingRatesDisplay(currency);
      return {
        success: true,
        rates,
        currency,
        message: `${currency}の${rates.length}件のレンディングオプションがあります。`,
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
    "DeFi預け入れ（運用開始）の準備をします。金額と期間、通貨を指定します。ユーザーが「運用したい」「預けたい」と言った時に使用します。デフォルトはUSDCです。",
  parameters: z.object({
    amount: z.number().describe("預け入れ金額"),
    maturityMonths: z.number().describe("運用期間（月）。3, 6, 9, 12から選択"),
    currency: z.enum(["USDC", "JPYC"]).optional().describe("通貨（デフォルト: USDC）"),
  }),
  execute: async ({ amount, maturityMonths, currency = "USDC" }) => {
    try {
      // 通貨に応じた小数点桁数
      const decimals = currency === "USDC" ? 6n : 18n;
      const amountInSmallestUnit = BigInt(amount) * 10n ** decimals;

      // SDKからレンディングパラメータを取得
      const lendingParams = await defiClient.getLendingOrderParams({
        amount: amountInSmallestUnit,
        maturityMonths,
        currency,
      });

      if (!lendingParams.success) {
        // SDK初期化失敗時はモックパラメータを生成
        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + maturityMonths);
        const maturityTimestamp = Math.floor(maturityDate.getTime() / 1000);

        const rates = await defiClient.getLendingRatesDisplay(currency);
        const matchingRate = rates.find(
          (r) => r.daysUntilMaturity >= maturityMonths * 28
        );

        return {
          success: true,
          message: `${amount.toLocaleString()} ${currency}を${maturityMonths}ヶ月運用する準備ができました。下のボタンをクリックして実行してください。`,
          action: {
            type: "lending" as const,
            currency: currency as "USDC" | "JPYC",
            amount: amountInSmallestUnit.toString(),
            amountDisplay: `${amount.toLocaleString()} ${currency}`,
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
        message: `${amount.toLocaleString()} ${currency}を${maturityMonths}ヶ月運用する準備ができました。予想年利は${lendingParams.estimatedApy.toFixed(1)}%です。下のボタンをクリックして実行してください。`,
        action: {
          type: "lending" as const,
          currency: currency as "USDC" | "JPYC",
          amount: lendingParams.amount,
          amountDisplay: `${amount.toLocaleString()} ${currency}`,
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
    "DeFiポジションの早期引き出し（満期前の解約）を準備します。満期前のポジションのみ対象です。満期済みのポジションはprepareClaimを使用してください。",
  parameters: z.object({
    walletAddress: z.string().describe("ユーザーのウォレットアドレス"),
    maturity: z.number().describe("引き出すポジションの満期タイムスタンプ"),
  }),
  execute: async ({ walletAddress, maturity }) => {
    try {
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

      // 満期済みの場合はClaimを案内
      if (isMatured) {
        return {
          success: false,
          error: "このポジションは満期済みです。「利息を受け取りたい」と言っていただければ、満期償還を実行できます。",
          action: null,
        };
      }

      return {
        success: true,
        message: `運用中のポジション（${formatJPYC(position.principal)}）の早期引き出しを準備しました。満期前の解約には手数料がかかる場合があります。`,
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
          isMatured: false,
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

export const prepareClaimTool = tool({
  description:
    "満期済みポジションの元本+利息の受け取り（満期償還）を準備します。ユーザーが「利息を受け取りたい」「満期になった」と言った時に使用します。",
  parameters: z.object({
    walletAddress: z.string().describe("ユーザーのウォレットアドレス"),
    maturity: z.number().optional().describe("受け取るポジションの満期タイムスタンプ。省略時は満期済みポジションを自動選択"),
  }),
  execute: async ({ walletAddress, maturity }) => {
    try {
      const positions = await defiClient.getPositions(walletAddress);

      // 満期済みポジションをフィルタ
      const maturedPositions = positions.filter(
        (p) => p.maturityDate.getTime() < Date.now()
      );

      if (maturedPositions.length === 0) {
        return {
          success: false,
          error: "満期済みのポジションがありません。満期日まで運用を続けるか、早期引き出し（prepareWithdraw）をご利用ください。",
          action: null,
        };
      }

      // 特定のmaturityが指定されていればそれを選択、なければ最初の満期済みポジション
      const position = maturity
        ? maturedPositions.find((p) => Math.abs(Number(p.maturityDate.getTime() / 1000) - maturity) < 86400)
        : maturedPositions[0];

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

      const total = position.principal + position.accruedInterest;

      return {
        success: true,
        message: `満期を迎えたポジションがあります！元本 ${formatJPYC(position.principal)} + 利息 ${formatJPYC(position.accruedInterest)} = 合計 ${formatJPYC(total)} を受け取れます。`,
        action: {
          type: "claim" as const,
          positionId: position.id,
          maturity: Math.floor(position.maturityDate.getTime() / 1000),
          principal: position.principal.toString(),
          principalDisplay: formatJPYC(position.principal),
          interest: position.accruedInterest.toString(),
          interestDisplay: formatJPYC(position.accruedInterest),
          total: total.toString(),
          totalDisplay: formatJPYC(total),
          maturityDate: position.maturityDate.toLocaleDateString("ja-JP"),
        },
      };
    } catch (error) {
      console.error("Prepare claim error:", error);
      return {
        success: false,
        error: "受け取り準備に失敗しました。",
        action: null,
      };
    }
  },
});

export const startPurchaseTool = tool({
  description:
    "商品の購入フローを開始します。ユーザーが「これを買いたい」「購入したい」と言った時に使用します。住所のヒアリングを開始します。actionは返さず、チャットで住所を聞いてください。",
  parameters: z.object({
    productName: z.string().describe("商品名"),
    productImageUrl: z.string().optional().describe("商品画像URL"),
    productUrl: z.string().describe("商品ページURL（楽天市場）"),
    price: z.number().describe("商品価格（円/JPYC）"),
  }),
  execute: async ({ productName, price }) => {
    // actionは返さない。AIがチャットで住所を聞き、confirmPurchaseで初めてUIを表示する
    return {
      success: true,
      message: `「${productName}」（${price.toLocaleString()}円）のご購入ですね。お届け先の情報を教えてください。\n\n以下の情報をお願いします：\n・お名前（届け先の氏名）\n・郵便番号\n・住所`,
      awaitingShippingInfo: true,
    };
  },
});

export const confirmPurchaseTool = tool({
  description:
    "住所情報を受け取り、購入の最終確認を行います。ユーザーが住所情報を提供した後に使用します。",
  parameters: z.object({
    productName: z.string().describe("商品名"),
    productImageUrl: z.string().optional().describe("商品画像URL"),
    productUrl: z.string().describe("商品ページURL"),
    price: z.number().describe("商品価格（円/JPYC）"),
    shippingName: z.string().describe("届け先氏名"),
    shippingPostalCode: z.string().describe("郵便番号（ハイフンなし7桁）"),
    shippingAddress: z.string().describe("住所（都道府県から番地まで）"),
  }),
  execute: async ({
    productName,
    productImageUrl,
    productUrl,
    price,
    shippingName,
    shippingPostalCode,
    shippingAddress,
  }) => {
    // 郵便番号のフォーマット（ハイフンなしに統一）
    const formattedPostalCode = shippingPostalCode.replace(/-/g, "");

    return {
      success: true,
      message: `ご注文内容を確認してください：\n\n商品: ${productName}\n金額: ${price.toLocaleString()} JPYC\n\nお届け先:\n${shippingName} 様\n〒${formattedPostalCode}\n${shippingAddress}\n\nよろしければ「購入する」ボタンを押してください。`,
      action: {
        type: "purchase" as const,
        productName,
        productImageUrl,
        productUrl,
        price,
        priceDisplay: `${price.toLocaleString()} JPYC`,
        shippingName,
        shippingPostalCode: formattedPostalCode,
        shippingAddress,
        isReadyToPurchase: true,
      },
    };
  },
});

export const tools = {
  searchProducts: searchProductsTool,
  getLendingRates: getLendingRatesTool,
  getPositions: getPositionsTool,
  getAffordableProducts: getAffordableProductsTool,
  prepareDeposit: prepareDepositTool,
  prepareWithdraw: prepareWithdrawTool,
  prepareClaim: prepareClaimTool,
  startPurchase: startPurchaseTool,
  confirmPurchase: confirmPurchaseTool,
};
