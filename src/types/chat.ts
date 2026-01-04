import { Product } from "./product";

export type MessageRole = "user" | "assistant";

// アクションの種類
export type ActionType = "lending" | "withdraw" | "claim" | "purchase";

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

// 引き出しアクションのパラメータ（満期前の早期解約）
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

// 満期償還アクションのパラメータ（満期後の元本+利息受け取り）
export interface ClaimActionParams {
  type: "claim";
  positionId: string;
  maturity: number; // executeRedemptionに必要
  principal: string; // 元本（wei）
  principalDisplay: string; // "10,000 JPYC"
  interest: string; // 利息（wei）
  interestDisplay: string; // "500 JPYC"
  total: string; // 合計（wei）
  totalDisplay: string; // "10,500 JPYC"
  maturityDate: string; // "2026/03/01"
}

// 購入アクションのパラメータ
export interface PurchaseActionParams {
  type: "purchase";
  productName: string;
  productImageUrl?: string;
  productUrl: string;
  price: number;
  priceDisplay: string;
  // 住所情報（住所ヒアリング完了後に追加される）
  shippingPostalCode?: string;
  shippingAddress?: string;
  shippingName?: string;
  // 決済状態
  isReadyToPurchase: boolean;
}

// アクション統合型
export type ChatAction =
  | LendingActionParams
  | WithdrawActionParams
  | ClaimActionParams
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
