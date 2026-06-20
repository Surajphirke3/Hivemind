# ARCH.md — HiveMind Protocol

**Decentralized Collective Intelligence Network on Monad**

Version: 2.0 (aligned to the corrected v2.0 tech stack)
Hackathon: Monad Blitz
Audience: Founders, PMs, Designers, Frontend/Backend/AI Engineers, Smart Contract Developers, Judges

> **Stack note:** This document supersedes any earlier draft built around NestJS + Prisma + raw multi-SDK AI calls. HiveMind v2.0 runs on Hono inside Next.js route handlers, LiteLLM + LangGraph for AI orchestration, and Supabase for Postgres/Auth/Storage. See §6–§9 for the reasoning.

---

## 1. Executive Summary

HiveMind Protocol is a decentralized collective intelligence platform where multiple specialized AI agents — Research, Market, Risk, Technical, Critic, and Synthesizer — collaborate on a single problem statement instead of one model producing one answer.

**The problem it solves:** single-model AI responses hallucinate, miss perspectives, and offer no audit trail. A founder asking "is this a good market to enter" gets one opinion with no visible reasoning, no challenge, no way to verify how the conclusion was reached.

**Why it matters:** HiveMind turns AI reasoning into a visible, adversarial, multi-perspective process — agents submit findings, a Critic agent challenges them, and a Synthesizer produces a final report only after that friction. The user sees the debate, not just the answer.

**Why Monad is required:** Monad's parallel EVM execution is the only practical way to record 20+ simultaneous agent contributions as on-chain events without serializing them into a queue. HiveMind doesn't use Monad for payments — it uses it as a high-throughput, auditable coordination and provenance layer: every agent contribution is hashed and logged as a `ContributionLogged` event, every workspace finalization is a verifiable on-chain fact. That requires a chain that can absorb bursts of concurrent low-value writes cheaply, which is exactly Monad's design target.

---

## 2. Product Vision

**Mission:** Replace single-model AI answers with transparent, multi-agent collective reasoning, anchored to a verifiable coordination layer.

**Vision:** Become the default substrate for "AI committees" — any task that benefits from multiple expert perspectives debating before converging, from startup due diligence to code review to research synthesis.

**Long-term direction:** Agent marketplaces (bring your own specialized agent), reputation-weighted consensus, and eventually autonomous agent-to-agent research networks that operate without a human in the loop for routine analysis.

**Core principles:**
1. **Show the disagreement, not just the answer.** The Critic agent's pushback is a first-class UI element, not hidden reasoning.
2. **Minimal on-chain footprint, maximal on-chain trust.** Only hashes and scores go on-chain; full content lives in Supabase/IPFS, but every claim is independently verifiable against its hash.
3. **72-hour-honest engineering.** Every tool choice in this doc is justified against hackathon velocity, not theoretical production scale.
4. **No silent agents.** Every agent action streams to the UI in real time — nothing happens off-screen during a demo.

---

## 3. User Personas

### Founder
- **Goals:** Validate a startup idea fast — market size, competitive landscape, technical feasibility — without commissioning four separate consultants.
- **Pain points:** Single-AI market research is shallow and overconfident; no way to see what evidence was actually weighed.
- **Expected outcome:** A workspace that returns a Research + Market + Risk + Technical view with a Synthesizer report and a visible consensus score, in under 60 seconds.

### Developer
- **Goals:** Get an architecture or code review from multiple "expert lenses" (security, performance, maintainability) instead of one linear AI response.
- **Pain points:** Single-pass code review tools miss tradeoffs that only surface when two reviewers disagree.
- **Expected outcome:** Spawn a Technical Architect + Critic pairing on a design doc and see where they diverge.

### Researcher
- **Goals:** Cross-validate a claim or literature summary across independent reasoning paths.
- **Pain points:** Can't tell if an AI summary reflects genuine consensus or one model's confident guess.
- **Expected outcome:** Multiple agents independently reason over the same problem statement; disagreement is visible, not smoothed over.

