"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";

export function MockAuthSync() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    void fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
  }, [address, isConnected]);

  return null;
}
