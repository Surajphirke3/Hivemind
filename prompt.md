# prompt.md — HiveMind Protocol Build Instructions for Cursor

You are building **HiveMind Protocol**, a decentralized collective intelligence network for the Monad Blitz hackathon. Full architecture spec lives in `ARCH.md` in this repo — read it before starting any phase. This file tells you *what to build, in what order, and when to stop*.

Work through the phases below **in order**. Do not start Phase 2 work until Phase 1's "Definition of Done" is genuinely met. Do not gold-plate — this is a 4-day build, not a production system.

---

## Global Rules (apply to every phase)

1. **Stack is fixed. Do not substitute.**
   - Frontend: Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui · Zustand · TanStack Query
   - Backend: Hono mounted inside Next.js route handlers — **no standalone NestJS service, no separate backend deployment**
   - AI: LiteLLM + LangGraph · Groq (Llama 3.1 70B) for all agents except Synthesizer · GPT-4o for Synthesizer only · OpenRouter as automatic LiteLLM fallback
   - Chain: Solidity ^0.8.20 · Foundry · Viem · Wagmi · RainbowKit · Monad Testnet
   - Data: Supabase (Postgres + Auth via SIWE + Storage) — **no Prisma, no separate ORM**
   - Infra: Bun (package manager/runtime) · Biome (lint/format) · Upstash Redis (rate limit + pub/sub) · Vercel deploy
   - Real-time: SSE only. **Do not implement WebSockets.**

2. **Validate everything entering the AI layer.** Every user-submitted field (title, problem statement, goal) goes through a Zod schema before it touches LiteLLM. This is the project's primary prompt-injection defense — treat it as non-optional in every phase, not a Phase 4 hardening task.

3. **No API keys in client code.** All LLM and chain-write calls happen server-side (Hono route handlers / Server Actions only). If you find yourself importing an LLM SDK in a Client Component, stop and move that call server-side.

4. **Keep gas-relevant data off-chain.** Smart contracts only ever store hashes, scores, addresses, and timestamps. If a function parameter looks like it could hold raw agent text, that's a bug — hash it and store the hash.

5. **Follow the folder structures in `ARCH.md` §7 and §9 exactly.** Don't invent new top-level folders without a reason you'd defend to a reviewer.

6. **Commit at the end of each phase**, tagged `phase-1`, `phase-2`, `phase-3`, `phase-4`, so there's always a working rollback point before a demo.

---

## Phase 1 — Foundation (Day 1)

**Goal:** every layer exists and talks to its neighbor with placeholder/stub data. Nothing intelligent happens yet — that's Phase 2.

### Tasks

1. **Repo scaffold**
   - `bun create next-app` with TypeScript, Tailwind, App Router, src directory.
   - Install and configure Biome (replace default ESLint/Prettier setup).
   - Set up `dotenv-vault` for shared secrets; create `.env.example` covering every key in the "Environment Variables" section below.

2. **Supabase setup**
   - Create the Supabase project. Implement the schema from `ARCH.md` §10 exactly: `users`, `workspaces`, `agents`, `contributions`, `consensus`, `reports`.
   - Write the RLS policy for `workspaces` (`creator_id = auth.uid()`).
   - Wire up Supabase Auth for SIWE (you can stub the actual wallet signature flow in Phase 1 — get the session/cookie plumbing working with a mocked address first).

3. **Frontend scaffold**
   - Build the route structure from `ARCH.md` §6: `/`, `/dashboard`, `/workspace/new`, `/workspace/[id]`, `/workspace/[id]/report`.
   - Install shadcn/ui, set up the design tokens from `ARCH.md` §18 as CSS variables in `globals.css`.
   - Build static (non-functional) versions of: `WorkspaceCard`, `AgentCard`, `ConsensusMeter` — hardcoded props, no data fetching yet.

4. **Hono API skeleton**
   - Mount Hono inside `app/api/workspaces/route.ts` and `app/api/agents/run/route.ts`.
   - Implement `POST /workspaces` end-to-end: Zod validation → insert into Supabase → return `{ workspaceId }`. This is the one route that must be *fully real* by end of Phase 1, not stubbed.
   - Stub `POST /agents/run` to just log the payload and return a fake `runId` — no LangGraph yet.

