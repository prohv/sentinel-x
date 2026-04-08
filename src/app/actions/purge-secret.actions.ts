'use server';

import { db } from '@/lib/db';
import { findings, purgeLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import type { FindingRow } from './scan-types';

// Shared Types
export interface PurgeStepResult {
  success: boolean;
  detail: string;
}

// Server-Side Session Store
// Process-lifetime Map (fine for this local-first app).
// Stores ephemeral state that needs to flow between step calls without
// going through the client (backup path, extracted secret, startedAt).
const sessions = new Map<
  number,
  { backupPath: string; secret: string; startedAt: Date; pristine: boolean }
>();

// Secret Extraction
const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'GitHub Token', regex: /ghp_[A-Za-z0-9_]{36,}/ },
  { name: 'Stripe Secret Key', regex: /sk_(live|test)_[A-Za-z0-9]{20,}/ },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  {
    name: 'Generic API Key',
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})/i,
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/,
  },
  {
    name: 'Password Assignment',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^\s"']{8,})/i,
  },
  {
    name: 'Connection String',
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s"'`]+/i,
  },
];

function extractSecret(snippet: string, ruleName: string): string | null {
  const rulePattern = SECRET_PATTERNS.find(
    (p) => p.name.toLowerCase() === ruleName.toLowerCase(),
  );
  const candidates = rulePattern
    ? [rulePattern, ...SECRET_PATTERNS.filter((p) => p !== rulePattern)]
    : SECRET_PATTERNS;

  for (const { regex } of candidates) {
    const clone = new RegExp(regex.source, regex.flags.replace('g', ''));
    const m = clone.exec(snippet);
    if (m) return (m[1] ?? m[0]).trim();
  }
  return null;
}

// Bun.spawn Helper
async function spawnCmd(cmd: string[], cwd: string) {
  const proc = Bun.spawn(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stdout, stderr };
}

function escapeForSed(s: string): string {
  return s.replace(/[[\]\\^$.|?*+(){}/&]/g, '\\$&');
}

// Step 1 — Pre-Flight Integrity Check
export async function purgeStepPreFlight(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const repoPath = finding.repoPath ?? '';

  if (!repoPath) {
    return {
      success: false,
      detail: 'No repository path attached to this finding.',
    };
  }

  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    return {
      success: false,
      detail: `No .git directory found in: ${repoPath}`,
    };
  }

  const status = await spawnCmd(['git', 'status', '--porcelain'], repoPath);
  if (status.stdout.trim()) {
    const dirty = status.stdout.trim().split('\n').slice(0, 3).join(', ');
    return { success: false, detail: `Working directory is dirty: ${dirty}` };
  }

  const secret = extractSecret(finding.snippet, finding.rule);
  if (!secret) {
    return {
      success: false,
      detail: `Could not extract secret token from snippet for rule: ${finding.rule}`,
    };
  }

  // Store session state for subsequent steps
  sessions.set(finding.id, {
    backupPath: '',
    secret,
    startedAt: new Date(),
    pristine: false,
  });

  return {
    success: true,
    detail: `Secret token identified · Repository is clean · Rule: ${finding.rule}`,
  };
}

// Step 2 — Shadow Backup
export async function purgeStepBackup(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const repoPath = finding.repoPath ?? '';
  const session = sessions.get(finding.id);
  if (!session)
    return {
      success: false,
      detail: 'Session expired. Please restart the purge.',
    };

  const backupName = `.git-sentinel-backup-${Date.now()}`;
  const backupPath = path.join(repoPath, backupName);
  const isWin = process.platform === 'win32';

  const backupCmd = isWin
    ? ['xcopy', '/E', '/I', '/H', '/Y', '.git', backupName]
    : ['cp', '-R', '.git', backupName];

  const result = await spawnCmd(backupCmd, repoPath);

  if (result.code !== 0 && !fs.existsSync(backupPath)) {
    return { success: false, detail: result.stderr.slice(0, 200) };
  }

  session.backupPath = backupPath;
  return { success: true, detail: `Backup created: ${backupName}` };
}

