import { Annotation } from "@langchain/langgraph";

export interface AgentOutput {
  summary: string;
  [key: string]: any;
}

export const AgentState = Annotation.Root({
  problemStatement: Annotation<string>(),
  goal: Annotation<string>(),
  selectedAgents: Annotation<string[]>(),
  // Agent outputs
  researchOutput: Annotation<AgentOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  marketOutput: Annotation<AgentOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  riskOutput: Annotation<AgentOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  technicalOutput: Annotation<AgentOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  // Critic outputs
  criticOutput: Annotation<any | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  // Synthesizer outputs
  synthesizerOutput: Annotation<any | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  // Tracking
  workspaceId: Annotation<string>(),
  agentIds: Annotation<Record<string, string>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

export type AgentStateType = typeof AgentState.State;
