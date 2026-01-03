export type OrderStatus =
  | "pending"
  | "ordered"
  | "shipped"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  conversationId?: string | null;
  productName: string;
  productImageUrl?: string | null;
  productUrl: string;
  price: number;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingName: string;
  txHash?: string | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  walletAddress: string;
  conversationId?: string;
  productName: string;
  productImageUrl?: string;
  productUrl: string;
  price: number;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingName: string;
  txHash?: string;
}

export interface UpdateOrderInput {
  status: OrderStatus;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
