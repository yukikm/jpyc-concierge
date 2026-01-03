"use client";

import Header from "@/components/common/Header";
import ChatContainer from "@/components/chat/ChatContainer";
import WalletButton from "@/components/wallet/WalletButton";
import { useChat } from "@/hooks/useChat";

export default function Home() {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Header walletButton={<WalletButton />} />
      <main className="flex flex-1 flex-col">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
        />
      </main>
    </div>
  );
}