### Student
- **Goals:** Get alternative explanations of a concept and see how different "teachers" approach the same question.
- **Pain points:** One AI explanation either clicks or doesn't, with no fallback framing.
- **Expected outcome:** A workspace with agents framed as different teaching styles, with a synthesized best explanation.

### Product Manager
- **Goals:** Stress-test a product decision (e.g., feature prioritization) against market, technical, and risk lenses before a roadmap review.
- **Pain points:** Single-AI strategy docs read confidently but don't reveal where the reasoning is weak.
- **Expected outcome:** A defensible, multi-angle brief with a traceable consensus score to bring into a planning meeting.

---

## 4. Product Workflow

```
User submits problem statement
        │
        ▼
Workspace created (Supabase row + on-chain WorkspaceCreated event)
        │
        ▼
User selects agents (Research / Market / Risk / Technical)
        │
        ▼
LangGraph Supervisor fans out to agents — all run in PARALLEL (Groq)
        │
        ▼
Each agent submits findings → streamed to UI via SSE as they land
        │
        ▼
Critic Agent reviews all four outputs, flags weak claims
        │
        ▼
Consensus score computed per contribution (0–100)
        │
        ▼
Synthesizer Agent (GPT-4o) produces final report from all inputs
        │
        ▼
Report + contribution hashes written to Monad (ContributionLogged, WorkspaceFinalized)
        │
        ▼
User views report + full reasoning timeline, independently verifiable on-chain
```

---

## 5. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────┐
│              Next.js 15 (App Router)          │
│   React 19 · TypeScript · Tailwind 4 · shadcn │
│         (Frontend + API routes, one repo)      │
└───────────────────────┬────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │     Hono API      │   edge-compatible,
              │ (Next.js route    │   zero extra server
              │   handlers)       │
              └─────────┬─────────┘
            ┌────────────┴────────────┐
            │                          │
   ┌────────▼────────┐      ┌─────────▼──────────┐
   │  AI Orchestration │      │   Monad Network    │
   │  LiteLLM +         │      │   (Testnet)         │
   │  LangGraph         │      │   Viem + Wagmi       │
   └────────┬────────┘      └─────────┬──────────┘
            │                          │
   ┌────────▼────────┐      ┌─────────▼──────────┐
   │ Upstash Redis     │      │ Foundry / Solidity   │
   │ (rate limit,       │      │ WorkspaceRegistry     │
   │  pub/sub queue)    │      │ ContributionRegistry  │
   └────────┬────────┘      │ ConsensusRegistry      │
            │                 └─────────────────────┘
   ┌────────▼────────┐
   │   Supabase        │  Postgres + Auth (SIWE) + Storage
   │   (system of      │  Row-level security on workspaces
   │    record)         │
   └────────────────────┘
