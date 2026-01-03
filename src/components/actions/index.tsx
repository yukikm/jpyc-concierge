"use client";

import type { ChatAction } from "@/types/chat";
import LendingAction from "./LendingAction";
import WithdrawAction from "./WithdrawAction";

interface ChatActionRendererProps {
  action: ChatAction;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function ChatActionRenderer({
  action,
  onSuccess,
  onError,
}: ChatActionRendererProps) {
  switch (action.type) {
    case "lending":
      return (
        <LendingAction
          action={action}
          onSuccess={onSuccess}
          onError={onError}
        />
      );
    case "withdraw":
      return (
        <WithdrawAction
          action={action}
          onSuccess={onSuccess}
          onError={onError}
        />
      );
    case "purchase":
      // TODO: PurchaseAction component
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
          購入機能は準備中です
        </div>
      );
    default:
      return null;
  }
}

export { LendingAction, WithdrawAction };
