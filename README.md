# Sentinel-X

> Local-first secret hunter and taint scanner for codebases. Finds leaked secrets, maps their propagation through code, and surgically rewrites git history to purge them — without sending a byte to the cloud.

---

## Aim & Scope

Sentinel-X scans your repository for hardcoded secrets, API keys, and configuration leaks. It runs entirely **offline** using local SQLite, so your code never leaves your machine.

Built as a Next.js dashboard with streaming scanner engines, an AST-based taint analyzer, and a 6-step git history purge pipeline, it's designed for developers who want real secret discovery and remediation without trusting a third-party SaaS.

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
| **AST** | TypeScript Compiler API |
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

# 3. (Optional) Reset database for a fresh demo
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

### Scanner Dashboard (`/dashboard`)
- **Topbar** — repo context selector, real-time search bar, "New Scan" trigger
- **Vitals Cards** — active threats count, security score, resolved secrets
- **Rules Distribution** — Recharts donut breakdown by secret type
- **Findings Stream** — scrollable table with severity badges and row actions
- **Sidebar Log** — scan history timeline with quick actions
- **Batch Selection** — checkbox-based multi-select mode for bulk operations

### Remediation Hub
- **Intelligent Detail Dialog** per finding:
  - Exact file path resolution (VCS vs Ghost vs Phantom)
  - Commit author/hash context with live code snippet evidence
  - False Positive and Shielding workflows
- **Forensics Page** (`/dashboard/forensics`) — deep-dive into a specific secret's git lifecycle:
  - Full commit trace via `git log -S` pickaxe
  - Author, date, and commit hash context
  - Historical timeline of when the secret appeared and was removed

### Taint Tree Analyzer (`/dashboard/taint-tree`)
- Parses source files as TypeScript AST via the TypeScript Compiler API
- Identifies the variable declaration at the finding line (source node)
- Follows variable reassignments across the file (propagation nodes)
- Detects external function calls with tainted arguments (sink nodes)
- Visualizes the full data flow: source → propagation → sink
- Supports `git:` blob paths — extracts content from commit diffs for history findings
- Playback controls to step through the taint flow interactively

### Git History Purge Pipeline
A 6-step server action pipeline that surgically removes secrets from git history:

| Step | Action | What It Does |
|---|---|---|
| 1 | `purgeStepPreFlight` | Validates repo, checks clean working tree, extracts secret |
| 2 | `purgeStepBackup` | Creates `.git` shadow backup (platform-aware: `xcopy` on Win, `cp` on Unix) |
| 3 | `purgeStepSurgery` | `fast-export` → Bun-native buffer redaction → `fast-import` (zero subprocess calls) |
| 4 | `purgeStepIncinerate` | Expires reflog, runs `git gc --prune=now` to permanently delete old objects |
| 5 | `purgeStepVerify` | Full history scan confirms secret is absent from all reachable commits |
| 6 | `purgeStepAudit` | Logs to `purge_log` table, marks finding as PURGED, cleans up backup |

- **Batch Purge** (`/dashboard/report`) — multi-select multiple findings and purge them in sequence with retry logic for Windows file-lock issues

### Reporting (`/dashboard/report`)
- Business-readable compliance report translating technical rule names into security impact labels
- Severity-weighted pie chart breakdown
- Printable layout for audit handoffs
- Executive summary with affected systems, secret types, and risk categorization

### Secure Vault Engine
- **AES-256-GCM** authenticated encryption for shielded artifacts
- Cryptographic decoupling from the local repository state
- Salt-based key derivation via `VAULT_SALT` env variable

### Compliance Export
- **CSV Export** — one-click download of all findings for auditing
- **Report Page** — formatted summary with business-impact mapping

### Scanner Engines
- **Ghost Hunter** — async generator (`yield`-based) filesystem scanner:
  - **Master pattern** fast-gate: skips clean lines in 1 regex call
  - **Single-pass taint check**: compiled regex replaces per-key loop (O(n) → O(1))
  - **Shannon entropy** calculation for unknown-format secret detection
  - **`.env` taint baseline**: flags when `.env` key names appear in source files
- **Git Scanner** — 4 history scanning functions via `simple-git`:
  - `traceSecret(secret)` — Pickaxe search tracking a secret's full lifecycle
  - `scanRecentHistory(depth)` — Quick scan of last N commits (pre-push check)
  - `auditFullHistory(fromCheckpoint?)` — Full history walk with incremental checkpointing
  - `huntOrphanBlobs()` — Finds secrets in deleted branches and dangling `.git/objects`
- **Chaos Generator** (`scripts/chaos-generator.sh`) — attack simulator that fabricates a realistic test repo:
  - 28+ seeded secrets across `.env.local`, inline source, and config files
  - 60+ backdated commits with real app boilerplate
  - Deep path obfuscation (3-6 levels with hidden dirs)
  - Abandoned feature branches with unmerged leaks
  - Ground-truth Oracle (`ground_truth.json`) for recall verification

### Core Infrastructure
- **Pattern library** — 7 built-in detection rules: GitHub tokens, Stripe keys, AWS keys, private keys, passwords, connection strings, generic API keys
- **SQLite via Drizzle** — WAL mode, foreign keys, B-tree indexes on severity/rule/path
- **Type-safe** — full TypeScript with Zod validation and shared types
- **Pre-commit guard** — Husky + lint-staged hooks
- **Database utilities** — `db:reset` script and `scripts/reset-db.ts`

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

