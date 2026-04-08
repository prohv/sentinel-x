'use server';

import { db } from '@/lib/db';
import { scans, findings } from '@/lib/db/schema';
import { desc, count, asc, sql } from 'drizzle-orm';
import type { DashboardStatsResult } from './scan-types';

export async function getDashboardStats(): Promise<DashboardStatsResult> {
  try {
    const [
      threatResult,
      shieldedResult,
      totalResult,
      ruleDistResult,
      severityDistResult,
      recentResult,
      scanHistoryResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(findings)
        .where(
          sql`(${findings.severity} = 'critical' OR ${findings.severity} = 'high') AND ${findings.status} = 'open'`,
        ),

      db
        .select({ count: count() })
        .from(findings)
        .where(sql`${findings.status} = 'shielded'`),

      db.select({ count: count() }).from(findings),

      db
        .select({ rule: findings.rule, count: count() })
        .from(findings)
        .groupBy(findings.rule)
        .orderBy(asc(findings.rule)),

      db
        .select({ severity: findings.severity, count: count() })
        .from(findings)
        .where(sql`${findings.status} = 'open'`)
        .groupBy(findings.severity),

      db
        .select({
          id: findings.id,
          scanId: findings.scanId,
          rule: findings.rule,
          severity: findings.severity,
          path: findings.path,
          line: findings.line,
          confidence: findings.confidence,
          snippet: findings.snippet,
          status: findings.status,
          commitHash: findings.commitHash,
          author: findings.author,
        })
        .from(findings)
        .orderBy(desc(findings.id))
        .limit(12),

      db
        .select({
          id: scans.id,
          type: scans.type,
          status: scans.status,
          startedAt: scans.startedAt,
          finishedAt: scans.finishedAt,
          repoPath: scans.repoPath,
          totalFindings: scans.totalFindings,
        })
        .from(scans)
        .orderBy(desc(scans.id))
        .limit(10),
    ]);

    const totalFindings = Number(totalResult[0]?.count ?? 0);
    const activeThreats = Number(threatResult[0]?.count ?? 0);
    const shieldedSecrets = Number(shieldedResult[0]?.count ?? 0);

    // Calculate dynamic security score based on severity weights
    let penalty = 0;
    for (const row of severityDistResult) {
      const c = Number(row.count);
      if (row.severity === 'critical') penalty += c * 10;
      else if (row.severity === 'high') penalty += c * 5;
      else if (row.severity === 'medium') penalty += c * 2;
      else if (row.severity === 'low') penalty += c * 1;
    }

    // Exponential decay curve: steeper decay to lower the score faster.
    const securityScore =
      totalFindings === 0
        ? 100
        : Math.max(1, Math.round(100 * Math.exp(-penalty / 350)));

    return {
      success: true,
      activeThreats,
      securityScore,
      shieldedSecrets,
      ruleDistribution: ruleDistResult,
      recentFindings: recentResult,
      scanHistory: scanHistoryResult,
    };
  } catch (err) {
    console.error('[getDashboardStats] Error:', err);
    return { success: false, error: 'Failed to fetch dashboard stats.' };
  }
}
