# Changelog

All notable changes to this project will be documented in this file.

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