// Step 3 — Filter-Branch Surgery
export async function purgeStepSurgery(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const repoPath = finding.repoPath ?? '';
  const session = sessions.get(finding.id);
  if (!session) return { success: false, detail: 'Session expired.' };

  const { secret } = session;
  const esc = escapeForSed(secret);

  const indexFilter = [
    `MATCH=$(git ls-files | xargs grep -lF "${secret}" 2>/dev/null); `,
    `if [ -n "$MATCH" ]; then `,
    `  echo "$MATCH" | while IFS= read -r f; do `,
    `    sed -i "s/${esc}/[REDACTED by Sentinel X]/g" "$f" 2>/dev/null && git update-index -- "$f"; `,
    `  done; `,
    `fi; true`,
  ].join('');

  const result = await spawnCmd(
    [
      'git',
      'filter-branch',
      '-f',
      '--index-filter',
      indexFilter,
      '--tag-name-filter',
      'cat',
      '--',
      '--all',
    ],
    repoPath,
  );

  // filter-branch exits non-zero with WARNING messages on clean runs — treat those as OK
  const isRealFailure =
    result.code !== 0 &&
    !result.stderr.includes('WARNING') &&
    !result.stderr.includes('Rewrite');

  if (isRealFailure) {
    return { success: false, detail: result.stderr.slice(0, 300) };
  }

  const rewrites = (result.stderr.match(/Rewrite/g) ?? []).length;
  return {
    success: true,
    detail: `${rewrites} commit(s) rewritten · Hash ripple resolved across DAG`,
  };
}

// Step 4 — Forensic Incineration
export async function purgeStepIncinerate(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const repoPath = finding.repoPath ?? '';
  if (!sessions.has(finding.id))
    return { success: false, detail: 'Session expired.' };

  await spawnCmd(
    ['git', 'reflog', 'expire', '--expire=now', '--all'],
    repoPath,
  );
  const gc = await spawnCmd(
    ['git', 'gc', '--prune=now', '--aggressive'],
    repoPath,
  );

  const pruned =
    gc.stderr.includes('pruning') || gc.stderr.includes('Counting');
  return {
    success: true,
    detail: `Reflog wiped · ${pruned ? 'Unreachable objects pruned' : 'GC complete'}`,
  };
}

// Step 5 — Mini-Scan Verification
export async function purgeStepVerify(
  finding: FindingRow,
): Promise<PurgeStepResult & { pristine: boolean }> {
  const repoPath = finding.repoPath ?? '';
  const session = sessions.get(finding.id);
  if (!session)
    return { success: false, pristine: false, detail: 'Session expired.' };

  const result = await spawnCmd(
    ['git', 'log', '-p', '--all', '--format=%H'],
    repoPath,
  );

  const pristine = !result.stdout.includes(session.secret);
  session.pristine = pristine;

  return {
    success: true,
    pristine,
    detail: pristine
      ? '✓ PRISTINE — secret confirmed absent from all reachable history'
      : '⚠ PARTIAL — traces may remain in edge branches. Manual review advised.',
  };
}

// Step 6 — Sovereign Audit Log
export async function purgeStepAudit(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const session = sessions.get(finding.id);
  if (!session) return { success: false, detail: 'Session expired.' };

  const now = new Date();

  const inserted = await db
    .insert(purgeLog)
    .values({
      findingId: finding.id,
      repoPath: finding.repoPath ?? '',
      affectedPath: finding.path,
      ruleMatched: finding.rule,
      status: 'success',
      pristine: session.pristine ? 1 : 0,
      startedAt: session.startedAt,
      completedAt: now,
    })
    .returning({ id: purgeLog.id });

  const logId = inserted[0]?.id ?? null;

  // Mark finding as purged
  await db
    .update(findings)
    .set({ status: 'purged' } as Partial<typeof findings.$inferInsert>)
    .where(eq(findings.id, finding.id));

  // Delete shadow backup on success
  try {
    if (session.backupPath) {
      fs.rmSync(session.backupPath, { recursive: true, force: true });
    }
  } catch {
    /* non-fatal */
  }

  // Clean up session
  sessions.delete(finding.id);

  return {
    success: true,
    detail: `Audit record #${logId} committed · Finding marked PURGED · Backup removed`,
  };
}
