"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workspace/new", label: "New Workspace" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [isDemoConnected, setIsDemoConnected] = useState(false);

  useEffect(() => {
    setIsDemoConnected(document.cookie.includes("hivemind_wallet_address"));
  }, []);

  const handleDemoConnect = async () => {
    const dummyAddress = "0xd53ffd119c57F7335D3295637fDDBABF47B8bDEf";
    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: dummyAddress }),
    });
    if (res.ok) {
      window.location.reload();
    }
  };

  const handleDemoDisconnect = async () => {
    const res = await fetch("/api/auth/mock-login", {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            HiveMind
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm transition-colors hover:text-[var(--color-accent)]",
                  pathname === item.href
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton showBalance={false} chainStatus="icon" />
          {!isConnected && (
            isDemoConnected ? (
              <Button variant="outline" size="sm" onClick={handleDemoDisconnect} className="text-xs">
                Demo Disconnect
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={handleDemoConnect} className="text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80">
                Demo Connect
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