5. **Monad / Foundry setup**
   - `forge init` the contracts package.
   - Get a Monad testnet wallet funded, confirm `forge create` deploys *something* (even an empty contract) to testnet successfully. This is purely a plumbing check — real contract logic is Phase 3.
   - Set up Wagmi + RainbowKit in the frontend, confirm wallet connect works end-to-end (no chain writes yet).

### Definition of Done
- [ ] `bun run dev` boots with zero errors
- [ ] Wallet connects via RainbowKit, address visible in the UI
- [ ] Submitting the workspace creation form writes a real row to Supabase and redirects to `/workspace/[id]`
- [ ] A throwaway contract deploys successfully to Monad testnet from your machine
- [ ] Biome runs clean (`bun run lint`)

---

## Phase 2 — Core Loop (Day 2)

**Goal:** the actual multi-agent reasoning loop works end-to-end with real AI output, streamed live to the UI. No blockchain writes yet — Supabase is the only system of record this phase.

### Tasks

1. **LangGraph agent graph**
   - Build the graph exactly as specified in `ARCH.md` §13: Supervisor node → 4 parallel branches (Research, Market, Risk, Technical) → Critic node → Synthesizer node.
   - One file per agent under `src/server/graph/agents/`, each with its own prompt template in `src/server/graph/prompts/`.
   - Research/Market/Risk/Technical all route through LiteLLM to Groq Llama 3.1 70B. Synthesizer is the one and only call to GPT-4o — enforce this in code, don't leave it as a config someone could accidentally widen.
   - Confirm the LiteLLM config includes OpenRouter as fallback for the Groq calls specifically (this is your demo insurance policy — test it by temporarily pointing the Groq key at something invalid and confirming it fails over).

2. **Wire `POST /agents/run` for real**
   - Replace the Phase 1 stub: validate input, kick off the LangGraph run, persist each agent's output to `contributions` as it lands (don't wait for the whole graph to finish to write the first row).

3. **SSE streaming**
   - Implement `/api/stream/[workspaceId]` per `ARCH.md` §15's event list (`agent.started`, `agent.completed`, `consensus.updated`, `report.generated`).
   - Backend publishes to an Upstash Redis channel keyed `workspace:{id}` as each LangGraph node completes; the SSE route subscribes and forwards.
   - Frontend: replace static `AgentCard`/`ConsensusMeter` with SSE-driven versions. Use `useOptimistic` for the instant "queued → running" status flip described in `ARCH.md` §6, and push incoming SSE events directly into the TanStack Query cache rather than re-fetching.

