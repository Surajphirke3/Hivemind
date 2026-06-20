# Contributing to HiveMind Protocol

Thanks for your interest in contributing to HiveMind! Whether you're fixing a typo, reporting a bug, or building a new feature, this guide will help you get started quickly.

---

## Table of Contents

- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style and Linting](#code-style-and-linting)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Branch Naming](#branch-naming)
- [Versioning](#versioning)
- [Getting Help](#getting-help)

---

## Reporting Bugs

Found something broken? Open a [GitHub Issue](../../issues/new) with the **Bug Report** template (or create one manually) and include:

1. **What you expected to happen** — describe the intended behavior
2. **What actually happened** — include error messages, screenshots, or screen recordings if possible
3. **Steps to reproduce** — be specific enough that someone else can follow them
4. **Environment details** — OS, browser, Node/Bun version, wallet provider
5. **Relevant logs** — browser console output, terminal output, or network tab screenshots

**Before filing**, search existing issues to check if someone has already reported it. If they have, add a 👍 reaction and any additional context in a comment rather than opening a duplicate.

---

## Suggesting Features

Have an idea that would make HiveMind better? Open a [GitHub Issue](../../issues/new) with the **Feature Request** template and include:

1. **The problem you're trying to solve** — what's frustrating or missing today?
2. **Your proposed solution** — how do you think it should work?
3. **Alternatives you've considered** — what other approaches did you think about?
4. **Who benefits** — which user persona (see [arch.md](arch.md) §3) does this help most?

Keep in mind that HiveMind is currently scoped for a hackathon MVP. Features listed in [arch.md](arch.md) §24 (agent marketplace, reputation system, DAO governance) are explicitly future scope — we welcome discussion about them, but implementation PRs for those areas will likely be deferred.

---

## Development Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Bun](https://bun.sh/) | Latest | Package manager and runtime |
| [Node.js](https://nodejs.org/) | 20+ | Required by some dependencies |
| [Foundry](https://book.getfoundry.sh/) | Latest | Smart contract development (optional for frontend work) |
| [Git](https://git-scm.com/) | 2.30+ | Version control |

### 1. Fork and clone

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/hivemind.git
cd hivemind
```

### 2. Install dependencies

```bash
cd frontend
bun install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in the required values. See the [README](README.md#environment-variables) for a full list of environment variables and what each one does. At minimum, you'll need:

- Supabase URL and anon key
- WalletConnect project ID
- For AI features: Groq API key

### 4. Set up the database

Run the migration in `supabase/migrations/001_schema.sql` against your Supabase project.

### 5. Start the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the landing page and be able to connect a wallet.

### 6. Smart contracts (optional)

If you're working on the blockchain layer:

```bash
cd contracts
forge build
forge test
```

---

## Making Changes

### Before you start coding

1. **Check for existing issues or PRs** that cover the same change — avoid duplicate work.
2. **Open an issue first** for non-trivial changes. This gives maintainers a chance to weigh in on the approach before you invest time in implementation.
3. **Read the architecture spec.** [arch.md](arch.md) documents the design decisions and folder structure. Changes that conflict with the architecture should be discussed in an issue first.

### While you're coding

- **Follow the folder structure** defined in [arch.md](arch.md) §7 (frontend) and §9 (backend). Don't create new top-level folders without discussion.
- **Keep API keys server-side.** All LLM and chain-write calls happen in Hono route handlers or Server Actions — never in Client Components.
- **Validate inputs with Zod.** Any data entering the AI layer must pass through a Zod schema first.
- **Only hashes go on-chain.** Smart contracts store hashes, scores, addresses, and timestamps — never raw text content.

---

## Submitting a Pull Request

### 1. Create a feature branch

Branch from `main` using the naming convention below:

```bash
git checkout -b feat/agent-card-animations
```

### 2. Make your changes

Keep your PR focused on a single concern. If you find an unrelated bug while working, open a separate issue and PR for it.

### 3. Run checks locally

```bash
# From the frontend/ directory
bun run lint        # Biome linter — must pass with zero errors
bun run build       # Ensure the production build succeeds
```

For contract changes:

```bash
# From the contracts/ directory
forge test          # All Foundry tests must pass
forge build         # Must compile cleanly
```

### 4. Write a clear PR description

Use this template:

```markdown
## What

Brief description of what this PR does.

## Why

The problem this solves or the feature it adds. Link to the relevant issue: Closes #123

## How

Technical approach — what you changed and why you made those choices.

## Testing

How you verified this works:
- [ ] Manual testing steps you performed
- [ ] New or updated tests
- [ ] Screenshots/recordings for UI changes

## Checklist

- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds
- [ ] No API keys or secrets in client-side code
- [ ] New Zod schemas added for any new user inputs
- [ ] Existing tests still pass
```

### 5. Push and open the PR

```bash
git push origin feat/agent-card-animations
```

Open a pull request against `main` on GitHub. A maintainer will review it — expect feedback within a few days.

### 6. Respond to review feedback

- Address all review comments before requesting re-review
- Use "Resolve conversation" on GitHub once you've addressed each point
- If you disagree with feedback, explain your reasoning — healthy technical debate is welcome

---

## Code Style and Linting

HiveMind uses **[Biome](https://biomejs.dev/)** for both linting and formatting. The config lives in [biome.json](frontend/biome.json).

```bash
# Check for issues
bun run lint

# Auto-fix what can be fixed
bun run lint:fix

# Format code
bun run format
```

**Key style rules:**

- TypeScript strict mode is enabled — don't use `any` unless absolutely necessary, and leave a comment explaining why
- Use named exports, not default exports (except for Next.js pages/layouts where default export is required)
- Server-only code goes in `src/server/` or route handlers — never import server modules from Client Components
- Prefer `const` declarations over `let` unless reassignment is genuinely needed

---

## Testing

### Frontend

At this stage (hackathon MVP), there isn't a full test suite in place. If you're adding tests, we recommend:

- **Unit tests** for utility functions in `src/lib/` using Bun's built-in test runner
- **Integration tests** for Hono API routes

### Smart Contracts

Foundry tests are expected for all contract changes:

```bash
cd contracts
forge test -vv    # verbose output for debugging
```

At minimum, test:
- Happy path behavior
- Access control (`onlyOwner` modifiers)
- Edge cases (empty inputs, duplicate calls)

### Manual Testing Checklist

For UI changes, verify:

- [ ] The page works on a fresh load (no stale state)
- [ ] Wallet connect/disconnect works correctly
- [ ] The change looks correct on both desktop and mobile viewports
- [ ] Loading, empty, and error states are handled
- [ ] SSE streaming still works if your change touches the workspace or agent flow

---

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) to keep the history readable and to support future automated changelog generation.

### Format

```
type(scope): short description

Optional longer body explaining the "why" behind the change.

Closes #123
```

### Types

| Type | When to Use |
|---|---|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `docs` | Documentation-only changes |
| `style` | Formatting, missing semicolons, etc. — no logic change |
| `refactor` | Code restructuring that doesn't add features or fix bugs |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependency updates |
| `perf` | Performance improvements |

### Scopes

Use the area of the codebase you're changing:

| Scope | Area |
|---|---|
| `ui` | Frontend components and pages |
| `api` | Hono route handlers |
| `agents` | LangGraph agent logic or prompts |
| `contracts` | Solidity smart contracts |
| `db` | Supabase schema or migrations |
| `auth` | SIWE / wallet authentication |
| `infra` | Deployment, CI/CD, tooling |

### Examples

```
feat(agents): add retry logic for Groq rate limit fallback
fix(ui): prevent consensus meter from overflowing at 100%
docs: add CONTRIBUTING.md with development setup guide
refactor(api): extract workspace validation into shared schema
chore(infra): update Biome to v2.5
```

---

## Branch Naming

Use this pattern: `type/short-description`

| Pattern | Example |
|---|---|
| `feat/description` | `feat/agent-card-animations` |
| `fix/description` | `fix/sse-reconnect-on-drop` |
| `docs/description` | `docs/update-env-variables` |
| `refactor/description` | `refactor/extract-chain-service` |
| `chore/description` | `chore/upgrade-langraph` |

Keep branch names lowercase, use hyphens to separate words, and keep them short but descriptive.

---

## Versioning

HiveMind follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes to the API, database schema, or smart contract interfaces
- **MINOR** (1.0.0 → 1.1.0): New features that are backward-compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes and minor improvements

During the hackathon phase, the project is at `0.x.x` — expect breaking changes between minor versions.

---

## Getting Help

- **Architecture questions?** Read [arch.md](arch.md) first — it covers design decisions and trade-offs in detail.
- **Build order questions?** See [prompt.md](prompt.md) for the phased implementation plan.
- **Stuck on setup?** Open an issue tagged `help wanted` and describe what you've tried.
- **General discussion?** Use [GitHub Discussions](../../discussions) for open-ended questions or ideas.

---

## Recognition

All contributors are recognized in the project. Meaningful contributions (features, bug fixes, documentation improvements) will be acknowledged in release notes.

---

*Thank you for helping build the future of collective AI intelligence. Every contribution — from fixing a typo to implementing a new agent — makes HiveMind better for everyone.* 🐝
