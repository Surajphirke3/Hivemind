import { getGroqModel } from "@/lib/litellm";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  hashContent,
  onChainLogContribution,
} from "@/server/services/chain.service";
import { publishEvent } from "@/server/services/event.service";
import { RESEARCH_PROMPT, ResearchOutputSchema } from "../prompts";
import type { AgentStateType } from "../state";

export async function researchNode(state: AgentStateType) {
  const { workspaceId, problemStatement, goal, agentIds } = state;
  const agentId = agentIds.research;
  if (!agentId) return {};

  const supabase = createServiceRoleClient();

  await supabase.from("agents").update({ status: "running" }).eq("id", agentId);

  await publishEvent(workspaceId, "agent.started", { role: "research" });

  try {
    const model = getGroqModel().withStructuredOutput(ResearchOutputSchema);
    const prompt = RESEARCH_PROMPT.replace(
      "{problemStatement}",
      problemStatement,
    ).replace("{goal}", goal);

    const output = await model.invoke(prompt);
    const contentHash = hashContent(output);

    const { data: contrib, error: contribError } = await supabase
      .from("contributions")
      .insert({
        workspace_id: workspaceId,
        agent_id: agentId,
        content: output as any,
        content_hash: contentHash,
        score: 0,
      })
      .select("*")
      .single();

    if (contribError) throw contribError;

    await supabase.from("agents").update({ status: "done" }).eq("id", agentId);

    try {
      await onChainLogContribution(workspaceId, "research", output, 0);
    } catch (chainErr) {
      console.error("[Research Chain Log Error]:", chainErr);
    }

    await publishEvent(workspaceId, "agent.completed", {
      role: "research",
      contributionId: contrib.id,
      summary: output.summary,
      score: 0,
    });

    return {
      researchOutput: output,
    };
  } catch (error) {
    console.error("[Research Agent Error]:", error);
    await supabase
      .from("agents")
      .update({ status: "failed" })
      .eq("id", agentId);
    await publishEvent(workspaceId, "agent.failed", {
      role: "research",
      error: String(error),
    });
    throw error;
  }
}
