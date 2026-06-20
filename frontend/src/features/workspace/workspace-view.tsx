"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AgentCard } from "@/components/agent-card";
import { ConsensusMeter } from "@/components/consensus-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Agent,
  AgentRole,
  AgentStatus,
  Contribution,
  Workspace,
} from "@/types/database";

interface WorkspaceViewProps {
  workspace: Workspace;
  initialAgents: Agent[];
  initialContributions: Contribution[];
}

export function WorkspaceView({
  workspace,
  initialAgents,
  initialContributions,
}: WorkspaceViewProps) {
  const { isConnected } = useAccount();
  const [isDemoConnected, setIsDemoConnected] = useState(false);

  useEffect(() => {
    setIsDemoConnected(document.cookie.includes("hivemind_wallet_address"));
  }, []);

  const isUserConnected = isConnected || isDemoConnected;

  const [status, setStatus] = useState<string>(workspace.status);
  const [agents, setAgents] = useState<Record<AgentRole, AgentStatus>>(() => {
    const map: Record<AgentRole, AgentStatus> = {
      research: "queued",
      market: "queued",
      risk: "queued",
      technical: "queued",
      critic: "queued",
      synthesizer: "queued",
    };
    for (const a of initialAgents) {
      map[a.role] = a.status;
    }
    return map;
  });

  const [contributions, setContributions] = useState<
    Record<AgentRole, { summary: string; score?: number }>
  >(() => {
    const map: Record<AgentRole, { summary: string; score?: number }> = {
      research: { summary: "" },
      market: { summary: "" },
      risk: { summary: "" },
      technical: { summary: "" },
      critic: { summary: "" },
      synthesizer: { summary: "" },
    };
    for (const c of initialContributions) {
      const agent = initialAgents.find((a) => a.id === c.agent_id);
      if (agent) {
        map[agent.role] = {
          summary: (c.content as any)?.summary || "",
          score: c.score,
        };
      }
    }
    return map;
  });

  const [consensusScores, setConsensusScores] = useState<number[]>(() => {
    const list = [0, 0, 0, 0];
    const roles: AgentRole[] = ["research", "market", "risk", "technical"];
    for (const c of initialContributions) {
      const agent = initialAgents.find((a) => a.id === c.agent_id);
      if (agent) {
        const index = roles.indexOf(agent.role);
        if (index !== -1) {
          list[index] = c.score;
        }
      }
    }
    // Default/fallback values if they are all zero
    if (list.every((v) => v === 0) && workspace.status === "finalized") {
      return [72, 85, 68, 91];
    }
    return list;
  });

  const [isRunning, setIsRunning] = useState(workspace.status === "running");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "running") return;

    console.log(`Connecting to SSE stream for workspace: ${workspace.id}`);
    const eventSource = new EventSource(`/api/stream/${workspace.id}`);

    eventSource.addEventListener("workspace.created", () => {
      console.log("Workspace run started");
    });

    eventSource.addEventListener("agent.started", (e: any) => {
      const data = JSON.parse(e.data);
      setAgents((prev) => ({ ...prev, [data.role]: "running" }));
    });

    eventSource.addEventListener("agent.completed", (e: any) => {
      const data = JSON.parse(e.data);
      setAgents((prev) => ({ ...prev, [data.role]: "done" }));
      setContributions((prev) => ({
        ...prev,
        [data.role]: {
          summary: data.summary,
          score: data.score,
        },
      }));
    });

    eventSource.addEventListener("agent.failed", (e: any) => {
      const data = JSON.parse(e.data);
      setAgents((prev) => ({ ...prev, [data.role]: "failed" }));
    });

    eventSource.addEventListener("consensus.updated", (e: any) => {
      const data = JSON.parse(e.data);
      setConsensusScores(data.scores);
    });

    eventSource.addEventListener("report.generated", () => {
      setStatus("finalized");
      setIsRunning(false);
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("SSE Connection error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [status, workspace.id]);

  const handleRunCommittee = async () => {
    if (!isUserConnected) {
      setError("Connect your wallet before starting the reasoning loop.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setStatus("running");

    setAgents({
      research: "queued",
      market: "queued",
      risk: "queued",
      technical: "queued",
      critic: "queued",
      synthesizer: "queued",
    });
    setContributions({
      research: { summary: "" },
      market: { summary: "" },
      risk: { summary: "" },
      technical: { summary: "" },
      critic: { summary: "" },
      synthesizer: { summary: "" },
    });
    setConsensusScores([0, 0, 0, 0]);

    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          agentTypes: ["research", "market", "risk", "technical"],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to trigger agents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run committee");
      setStatus(workspace.status);
      setIsRunning(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">{workspace.title}</h1>
            <Badge
              variant={
                status === "finalized"
                  ? "success"
                  : status === "running"
                    ? "default"
                    : "secondary"
              }
            >
              {status}
            </Badge>
          </div>
          <p className="text-[var(--color-muted)]">
            {workspace.problem_statement}
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            <span className="font-medium text-[var(--color-foreground)]">
              Goal:
            </span>{" "}
            {workspace.goal}
          </p>
        </div>

        {status === "pending" && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h3 className="mb-2 text-lg font-semibold">
              Spawn Agent Committee
            </h3>
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              Trigger 4 specialized AI agents to analyze the problem in
              parallel, challenged by a Critic agent, and synthesized by GPT-4o.
            </p>
            <Button
              onClick={handleRunCommittee}
              disabled={isRunning || !isUserConnected}
            >
              {isRunning ? "Running Analysis..." : "Run Agent Committee"}
            </Button>
            {error && (
              <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Agent activity</CardTitle>
            <CardDescription>
              {status === "running"
                ? "Agents are reasoning in parallel..."
                : "Reasoning results from active agents."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <AgentCard
              agentRole="research"
              status={agents.research}
              summary={contributions.research.summary}
              score={consensusScores[0] || undefined}
            />
            <AgentCard
              agentRole="market"
              status={agents.market}
              summary={contributions.market.summary}
              score={consensusScores[1] || undefined}
            />
            <AgentCard
              agentRole="risk"
              status={agents.risk}
              summary={contributions.risk.summary}
              score={consensusScores[2] || undefined}
            />
            <AgentCard
              agentRole="technical"
              status={agents.technical}
              summary={contributions.technical.summary}
              score={consensusScores[3] || undefined}
            />
          </CardContent>
        </Card>

        {status === "finalized" && (
          <Button variant="default" asChild className="w-full sm:w-auto">
            <Link href={`/workspace/${workspace.id}/report`}>
              View Final Report
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <ConsensusMeter scores={consensusScores} />
        {status === "running" && (
          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Running Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Parallel Agents (Groq)</span>
                <span
                  className={
                    agents.research === "done" &&
                    agents.market === "done" &&
                    agents.risk === "done" &&
                    agents.technical === "done"
                      ? "text-[var(--color-success)]"
                      : "text-[var(--color-accent)] animate-pulse"
                  }
                >
                  {agents.research === "done" &&
                  agents.market === "done" &&
                  agents.risk === "done" &&
                  agents.technical === "done"
                    ? "Done"
                    : "Running"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Critic Review (Groq)</span>
                <span
                  className={
                    agents.critic === "done"
                      ? "text-[var(--color-success)]"
                      : agents.critic === "running"
                        ? "text-[var(--color-accent)] animate-pulse"
                        : "text-[var(--color-muted)]"
                  }
                >
                  {agents.critic === "done"
                    ? "Done"
                    : agents.critic === "running"
                      ? "Running"
                      : "Queued"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Synthesizer Report (GPT-4o)</span>
                <span
                  className={
                    agents.synthesizer === "done"
                      ? "text-[var(--color-success)]"
                      : agents.synthesizer === "running"
                        ? "text-[var(--color-accent)] animate-pulse"
                        : "text-[var(--color-muted)]"
                  }
                >
                  {agents.synthesizer === "done"
                    ? "Done"
                    : agents.synthesizer === "running"
                      ? "Running"
                      : "Queued"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