```

**Layer responsibilities:**

| Layer | Responsibility |
|---|---|
| Frontend | Workspace UI, agent visualization, real-time streaming consumption |
| Hono API | Request validation (Zod), auth checks, rate limiting, orchestration trigger |
| AI Orchestration | LangGraph state machine running the agent graph via LiteLLM |
| Monad Layer | Immutable provenance: workspace + contribution + consensus events |
| Supabase | System of record for full content, RLS-gated by creator wallet |
| Upstash Redis | Rate limiting per wallet, pub/sub for SSE fan-out |

---

## 6. Frontend Architecture

**Stack:** Next.js 15 App Router · React 19 · TypeScript 5.5+ (strict) · Tailwind CSS 4 · shadcn/ui · Zustand · TanStack Query · Framer Motion (used sparingly — agent card entrance + consensus animation only).

**Routing structure (App Router):**

```
/                       → Landing page
/dashboard              → User's workspace list
/workspace/new          → Workspace creation form
/workspace/[id]         → Live agent activity view (SSE-driven)
/workspace/[id]/report  → Final synthesized report
/api/workspaces         → Hono route handler (CRUD)
/api/agents/run         → Hono route handler (triggers LangGraph)
/api/stream/[id]        → SSE route handler (agent output streaming)
```

**Component architecture:** Server Components by default for static/initial-load content (workspace metadata, report shell). Client Components are reserved for anything stateful or streaming — agent cards, consensus meter, live activity feed. This keeps the initial payload small and pushes the interactive surface to exactly where it's needed.

**State management split:**
- **Zustand** — workspace UI state (selected agents, active tab, optimistic agent statuses). Lightweight, no provider boilerplate.
- **TanStack Query** — server state: workspace list, contribution history, polling fallback if SSE drops. Query keys namespaced by `workspaceId`.
- **`useOptimistic`** — instant agent-card status flips ("queued" → "running") before the server confirms, so the UI never feels like it's waiting on the network.

**Data fetching strategy:** Initial workspace data fetched server-side in the Server Component (no client waterfall). Live updates arrive via SSE (`/api/stream/[workspaceId]`), which TanStack Query's cache is updated from directly (`queryClient.setQueryData`) rather than re-fetching — this avoids a polling loop competing with the stream.

**Caching strategy:** TanStack Query `staleTime` set high (5 min) for finalized workspaces (immutable once on-chain), and `staleTime: 0` for active/in-progress workspaces so SSE pushes are trusted as source of truth.

---

## 7. Frontend Folder Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (marketing)/page.tsx          # Landing page
│   │   ├── dashboard/page.tsx
│   │   ├── workspace/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Live agent view
│   │   │       └── report/page.tsx
│   │   └── api/
│   │       ├── workspaces/route.ts       # Hono handler
│   │       ├── agents/run/route.ts       # Hono handler
│   │       └── stream/[id]/route.ts      # SSE handler
│   ├── components/
│   │   ├── ui/                           # shadcn primitives — do not hand-edit generated parts
│   │   └── agent-card, consensus-meter, workspace-form, etc.
│   ├── features/
│   │   ├── workspace/                    # workspace-specific components + hooks, colocated
│   │   ├── agents/
│   │   └── reports/
│   ├── lib/
│   │   ├── litellm.ts                    # AI client wrapper
│   │   ├── viem.ts                       # chain client config
│   │   ├── supabase.ts                   # Supabase client (server + browser variants)
│   │   └── zod-schemas.ts                # shared validation schemas
│   ├── hooks/                            # use-agent-stream, use-workspace, etc.
│   ├── store/                            # Zustand stores, one file per domain slice
│   ├── providers/                        # QueryClientProvider, WagmiProvider, RainbowKitProvider
│   ├── types/                            # shared TS types, mirrors Supabase schema
│   └── actions/                          # Next.js Server Actions for mutations
```

| Folder | Purpose | Rule |
|---|---|---|
| `app/` | Routes only | No business logic — delegate to `features/` and `lib/` |
| `components/ui` | shadcn-generated primitives | Never hand-edit generated internals; wrap instead |
| `features/` | Domain-colocated components/hooks/types | One feature folder per bounded concept (workspace, agents, reports) |
| `lib/` | Framework-agnostic clients and utilities | No React imports here |
| `store/` | Zustand slices | One slice per domain, no cross-slice coupling |
| `actions/` | Server Actions | Only for mutations; reads go through TanStack Query + route handlers |

---

## 8. Backend Architecture

**Stack:** Hono 4.x (running inside Next.js route handlers) · Zod 3.x · Upstash Redis · LiteLLM · LangGraph 0.2.x.

There is no standalone backend service. Hono mounts directly as the handler for Next.js route files, giving Express-like routing ergonomics with zero extra deployment target — one Vercel deployment serves both UI and API.

**Why not NestJS:** decorators, modules, and DI wiring cost 4–6 hours of setup for no demo-visible value at hackathon scope. Hono gives equivalent routing ergonomics in about 20 minutes, and stays on the edge runtime Vercel already optimizes for.

**Service boundaries (logical, not physical — all run in the same Next.js deployment):**

| Boundary | Responsibility |
|---|---|
| Workspace service | Create/read workspace records, enforce RLS via Supabase auth context |
| Agent orchestration service | Triggers LangGraph graph execution, manages job lifecycle |
| Streaming service | Publishes agent events to Upstash Redis channel, SSE route subscribes |
| Chain service | Builds and submits Viem transactions for contribution/workspace events |