## Routes

| Route | Description |
|---|---|
| `/` | Landing page with hero, features, navigation |
| `/dashboard` | Main scanner dashboard with vitals, charts, findings feed |
| `/dashboard/forensics?id=N` | Deep-dive into a specific finding's git history |
| `/dashboard/report` | Compliance report with business-impact translation |
| `/dashboard/taint-tree?id=N` | AST-based taint propagation visualizer |
| `/docs` | Built-in documentation viewer |
| `/changelog` | Interactive release history |
| `/api/changelog` | API endpoint serving changelog data |
| `/api/readme` | API endpoint serving README content |

---

## Project Structure

```
src/
├── app/
│   ├── actions/                          # Server actions
│   │   ├── dashboard-stats.actions.ts    # Aggregated dashboard metrics
│   │   ├── forensics.actions.ts          # Git pickaxe trace for forensics
│   │   ├── get-findings.actions.ts       # Fetch & filter findings
│   │   ├── purge-secret.actions.ts       # 6-step git history purge pipeline
│   │   ├── scan-directories.actions.ts   # Directory discovery
│   │   ├── scan-status.actions.ts        # Poll active scan progress
│   │   ├── scan-types.ts                 # Shared scan type definitions
│   │   └── start-scan.actions.ts         # Trigger new scan
│   ├── api/
│   │   ├── changelog/route.ts            # Serves changelog JSON
│   │   └── readme/route.ts               # Serves README markdown
│   ├── dashboard/
│   │   ├── forensics/page.tsx            # Forensics deep-dive page
│   │   ├── report/page.tsx               # Compliance report page
│   │   ├── taint-tree/page.tsx           # Taint propagation visualizer
│   │   └── page.tsx                      # Main dashboard
│   ├── changelog/page.tsx                # Changelog display
│   ├── docs/page.tsx                     # Documentation viewer
│   ├── layout.tsx                        # Root layout with font setup
│   ├── page.tsx                          # Landing page
│   └── globals.css                       # Global styles & gradients
│
├── components/
│   ├── dashboard/
│   │   ├── BatchPurgeContext.tsx         # React context for multi-select purge
│   │   ├── BatchPurgeModal.tsx           # Batch purge workflow modal
│   │   ├── DashboardVitals.tsx           # Top-level stat cards
│   │   ├── FindingsStream.tsx            # Scrollable findings table
│   │   ├── ForensicsTriggerModal.tsx     # Modal to launch forensics view
│   │   ├── RulesDistribution.tsx         # Recharts donut by secret type
│   │   ├── SidebarLog.tsx                # Scan history sidebar
│   │   └── Topbar.tsx                    # Repo selector, search, actions
│   └── landing/
│       ├── FeaturesStrip.tsx             # Feature highlights strip
│       ├── HeroSection.tsx               # Landing hero section
│       ├── HeroVisual.tsx                # Animated hero graphic
│       ├── LandingFooter.tsx             # Page footer
│       └── LandingNav.tsx                # Top navigation bar
│
├── hooks/
│   ├── scan-provider.tsx                 # React context wrapping all scan state
│   ├── use-dashboard-stats.ts            # Dashboard metrics query
│   ├── use-findings.ts                   # Findings fetch & filter query
│   ├── use-scan-directories.ts           # Directory discovery query
│   ├── use-scan-status.ts                # Scan progress polling query
│   └── use-start-scan.ts                 # Scan trigger mutation
│
├── lib/
│   ├── db/
│   │   ├── index.ts                      # SQLite connection (WAL, FK, sync)
│   │   └── schema.ts                     # Drizzle schema: scans, findings, secrets_registry, purge_log
│   ├── scanner/
│   │   ├── ghost-hunter.ts               # Filesystem async-generator scanner
│   │   ├── git-scanner.ts                # Git history scanner (4 functions)
│   │   └── patterns.ts                   # 7 shared secret detection patterns
│   └── vault/
│       └── crypto.ts                     # AES-256-GCM encryption utilities
│
├── types/
│   └── scanner.ts                        # Shared types: FindingRow, TraceResult, GitCommitFinding
│
├── scripts/
│   ├── chaos-generator.sh                # Attack simulator (fabricates test repos)
│   └── reset-db.ts                       # TypeScript DB reset utility
│
├── drizzle.config.ts                     # Drizzle Kit configuration
└── .env                                  # Local-only secrets (gitignored)
```

---

## Database Schema

| Table | Purpose | Key Columns |
|---|---|---|
| `scans` | Activity log with checkpoint resume | type, status, startedAt, finishedAt, repoPath, totalFindings, checkpoint |
| `findings` | Evidence vault with unique fingerprints | rule, severity, path, line, confidence, snippet, fingerprint, status, commitHash, author |
| `secrets_registry` | `.env` taint baseline for key joins | keyName (unique) |
| `purge_log` | Audit trail for git history purges | findingId, repoPath, affectedPath, ruleMatched, status, pristine, startedAt, completedAt |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite database file path (`file:./sentinel.db`) |
| `VAULT_SALT` | Salt for AES-256-GCM key derivation |
| `MAX_SCAN_SIZE` | Max file size to scan in bytes (default: 5MB) |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for all releases and changes.

---

*Built with the mindset: "Your secrets shouldn't leave your machine."*
