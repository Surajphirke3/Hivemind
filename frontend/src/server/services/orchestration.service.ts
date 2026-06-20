import { createServiceRoleClient } from "@/lib/supabase";
import { graph } from "../graph/supervisor";
import { onChainCreateWorkspace } from "./chain.service";
import { publishEvent } from "./event.service";

export async function runOrchestration(
  workspaceId: string,
  agentTypes: string[],
) {
  const supabase = createServiceRoleClient();

  try {
    // 1. Fetch workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (wsError || !workspace) {
      throw new Error(wsError?.message ?? "Workspace not found");
    }

    // 2. Clean up previous runs
    await supabase.from("agents").delete().eq("workspace_id", workspaceId);
    await supabase.from("reports").delete().eq("workspace_id", workspaceId);

    // 3. Update status to running
    await supabase
      .from("workspaces")
      .update({ status: "running" })
      .eq("id", workspaceId);

    // 4. Create agent entries in database to get their IDs
    const rolesToCreate = [...agentTypes, "critic", "synthesizer"];
    const agentsToInsert = rolesToCreate.map((role) => ({
      workspace_id: workspaceId,
      role,
      status: "queued",
    }));

    const { data: insertedAgents, error: agentsError } = await supabase
      .from("agents")
      .insert(agentsToInsert)
      .select("*");

    if (agentsError || !insertedAgents) {
      throw new Error(agentsError?.message ?? "Failed to create agent entries");
    }

    const agentIds: Record<string, string> = {};
    for (const agent of insertedAgents) {
      agentIds[agent.role] = agent.id;
    }

    // 5. Call on-chain create workspace
    try {
      await onChainCreateWorkspace(workspaceId);
    } catch (chainErr) {
      console.error(
        "[Orchestration] On-chain create workspace failed, continuing:",
        chainErr,
      );
    }

    // Publish workspace creation event to SSE
    await publishEvent(workspaceId, "workspace.created", { workspaceId });

    // 6. Execute LangGraph in background
    console.log(
      `[Orchestration] Invoking LangGraph for workspace: ${workspaceId}`,
    );

    graph
      .invoke({
        workspaceId,
        problemStatement: workspace.problem_statement,
        goal: workspace.goal,
        selectedAgents: agentTypes,
        agentIds,
      })
      .then(() => {
        console.log(
          `[Orchestration] LangGraph complete for workspace: ${workspaceId}`,
        );
      })
      .catch(async (err) => {
        console.error(
          `[Orchestration] LangGraph failed for workspace: ${workspaceId}:`,
          err,
        );
        // Rollback workspace status on crash
        await supabase
          .from("workspaces")
          .update({ status: "pending" })
          .eq("id", workspaceId);
      });
  } catch (error) {
    console.error("[Orchestration Service Error]:", error);
    await supabase
      .from("workspaces")
      .update({ status: "pending" })
      .eq("id", workspaceId);
    throw error;
  }
}