**Event architecture:** Agent completion publishes to an Upstash Redis pub/sub channel keyed by `workspace:{id}`. The SSE route handler subscribes to that channel and forwards events to connected clients. No WebSocket server needed.

**Queue architecture:** For MVP, agent execution is triggered synchronously per request (LangGraph handles internal parallelism across the 4 agents). BullMQ is intentionally **not** included in the base stack — only add it if agent runs need persistent retry semantics beyond the hackathon demo.

**Agent orchestration (LangGraph):** see §12–13 for the full graph definition.

---

## 9. Backend Folder Structure

```
src/server/
├── routes/
│   ├── workspaces.ts          # Hono router: create/get/list workspaces
│   ├── agents.ts               # Hono router: trigger agent runs
│   └── stream.ts                # SSE route logic
├── services/
│   ├── workspace.service.ts
│   ├── orchestration.service.ts # wraps LangGraph graph invocation
│   ├── chain.service.ts          # Viem read/write helpers
│   └── rate-limit.service.ts     # Upstash-backed limiter
├── graph/
│   ├── agents/
│   │   ├── research.agent.ts
│   │   ├── market.agent.ts
│   │   ├── risk.agent.ts
│   │   ├── technical.agent.ts
│   │   ├── critic.agent.ts
│   │   └── synthesizer.agent.ts
│   ├── supervisor.ts             # LangGraph supervisor node + edges
│   └── prompts/                  # per-agent system prompt templates
├── schemas/                      # Zod input/output schemas, one per route
├── contracts/
│   ├── abi/                      # generated ABIs from Foundry build
│   └── addresses.ts               # deployed contract addresses per network
└── types/
```

| Folder | Purpose | Rule |
|---|---|---|
| `routes/` | Hono handlers only | Validate with Zod, call a service, return — no business logic inline |
| `services/` | Business logic | Framework-agnostic, unit-testable in isolation |
| `graph/agents/` | One file per agent | Each agent owns its own prompt template and output schema |
| `schemas/` | Zod schemas | Shared between client and server for type-safe validation |
| `contracts/` | Generated artifacts | Never hand-edit ABI files — regenerate from Foundry |

---

## 10. Database Design

**Engine:** Supabase (managed Postgres), accessed via the Supabase client — no ORM layer. Row-level security enforces that a workspace's full content is only readable by its creator wallet by default.

### ER Diagram

```
users ───┐
         │ 1:N
         ▼
   workspaces ───┐
         │        │ 1:N
         │ 1:N    ▼
         ▼     contributions ───┐
      agents                    │ 1:1
                                 ▼
                            consensus
         │
         │ 1:1 (on finalize)
         ▼
       reports
```

### Tables

**users**
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| wallet_address | text, unique, indexed | SIWE identity |
| created_at | timestamptz | |

**workspaces**
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | mirrors on-chain `bytes32 id` |
| creator_id | uuid FK → users | RLS: `creator_id = auth.uid()` |
| title | text | |
| problem_statement | text | sanitized via Zod before storage |
| status | text | `pending \| running \| finalized` |
| content_hash | text, nullable | set on finalize, matches on-chain hash |
| created_at | timestamptz, indexed | |

**agents**
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK → workspaces, indexed | |
| role | text | research \| market \| risk \| technical \| critic \| synthesizer |
| status | text | queued \| running \| done \| failed |

**contributions**
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK, indexed | |
| agent_id | uuid FK | |
| content | jsonb | full structured output |
| content_hash | text, indexed | matches on-chain `Contribution.contentHash` |
| score | int | consensus score 0–100 |
| created_at | timestamptz | |

**consensus**
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK, indexed | |
| contribution_id | uuid FK | |
| critic_notes | text | |
| final_score | int | |

**reports**
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK, unique | one report per workspace |
| executive_summary | text | |
| key_findings | jsonb | |
| risks | jsonb | |
| recommendations | jsonb | |
| storage_url | text | Supabase Storage object reference |

**RLS policy sketch:**
```sql
create policy "workspaces_select_own"
on workspaces for select
using (creator_id = auth.uid());
```

---

## 11. Smart Contract Architecture

