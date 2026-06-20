export type WorkspaceStatus = "pending" | "running" | "finalized";

export type AgentRole =
  | "research"
  | "market"
  | "risk"
  | "technical"
  | "critic"
  | "synthesizer";

export type AgentStatus = "queued" | "running" | "done" | "failed";

export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  creator_id: string;
  title: string;
  problem_statement: string;
  goal: string;
  status: WorkspaceStatus;
  content_hash: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  workspace_id: string;
  role: AgentRole;
  status: AgentStatus;
}

export interface Contribution {
  id: string;
  workspace_id: string;
  agent_id: string;
  content: Record<string, unknown>;
  content_hash: string;
  score: number;
  created_at: string;
}

export interface Consensus {
  id: string;
  workspace_id: string;
  contribution_id: string;
  critic_notes: string;
  final_score: number;
}

export interface Report {
  id: string;
  workspace_id: string;
  executive_summary: string;
  key_findings: Record<string, unknown>;
  risks: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  storage_url: string | null;
}
