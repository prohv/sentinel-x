# Sentinel-X

> Local-first secret hunter and taint scanner for codebases. Finds leaked secrets, tracks misconfigurations, and keeps your repo clean — without sending a byte to the cloud.

---

## Aim & Scope

Sentinel-X scans your repository for hardcoded secrets, API keys, and configuration leaks. It runs entirely **offline** using local SQLite, so your code never leaves your machine.

Built as a Next.js dashboard with a streaming scanner engine, it's designed for developers who want real-time secret discovery without trusting a third-party SaaS.

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Runtime** | [Bun](https://bun.sh) |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **UI** | React 19 + Tailwind CSS 4 |
| **Data** | Drizzle ORM + SQLite (`bun:sqlite`) |
| **Auth** | Better-Auth (offline mode) |
| **State** | TanStack React Query |
| **Validation** | Zod v4 |
| **Icons** | Lucide React |
| **Git Ops** | simple-git |
| **Hooks** | Husky + lint-staged |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed globally
- Node.js 20+ (type definitions only)

### Setup

```bash
# 1. Install dependencies
bun install

# 2. Copy env template and fill in values
cp .example.env .env

# 3. (Optional) Initialize DB schema or Reset for Demo
bun run db:reset
```

### Run

```bash
bun dev          # dev server
bun run build    # production build
bun start        # production server
bun lint         # ESLint check
bun run db:reset # nuke and recreate current db
```

---

## Current Features

- **Dashboard UI** — polished security scanning dashboard with:
  - Topbar with repo context, search bar, and mass "Shield All" trigger
  - Vitals cards (active threats, security score, resolved secrets)
  - Rules Distribution chart (Recharts donut breakdown by secret type)
  - Findings Stream table (scrollable feed with severity badges)
  - Sidebar with scan history timeline and quick actions
- **Remediation Hub** — Intelligent Detail Dialog featuring:
  - Exact file path resolution (VCS vs Ghost vs Phantom)
  - Commit author/hash context with live code snippet evidence
  - Interactive False Positive and Shielding workflows
- **Secure Vault Engine** — Industry-standard structural isolation:
  - **AES-256-GCM** authenticated encryption for shielded artifacts
  - Cryptographic decoupling from the local repository state
- **Bulk Defenses** — "Shield All" global interaction to secure an entire codebase in one click
- **Real-time Synchronization** — Unified dashboard metrics with automatic TanStack cache invalidation
- **Compliance Reporting** — Instant CSV export utility for all discovered and processed findings
- **Chaos Generator** — standalone attack simulator (`scripts/chaos-generator.sh`) that fabricates a realistic test repo:
  - 28+ seeded secrets across `.env.local`, inline source, and config files
  - 60+ backdated commits with real app boilerplate (components, libs, API routes, tests)
  - Oops lifecycle: commit → cleanup pattern (secrets persist in git history)
  - Deep path obfuscation (3-6 levels with hidden dirs)
  - Abandoned feature branches with unmerged leaks
  - Ground-truth Oracle (`ground_truth.json`) for recall verification
- **Ghost Hunter** — async generator (`yield`-based) secret scanner with real-time streaming results
  - **Master pattern** fast-gate: skips clean lines in 1 regex call instead of N
  - **Single-pass taint check**: compiled regex replaces the per-key loop (O(n) → O(1))
  - **Shannon entropy** calculation for unknown-format secret detection
  - **`.env` taint baseline**: flags when `.env` key names appear in source files
- **Git Scanner** — 4 history scanning functions via `simple-git`:
  - `traceSecret(secret)` — Pickaxe search to track a secret's full lifecycle across commits
  - `scanRecentHistory(depth)` — Quick scan of last N commits (pre-push / quick refresh)
  - `auditFullHistory(fromCheckpoint?)` — Full history walk with incremental checkpointing
  - `huntOrphanBlobs()` — Finds secrets in deleted branches and dangling `.git/objects`
- **Drizzle Schema** — three-table foundation with referential integrity:
  - `scans` — activity log with checkpoint resume
  - `findings` — evidence vault with unique fingerprint, B-tree indexes on severity/rule/path
  - `secrets_registry` — taint baseline for `.env` key joins
- **Better-Auth** — offline email/password auth via Drizzle adapter with SQLite
- **Bootstrap Admin Setup** — `/setup` page gates on empty user table, creates first admin account
- **Pattern library** — shared rules for GitHub tokens, Stripe keys, AWS keys, private keys, passwords, connection strings, and generic API keys
- **SQLite via Drizzle** — WAL mode, foreign keys, local-only database
- **Type-safe** — full TypeScript with Zod validation and shared types
- **Pre-commit guard** — Husky + lint-staged hooks

---

## Planned Features

| Phase | Feature | Description |
|---|---|---|
| **Phase 4** | Entropy Threshold Tuning | Per-rule entropy thresholds with auto-calibration |
| **Phase 4** | Custom Rule Engine | User-defined regex patterns via UI |
| **Phase 5** | PDF Generation | Formal PDF security audit reports |


---

## Project Structure

```
src/
├── app/               # Next.js routes & server actions
├── components/        # shadcn/ui & custom Amethyst components
├── hooks/             # TanStack Query & scanner hooks
├── lib/
│   ├── auth/          # Better-Auth offline configuration
│   ├── db/            # Drizzle schema & SQLite client
│   ├── scanner/       # Ghost Hunter + Git Scanner engines
│   │   ├── ghost-hunter.ts   # Filesystem secret scanner
│   │   ├── git-scanner.ts    # Git history scanner
│   │   └── patterns.ts       # Shared pattern rules
│   └── utils/         # Crypto helpers & regex patterns
├── scripts/           # Demo repo generator (attack simulator)
├── types/
│   └── scanner.ts     # Shared type definitions
├── drizzle.config.ts  # Drizzle migration settings
└── .env               # Local-only secrets
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for all releases and changes.

---

*Built with the mindset: "Your secrets shouldn't leave your machine."*
