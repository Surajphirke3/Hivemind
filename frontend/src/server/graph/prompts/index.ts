import { z } from "zod";

// --- Output Schemas ---

export const ResearchOutputSchema = z.object({
  summary: z.string().describe("Concise 1-2 sentence summary of findings."),
  findings: z
    .array(z.string())
    .describe("Factual claims grounded in source materials."),
  sources: z
    .array(z.string())
    .describe("List of publications, websites, or datasets cited."),
});

export const MarketOutputSchema = z.object({
  summary: z
    .string()
    .describe("Concise 1-2 sentence summary of market potential."),
  marketSizeEstimate: z
    .string()
    .describe("Market size estimate, target audience, or TAM/SAM/SOM details."),
  competitors: z
    .array(z.string())
    .describe("Main competitors and their strengths/weaknesses."),
  positioningNotes: z
    .string()
    .describe("Strategic differentiation tips for the workspace goal."),
});

export const RiskOutputSchema = z.object({
  summary: z
    .string()
    .describe("Concise 1-2 sentence summary of primary risks."),
  risks: z
    .array(
      z.object({
        risk: z.string().describe("The description of the risk."),
        severity: z.enum(["low", "medium", "high", "critical"]),
        mitigation: z.string().describe("Suggested mitigation strategy."),
      }),
    )
    .describe("List of failure modes, regulatory, or technical risks."),
});

export const TechnicalOutputSchema = z.object({
  summary: z.string().describe("Concise 1-2 sentence summary of feasibility."),
  verdict: z
    .enum(["feasible", "challenging", "unfeasible"])
    .describe("Overall verdict of technical feasibility."),
  challenges: z
    .array(z.string())
    .describe("Key technical hurdles to build this."),
  technicalStackRecommendations: z
    .array(z.string())
    .describe("Recommended tools, languages, and protocols."),
});

export const CriticOutputSchema = z.object({
  criticism: z.string().describe("General critique of all the outputs."),
  challenges: z
    .array(
      z.object({
        agentRole: z.enum(["research", "market", "risk", "technical"]),
        notes: z
          .string()
          .describe(
            "What is weak or unsupported in this agent's claim, and why.",
          ),
        score: z
          .number()
          .min(0)
          .max(100)
          .describe(
            "Consensus score from 0 (poor) to 100 (excellent) for this agent.",
          ),
      }),
    )
    .describe("Critique notes per agent."),
  finalScore: z
    .number()
    .min(0)
    .max(100)
    .describe("The average consensus score overall."),
});

export const SynthesizerOutputSchema = z.object({
  executiveSummary: z
    .string()
    .describe(
      "A high-quality executive summary synthesising all agent and critic findings.",
    ),
  keyFindings: z
    .array(z.string())
    .describe("Main takeaways resolving any conflicting agent reports."),
  risks: z
    .array(z.string())
    .describe("Consolidated list of critical risks and caveats."),
  recommendations: z
    .array(z.string())
    .describe("Clear, actionable next steps towards MVP."),
});

// --- System Prompts ---

export const RESEARCH_PROMPT = `You are the Research Agent. Your task is to gather factual grounding on the problem statement.
Analyze the user's problem statement and goal. Cite your sources and reasons.
Do not smooth over disagreements or hide uncertainty. If information is missing, state it clearly.
Problem Statement: {problemStatement}
Goal: {goal}`;

export const MARKET_PROMPT = `You are the Market Agent. Size the market opportunity and competitive landscape.
Utilize the problem statement and research findings (if available) to estimate TAM/SAM/SOM, identify main competitors, and write positioning/differentiation notes.
Problem Statement: {problemStatement}
Goal: {goal}
Research Findings: {researchFindings}`;

export const RISK_PROMPT = `You are the Risk Agent. Identify potential failure modes, regulatory bottlenecks, or technical pitfalls.
Be adversarial — find reasons this fails, not why it succeeds. Review the problem statement and findings from Research and Market agents (if available).
Problem Statement: {problemStatement}
Goal: {goal}
Research Findings: {researchFindings}
Market Findings: {marketFindings}`;

export const TECHNICAL_PROMPT = `You are the Technical Agent. Assess technical feasibility, system design tradeoffs, and architecture implications.
Review the problem statement, research, market, and risk findings (if available). Provide a technical feasibility verdict and suggest a concrete tech stack/MVP path.
Problem Statement: {problemStatement}
Goal: {goal}
Research Findings: {researchFindings}
Market Findings: {marketFindings}
Risk Findings: {riskFindings}`;

export const CRITIC_PROMPT = `You are the Critic Agent.
Review the outputs of all selected agents (Research, Market, Risk, and Technical).
Your job is to identify weak claims, unsupported assertions, or contradictions in their findings.
For each active agent, write critique notes and assign an honest consensus score (0-100).
Research findings: {researchFindings}
Market findings: {marketFindings}
Risk findings: {riskFindings}
Technical findings: {technicalFindings}`;

export const SYNTHESIZER_PROMPT = `You are the Synthesizer Agent.
Review all prior agent findings and the Critic's challenge notes.
Write the final synthesized report. You must resolve conflicting views (e.g. if Market is optimistic but Risk or Technical is critical, outline the compromise or the correct path).
Your report must be detailed, professional, and clear.
Research findings: {researchFindings}
Market findings: {marketFindings}
Risk findings: {riskFindings}
Technical findings: {technicalFindings}
Critic notes: {criticNotes}`;
