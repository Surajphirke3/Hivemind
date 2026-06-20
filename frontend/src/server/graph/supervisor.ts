import { END, START, StateGraph } from "@langchain/langgraph";
import { criticNode } from "./agents/critic.agent";
import { marketNode } from "./agents/market.agent";
import { researchNode } from "./agents/research.agent";
import { riskNode } from "./agents/risk.agent";
import { synthesizerNode } from "./agents/synthesizer.agent";
import { technicalNode } from "./agents/technical.agent";
import { AgentState } from "./state";

function supervisorRoute(state: typeof AgentState.State) {
  const selected = state.selectedAgents || [];
  const next: string[] = [];

  if (selected.includes("research")) next.push("research");
  if (selected.includes("market")) next.push("market");
  if (selected.includes("risk")) next.push("risk");
  if (selected.includes("technical")) next.push("technical");

  if (next.length === 0) {
    return ["critic"];
  }
  return next;
}

const workflow = new StateGraph(AgentState)
  .addNode("research", researchNode as any)
  .addNode("market", marketNode as any)
  .addNode("risk", riskNode as any)
  .addNode("technical", technicalNode as any)
  .addNode("critic", criticNode as any)
  .addNode("synthesizer", synthesizerNode as any)
  .addConditionalEdges(START, supervisorRoute as any);

// Parallel paths join at critic
workflow.addEdge("research", "critic");
workflow.addEdge("market", "critic");
workflow.addEdge("risk", "critic");
workflow.addEdge("technical", "critic");

// Critic to synthesizer
workflow.addEdge("critic", "synthesizer");

// Synthesizer to end
workflow.addEdge("synthesizer", END);

export const graph = workflow.compile();
export type GraphType = typeof graph;