**Network:** Monad Testnet. **Tooling:** Foundry. **Language:** Solidity ^0.8.20 (custom errors for gas efficiency).

Per the v2.0 stack decision, only **hashes and metadata** ever touch the chain — full agent text lives in Supabase/IPFS. This keeps gas near-zero and avoids the block-size ceiling raw text would hit immediately.

### Contract Structure

**WorkspaceRegistry**
- **Responsibilities:** workspace lifecycle (create, finalize)
- **Storage:** `mapping(bytes32 => Workspace)`
- **Events:** `WorkspaceCreated(bytes32 indexed id, address creator)`, `WorkspaceFinalized(bytes32 indexed id, bytes32 reportHash)`
- **Functions:** `createWorkspace(bytes32 id)`, `finalizeWorkspace(bytes32 id, bytes32 reportHash)` — `onlyOwner` modifier restricts finalize to the workspace creator.

**ContributionRegistry**
- **Responsibilities:** logs each agent's contribution hash and score
- **Storage:** `mapping(bytes32 => Contribution[])`
- **Events:** `ContributionLogged(bytes32 indexed workspaceId, string agentRole, uint256 score)`
- **Functions:** `logContribution(bytes32 workspaceId, string agentRole, bytes32 contentHash, uint256 score)`

**ConsensusRegistry**
- **Responsibilities:** records the final consensus score per workspace, separate from individual contributions for clean querying
- **Storage:** `mapping(bytes32 => uint256)` workspace → final consensus score
- **Events:** `ConsensusRecorded(bytes32 indexed workspaceId, uint256 finalScore)`
- **Functions:** `recordConsensus(bytes32 workspaceId, uint256 finalScore)`

```solidity
// Solidity interface sketch — ContributionRegistry
interface IContributionRegistry {
    struct Contribution {
        bytes32 workspaceId;
        string agentRole;
        bytes32 contentHash;
        uint256 score;
        uint256 timestamp;
    }

    event ContributionLogged(bytes32 indexed workspaceId, string agentRole, uint256 score);

    function logContribution(
        bytes32 workspaceId,
        string calldata agentRole,
        bytes32 contentHash,
        uint256 score
    ) external;

    function getContributions(bytes32 workspaceId) external view returns (Contribution[] memory);
}
```

**Reentrancy:** not applicable for MVP (no ETH transfers). Add `ReentrancyGuard` only if a payments/incentive layer is added post-hackathon.

---

## 12. AI Agent Architecture

| Agent | Role | Inputs | Outputs | Prompt Strategy |
|---|---|---|---|---|
| Research | Gathers factual grounding on the problem statement | Problem statement, goal | Structured findings + sources | Instructed to cite reasoning, flag uncertainty explicitly rather than smoothing it over |
| Market | Sizes opportunity / competitive landscape | Problem statement + Research output | Market size estimate, competitor list, positioning notes | Few-shot examples of well-scoped market analyses; explicit instruction to flag when data is an estimate vs. sourced |
| Risk | Identifies failure modes, regulatory/technical risk | Problem statement + Research + Market outputs | Ranked risk list with severity | Adversarial framing — "find reasons this fails," not "validate this" |
| Technical | Assesses feasibility, architecture implications | Problem statement + prior outputs | Feasibility verdict, technical risks | Grounded in concrete tradeoffs, not generic best-practice lists |
| Critic | Reviews all four outputs for weak claims or unsupported assertions | All four agent outputs | Per-contribution challenge notes + adjusted scores | Instructed to be specific — must cite which claim it's challenging and why |
| Synthesizer | Produces the final report | All outputs + critic notes | Executive summary, key findings, risks, recommendations | One call only (cost control), explicitly told to resolve — not just restate — disagreements |

All agents run on **Groq / Llama 3.1 70B** for speed, except the Synthesizer, which uses **GPT-4o** for one final high-quality pass. **OpenRouter** is the automatic fallback if Groq rate-limits mid-demo — routed transparently by **LiteLLM** with no code change required.

---

## 13. Agent Coordination Flow

