import { getGroqModel } from "@/lib/litellm";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  hashContent,
  onChainLogContribution,
} from "@/server/services/chain.service";
import { publishEvent } from "@/server/services/event.service";
import { MARKET_PROMPT, MarketOutputSchema } from "../prompts";
import type { AgentStateType } from "../state";

export async function marketNode(state: AgentStateType) {
  const { workspaceId, problemStatement, goal, researchOutput, agentIds } =
    state;
  const agentId = agentIds.market;
  if (!agentId) return {};

  const supabase = createServiceRoleClient();

  await supabase.from("agents").update({ status: "running" }).eq("id", agentId);

  await publishEvent(workspaceId, "agent.started", { role: "market" });

  try {
    const model = getGroqModel().withStructuredOutput(MarketOutputSchema);
    const researchFindings = researchOutput
      ? JSON.stringify(researchOutput.findings)
      : "No research findings available.";

    const prompt = MARKET_PROMPT.replace("{problemStatement}", problemStatement)
      .replace("{goal}", goal)
      .replace("{researchFindings}", researchFindings);

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
      await onChainLogContribution(workspaceId, "market", output, 0);
    } catch (chainErr) {
      console.error("[Market Chain Log Error]:", chainErr);
    }

    await publishEvent(workspaceId, "agent.completed", {
      role: "market",
      contributionId: contrib.id,
      summary: output.summary,
      score: 0,
    });

    return {
      marketOutput: output,
    };
  } catch (error) {
    console.error("[Market Agent Error]:", error);
    await supabase
      .from("agents")
      .update({ status: "failed" })
      .eq("id", agentId);
    await publishEvent(workspaceId, "agent.failed", {
      role: "market",
      error: String(error),
    });
    throw error;
  }
}
