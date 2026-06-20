import { getGroqModel } from "@/lib/litellm";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  hashContent,
  onChainLogContribution,
} from "@/server/services/chain.service";
import { publishEvent } from "@/server/services/event.service";
import { RISK_PROMPT, RiskOutputSchema } from "../prompts";
import type { AgentStateType } from "../state";

export async function riskNode(state: AgentStateType) {
  const {
    workspaceId,
    problemStatement,
    goal,
    researchOutput,
    marketOutput,
    agentIds,
  } = state;
  const agentId = agentIds.risk;
  if (!agentId) return {};

  const supabase = createServiceRoleClient();

  await supabase.from("agents").update({ status: "running" }).eq("id", agentId);

  await publishEvent(workspaceId, "agent.started", { role: "risk" });

  try {
    const model = getGroqModel().withStructuredOutput(RiskOutputSchema);
    const researchFindings = researchOutput
      ? JSON.stringify(researchOutput.findings)
      : "No research findings available.";
    const marketFindings = marketOutput
      ? JSON.stringify(marketOutput.summary)
      : "No market findings available.";

    const prompt = RISK_PROMPT.replace("{problemStatement}", problemStatement)
      .replace("{goal}", goal)
      .replace("{researchFindings}", researchFindings)
      .replace("{marketFindings}", marketFindings);

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
      await onChainLogContribution(workspaceId, "risk", output, 0);
    } catch (chainErr) {
      console.error("[Risk Chain Log Error]:", chainErr);
    }

    await publishEvent(workspaceId, "agent.completed", {
      role: "risk",
      contributionId: contrib.id,
      summary: output.summary,
      score: 0,
    });

    return {
      riskOutput: output,
    };
  } catch (error) {
    console.error("[Risk Agent Error]:", error);
    await supabase
      .from("agents")
      .update({ status: "failed" })
      .eq("id", agentId);
    await publishEvent(workspaceId, "agent.failed", {
      role: "risk",
      error: String(error),
    });
    throw error;
  }
}
