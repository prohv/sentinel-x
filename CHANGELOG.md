# Changelog

All notable changes to this project will be documented in this file.

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
