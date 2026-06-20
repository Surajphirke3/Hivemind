"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cookieStorage, createStorage } from "wagmi";
import { monadTestnet } from "@/lib/viem";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo";

export const wagmiConfig = getDefaultConfig({
  appName: "HiveMind Protocol",
  projectId,
  chains: [monadTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
