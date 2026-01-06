"use client";

import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import type { ChatMessage } from "@/types/chat";

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export default function ChatContainer({
  messages,
  isLoading,
  onSendMessage,
}: ChatContainerProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* メッセージリスト（スクロール可能領域） */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
      {/* 入力フォーム（下部固定） */}
      <div className="shrink-0">
        <ChatInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
