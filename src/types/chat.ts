import { Product } from "./product";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  products?: Product[];
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
}

export interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
}
