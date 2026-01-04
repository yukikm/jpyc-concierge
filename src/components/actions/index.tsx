"use client";

import type { ChatAction } from "@/types/chat";
import LendingAction from "./LendingAction";
import WithdrawAction from "./WithdrawAction";
import ClaimAction from "./ClaimAction";
import PurchaseAction from "./PurchaseAction";

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
    case "claim":
      return <ClaimAction action={action} />;
    case "purchase":
      return <PurchaseAction action={action} />;
    default:
      return null;
  }
}

export { LendingAction, WithdrawAction, ClaimAction, PurchaseAction };
