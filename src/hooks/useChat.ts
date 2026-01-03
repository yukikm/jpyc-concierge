"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chatStore";
import type { ChatMessage } from "@/types/chat";
import type { Product } from "@/types/product";
import type { ChatAction } from "@/types/chat";

interface ChatApiResponse {
  response: string;
  products?: Product[];
  action?: ChatAction;
}

export function useChat() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date(),
      };

      addMessage(userMessage);
      setLoading(true);

      try {
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history,
          }),
        });

        if (!response.ok) {
          throw new Error("Chat request failed");
        }

        const data: ChatApiResponse = await response.json();

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          products: data.products,
          action: data.action,
          createdAt: new Date(),
        };

        addMessage(assistantMessage);
      } catch (error) {
        console.error("Chat error:", error);

        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "申し訳ありません。エラーが発生しました。もう一度お試しください。",
          createdAt: new Date(),
        };

        addMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [messages, isLoading, addMessage, setLoading]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
