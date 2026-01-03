"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden">
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 384px) 100vw, 384px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            No Image
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="line-clamp-2 text-sm font-medium">
          {product.name}
        </CardTitle>
        {product.shopName && (
          <CardDescription className="text-xs">
            {product.shopName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatPrice(product.price)}
          </span>
          <Button variant="outline" size="sm" asChild>
            <a
              href={product.itemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              詳細
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