```
                     User Input
                         │
                         ▼
            LangGraph Supervisor Node
                         │
        ┌────────┬───────┴───────┬────────┐
        ▼        ▼               ▼        ▼
   Research   Market           Risk    Technical    ← all 4 run in PARALLEL
   (Groq)     (Groq)          (Groq)    (Groq)
        │        │               │        │
        └────────┴───────┬───────┴────────┘
                         ▼
                  Critic Agent (Groq)
              reviews all 4 outputs,
              flags weak/unsupported claims
                         │
                         ▼
              Consensus scores computed
              (per-contribution, 0–100)
                         │
                         ▼
              Synthesizer Agent (GPT-4o)
              — single call, resolves conflicts —
                         │
                         ▼
                   Final Report
                         │
                         ▼
              Hashes written to Monad
```

**Task distribution:** the LangGraph supervisor node fans out to the four parallel agents as independent graph branches; LangGraph's typed edges guarantee the graph can't loop indefinitely the way an undefined "agents review each other" loop could under demo pressure.

**Shared memory:** intermediate outputs are written to a shared LangGraph state object so downstream agents (Risk, Technical) can reference what Research/Market already found, rather than reasoning from scratch.

**Conflict resolution:** the Critic agent doesn't vote — it annotates. The Synthesizer is the single point that resolves conflicting claims into one final narrative, which keeps the "who's right" decision auditable to one call instead of an opaque voting average.

---

## 14. API Design

All routes are Hono handlers mounted under Next.js App Router route files. Auth via Supabase session (SIWE-issued JWT) where noted.

### Authentication
- **POST /auth/login** — SIWE challenge/response. Request: `{ address, signature }`. Response: `{ session }`. Errors: `401` invalid signature.
- **POST /auth/register** — implicit on first successful SIWE login (no separate registration form).

### Workspaces
- **GET /workspaces** — list current user's workspaces. Auth required. Response: `Workspace[]`.
- **POST /workspaces** — Request: `{ title, problemStatement, goal }` (Zod-validated, sanitized before touching AI). Response: `{ workspaceId }`. Errors: `400` validation failure, `429` rate-limited (max 5/hour/wallet).

### Agents
- **POST /agents/run** — Request: `{ workspaceId, agentTypes: string[] }`. Triggers the LangGraph supervisor. Response: `{ runId }` (stream progress via `/api/stream/[workspaceId]`). Errors: `404` workspace not found, `403` not workspace owner.

### Reports
- **GET /reports/:id** — Response: `Report` (executive summary, findings, risks, recommendations, consensus score). Errors: `404` not finalized yet.

All mutating routes validate with Zod before any AI or chain interaction — this is the primary prompt-injection defense, not an afterthought.

---

## 15. WebSocket Architecture

HiveMind uses **SSE, not WebSockets** — see §17 for rationale. Events delivered over `/api/stream/[workspaceId]`:

| Event | Payload | Trigger |
|---|---|---|
| `workspace.created` | `{ workspaceId }` | Workspace row inserted |
| `agent.started` | `{ agentId, role }` | LangGraph node begins execution |
| `agent.completed` | `{ agentId, contributionId, score }` | Agent submission stored |
| `consensus.updated` | `{ workspaceId, scores }` | Critic agent finishes review pass |
| `report.generated` | `{ workspaceId, reportId }` | Synthesizer completes |

---

## 16. UI Screens

### Landing Page
- **Purpose:** explain the multi-agent concept in one scroll, drive to wallet connect.
- **Sections:** Hero (one-line pitch + live agent-debate animation loop), Features (3-up grid: parallel reasoning / transparent consensus / on-chain provenance), How It Works (the 7-step workflow from §4, condensed visually), CTA (Connect Wallet → New Workspace).

### Dashboard
- **Purpose:** workspace list + quick-create entry point.
- **Layout:** table/card list of past workspaces with status badges (`pending`/`running`/`finalized`), sorted by recency.
- **Components:** `WorkspaceCard`, `NewWorkspaceButton`, empty state for first-time users.
- **User actions:** open a workspace, start a new one.

