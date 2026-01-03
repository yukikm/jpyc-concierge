"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import ProductCard from "./ProductCard";
import ChatActionRenderer from "@/components/actions";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "bg-blue-600 text-white"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isUser
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.products && message.products.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {message.products.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        )}
        {message.action && (
          <ChatActionRenderer
            action={message.action}
            onSuccess={(txHash) => {
              console.log("Transaction success:", txHash);
            }}
            onError={(error) => {
              console.error("Transaction error:", error);
            }}
          />
        )}
      </div>
    </div>
  );
}