4. **Critic + consensus scoring**
   - Critic agent output must reference specific claims from the other four agents (per `ARCH.md` §12's prompt strategy) — verify this isn't producing generic "looks good" output before moving on.
   - Compute and store per-contribution consensus scores in the `consensus` table.

5. **Report generation**
   - Synthesizer output populates the `reports` table (executive summary, key findings, risks, recommendations).
   - Build the real `/workspace/[id]/report` page against this data.

### Definition of Done
- [ ] Submitting a problem statement with all 4 agents selected produces 4 real, distinct LLM outputs — not 4 copies of the same response
- [ ] The activity feed updates live via SSE as each agent completes, with no manual refresh
- [ ] Critic agent output names specific claims it's challenging
- [ ] A finalized report renders on `/workspace/[id]/report` with real synthesized content
- [ ] Full run (4 parallel agents → critic → synthesizer) completes in well under 60 seconds
- [ ] Killing the Groq key mid-run causes LiteLLM to fail over to OpenRouter without the run dying

---

## Phase 3 — Monad Integration + Polish (Day 3)

**Goal:** every contribution and finalized report is independently verifiable on-chain. UI feels finished, not functional-but-ugly.

### Tasks

1. **Smart contracts**
   - Implement and deploy the three contracts from `ARCH.md` §11: `WorkspaceRegistry`, `ContributionRegistry`, `ConsensusRegistry`.
   - Write Foundry tests for each — at minimum: workspace creation, contribution logging, the `onlyOwner` restriction on `finalizeWorkspace`, and consensus recording.
   - Deploy to Monad testnet, save addresses to `src/server/contracts/addresses.ts`.

2. **Chain service**
   - Build `chain.service.ts`: on workspace creation → `WorkspaceCreated` write; on each contribution landing → `logContribution` write (hash the `contributions.content` jsonb, don't write it raw); on synthesis completion → `finalizeWorkspace` + `recordConsensus`.
   - Confirm the hash written on-chain matches a hash you can recompute from the Supabase row — this is what the demo's "verify on-chain" moment depends on.

3. **Auth, for real this time**
   - Replace the Phase 1 mocked SIWE flow with the real signature challenge/response via RainbowKit + Supabase Auth.
   - Confirm RLS actually blocks a second wallet from reading a workspace it didn't create.

4. **Rate limiting**
   - Implement the Upstash-backed limiter: max 5 workspace creations/hour/wallet, per `ARCH.md` §19. Return a clear `429` with retry-after info, surfaced in the UI rather than a silent failure.

5. **UI polish pass**
   - Implement the micro-interactions table from `ARCH.md` §17 (agent card entrance, thinking pulse, consensus fill animation, report crossfade). Use Framer Motion only for these — resist the urge to add it elsewhere.
   - Build the on-chain verification badge on the report page — clicking it should link to the actual Monad testnet transaction.
   - Pass over empty states, loading skeletons, and error states for every screen in `ARCH.md` §16 — these are usually what's missing right before a demo and it shows.

### Definition of Done
- [ ] A finalized workspace has a real, inspectable transaction on Monad testnet
- [ ] The hash in that transaction matches a hash recomputed from the Supabase content
- [ ] A second wallet cannot read a workspace it didn't create
- [ ] Hitting the rate limit shows a real UI message, not a console error
- [ ] All animations from §17 are implemented and tied to real events, not fixed timers
- [ ] No screen has an unstyled loading or empty state

---

## Phase 4 — Demo Prep (Day 4)

**Goal:** the thing survives being shown to judges, including if Wi-Fi or an API has a bad moment.

### Tasks

1. **Security hardening pass**
   - Re-check every route against `ARCH.md` §19's table — confirm no LLM/chain keys are reachable from client bundles (`bun run build` + grep the output for your API key prefixes as a sanity check).
   - Confirm Zod validation actually rejects malformed/oversized problem statements rather than just trimming them.

2. **Vercel deployment**
   - Deploy the Next.js app (which includes the Hono API — single deployment target). Set all env vars in Vercel, not just locally.
   - Confirm the deployed version's wallet connect, agent run, and on-chain verification all work from a fresh browser session — not just `localhost`.

3. **Demo scenario, scripted and rehearsed**
   - Use the exact script in `ARCH.md` §23. Pick (and pre-test) the actual problem statement you'll submit live — don't improvise it during the demo.
   - Time a full run-through at least twice. If it's not reliably under 60 seconds for the agent loop, trim scope (drop to 3 agents) rather than risk a live timeout.

4. **Backup plan**
   - Record a full screen capture of one complete successful run, start to finish, including the on-chain verification click-through. Have it ready to play if live demo or network fails.
   - Pre-fund a second testnet wallet as backup in case the primary runs low on gas mid-demo.

### Definition of Done
- [ ] Deployed Vercel URL works end-to-end from a cold browser with no dev tools open
- [ ] Demo script rehearsed twice, both times under the 3-minute target
- [ ] Backup recording exists and has been played back to confirm it actually captured audio/video correctly
- [ ] Backup wallet funded and addresses double-checked against `addresses.ts`

---

## Environment Variables Reference

```
# AI
GROQ_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
LITELLM_CONFIG_PATH=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Chain
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=
DEPLOYER_PRIVATE_KEY=
NEXT_PUBLIC_WORKSPACE_REGISTRY_ADDRESS=
NEXT_PUBLIC_CONTRIBUTION_REGISTRY_ADDRESS=
NEXT_PUBLIC_CONSENSUS_REGISTRY_ADDRESS=

# WalletConnect (for RainbowKit)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

`SUPABASE_SERVICE_ROLE_KEY` and `DEPLOYER_PRIVATE_KEY` must never appear in any file under `app/` that isn't a route handler, and never in anything prefixed `NEXT_PUBLIC_`.

---

## Things Not to Build

To keep this honest about hackathon scope, explicitly **do not** implement unless a judge specifically asks and you have spare time on Day 4:
- BullMQ / persistent job retries
- IPFS/Pinata storage (Supabase Storage is sufficient for MVP)
- Tokenomics, payments, or DAO governance
- Cross-chain support
- Agent marketplace or reputation system (these are `ARCH.md` §24 future vision, not MVP scope)