### Workspace Page (`/workspace/[id]`)
- **Purpose:** create or watch a workspace run live.
- **Layout:** left column problem statement + agent selector (pre-run); right column live agent activity feed (during/post-run).
- **Components:** `AgentCard` (per agent, status-driven), `ConsensusMeter`, `LiveActivityFeed` (SSE-driven).
- **User actions:** select agents, submit, watch agents stream in, drill into a single contribution.

### Agent Activity Page
- **Purpose:** deep-dive into one agent's full output and the Critic's notes on it.
- **Layout:** split view — agent's raw finding on the left, Critic's annotations inline on the right.
- **User actions:** expand sources, view consensus score breakdown.

### Report Page
- **Purpose:** the final synthesized deliverable.
- **Layout:** Executive Summary at top, then Key Findings / Risks / Recommendations as collapsible sections, with an on-chain verification badge linking to the Monad transaction.
- **User actions:** export, share link, verify on-chain.

### Profile Page
- **Purpose:** wallet identity, workspace history, usage stats.
- **Layout:** connected wallet address, total workspaces created, rate-limit status.

---

## 17. UX and Micro-Interactions

| Interaction | Behavior | Timing |
|---|---|---|
| Agent card entrance | Fade + slight upward translate as each agent is spawned | 200–250ms ease-out |
| Loading skeleton | Shimmer placeholder while initial workspace data loads server-side | n/a (replaced on hydration) |
| Agent "thinking" animation | Subtle pulsing dot sequence on the agent card while status = `running` | 1.2s loop |
| Consensus progress animation | Radial meter fills as each agent's score lands, not all at once | 400ms per increment |
| Workspace creation success | Toast + redirect to live view | 300ms toast-in, immediate redirect |
| Report generation transition | Cross-fade from activity feed to report layout, not a hard route jump | 350ms crossfade |
| Hover states (cards/buttons) | Subtle elevation/border-color shift, no scale transforms (avoid layout jitter) | 150ms |

**Why SSE-driven, not WS-driven, animations:** because events arrive as discrete server-pushed messages, every animation above is triggered by an event handler, not a polling interval — this is what keeps the "agent thinking" feel honest rather than faked with a fixed timer.

---

## 18. Design System

**Typography:** a single variable sans-serif for UI text (e.g., Inter or a comparable variable font), monospace reserved for hashes, addresses, and code/agent-output blocks — reinforces the "verifiable, technical" feel without resorting to a gimmick terminal theme everywhere.

**Color tokens (semantic, not literal hex — define via CSS variables):**
| Token | Use |
|---|---|
| `--color-bg` | App background |
| `--color-surface` | Cards, panels |
| `--color-border` | Dividers, card outlines |
| `--color-accent` | Primary CTA, active agent state |
| `--color-success` | Finalized/done states |
| `--color-warning` | Critic challenge flags |
| `--color-danger` | Failed agent runs |

**Spacing:** 4px base unit, scale `4 / 8 / 12 / 16 / 24 / 32 / 48`.

**Radius:** `--radius-sm: 6px` (inputs, badges), `--radius-md: 10px` (cards), `--radius-lg: 16px` (modals).

**Shadows:** restrained — one subtle elevation shadow for cards, a slightly stronger one for modals. Avoid heavy drop shadows; they read as dated against the terminal/technical aesthetic this product wants.

**Icons:** a single consistent icon set (e.g., Lucide, matching shadcn/ui defaults) — no mixing icon families.

---

## 19. Security Architecture

| Area | Implementation |
|---|---|
| Auth | SIWE (Sign-In With Ethereum) via Supabase Auth — no passwords |
| API key exposure | All LLM calls server-side only; keys live in Vercel env vars, never shipped to client |
| Prompt injection | Zod schema validates and sanitizes every problem statement before it touches the AI layer |
| Rate limiting | Upstash Redis limiter, max 5 workspace creations/hour/wallet |
| Smart contract access | `onlyOwner` modifier on `finalizeWorkspace` — only the creator can finalize |
| On-chain data | Hashes and scores only — no PII or raw content ever written on-chain |
| Row-level security | Supabase RLS restricts workspace reads to `creator_id = auth.uid()` by default |
| Secrets management | `dotenv-vault` for encrypted `.env` sharing across the team, nothing committed to git |

