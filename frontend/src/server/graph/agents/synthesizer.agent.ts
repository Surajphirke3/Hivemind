import { getSynthesizerModel } from "@/lib/litellm";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  hashContent,
  onChainFinalizeWorkspace,
} from "@/server/services/chain.service";
import { publishEvent } from "@/server/services/event.service";
import { SYNTHESIZER_PROMPT, SynthesizerOutputSchema } from "../prompts";
import type { AgentStateType } from "../state";

export async function synthesizerNode(state: AgentStateType) {
  const {
    workspaceId,
    researchOutput,
    marketOutput,
    riskOutput,
    technicalOutput,
    criticOutput,
    agentIds,
  } = state;
  const agentId = agentIds.synthesizer;
  if (!agentId) return {};

  const supabase = createServiceRoleClient();

  await supabase.from("agents").update({ status: "running" }).eq("id", agentId);

  await publishEvent(workspaceId, "agent.started", { role: "synthesizer" });

  try {
    const model = getSynthesizerModel().withStructuredOutput(
      SynthesizerOutputSchema,
    );

    const researchFindings = researchOutput
      ? JSON.stringify(researchOutput)
      : "Research findings not available.";
    const marketFindings = marketOutput
      ? JSON.stringify(marketOutput)
      : "Market findings not available.";
    const riskFindings = riskOutput
      ? JSON.stringify(riskOutput)
      : "Risk findings not available.";
    const technicalFindings = technicalOutput
      ? JSON.stringify(technicalOutput)
      : "Technical findings not available.";
    const criticNotes = criticOutput
      ? JSON.stringify(criticOutput)
      : "No critique available.";

    const prompt = SYNTHESIZER_PROMPT.replace(
      "{researchFindings}",
      researchFindings,
    )
      .replace("{marketFindings}", marketFindings)
      .replace("{riskFindings}", riskFindings)
      .replace("{technicalFindings}", technicalFindings)
      .replace("{criticNotes}", criticNotes);

    const output = await model.invoke(prompt);
    const finalScore = criticOutput?.finalScore ?? 70;

    // Store report in DB
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        workspace_id: workspaceId,
        executive_summary: output.executiveSummary,
        key_findings: output.keyFindings as any,
        risks: output.risks as any,
        recommendations: output.recommendations as any,
      })
      .select("*")
      .single();

    if (reportError) throw reportError;

    await supabase.from("agents").update({ status: "done" }).eq("id", agentId);

    const reportHash = hashContent(output);

    await supabase
      .from("workspaces")
      .update({
        status: "finalized",
        content_hash: reportHash,
      })
      .eq("id", workspaceId);

    try {
      await onChainFinalizeWorkspace(workspaceId, output, finalScore);
    } catch (chainErr) {
      console.error("[Synthesizer Chain Finalize Error]:", chainErr);
    }

    await publishEvent(workspaceId, "agent.completed", {
      role: "synthesizer",
      summary: "Synthesis complete. Final report generated.",
      output,
    });

    await publishEvent(workspaceId, "report.generated", {
      workspaceId,
      reportId: report.id,
    });

    return {
      synthesizerOutput: output,
    };
  } catch (error) {
    console.error("[Synthesizer Agent Error]:", error);
    await supabase
      .from("agents")
      .update({ status: "failed" })
      .eq("id", agentId);
    await publishEvent(workspaceId, "agent.failed", {
      role: "synthesizer",
      error: String(error),
    });
    throw error;
  }
}
