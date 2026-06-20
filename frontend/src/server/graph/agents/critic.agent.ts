import { getGroqModel } from "@/lib/litellm";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  hashContent,
  onChainLogContribution,
} from "@/server/services/chain.service";
import { publishEvent } from "@/server/services/event.service";
import { CRITIC_PROMPT, CriticOutputSchema } from "../prompts";
import type { AgentStateType } from "../state";

export async function criticNode(state: AgentStateType) {
  const {
    workspaceId,
    researchOutput,
    marketOutput,
    riskOutput,
    technicalOutput,
    agentIds,
  } = state;
  const agentId = agentIds.critic;
  if (!agentId) return {};

  const supabase = createServiceRoleClient();

  await supabase.from("agents").update({ status: "running" }).eq("id", agentId);

  await publishEvent(workspaceId, "agent.started", { role: "critic" });

  try {
    const model = getGroqModel().withStructuredOutput(CriticOutputSchema);

    const researchFindings = researchOutput
      ? JSON.stringify(researchOutput)
      : "Research agent did not run.";
    const marketFindings = marketOutput
      ? JSON.stringify(marketOutput)
      : "Market agent did not run.";
    const riskFindings = riskOutput
      ? JSON.stringify(riskOutput)
      : "Risk agent did not run.";
    const technicalFindings = technicalOutput
      ? JSON.stringify(technicalOutput)
      : "Technical agent did not run.";

    const prompt = CRITIC_PROMPT.replace("{researchFindings}", researchFindings)
      .replace("{marketFindings}", marketFindings)
      .replace("{riskFindings}", riskFindings)
      .replace("{technicalFindings}", technicalFindings);

    const output = await model.invoke(prompt);
    const contentHash = hashContent(output);

    const { data: criticContrib, error: criticError } = await supabase
      .from("contributions")
      .insert({
        workspace_id: workspaceId,
        agent_id: agentId,
        content: output as any,
        content_hash: contentHash,
        score: output.finalScore,
      })
      .select("*")
      .single();

    if (criticError) throw criticError;

    await supabase.from("agents").update({ status: "done" }).eq("id", agentId);

    try {
      await onChainLogContribution(
        workspaceId,
        "critic",
        output,
        output.finalScore,
      );
    } catch (chainErr) {
      console.error("[Critic Chain Log Error]:", chainErr);
    }

    // Process per-agent challenges and scores
    const scoresMap: Record<string, number> = {
      research: 0,
      market: 0,
      risk: 0,
      technical: 0,
    };

    for (const challenge of output.challenges) {
      if (challenge.agentRole in scoresMap) {
        scoresMap[challenge.agentRole] = challenge.score;
      }

      const targetAgentId = agentIds[challenge.agentRole];
      if (targetAgentId) {
        const { data: targetContrib } = await supabase
          .from("contributions")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("agent_id", targetAgentId)
          .maybeSingle();

        if (targetContrib) {
          // Update score in contributions table
          await supabase
            .from("contributions")
            .update({ score: challenge.score })
            .eq("id", targetContrib.id);

          // Add consensus entry
          await supabase.from("consensus").insert({
            workspace_id: workspaceId,
            contribution_id: targetContrib.id,
            critic_notes: challenge.notes,
            final_score: challenge.score,
          });
        }
      }
    }

    // Set fallback default scores for agents that ran but weren't returned by Critic
    if (researchOutput && scoresMap.research === 0) scoresMap.research = 70;
    if (marketOutput && scoresMap.market === 0) scoresMap.market = 70;
    if (riskOutput && scoresMap.risk === 0) scoresMap.risk = 70;
    if (technicalOutput && scoresMap.technical === 0) scoresMap.technical = 70;

    await publishEvent(workspaceId, "consensus.updated", {
      workspaceId,
      scores: [
        scoresMap.research,
        scoresMap.market,
        scoresMap.risk,
        scoresMap.technical,
      ],
      finalScore: output.finalScore,
    });

    await publishEvent(workspaceId, "agent.completed", {
      role: "critic",
      contributionId: criticContrib.id,
      summary: output.criticism,
      score: output.finalScore,
    });

    return {
      criticOutput: output,
    };
  } catch (error) {
    console.error("[Critic Agent Error]:", error);
    await supabase
      .from("agents")
      .update({ status: "failed" })
      .eq("id", agentId);
    await publishEvent(workspaceId, "agent.failed", {
      role: "critic",
      error: String(error),
    });
    throw error;
  }
}
