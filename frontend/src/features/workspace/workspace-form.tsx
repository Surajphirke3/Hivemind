"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function WorkspaceForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isDemoConnected, setIsDemoConnected] = useState(false);

  useEffect(() => {
    setIsDemoConnected(document.cookie.includes("hivemind_wallet_address"));
  }, []);

  const isUserConnected = isConnected || isDemoConnected;

  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isUserConnected) {
      setError("Connect your wallet or use Demo Connect before creating a workspace.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, problemStatement, goal }),
      });

      const data = (await response.json()) as {
        workspaceId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create workspace");
      }

      if (!data.workspaceId) {
        throw new Error("Missing workspace ID in response");
      }

      router.push(`/workspace/${data.workspaceId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Workspace title</Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="AI startup opportunity in India"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problem">Problem statement</Label>
        <Textarea
          id="problem"
          value={problemStatement}
          onChange={(event) => setProblemStatement(event.target.value)}
          placeholder="Find the best AI startup opportunity in India."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal">Goal</Label>
        <Textarea
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Identify market size, risks, and a technical path to MVP."
          required
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting || !isUserConnected}>
        {isSubmitting ? "Creating..." : "Create workspace"}
      </Button>
    </form>
  );
}
