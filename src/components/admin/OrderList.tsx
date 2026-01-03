"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import type { Order, OrderStatus } from "@/types/order";

interface OrderListProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "ordered",
  ordered: "shipped",
  shipped: "completed",
};

const nextStatusLabel: Record<string, string> = {
  pending: "発注済みに変更",
  ordered: "発送済みに変更",
  shipped: "完了に変更",
};

export default function OrderList({ orders, onStatusChange }: OrderListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    await onStatusChange(orderId, status);
    setUpdatingId(null);
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <Package className="h-12 w-12 mb-4" />
        <p>注文がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">#{order.id.slice(-6)}</CardTitle>
                <CardDescription>{formatDate(order.createdAt)}</CardDescription>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {order.productImageUrl && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  <Image
                    src={order.productImageUrl}
                    alt={order.productName}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <p className="font-medium">{order.productName}</p>
                <p className="text-lg font-bold">{formatPrice(order.price)}</p>
                <div className="text-sm text-zinc-500">
                  <p>
                    〒{order.shippingPostalCode}
                  </p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.shippingName} 様</p>
                </div>
                {order.txHash && (
                  <p className="text-xs text-zinc-400">
                    TX: {order.txHash.slice(0, 10)}...{order.txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={order.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  楽天で開く
                </a>
              </Button>
              {nextStatusMap[order.status] && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleStatusChange(order.id, nextStatusMap[order.status]!)
                  }
                  disabled={updatingId === order.id}
                >
                  {updatingId === order.id
                    ? "更新中..."
                    : nextStatusLabel[order.status]}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
