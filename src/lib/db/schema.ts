import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const scans = sqliteTable('scans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'ghost_hunter' | 'git_recent' | 'git_full' | 'git_orphan'
  status: text('status').notNull(), // 'running' | 'completed' | 'failed'
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  repoPath: text('repo_path').notNull(),
  totalFindings: integer('total_findings').notNull().default(0),
  checkpoint: text('checkpoint'), // last scanned commit hash for resume
});

export const findings = sqliteTable(
  'findings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    scanId: integer('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    rule: text('rule').notNull(),
    severity: text('severity').notNull(),
    path: text('path').notNull(),
    line: integer('line').notNull().default(0),
    confidence: integer('confidence').notNull().default(0), // 0-100 stored as int
    snippet: text('snippet').notNull(),
    fingerprint: text('fingerprint').unique(), // hash(path + secret)
    status: text('status').notNull().default('open'), // 'open' | 'shielded'
    commitHash: text('commit_hash'), // null for file scans
    author: text('author'),
  },
  (table) => [
    index('idx_findings_severity').on(table.severity),
    index('idx_findings_rule').on(table.rule),
    index('idx_findings_path').on(table.path),
  ],
);

export const secretsRegistry = sqliteTable('secrets_registry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  keyName: text('key_name').notNull().unique(), // env key name e.g. DATABASE_URL
});

export const purgeLog = sqliteTable('purge_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  findingId: integer('finding_id').references(() => findings.id, {
    onDelete: 'set null',
  }),
  repoPath: text('repo_path').notNull(),
  affectedPath: text('affected_path').notNull(), // relative file path — never the secret
  ruleMatched: text('rule_matched').notNull(), // e.g. "Stripe Secret Key"
  status: text('status').notNull().default('running'), // 'running' | 'success' | 'failed'
  pristine: integer('pristine').notNull().default(0), // 1 = mini-scan confirmed clean
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
});

//Relations
export const scansRelations = relations(scans, ({ many }) => ({
  findings: many(findings),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  scan: one(scans, {
    fields: [findings.scanId],
    references: [scans.id],
  }),
}));
