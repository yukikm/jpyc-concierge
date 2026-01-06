// DeFiクライアント
// secured.finance SDKとの通信を担当

import { SecuredFinanceClient, OrderSide, WalletSource } from "@secured-finance/sf-client";
import { Token } from "@secured-finance/sf-core";
import { createPublicClient, http, type PublicClient } from "viem";
import { sepolia } from "viem/chains";
import type {
  Position,
  LendingRate,
  PositionDisplay,
  LendingRateDisplay,
  DepositParams,
  WithdrawParams,
  TransactionRequest,
} from "@/types/defi";
import {
  mockPositions,
  mockLendingRates,
  toPositionDisplay,
  toLendingRateDisplay,
  mockDelay,
} from "./mock";
import { JPYC_DECIMALS, USDC_DECIMALS, formatJPYC } from "./constants";

// 通貨タイプ
type CurrencyType = "JPYC" | "USDC";

// Token定義（secured.finance staging環境用）
// hasPermit=true, eip712Version="2" はEIP-3009対応
const JPYC_TOKEN = new Token(JPYC_DECIMALS, "JPYC", "JPY Coin", true, "2");
const USDC_TOKEN = new Token(USDC_DECIMALS, "USDC", "USD Coin", true, "2");

// 通貨に対応するTokenを取得
const getTokenForCurrency = (currency: CurrencyType): Token => {
  return currency === "USDC" ? USDC_TOKEN : JPYC_TOKEN;
};

// SF_ENV環境変数の設定（SDK要件）
// クライアントサイドでは process.env は build時に評価される
const SF_ENV = process.env.NEXT_PUBLIC_SF_ENV || "staging";

// SDK利用可能かどうかをチェック（将来的にSDKの可用性チェックを追加予定）
// const isSDKAvailable = true;

