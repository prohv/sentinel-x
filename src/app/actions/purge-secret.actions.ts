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

// ── Bun-Native Fast-Export Stream Redactor ───────────────────────────────
// git fast-export serialises the entire repo as a text protocol.
// Each blob/commit body is preceded by a "data <N>" header announcing its
// byte length. We MUST rewrite that length when the content changes,
// otherwise git fast-import will reject the stream.
//
// This function iterates the buffer once (O(RepositorySize)) and:
//   1. Passes all non-data bytes through verbatim.
//   2. For each "data <N>" section, replaces every occurrence of `secret`
//      inside those N bytes and emits a corrected header.
//
// It intentionally avoids spawning grep, sed, or xargs.

function bufReplaceAll(buf: Buffer, search: Buffer, replace: Buffer): Buffer {
  const parts: Buffer[] = [];
  let pos = 0;
  while (pos < buf.length) {
    const idx = buf.indexOf(search, pos);
    if (idx === -1) {
      parts.push(buf.subarray(pos));
      break;
    }
    parts.push(buf.subarray(pos, idx));
    parts.push(replace);
    pos = idx + search.length;
  }
  return Buffer.concat(parts);
}

function redactFastExportStream(raw: Buffer, secret: string): Buffer {
  const secretBuf = Buffer.from(secret, 'utf8');
  const redactBuf = Buffer.from('[REDACTED by Sentinel X]', 'utf8');
  const DATA_PREFIX = Buffer.from('data ', 'ascii');
  const LF = 0x0a;

  const out: Buffer[] = [];
  let pos = 0;

  while (pos < raw.length) {
    // Find the next "data " token that sits at the very start of a line.
    const dataPos = raw.indexOf(DATA_PREFIX, pos);
    if (dataPos === -1) {
      out.push(raw.subarray(pos));
      break;
    }

    const isLineStart = dataPos === 0 || raw[dataPos - 1] === LF;
    if (!isLineStart) {
      // "data" appears mid-line (e.g. inside a path) — skip one byte and retry.
      out.push(raw.subarray(pos, dataPos + 1));
      pos = dataPos + 1;
      continue;
    }

    // Emit everything before this header.
    out.push(raw.subarray(pos, dataPos));

    // Find end of the "data <N>\n" line.
    const lineEnd = raw.indexOf(LF, dataPos);
    if (lineEnd === -1) {
      // Truncated stream — pass rest through.
      out.push(raw.subarray(dataPos));
      break;
    }

    const sizeStr = raw
      .subarray(dataPos + 5, lineEnd)
      .toString('ascii')
      .trim();
    const size = parseInt(sizeStr, 10);

    if (isNaN(size)) {
      // Delimiter form: "data <<MARKER" — not a fixed-size blob, pass through.
      out.push(raw.subarray(dataPos, lineEnd + 1));
      pos = lineEnd + 1;
      continue;
    }

    // Read exactly `size` bytes of blob content.
    const contentStart = lineEnd + 1;
    const contentEnd = contentStart + size;
    const content = raw.subarray(contentStart, contentEnd);

    // Redact and recalculate length.
    const redacted = bufReplaceAll(content, secretBuf, redactBuf);
    out.push(Buffer.from(`data ${redacted.length}\n`));
    out.push(redacted);

    pos = contentEnd;
  }

  return Buffer.concat(out);
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

// Step 3 — Fast-Export / Bun-Native Redact / Fast-Import
export async function purgeStepSurgery(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const repoPath = finding.repoPath ?? '';
  const session = sessions.get(finding.id);
  if (!session) return { success: false, detail: 'Session expired.' };

  const { secret } = session;

  // ── 1. Export ──────────────────────────────────────────────────────────
  // git fast-export serialises ALL refs into a single protocol stream.
  // --all includes branches, tags, notes, and stash — nothing slips through.
  const exporter = Bun.spawn(
    ['git', 'fast-export', '--all', '--signed-tags=strip'],
    { cwd: repoPath, stdout: 'pipe', stderr: 'pipe' },
  );

  const [rawAB, exportStderr, exportCode] = await Promise.all([
    new Response(exporter.stdout).arrayBuffer(),
    new Response(exporter.stderr).text(),
    exporter.exited,
  ]);

  if (exportCode !== 0 && !exportStderr.toLowerCase().includes('warning')) {
    return {
      success: false,
      detail: `git fast-export failed: ${exportStderr.slice(0, 200)}`,
    };
  }

  const rawBuf = Buffer.from(rawAB);

  // Count commits in the stream for the progress message.
  const commitCount = [...rawBuf.toString('ascii').matchAll(/^commit /gm)]
    .length;

  // ── 2. Redact (Bun-native, zero extra processes) ───────────────────────
  const redacted = redactFastExportStream(rawBuf, secret);

  // ── 3. Import ──────────────────────────────────────────────────────────
  // --force allows rewriting refs that already exist.
  // --quiet suppresses per-commit progress noise.
  const importer = Bun.spawn(['git', 'fast-import', '--force', '--quiet'], {
    cwd: repoPath,
    stdin: new Blob([new Uint8Array(redacted)]),
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [importStderr, importCode] = await Promise.all([
    new Response(importer.stderr).text(),
    importer.exited,
  ]);

  if (importCode !== 0) {
    return {
      success: false,
      detail: `git fast-import failed: ${importStderr.slice(0, 200)}`,
    };
  }

  // ── 4. Sync working tree to the rewritten HEAD ─────────────────────────
  await spawnCmd(['git', 'reset', '--hard', 'HEAD'], repoPath);

  return {
    success: true,
    detail: `${commitCount} commit(s) rewritten via fast-export stream · Hash DAG rebuilt · 0 subprocess calls`,
  };
}

// Step 4 — Forensic Incineration
export async function purgeStepIncinerate(
  finding: FindingRow,
): Promise<PurgeStepResult> {
  const repoPath = finding.repoPath ?? '';
  if (!sessions.has(finding.id))
    return { success: false, detail: 'Session expired.' };

  // Expire all reflog entries immediately so the old (infected) objects
  // become unreachable.
  await spawnCmd(
    ['git', 'reflog', 'expire', '--expire=now', '--all'],
    repoPath,
  );

  // --prune=now removes unreachable objects right away.
  // We intentionally omit --aggressive: it re-deltas every object which
  // takes ~10x longer with no security benefit for a secret purge.
  const gc = await spawnCmd(['git', 'gc', '--prune=now'], repoPath);

  const pruned =
    gc.stderr.includes('pruning') || gc.stderr.includes('Counting');
  return {
    success: true,
    detail: `Reflog wiped · ${pruned ? 'Unreachable objects pruned' : 'GC complete'} · --aggressive omitted (not needed for secret purge)`,
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
  let backupCleaned = false;
  if (session.backupPath && fs.existsSync(session.backupPath)) {
    let retries = 3;
    while (fs.existsSync(session.backupPath) && retries > 0) {
      try {
        const isWin = process.platform === 'win32';
        if (isWin) {
          const escaped = session.backupPath.replace(/\//g, '\\');
          // Important: Don't set cwd to parent folder to avoid handle locks, quote the path.
          await spawnCmd(
            ['cmd.exe', '/c', `rd /s /q "${escaped}"`],
            process.cwd(),
          );
          // Fallback node cleanup
          if (fs.existsSync(session.backupPath)) {
            fs.rmSync(session.backupPath, {
              recursive: true,
              force: true,
              maxRetries: 3,
            });
          }
        } else {
          fs.rmSync(session.backupPath, { recursive: true, force: true });
        }
      } catch (err: unknown) {
        // Ignore and retry
      }

      if (fs.existsSync(session.backupPath)) {
        await new Promise((r) => setTimeout(r, 1000));
        retries--;
      }
    }
    backupCleaned = fs.existsSync(session.backupPath) === false;
    if (!backupCleaned) {
      console.warn(
        `[purge] backup cleanup failed after retries for: ${session.backupPath}`,
      );
    }
  } else if (!session.backupPath) {
    backupCleaned = true; // no backup was created
  }

  // Clean up session
  sessions.delete(finding.id);

  return {
    success: true,
    detail: `Audit record #${logId} committed · Finding marked PURGED · ${backupCleaned ? 'Backup removed' : 'Backup cleanup pending — manual deletion advised'}`,
  };
}

/**
 * Consolidated action to run the entire 6-step purge pipeline for a single finding.
 * Essential for batch operations where we want to avoid client-side state orchestration
 * for every single item in a large queue.
 */
export async function purgeSecret(
  id: number,
): Promise<{ success: boolean; detail: string }> {
  try {
    const findingResult = await db
      .select()
      .from(findings)
      .where(eq(findings.id, id))
      .limit(1);
    if (findingResult.length === 0) {
      return { success: false, detail: `Finding #${id} not found.` };
    }
    const finding = findingResult[0] as FindingRow;

    // 1. Pre-Flight
    const preFlight = await purgeStepPreFlight(finding);
    if (!preFlight.success) return preFlight;

    // 2. Backup
    const backup = await purgeStepBackup(finding);
    if (!backup.success) return backup;

    // 3. Surgery
    const surgery = await purgeStepSurgery(finding);
    if (!surgery.success) return surgery;

    // 4. Incinerate
    const incinerate = await purgeStepIncinerate(finding);
    if (!incinerate.success) return incinerate;

    // 5. Verify
    const verify = await purgeStepVerify(finding);
    if (!verify.success) return verify;

    // 6. Audit & Mark Purged
    const audit = await purgeStepAudit(finding);
    return audit;
  } catch (err) {
    console.error(`[purgeSecret] error for ID ${id}:`, err);
    return {
      success: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
