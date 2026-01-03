import { Product } from "./product";

export type MessageRole = "user" | "assistant";

// アクションの種類
export type ActionType = "lending" | "withdraw" | "purchase";

// レンディングアクションのパラメータ
export interface LendingActionParams {
  type: "lending";
  amount: string; // JPYC amount in wei
  amountDisplay: string; // "10,000 JPYC"
  maturity: number; // timestamp
  maturityDate: string; // "2026/03/01"
  unitPrice: number;
  estimatedApy: string; // "5.0%"
  side: number; // OrderSide.LEND = 0
}

// 引き出しアクションのパラメータ
export interface WithdrawActionParams {
  type: "withdraw";
  positionId: string;
  maturity: number; // unwindPositionに必要
  presentValue: string; // 現在価値（wei）
  futureValue: string; // 将来価値（wei）
  presentValueDisplay: string; // "10,000 JPYC"
  accruedInterest: string; // 発生利息（wei）
  accruedInterestDisplay: string; // "500 JPYC"
  maturityDate: string; // "2026/03/01"
  isMatured: boolean; // 満期済みかどうか
}

// 購入アクションのパラメータ
export interface PurchaseActionParams {
  type: "purchase";
  productId: string;
  productName: string;
  price: number;
  priceDisplay: string;
}

// アクション統合型
export type ChatAction =
  | LendingActionParams
  | WithdrawActionParams
  | PurchaseActionParams;

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  products?: Product[];
  action?: ChatAction; // トランザクション実行用のアクション
  createdAt: Date;
}

export interface ChatRequest {
  message: string;
  walletAddress?: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  products?: Product[];
  action?: ChatAction;
}

export interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
}
