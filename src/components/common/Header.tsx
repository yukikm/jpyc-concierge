"use client";

import { Wallet } from "lucide-react";

interface HeaderProps {
  walletButton?: React.ReactNode;
}

export default function Header({ walletButton }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            JPYC Concierge
          </span>
        </div>
        {walletButton}
      </div>
    </header>
  );
}
