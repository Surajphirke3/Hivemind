import { getGroqModel } from "@/lib/litellm";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  hashContent,
  onChainLogContribution,
} from "@/server/services/chain.service";
import { publishEvent } from "@/server/services/event.service";
import { TECHNICAL_PROMPT, TechnicalOutputSchema } from "../prompts";
import type { AgentStateType } from "../state";

export async function technicalNode(state: AgentStateType) {
  const {
    workspaceId,
    problemStatement,
    goal,
    researchOutput,
    marketOutput,
    riskOutput,
    agentIds,
  } = state;
  const agentId = agentIds.technical;
  if (!agentId) return {};

  const supabase = createServiceRoleClient();

  await supabase.from("agents").update({ status: "running" }).eq("id", agentId);

  await publishEvent(workspaceId, "agent.started", { role: "technical" });

  try {
    const model = getGroqModel().withStructuredOutput(TechnicalOutputSchema);
    const researchFindings = researchOutput
      ? JSON.stringify(researchOutput.findings)
      : "No research findings available.";
    const marketFindings = marketOutput
      ? JSON.stringify(marketOutput.summary)
      : "No market findings available.";
    const riskFindings = riskOutput
      ? JSON.stringify(riskOutput.risks)
      : "No risk findings available.";

    const prompt = TECHNICAL_PROMPT.replace(
      "{problemStatement}",
      problemStatement,
    )
      .replace("{goal}", goal)
      .replace("{researchFindings}", researchFindings)
      .replace("{marketFindings}", marketFindings)
      .replace("{riskFindings}", riskFindings);

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
      await onChainLogContribution(workspaceId, "technical", output, 0);
    } catch (chainErr) {
      console.error("[Technical Chain Log Error]:", chainErr);
    }

    await publishEvent(workspaceId, "agent.completed", {
      role: "technical",
      contributionId: contrib.id,
      summary: output.summary,
      score: 0,
    });

    return {
      technicalOutput: output,
    };
  } catch (error) {
    console.error("[Technical Agent Error]:", error);
    await supabase
      .from("agents")
      .update({ status: "failed" })
      .eq("id", agentId);
    await publishEvent(workspaceId, "agent.failed", {
      role: "technical",
      error: String(error),
    });
    throw error;
  }
}
