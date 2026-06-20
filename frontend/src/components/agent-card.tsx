import {
  Brain,
  FlaskConical,
  LineChart,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AgentRole, AgentStatus } from "@/types/database";

const roleIcons: Record<AgentRole, ComponentType<{ className?: string }>> = {
  research: FlaskConical,
  market: LineChart,
  risk: ShieldAlert,
  technical: Wrench,
  critic: Brain,
  synthesizer: Brain,
};

const statusVariant: Record<
  AgentStatus,
  "default" | "secondary" | "success" | "warning" | "danger"
> = {
  queued: "secondary",
  running: "default",
  done: "success",
  failed: "danger",
};

export interface AgentCardProps {
  agentRole: AgentRole;
  status: AgentStatus;
  summary?: string;
  score?: number;
  className?: string;
}

export function AgentCard({
  agentRole,
  status,
  summary,
  score,
  className,
}: AgentCardProps) {
  const Icon = roleIcons[agentRole];

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="capitalize">{agentRole}</CardTitle>
        </div>
        <Badge variant={statusVariant[status]}>{status}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--color-muted)]">
          {summary ??
            "Agent output will appear here once the reasoning loop runs."}
        </p>
        {typeof score === "number" && (
          <p className="mt-3 font-mono text-xs text-[var(--color-success)]">
            Consensus: {score}/100
          </p>
        )}
      </CardContent>
    </Card>
  );
}
