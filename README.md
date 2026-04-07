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

# 3. (Optional) Push local DB schema
bunx drizzle-kit push
```

### Run

```bash
bun dev          # dev server
bun run build    # production build
bun start        # production server
bun lint         # ESLint check
```

---

## Current Features

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
- **Pattern library** — shared rules for GitHub tokens, Stripe keys, AWS keys, private keys, passwords, connection strings, and generic API keys
- **SQLite via Drizzle** — local-only database, zero external dependencies
- **Type-safe** — full TypeScript with Zod validation and shared types
- **Pre-commit guard** — Husky + lint-staged hooks

---

## Planned Features

| Phase | Feature | Description |
|---|---|---|
| **Phase 2** | Better-Auth | Offline auth setup for dashboard access |
| **Phase 3** | shadcn/ui Dashboard | Real-time scan progress, findings table, severity chart |
| **Phase 3** | TanStack Query | Server-side caching and real-time scan state management |
| **Phase 3** | Demo Attack Simulator | Script to generate a mock vulnerable repo for live demos |
| **Phase 4** | Entropy Threshold Tuning | Per-rule entropy thresholds with auto-calibration |
| **Phase 4** | Custom Rule Engine | User-defined regex patterns via UI |
| **Phase 4** | Export Reports | JSON/PDF/Markdown report generation |


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
