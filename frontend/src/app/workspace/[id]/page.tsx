import { notFound } from "next/navigation";
import { WorkspaceView } from "@/features/workspace/workspace-view";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  getSessionUserId,
  getWorkspaceById,
} from "@/server/services/workspace.service";
import type { Agent, Contribution, Workspace } from "@/types/database";

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const userId = await getSessionUserId();
  const workspace = await getWorkspaceById(id);

  if (!workspace || (userId && workspace.creator_id !== userId)) {
    notFound();
  }

  const supabase = createServiceRoleClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("workspace_id", id);

  const { data: contributions } = await supabase
    .from("contributions")
    .select("*")
    .eq("workspace_id", id);

  return (
    <WorkspaceView
      workspace={workspace}
      initialAgents={(agents as Agent[]) || []}
      initialContributions={(contributions as Contribution[]) || []}
    />
  );
}