---

## 20. Performance Strategy

**Frontend:** React Server Components for static workspace metadata (no client JS cost), Suspense boundaries around the agent activity feed so the shell renders instantly while the stream connects, streaming SSR for the report page.

**Backend:** Upstash Redis absorbs rate-limit checks and pub/sub fan-out without a dedicated server; LangGraph's parallel branch execution means all four reasoning agents run concurrently against Groq rather than sequentially — this is the single biggest latency lever (4x reduction vs. sequential calls).

**Blockchain:** batch contribution logging where possible — rather than four separate `logContribution` transactions, the chain service can batch the four agent hashes from a single workspace round into fewer calls if gas/latency in testnet conditions warrants it.

---

## 21. Deployment Architecture

```
Frontend + API (Next.js + Hono)  →  Vercel (single deployment, zero-config)
Database / Auth / Storage         →  Supabase (managed)
Rate limiting / pub-sub            →  Upstash Redis (serverless)
Smart contracts                    →  Monad Testnet (deployed via Foundry)
Secrets                            →  dotenv-vault → Vercel env vars
```

Because the backend is Hono running inside Next.js route handlers, there is no separate backend deployment target — this is a deliberate simplification versus a NestJS-on-Railway split, and it's the reason a 4-day build is realistic.

---

## 22. Development Roadmap

**Day 1 — Foundation**
Supabase schema, Next.js scaffold with Tailwind + shadcn, Hono API skeleton, Monad testnet wallet + Foundry project init.

**Day 2 — Core Loop**
LangGraph agent graph (Research/Market/Risk/Technical → Critic → Synthesizer), LiteLLM + Groq integration, workspace creation → agent execution end-to-end, SSE streaming wired to the frontend.

**Day 3 — Monad Integration + Polish**
Deploy WorkspaceRegistry / ContributionRegistry / ConsensusRegistry to Monad testnet, wire Viem contribution logging, SIWE + RainbowKit auth, UI polish on agent cards and consensus visualization.

**Day 4 — Demo Prep**
Script and rehearse the demo scenario, finish rate limiting/security hardening, Vercel deploy, record a backup demo video in case of live failure.

---

## 23. Demo Script (under 3 minutes)

1. **(0:00–0:20)** Connect wallet via RainbowKit. Show the dashboard — empty state, "create your first workspace."
2. **(0:20–0:40)** Submit problem statement: *"Find the best AI startup opportunity in India."* Select all four agents.
3. **(0:40–1:30)** Live view: four agent cards spin up in parallel, status pulses to "running," findings stream in one by one via SSE — narrate that this is real-time, not a replay.
4. **(1:30–1:50)** Critic agent flags a specific claim from the Market agent — point at the annotation, this is the "why this isn't just one model talking" moment.
5. **(1:50–2:15)** Consensus meter fills, Synthesizer generates the final report — executive summary appears.
6. **(2:15–2:45)** Click the on-chain verification badge — show the Monad testnet transaction with the contribution hash, explain: *"This hash matches what you just read — Monad is the receipt, not the database."*
7. **(2:45–3:00)** Close on the value prop: *"Multiple experts, visible disagreement, verifiable provenance — coordinated by Monad."*

---

## 24. Future Vision

- **Agent marketplace:** third parties register custom agents (specialized prompts/models) that workspaces can select, with usage-based incentives.
- **Reputation-weighted consensus:** agents (and their authors) accrue an on-chain reputation score from historical consensus accuracy, weighting future scores.
- **Multi-user workspaces:** collaborative workspaces where multiple human participants can each spawn agents into the same shared memory layer.
- **Autonomous research networks:** agents that spawn follow-up workspaces on unresolved questions without a human re-triggering the loop.
- **DAO-governed intelligence network:** community governance over which agent types are "certified" for high-stakes workspace categories (e.g., financial or medical research).

---

*HiveMind Protocol — built for Monad Blitz. Architecture optimized for a 72-hour build that still demos like it has a real backend, because it does — it's just not where you'd expect.*