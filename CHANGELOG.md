# Changelog

All notable changes to this project will be documented in this file.

---

## [3.1.0-beta] — 2026-04-09

### Added

#### Taint Tree Analyzer
- `/dashboard/taint-tree` — AST-based taint propagation visualizer
- TypeScript Compiler API integration for full source file parsing
- Source node detection at the finding line (variable declarations + property assignments)
- Propagation tracking across variable reassignments (`const b = taintedA`, `c = b`)
- Sink detection for external function calls with tainted arguments (`fetch`, `console.log`, `axios`, `db.`, `prisma.`, `Response.json`, `process.env`)
- Property access tracking (`taintedObj.key`) for real-world exfiltration patterns
- Support for `git:` blob paths — extracts file content from commit diffs when the finding originates from git history scans
- Playback/scrubber controls to step through the taint flow interactively
- Deduplication via per-line guards to prevent duplicate nodes

#### Forensics Deep-Dive
- `/dashboard/forensics?id=N` — granular secret lifecycle analysis
- `forensics.actions.ts` server action wrapping `traceSecret` pickaxe search
- Full commit history timeline showing when a secret was introduced and removed
- Author, date, and commit hash context per appearance
- Secret extraction using 7-pattern rule matching (same engine as Ghost Hunter)

#### Compliance Reporting
- `/dashboard/report` — business-readable compliance report
- Rule-to-business-impact translation layer (e.g., "AWS Access Key" → "Cloud Infrastructure Credential")
- Severity-weighted Recharts pie chart breakdown
- Executive summary with affected systems, secret types, and risk categorization
- Printable layout for audit handoffs
- CSV export utility for all findings

#### Batch Purge Pipeline
- Batch selection via `BatchPurgeContext` React provider (multi-select checkboxes across findings)
- `BatchPurgeModal` with sequential purge execution and per-finding status tracking
- Retry logic for Windows file-lock issues (up to 3 retries with 2s backoff)
- `purge-secret.actions.ts` — 6-step server action pipeline:
  - **Step 1 (Pre-Flight):** Validates repo path, `.git` presence, clean working tree, secret extraction
  - **Step 2 (Backup):** Shadow copy of `.git` directory (platform-aware: `xcopy` on Win, `cp` on Unix)
  - **Step 3 (Surgery):** `fast-export` → Bun-native buffer redaction → `fast-import` (zero subprocess calls, length-correct `data <N>` protocol)
  - **Step 4 (Incinerate):** `git reflog expire --expire=now --all` + `git gc --prune=now`
  - **Step 5 (Verify):** Full `git log -p --all` scan confirms secret is absent from all reachable history
  - **Step 6 (Audit):** Inserts `purge_log` record, marks finding as PURGED, deletes shadow backup

#### Landing Page & Documentation
- Polished public-facing site with hero section, animated hero visual, feature highlights strip
- `/docs` route — built-in documentation viewer (serves README via `/api/readme`)
- `/changelog` route — interactive release history display (served via `/api/changelog`)
- Responsive navigation bar with routing to all major sections

#### Server Action Architecture
- `start-scan.actions.ts` — scan trigger with directory selection
- `scan-status.actions.ts` — poll active scan progress
- `scan-directories.actions.ts` — local directory discovery for repo selection
- `get-findings.actions.ts` — fetch, filter, and shield findings
- `dashboard-stats.actions.ts` — aggregated metrics (active threats, score, resolved)
- `forensics.actions.ts` — git pickaxe trace for forensics view
- `purge-secret.actions.ts` — 6-step git history purge pipeline
- `scan-types.ts` — shared `FindingRow` and scan type definitions

#### TanStack Query Hooks
- `scan-provider.tsx` — React context wrapping all scan state
- `use-start-scan` — scan trigger mutation
- `use-scan-status` — scan progress polling query
- `use-findings` — findings fetch and filter query
- `use-dashboard-stats` — dashboard metrics query
- `use-scan-directories` — directory discovery query

#### Developer Utilities
- `scripts/reset-db.ts` — TypeScript database reset utility
- Enhanced `db:reset` package.json script (nuke + recreate in one command)

### Changed

- **Scanner engine:** Replaced `filter-branch` + `sed` with `fast-export` → Bun-native buffer redaction → `fast-import`. Subprocess calls reduced from O(files) to zero.
- **Taint tracking:** Rewrote `traceTaint` from single-variable string tracking to `Map<string, string>`-based multi-variable taint propagation graph
- **Edge linking:** Replaced fragile `nodes[nodes.length - 2]` index math with explicit origin node tracking via `taintedVars` map
- **Snippet extraction:** Replaced `parent.getText()` (entire parent expression) with per-line extraction from source code
- **File structure:** Organized into categorized feature sections (Landing, Dashboard, Scanners, DX)
- **Tech Stack table:** Added Markdown, Charts, AST, and Fonts entries
- **Project structure diagram:** Fully updated to reflect all current files and directories