export class DefiClient {
  private sfClient: SecuredFinanceClient | null = null;
  private publicClient: PublicClient | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // コンストラクタではまだ初期化しない（SSR対応）
  }

  /**
   * SDKクライアントを初期化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    await this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // Sepoliaネットワーク用のPublicClientを作成
      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      // SecuredFinanceClientを初期化
      this.sfClient = new SecuredFinanceClient();
      await this.sfClient.init(this.publicClient);

      this.initialized = true;
      console.log("[DefiClient] SDK initialized successfully");
    } catch (error) {
      console.error("[DefiClient] Failed to initialize SDK:", error);
      // 初期化に失敗してもモックで動作継続
      this.initialized = false;
    }
  }

  /**
   * SDKが利用可能かどうかをチェック
   */
  private isSDKReady(): boolean {
    return this.initialized && this.sfClient !== null;
  }

  /**
   * 現在のレンディングレートを取得
   */
  async getLendingRates(currency: CurrencyType = "USDC"): Promise<LendingRate[]> {
    await this.ensureInitialized();

    const token = getTokenForCurrency(currency);
    const minAmount = currency === "USDC" ? 10n * 10n ** 6n : 1000n * 10n ** 18n;

    if (this.isSDKReady() && this.sfClient) {
      try {
        // OrderBookの詳細を取得（レンディングレートを含む）
        const orderBooks = await this.sfClient.getOrderBookDetailsPerCurrency(token);

        const rates: LendingRate[] = orderBooks
          .filter((book) => !book.isMatured && book.isOpened)
          .map((book) => {
            // UnitPriceからAPYを計算
            // unitPrice は 10000 ベース (9500 = 95%, 10000 = 100%)
            const unitPrice = Number(book.marketUnitPrice);
            const maturityTimestamp = Number(book.maturity);
            const now = Date.now() / 1000;
            const daysToMaturity = (maturityTimestamp - now) / (24 * 60 * 60);

            // APY計算: (10000 / unitPrice - 1) * (365 / daysToMaturity) * 100
            let apy = 0;
            if (unitPrice > 0 && daysToMaturity > 0) {
              const discountRate = 10000 / unitPrice - 1;
              apy = discountRate * (365 / daysToMaturity) * 100;
            }

            return {
              maturityDate: new Date(maturityTimestamp * 1000),
              apy: Math.max(0, apy),
              minAmount,
            };
          });

        if (rates.length > 0) {
          console.log(`[DefiClient] Retrieved ${rates.length} ${currency} lending rates from SDK`);
          return rates;
        }
      } catch (error) {
        console.error(`[DefiClient] Failed to get ${currency} lending rates from SDK:`, error);
      }
    }

    // フォールバック: モックデータ（通貨に応じてminAmountを調整）
    console.log(`[DefiClient] Using mock lending rates for ${currency}`);
    await mockDelay();
    const mockMinAmount = currency === "USDC" ? 10n * 10n ** 6n : 1000n * 10n ** 18n;
    return mockLendingRates.map((rate) => ({
      ...rate,
      minAmount: mockMinAmount,
    }));
  }

  /**
   * レンディングレートを表示用に取得
   */
  async getLendingRatesDisplay(currency: CurrencyType = "USDC"): Promise<LendingRateDisplay[]> {
    const rates = await this.getLendingRates(currency);
    return rates.map((rate) => toLendingRateDisplay(rate, currency));
  }

  /**
   * ユーザーのポジションを取得
   */
  async getPositions(address: string): Promise<Position[]> {
    await this.ensureInitialized();

    if (this.isSDKReady() && this.sfClient) {
      try {
        // ユーザーが使用している通貨を取得
        const usedCurrencies = await this.sfClient.getUsedCurrenciesForOrders(address);

        if (usedCurrencies.length === 0) {
          console.log(`[DefiClient] No positions found for ${address}`);
          return [];
        }

        // JPYC関連のポジションを取得
        const sfPositions = await this.sfClient.getPositions(address, [JPYC_TOKEN]);

        const positions: Position[] = sfPositions.map((pos, index) => {
          const maturityTimestamp = Number(pos.maturity);
          const presentValue = pos.presentValue;
          const futureValue = pos.futureValue;

          // 利息 = FV - PV（正の値の場合）
          const interest = futureValue > presentValue ? futureValue - presentValue : 0n;

          // APYは概算（実際の計算はより複雑）
          const now = Date.now() / 1000;
          const daysToMaturity = Math.max(0, (maturityTimestamp - now) / (24 * 60 * 60));
          let apy = 0;
          if (presentValue > 0n && daysToMaturity > 0) {
            const growthRate = Number(futureValue) / Number(presentValue) - 1;
            apy = growthRate * (365 / daysToMaturity) * 100;
          }

          return {
            id: `pos-${address.slice(0, 8)}-${index}`,
            currency: "JPYC",
            principal: presentValue,
            accruedInterest: interest,
            maturityDate: new Date(maturityTimestamp * 1000),
            apy: Math.max(0, apy),
            status: maturityTimestamp * 1000 < Date.now() ? "matured" : "active",
          };
        });

        if (positions.length > 0) {
          console.log(`[DefiClient] Retrieved ${positions.length} positions from SDK`);
          return positions;
        }
      } catch (error) {
        console.error("[DefiClient] Failed to get positions from SDK:", error);
      }
    }

    // フォールバック: モックデータ
    console.log(`[DefiClient] Using mock positions for ${address}`);
    await mockDelay();
    return mockPositions;
  }

  /**
   * ポジションを表示用に取得
   */
  async getPositionsDisplay(address: string): Promise<PositionDisplay[]> {
    const positions = await this.getPositions(address);
    return positions.map(toPositionDisplay);
  }

  /**
   * 利用可能な利息の合計を取得
   */
  async getTotalAvailableInterest(address: string): Promise<{
    total: bigint;
    totalDisplay: string;
  }> {
    const positions = await this.getPositions(address);
    const total = positions.reduce((sum, pos) => sum + pos.accruedInterest, 0n);
    const totalNumber = Number(total / 10n ** 18n);
    return {
      total,
      totalDisplay: `${new Intl.NumberFormat("ja-JP").format(totalNumber)} JPYC`,
    };
  }

  /**
   * Depositトランザクションを準備
   * 注意: 実際のトランザクションはウォレット側で実行する必要がある
   */
  async prepareDepositTx(params: DepositParams): Promise<TransactionRequest> {
    await this.ensureInitialized();

    if (this.isSDKReady() && this.sfClient) {
      try {
        // 満期日に対応するmaturityを取得
        const maturities = await this.sfClient.getMaturities(JPYC_TOKEN);

        if (maturities.length === 0) {
          throw new Error("No available maturities");
        }

        // 最も近い満期を選択
        const targetTime = params.maturityDate.getTime() / 1000;
        const selectedMaturity = maturities.reduce((closest, current) => {
          const closestDiff = Math.abs(Number(closest) - targetTime);
          const currentDiff = Math.abs(Number(current) - targetTime);
          return currentDiff < closestDiff ? current : closest;
        });

        console.log(`[DefiClient] Preparing deposit: ${params.amount} JPYC, maturity: ${selectedMaturity}`);

        // 注: 実際の署名・送信はクライアントサイドで行う
        // トランザクションはplaceOrder経由で実行されるため、
        // ここでは準備完了のステータスを返す
        return {
          to: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          data: "0x", // 実際のトランザクションはフロントエンドでSDK経由で実行
          value: 0n,
        };
      } catch (error) {
        console.error("[DefiClient] Failed to prepare deposit:", error);
      }
    }

    // フォールバック
    await mockDelay();
    console.log(`[Mock] Preparing deposit: ${params.amount} for ${params.userAddress}`);
    return {
      to: "0x0000000000000000000000000000000000000000",
      data: "0x",
      value: 0n,
    };
  }

  /**
   * Withdrawトランザクションを準備
   */
  async prepareWithdrawTx(params: WithdrawParams): Promise<TransactionRequest> {
    await this.ensureInitialized();

    // 現時点ではモックで対応
    // 実際の引き出しはより複雑なロジックが必要
    await mockDelay();
    console.log(`[Mock] Preparing withdraw for position: ${params.positionId}`);

    return {
      to: "0x0000000000000000000000000000000000000000",
      data: "0x",
    };
  }

  /**
   * 指定した利息額で購入可能な価格帯を計算
   */
  async getAffordablePriceRange(address: string): Promise<{
    maxPrice: number;
    message: string;
  }> {
    const { total, totalDisplay } = await this.getTotalAvailableInterest(address);
    const maxPrice = Number(total / 10n ** 18n);

    if (maxPrice === 0) {
      return {
        maxPrice: 0,
        message: "現在利用可能な利息がありません。まず運用を開始してください。",
      };
    }

    return {
      maxPrice,
      message: `利息 ${totalDisplay} の範囲内でお買い物できます。`,
    };
  }

  /**
   * SDK設定情報を取得（デバッグ用）
   */
  async getConfig(): Promise<{
    initialized: boolean;
    environment: string;
    networkId?: number;
  }> {
    await this.ensureInitialized();

    return {
      initialized: this.initialized,
      environment: SF_ENV,
      networkId: this.sfClient?.config?.networkId,
    };
  }

  /**
   * レンディング注文のパラメータを取得
   * フロントエンドでplaceOrderを実行するためのパラメータを返す
   */
  async getLendingOrderParams(params: {
    amount: bigint;
    maturityMonths: number;
    currency?: CurrencyType;
  }): Promise<{
    success: boolean;
    currency: string;
    maturity: number;
    side: number;
    amount: string;
    unitPrice: number;
    estimatedApy: number;
    maturityDate: string;
    error?: string;
  }> {
    await this.ensureInitialized();

    const currency = params.currency || "USDC";
    const token = getTokenForCurrency(currency);

    if (!this.isSDKReady() || !this.sfClient) {
      return {
        success: false,
        currency,
        maturity: 0,
        side: OrderSide.LEND,
        amount: params.amount.toString(),
        unitPrice: 0,
        estimatedApy: 0,
        maturityDate: "",
        error: "SDK not initialized",
      };
    }

    try {
      // 利用可能な満期を取得
      const maturities = await this.sfClient.getMaturities(token);

      if (maturities.length === 0) {
        throw new Error(`No available maturities for ${currency}`);
      }

      // 指定した月数に最も近い満期を選択
      const now = Date.now() / 1000;
      const targetTime = now + params.maturityMonths * 30 * 24 * 60 * 60;
      const selectedMaturity = maturities.reduce((closest, current) => {
        const closestDiff = Math.abs(Number(closest) - targetTime);
        const currentDiff = Math.abs(Number(current) - targetTime);
        return currentDiff < closestDiff ? current : closest;
      });

      // OrderBookの詳細を取得してベストプライスを確認
      const orderBookDetail = await this.sfClient.getOrderBookDetail(
        token,
        Number(selectedMaturity)
      );

      // 市場価格を使用（0の場合はマーケットオーダー）
      const unitPrice = Number(orderBookDetail.marketUnitPrice);

      // APY計算
      const maturityTimestamp = Number(selectedMaturity);
      const daysToMaturity = (maturityTimestamp - now) / (24 * 60 * 60);
      let apy = 0;
      if (unitPrice > 0 && daysToMaturity > 0) {
        const discountRate = 10000 / unitPrice - 1;
        apy = discountRate * (365 / daysToMaturity) * 100;
      }

      console.log(`[DefiClient] ${currency} Lending params: maturity=${selectedMaturity}, unitPrice=${unitPrice}, apy=${apy.toFixed(2)}%`);

      return {
        success: true,
        currency,
        maturity: Number(selectedMaturity),
        side: OrderSide.LEND,
        amount: params.amount.toString(),
        unitPrice,
        estimatedApy: Math.max(0, apy),
        maturityDate: new Date(maturityTimestamp * 1000).toLocaleDateString("ja-JP"),
      };
    } catch (error) {
      console.error(`[DefiClient] Failed to get ${currency} lending order params:`, error);
      return {
        success: false,
        currency,
        maturity: 0,
        side: OrderSide.LEND,
        amount: params.amount.toString(),
        unitPrice: 0,
        estimatedApy: 0,
        maturityDate: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 注文見積もりを取得
   */
  async getOrderEstimation(params: {
    walletAddress: string;
    amount: bigint;
    maturity: number;
    unitPrice: number;
  }): Promise<{
    success: boolean;
    filledAmount: string;
    placedAmount: string;
    orderFee: string;
    coverage: string;
    isInsufficientDeposit: boolean;
    error?: string;
  }> {
    await this.ensureInitialized();

    if (!this.isSDKReady() || !this.sfClient) {
      return {
        success: false,
        filledAmount: "0",
        placedAmount: "0",
        orderFee: "0",
        coverage: "0",
        isInsufficientDeposit: true,
        error: "SDK not initialized",
      };
    }

    try {
      const estimation = await this.sfClient.getOrderEstimation(
        JPYC_TOKEN,
        params.maturity,
        params.walletAddress,
        OrderSide.LEND,
        params.amount,
        params.unitPrice
      );

      return {
        success: true,
        filledAmount: formatJPYC(estimation.filledAmount),
        placedAmount: formatJPYC(estimation.placedAmount),
        orderFee: formatJPYC(estimation.orderFeeInFV),
        coverage: (Number(estimation.coverage) / 100).toFixed(2) + "%",
        isInsufficientDeposit: estimation.isInsufficientDepositAmount,
      };
    } catch (error) {
      console.error("[DefiClient] Failed to get order estimation:", error);
      return {
        success: false,
        filledAmount: "0",
        placedAmount: "0",
        orderFee: "0",
        coverage: "0",
        isInsufficientDeposit: true,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * JPYCトークンのERC20残高を取得
   */
  async getJPYCBalance(address: string): Promise<{
    balance: bigint;
    balanceDisplay: string;
  }> {
    await this.ensureInitialized();

    if (!this.isSDKReady() || !this.sfClient) {
      return { balance: 0n, balanceDisplay: "0 JPYC" };
    }

    try {
      const balance = await this.sfClient.getERC20Balance(JPYC_TOKEN, address);
      return {
        balance,
        balanceDisplay: `${formatJPYC(balance)} JPYC`,
      };
    } catch (error) {
      console.error("[DefiClient] Failed to get JPYC balance:", error);
      return { balance: 0n, balanceDisplay: "0 JPYC" };
    }
  }

  /**
   * SecuredFinanceClientインスタンスを取得（フロントエンド用）
   * 実際のトランザクション実行に使用
   */
  async getSDKClient(): Promise<SecuredFinanceClient | null> {
    await this.ensureInitialized();
    return this.sfClient;
  }

  /**
   * JPYC Tokenオブジェクトを取得
   */
  getJPYCToken(): Token {
    return JPYC_TOKEN;
  }

  /**
   * OrderSideの定数をエクスポート
   */
  static get OrderSide() {
    return OrderSide;
  }

  /**
   * WalletSourceの定数をエクスポート
   */
  static get WalletSource() {
    return WalletSource;
  }
}

// シングルトンインスタンス
export const defiClient = new DefiClient();

// 定数のエクスポート
export { OrderSide, WalletSource, JPYC_TOKEN };
