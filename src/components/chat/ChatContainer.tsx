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
    <div className="flex h-full flex-col">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