### Removed

- **Shield All button** — Bulk shield button and success dialog removed from Topbar (hydration conflict resolution)
- **Authentication System** — Better-Auth dependency, `/setup` page, `src/lib/auth/`, `api/auth/[...all]/`, and all auth tables (`user`, `session`, `account`, `verification`) removed. No authentication needed for a local-first tool.
- `AUTH_SECRET` environment variable — no longer required

### Dependencies

| Package | Action |
|---|---|
| `marked` v18.0.0 | Added — Markdown parsing for `/docs` and `/api/readme` |
| `better-auth` | Removed — no longer needed |

### Database

- **New table:** `purge_log` — audit trail for git history purges (findingId, repoPath, affectedPath, ruleMatched, status, pristine, startedAt, completedAt)
- **Removed tables:** `user`, `session`, `account`, `verification`

---

## [1.2.0-beta] — 2026-04-09

### Added
- **Landing Page & Public Site:**
  - Polished hero section with visual graphics
  - Feature highlights strip showcasing core capabilities
  - Responsive navigation bar with routing
  - Landing footer with project information
- **Documentation System:**
  - `/docs` route — built-in documentation viewer
  - `/changelog` route — interactive release history display
  - `/api/changelog` — API endpoint for changelog data
  - `/api/readme` — API endpoint for README content
  - Markdown rendering via `marked` v18 integration
- **Server Action Architecture:**
  - `start-scan.actions.ts` — scan trigger handler
  - `scan-status.actions.ts` — scan status polling
  - `scan-directories.actions.ts` — directory scanning logic
  - `get-findings.actions.ts` — findings retrieval
  - `dashboard-stats.actions.ts` — metrics aggregation
  - `scan-types.ts` — shared type definitions
- **TanStack Query Hooks:**
  - `use-start-scan` — initiate scans with reactive state
  - `use-scan-status` — real-time status polling
  - `use-findings` — automated findings fetching
  - `use-dashboard-stats` — live dashboard metrics
  - `use-scan-directories` — directory selection state
  - `scan-provider.tsx` — unified React context for scan state
- **Developer Utilities:**
  - `scripts/reset-db.ts` — TypeScript database reset utility
  - Enhanced `db:reset` package.json script

### Changed
- Restructured `src/lib/utils/` → `src/lib/vault/` for clearer security context
- Organized features into categorized sections (Landing, Dashboard, Scanners, Auth, DX)
- Expanded Tech Stack table with Markdown, Charts, and Fonts entries
- Updated project structure diagram to reflect actual file layout

### Deprecated
- **Shield All** — Bulk shield button and success dialog removed from Topbar (hydration conflict resolution)

### Dependencies
- Added `marked` v18.0.0 for Markdown parsing/rendering

---

## [1.1.0-beta] — 2026-04-08

### Added
- **Finding Inspection Hub:** Modular Detail Dialog featuring:
  - Exact file path resolution (VCS vs Phantom)
  - Commit author/hash context with code snippet evidence
  - One-click remediation workflow
- **Remediation Pipeline:**
  - `False Positive` workflow (Blue State) — removes finding from tracking
  - `Verify & Shield` workflow (Green State) — isolates artifact in Secure Vault
- **Secure Vault Engine:**
  - Standardized AES-256-GCM encryption for shielded artifacts
  - Structural isolation from local repository state
- **Bulk Defenses:**
  - `Shield All` — Unified Topbar interaction to secure all open threats instantly
  - Multi-threaded bulk suppression logic
- **Global Data Integrity:**
  - Synchronized "Active Threats" and "Rules Distribution" metrics
  - Real-time cache invalidation for instant remediation feedback
- **Data Export:** Instant CSV reporting for compliance and auditing
- **Developer Utilities:** `db:reset` script for rapid demo re-initialization

### Fixed
- Severity weighting sync: "Active Threats" now accurately maps to 100% of open findings
- Discriminated union handling in Topbar stats polling
- Redundant logo assets consolidated into single `logo.svg`

## [0.3.0] — 2026-04-08

### Added
- Dashboard UI with 5 polished components:
  - `Topbar` — repo context, search bar, "New Scan" trigger
  - `DashboardVitals` — 3 stat cards (threats, score, resolved secrets)
  - `RulesDistribution` — Recharts donut breakdown by secret type
  - `FindingsStream` — scrollable findings table with severity badges
  - `SidebarLog` — scan history timeline + quick actions
