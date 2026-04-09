/**
 * Auto-migration utility for the Garrison DB.
 * Creates all tables if they don't exist on first run.
 * Idempotent — safe to call every server startup.
 */
import { db } from './index';
import { scans, findings, secretsRegistry, purgeLog } from './schema';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  // Create tables with IF NOT EXISTS — zero-downtime, safe on repeat calls
  db.run(sql`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      repo_path TEXT NOT NULL,
      total_findings INTEGER NOT NULL DEFAULT 0,
      checkpoint TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
      rule TEXT NOT NULL,
      severity TEXT NOT NULL,
      path TEXT NOT NULL,
      line INTEGER NOT NULL DEFAULT 0,
      confidence INTEGER NOT NULL DEFAULT 0,
      snippet TEXT NOT NULL,
      fingerprint TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'open',
      commit_hash TEXT,
      author TEXT
    )
  `);

  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity)`,
  );
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_findings_rule ON findings(rule)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_findings_path ON findings(path)`);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS secrets_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_name TEXT NOT NULL UNIQUE
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS purge_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id INTEGER REFERENCES findings(id) ON DELETE SET NULL,
      repo_path TEXT NOT NULL,
      affected_path TEXT NOT NULL,
      rule_matched TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      pristine INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `);

  console.log(
    '[Sentinel-X] Garrison DB migrated successfully →',
    process.env.GARRISON_DB ?? 'global',
  );
}
