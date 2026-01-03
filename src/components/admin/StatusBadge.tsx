"use client";

import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/order";

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }
> = {
  pending: { label: "注文受付", variant: "default" },
  ordered: { label: "発注済み", variant: "secondary" },
  shipped: { label: "発送済み", variant: "warning" },
  completed: { label: "完了", variant: "success" },
  cancelled: { label: "キャンセル", variant: "destructive" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
