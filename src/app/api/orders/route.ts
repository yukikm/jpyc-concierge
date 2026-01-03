import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import type { Order, OrderStatus } from "@/types/order";

const mockOrders: Order[] = [
  {
    id: "order-001",
    userId: "user-001",
    conversationId: "conv-001",
    productName: "ゴディバ チョコレート詰め合わせ",
    productImageUrl: "https://placehold.co/300x300/png?text=Godiva",
    productUrl: "https://www.rakuten.co.jp/",
    price: 1200,
    shippingPostalCode: "150-0001",
    shippingAddress: "東京都渋谷区神宮前1-2-3",
    shippingName: "山田 太郎",
    txHash: "0x1234567890abcdef",
    status: "pending",
    createdAt: new Date("2026-01-03T10:00:00"),
    updatedAt: new Date("2026-01-03T10:00:00"),
  },
  {
    id: "order-002",
    userId: "user-002",
    conversationId: "conv-002",
    productName: "スターバックス コーヒー豆",
    productImageUrl: "https://placehold.co/300x300/png?text=Starbucks",
    productUrl: "https://www.rakuten.co.jp/",
    price: 820,
    shippingPostalCode: "220-0012",
    shippingAddress: "神奈川県横浜市西区みなとみらい4-5-6",
    shippingName: "鈴木 花子",
    txHash: "0xabcdef1234567890",
    status: "ordered",
    createdAt: new Date("2026-01-02T14:30:00"),
    updatedAt: new Date("2026-01-02T15:00:00"),
  },
  {
    id: "order-003",
    userId: "user-003",
    conversationId: null,
    productName: "無印良品 お菓子詰め合わせ",
    productImageUrl: "https://placehold.co/300x300/png?text=MUJI",
    productUrl: "https://www.rakuten.co.jp/",
    price: 500,
    shippingPostalCode: "530-0001",
    shippingAddress: "大阪府大阪市北区梅田7-8-9",
    shippingName: "佐藤 一郎",
    txHash: null,
    status: "completed",
    createdAt: new Date("2026-01-01T09:00:00"),
    updatedAt: new Date("2026-01-01T18:00:00"),
  },
];

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "all";

  let filteredOrders = mockOrders;
  if (status !== "all") {
    filteredOrders = mockOrders.filter((order) => order.status === status);
  }

  const total = filteredOrders.length;
  const startIndex = (page - 1) * limit;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    orders: paginatedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

const CreateOrderSchema = z.object({
  walletAddress: z.string(),
  conversationId: z.string().optional(),
  productName: z.string(),
  productImageUrl: z.string().optional(),
  productUrl: z.string(),
  price: z.number(),
  shippingPostalCode: z.string(),
  shippingAddress: z.string(),
  shippingName: z.string(),
  txHash: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateOrderSchema.parse(body);

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: data.walletAddress,
      conversationId: data.conversationId || null,
      productName: data.productName,
      productImageUrl: data.productImageUrl || null,
      productUrl: data.productUrl,
      price: data.price,
      shippingPostalCode: data.shippingPostalCode,
      shippingAddress: data.shippingAddress,
      shippingName: data.shippingName,
      txHash: data.txHash || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockOrders.unshift(newOrder);

    return NextResponse.json({
      orderId: newOrder.id,
      status: newOrder.status,
      createdAt: newOrder.createdAt,
    });
  } catch (error) {
    console.error("Create order error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "注文作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

const UpdateOrderSchema = z.object({
  status: z.enum(["pending", "ordered", "shipped", "completed", "cancelled"]),
});

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = UpdateOrderSchema.parse(body);

    const orderIndex = mockOrders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    mockOrders[orderIndex].status = status as OrderStatus;
    mockOrders[orderIndex].updatedAt = new Date();

    return NextResponse.json({
      orderId,
      status,
      updatedAt: mockOrders[orderIndex].updatedAt,
    });
  } catch (error) {
    console.error("Update order error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "注文更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
