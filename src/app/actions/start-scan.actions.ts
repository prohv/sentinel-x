'use server';

import { db } from '@/lib/db';
import { scans, findings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { StartScanResult, ScanType } from './scan-types';
import { StartScanSchema } from './scan-types';

export async function startScan(input: unknown): Promise<StartScanResult> {
  const parsed = StartScanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { repoPath, scanType } = parsed.data;

  try {
    const [scan] = await db
      .insert(scans)
      .values({
        type: scanType,
        status: 'running',
        startedAt: new Date(),
        repoPath,
        totalFindings: 0,
      })
      .returning();

    runScanner(scan.id, repoPath, scanType).catch((err) => {
      console.error(`[startScan] Scanner error on scan ${scan.id}:`, err);
      markScanFailed(scan.id).catch(() => {});
    });

    return { success: true, scanId: scan.id };
  } catch (err) {
    console.error('[startScan] Failed to create scan:', err);
    return {
      success: false,
      error: 'Failed to start scan. Check server logs.',
    };
  }
}

// Internal scanner runner

async function runScanner(
  scanId: number,
  repoPath: string,
  scanType: ScanType,
): Promise<void> {
  const { ghostHunter } = await import('@/lib/scanner/ghost-hunter');
  const { scanRecentHistory, auditFullHistory, huntOrphanBlobs } =
    await import('@/lib/scanner/git-scanner');
  const { createHash } = await import('node:crypto');

  const findingsBatch: (typeof findings.$inferInsert)[] = [];
  let findingCount = 0;

  const insertBatch = async () => {
    if (findingsBatch.length === 0) return;
    await db.insert(findings).values(findingsBatch).onConflictDoNothing();
    findingsBatch.length = 0;
  };

  const addFinding = (f: {
    path: string;
    line: number;
    confidence: number;
    snippet: string;
    rule: string;
    severity: string;
    commitHash?: string | null;
    author?: string | null;
  }) => {
    const fingerprint = createHash('sha256')
      .update(`${f.path}:${f.snippet}:${f.rule}`)
      .digest('hex')
      .slice(0, 32);

    findingsBatch.push({
      scanId,
      rule: f.rule,
      severity: f.severity,
      path: f.path,
      line: f.line,
      confidence: Math.round(f.confidence * 100),
      snippet: f.snippet,
      fingerprint,
      commitHash: f.commitHash ?? null,
      author: f.author ?? null,
    });

    findingCount++;

    if (findingsBatch.length >= 50) {
      insertBatch().catch(console.error);
    }
  };

  try {
    switch (scanType) {
      case 'ghost_hunter':
        for await (const f of ghostHunter(repoPath)) addFinding(f);
        break;

      case 'git_recent': {
        const results = await scanRecentHistory(repoPath);
        for (const f of results) addFinding(f);
        break;
      }

      case 'git_full':
        for await (const f of auditFullHistory(repoPath)) addFinding(f);
        break;

      case 'git_orphan':
        for await (const f of huntOrphanBlobs(repoPath)) addFinding(f);
        break;
    }

    await insertBatch();

    await db
      .update(scans)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        totalFindings: findingCount,
      })
      .where(eq(scans.id, scanId));
  } catch (err) {
    console.error(`[runScanner] Scan ${scanId} failed:`, err);
    await insertBatch();
    await db
      .update(scans)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        totalFindings: findingCount,
      })
      .where(eq(scans.id, scanId));
  }
}

async function markScanFailed(scanId: number): Promise<void> {
  try {
    await db
      .update(scans)
      .set({ status: 'failed', finishedAt: new Date() })
      .where(eq(scans.id, scanId));
  } catch {
    // Already logged
  }
}
