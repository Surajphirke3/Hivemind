# 🐝 HiveMind Protocol

**Decentralized collective intelligence — multiple AI agents debate, challenge, and synthesize answers so you don't have to trust a single model.**

---

## The Problem

When you ask one AI model a complex question, you get one opinion with no visible reasoning, no challenge, and no way to verify how the conclusion was reached. Single-model responses hallucinate, miss perspectives, and offer no audit trail.

## The Solution

HiveMind turns AI reasoning into a visible, adversarial, multi-perspective process. Six specialized AI agents — Research, Market, Risk, Technical, Critic, and Synthesizer — collaborate on your problem statement. The Critic challenges weak claims, the Synthesizer resolves disagreements, and every contribution is hashed and logged on the Monad blockchain for verifiable provenance.

You see the debate, not just the answer.

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts, optional in early phases)
- A [Supabase](https://supabase.com/) project
- A [WalletConnect](https://cloud.walletconnect.com/) project ID

### 1. Clone and install

```bash
git clone https://github.com/your-org/hivemind.git
cd hivemind/frontend
bun install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your keys — see the [Environment Variables](#environment-variables) section below for the full list.

### 3. Set up the database

Run the migration in `supabase/migrations/001_schema.sql` against your Supabase project using the SQL Editor or the Supabase CLI.

### 4. Start developing

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your wallet.

### 5. Deploy contracts (optional)

```bash
cd contracts
forge build
forge create src/HiveMindPlumbingCheck.sol:HiveMindPlumbingCheck \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Key Features

| Feature | Description |
|---|---|
| **Multi-Agent Reasoning** | Research, Market, Risk, and Technical agents analyze your problem in parallel |
| **Adversarial Review** | A dedicated Critic agent challenges weak claims with specific annotations |
| **Consensus Scoring** | Each contribution receives a 0–100 consensus score based on quality and agreement |
| **Synthesized Reports** | A Synthesizer agent resolves conflicts into one coherent, actionable report |
| **Real-Time Streaming** | Watch agents think and respond live via server-sent events (SSE) |
| **On-Chain Provenance** | Contribution hashes and consensus scores are logged on Monad for independent verification |
| **Wallet-Based Auth** | Sign-In With Ethereum (SIWE) via RainbowKit — no passwords |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, TanStack Query |
| API | Hono (mounted inside Next.js route handlers) |
| AI Orchestration | LangGraph + LiteLLM → Groq (Llama 3.1 70B) for agents, GPT-4o for Synthesizer |
| Database | Supabase (Postgres + Auth + Storage) |
| Blockchain | Solidity / Foundry, Viem, Wagmi, RainbowKit, Monad Testnet |
| Real-Time | SSE via Upstash Redis pub/sub |
| Tooling | Bun, Biome |

---

## Project Structure

```
hivemind/
├── frontend/          Next.js app (UI + Hono API — single deployment)
├── contracts/         Foundry smart contracts (Solidity)
├── supabase/          SQL migrations
├── arch.md            Full architecture specification
├── prompt.md          Phased build instructions
├── LICENSE            MIT License
├── CODE_OF_CONDUCT.md Community standards
└── CONTRIBUTING.md    How to contribute
```

---

## Available Scripts

Run these from the `frontend/` directory:

| Command | Description |
|---|---|
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run start` | Serve the production build |
| `bun run lint` | Run Biome linter checks |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run format` | Format code with Biome |

---

## Environment Variables

Create a `.env.local` file in `frontend/` with the following keys (see `.env.example` for the template):

| Variable | Scope | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Server | Groq API for agent LLM calls |
| `OPENAI_API_KEY` | Server | GPT-4o for the Synthesizer agent |
| `OPENROUTER_API_KEY` | Server | Automatic fallback if Groq rate-limits |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase admin access (never expose to client) |
| `UPSTASH_REDIS_REST_URL` | Server | Upstash Redis for rate limiting and pub/sub |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Upstash Redis auth token |
| `NEXT_PUBLIC_MONAD_TESTNET_RPC_URL` | Client | Monad testnet RPC endpoint |
| `DEPLOYER_PRIVATE_KEY` | Server | Wallet private key for contract deployment |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Client | WalletConnect project ID for RainbowKit |

> ⚠️ **Security:** `SUPABASE_SERVICE_ROLE_KEY` and `DEPLOYER_PRIVATE_KEY` must never appear in client-side code or in any variable prefixed with `NEXT_PUBLIC_`.

---

## Architecture Overview

For the full architecture specification, see [arch.md](arch.md). For phased build instructions, see [prompt.md](prompt.md).

```
User submits problem statement
        │
        ▼
Workspace created (Supabase + on-chain event)
        │
        ▼
4 agents run in PARALLEL (Research, Market, Risk, Technical)
        │
        ▼
Critic agent reviews all outputs, flags weak claims
        │
        ▼
Consensus scores computed (0–100 per contribution)
        │
        ▼
Synthesizer produces final report (GPT-4o)
        │
        ▼
Hashes written to Monad — independently verifiable
```

---

## Documentation

| Document | Description |
|---|---|
| [Architecture Spec](arch.md) | Full system design, database schema, API design, agent architecture |
| [Build Instructions](prompt.md) | Phased implementation guide (4-day hackathon plan) |
| [Contributing Guide](CONTRIBUTING.md) | How to report bugs, suggest features, and submit code |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community standards and expectations |
| [License](LICENSE) | MIT License |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built for the **Monad Blitz Hackathon**. HiveMind uses Monad's parallel EVM execution as a high-throughput, auditable coordination layer — every agent contribution is hashed and logged as an on-chain event, making AI reasoning independently verifiable.