- Chaos Generator attack simulator (`scripts/chaos-generator.sh`):
  - Seeds `.env.local` with 28+ fake secrets (AWS, Stripe, GitHub, Slack, SendGrid, Twilio, passwords, API keys, connection strings)
  - Generates 60+ backdated commits with real app boilerplate (React components, lib modules, API routes, tests)
  - Oops lifecycle: commit → cleanup pattern (secrets persist in git history)
  - Deep path obfuscation (3-6 levels with hidden dirs)
  - 4 abandoned feature branches with unmerged leaks
  - Ground-truth Oracle (`ground_truth.json`) for recall verification
  - 3 injection modes: env files, inline source, config files
- Recharts v3.8.1 for charting
- Google Fonts: Epilogue (headings), Manrope (body), Fira Code (monospace)

---

## [0.2.0] — 2026-04-07

### Added
- Drizzle schema (`src/lib/db/schema.ts`) with three pillars:
  - `scans` — activity log with type, status, timestamps, checkpoint
  - `findings` — evidence vault with FK to scans, unique fingerprint, nullable git fields
  - `secrets_registry` — taint baseline for `.env` keys
- DB connection upgraded with WAL mode, synchronous=NORMAL, foreign_keys=ON
- Drizzle config updated: dialect set to `sqlite`, correct schema path, dbCredentials
- Better-Auth integration (`src/lib/auth/index.ts`) with Drizzle adapter and email/password
- Auth API handler (`app/api/auth/[...all]/route.ts`) — catch-all route for all auth actions
- Setup page (`app/setup/`) — Bootstrap Admin coronation flow:
  - Server action checks if users exist, gates or redirects accordingly
  - Form creates first account and explicitly sets role to `admin`
  - Client component with `useActionState`, success/error states, auto-redirect

### Fixed
- `traceSecret` reversed: `firstSeen` is now oldest commit, `lastSeen` is newest
- `TextDecoder` streaming fix: `{ stream: true }` prevents split UTF-8 characters
- `stderr` listeners added to `auditFullHistory` and `huntOrphanBlobs` for debug visibility
- `analyzeLine` master pattern sieve — fast-gates clean diff lines before per-rule loop
- `auditFullHistory` streamed via single `spawn('git log -p --all')` instead of O(N) `git show` calls
- `huntOrphanBlobs` batched via single `spawn('git cat-file --batch')` instead of O(N) `cat-file -p` calls
- Schema timestamps optimized: `integer({ mode: 'timestamp_ms' })` for range query performance
- Schema indexes added on `findings.severity`, `findings.rule`, `findings.path`
- `better-sqlite3` native bindings rebuilt for Windows x64

---

## [0.1.1] — 2026-04-07

### Added
- Git scanner (`src/lib/scanner/git-scanner.ts`) with 4 core functions:
  - `traceSecret(secret)` — Pickaxe search via `git log -S`; finds first/last appearance of a specific secret across all commits
  - `scanRecentHistory(depth)` — Pulse check; scans last N commits (default 50) for pattern matches on added lines
  - `auditFullHistory(fromCheckpoint?)` — Deep miner; async generator that walks every commit across all branches with resume support
  - `huntOrphanBlobs()` — Dangling blob hunter; scans reflog for secrets in deleted/force-pushed content still in `.git/objects`
- Shared pattern library (`src/lib/scanner/patterns.ts`) — single source for all 7 secret detection rules
- New types: `GitCommitFinding`, `TraceResult` in `src/types/scanner.ts`

---

## [0.1.0] — 2026-04-07

### Added
- Project scaffold with Next.js 16 + Bun + TypeScript + Tailwind 4
- Directory structure: `components/`, `hooks/`, `lib/`, `scripts/`, `types/`
- Ghost Hunter scanner (`src/lib/scanner/ghost-hunter.ts`)
  - Async generator for streaming results
  - 7 built-in pattern rules (GitHub, Stripe, AWS, private keys, passwords, connection strings, API keys)
  - Shannon entropy calculator for unknown-format secrets
  - `.env` taint baseline detection
  - Master pattern fast-gate (skip clean lines in 1 regex call)
  - Single-pass taint regex (replaces O(n) env key loop)
- Drizzle ORM + SQLite local client (`src/lib/db/index.ts`)
- Shared types (`src/types/scanner.ts`)
- Husky pre-commit hooks with lint-staged
- Environment template (`.example.env`)
