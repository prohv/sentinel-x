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
| **State** | TanStack React Query |
| **Validation** | Zod v4 |
| **Markdown** | Marked v18 |
| **Icons** | Lucide React |
| **Charts** | Recharts v3 |
| **Git Ops** | simple-git |
| **Fonts** | Epilogue, Manrope, Fira Code (Google Fonts) |
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

### Landing Page
- **Polished public-facing site** with hero section, feature highlights, and navigation
- **Docs & Changelog pages** — built-in documentation viewer and release history
- **Responsive design** — mobile-first layout with smooth transitions

### Scanner Dashboard
- **Dashboard UI** — polished security scanning dashboard with:
  - Topbar with repo context, search bar, and "New Scan" trigger
  - Vitals cards (active threats, security score, resolved secrets)
  - Rules Distribution chart (Recharts donut breakdown by secret type)
  - Findings Stream table (scrollable feed with severity badges)
  - Sidebar with scan history timeline and quick actions
  - Taint Tree visualizer — AST propagation flow from secret source to sink
- **Remediation Hub** — Intelligent Detail Dialog featuring:
  - Exact file path resolution (VCS vs Ghost vs Phantom)
  - Commit author/hash context with live code snippet evidence
  - Interactive False Positive and Shielding workflows
- **Secure Vault Engine** — Industry-standard structural isolation:
  - **AES-256-GCM** authenticated encryption for shielded artifacts
  - Cryptographic decoupling from the local repository state
- **Git History Purge** — 6-step pipeline (backup → fast-export redact → fast-import → gc → verify → audit)
- **Real-time Synchronization** — Unified dashboard metrics with automatic TanStack cache invalidation
- **Compliance Reporting** — Instant CSV export utility for all discovered and processed findings

### Scanner Engines
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

### Security & Core
- **Pattern library** — shared rules for GitHub tokens, Stripe keys, AWS keys, private keys, passwords, connection strings, and generic API keys
- **SQLite via Drizzle** — WAL mode, foreign keys, local-only database
- **Git History Purge** — `fast-export` → Bun-native redaction → `fast-import` pipeline with forensic verification

### Developer Experience
- **Type-safe** — full TypeScript with Zod validation and shared types
- **Pre-commit guard** — Husky + lint-staged hooks
- **Database utilities** — `db:reset` script and `scripts/reset-db.ts` for rapid re-initialization

---

## Planned Features

| Phase | Feature | Description |
|---|---|---|
| **Phase 4** | Entropy Threshold Tuning | Per-rule entropy thresholds with auto-calibration |
| **Phase 4** | Custom Rule Engine | User-defined regex patterns via UI |
| **Phase 5** | PDF Generation | Formal PDF security audit reports |
| **Phase 5** | CI/CD Integration | GitHub Actions & GitLab CI pipeline scanning |
| **Phase 6** | Multi-Repo Support | Scan multiple repositories from single dashboard |


---

## Project Structure

```
src/
├── app/                           # Next.js routes & server actions
│   ├── actions/                   # Server action handlers
│   │   ├── start-scan.actions.ts  # Trigger new scans
│   │   ├── scan-status.actions.ts # Poll scan status
│   │   ├── scan-directories.actions.ts # Directory scanning
│   │   ├── get-findings.actions.ts# Fetch findings
│   │   ├── dashboard-stats.actions.ts # Dashboard metrics
│   │   └── scan-types.ts          # Shared scan type definitions
│   ├── api/                       # API routes
│   ├── dashboard/                 # Scanner dashboard pages
│   │   ├── page.tsx               # Main dashboard view
│   │   ├── forensics/             # Forensics detail page
│   │   ├── taint-tree/            # Taint tree visualization
│   │   └── scan-log/              # Scan history page
│   ├── docs/                      # Documentation viewer
│   ├── changelog/                 # Changelog display page
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
│
├── components/                    # UI components
│   ├── dashboard/                 # Dashboard-specific components
│   │   ├── Topbar.tsx             # Repo context, search, Shield All
│   │   ├── DashboardVitals.tsx    # Stat cards
│   │   ├── RulesDistribution.tsx  # Recharts donut chart
│   │   ├── FindingsStream.tsx     # Findings table
│   │   └── SidebarLog.tsx         # Scan history sidebar
│   └── landing/                   # Landing page components
│       ├── HeroSection.tsx        # Hero area
│       ├── HeroVisual.tsx         # Hero visual element
│       ├── LandingNav.tsx         # Navigation bar
│       ├── FeaturesStrip.tsx      # Feature highlights
│       └── LandingFooter.tsx      # Page footer
│
├── hooks/                         # TanStack Query & scanner hooks
│   ├── scan-provider.tsx          # React context for scan state
│   ├── use-start-scan.ts          # Start scan hook
│   ├── use-scan-status.ts         # Scan status polling hook
│   ├── use-findings.ts            # Fetch findings hook
│   ├── use-dashboard-stats.ts     # Dashboard metrics hook
│   └── use-scan-directories.ts    # Directory scanning hook
│
├── lib/
│   ├── db/                        # Drizzle schema & SQLite client
│   │   ├── index.ts               # DB connection (WAL mode, FK)
│   │   └── schema.ts              # Schema: scans, findings, secrets_registry, purge_log
│   ├── scanner/                   # Scanner engines
│   │   ├── ghost-hunter.ts        # Filesystem secret scanner
│   │   ├── git-scanner.ts         # Git history scanner
│   │   └── patterns.ts            # Shared pattern rules (7 types)
│   └── vault/                     # Secure Vault Engine
│       └── crypto.ts              # AES-256-GCM encryption utilities
│
├── types/
│   └── scanner.ts                 # Shared type definitions
│
├── scripts/                       # Utility scripts
│   ├── chaos-generator.sh         # Attack simulator (test repo generator)
│   └── reset-db.ts                # Database reset utility
│
├── drizzle.config.ts              # Drizzle migration settings
└── .env                           # Local-only configuration
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for all releases and changes.

---

*Built with the mindset: "Your secrets shouldn't leave your machine."*
