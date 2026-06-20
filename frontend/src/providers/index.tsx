"use client";

import { QueryProvider } from "@/providers/query-provider";
import { Web3Provider } from "@/providers/web3-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <Web3Provider>{children}</Web3Provider>
    </QueryProvider>
  );
}
