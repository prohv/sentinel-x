'use server';

import { db } from '@/lib/db';
import { scans, findings } from '@/lib/db/schema';
import { desc, count, asc, sql, eq, and } from 'drizzle-orm';
import type { DashboardStatsResult } from './scan-types';

export async function getDashboardStats(
  repoPath?: string,
): Promise<DashboardStatsResult> {
  try {
    const repoFilter = repoPath ? eq(scans.repoPath, repoPath) : undefined;

    const [
      threatResult,
      shieldedResult,
      purgedResult,
      totalResult,
      ruleDistResult,
      severityDistResult,
      recentResult,
      scanHistoryResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(and(sql`${findings.status} = 'open'`, repoFilter)),
      db
        .select({ count: count() })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(and(sql`${findings.status} = 'shielded'`, repoFilter)),

      db
        .select({ count: count() })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(and(sql`${findings.status} = 'purged'`, repoFilter)),

      db
        .select({ count: count() })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(repoFilter),

      db
        .select({ rule: findings.rule, count: count() })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(and(sql`${findings.status} = 'open'`, repoFilter))
        .groupBy(findings.rule)
        .orderBy(asc(findings.rule)),

      db
        .select({
          status: findings.status,
          severity: findings.severity,
          count: count(),
        })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(and(sql`${findings.status} IN ('open', 'shielded')`, repoFilter))
        .groupBy(findings.status, findings.severity),

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
        .leftJoin(scans, eq(findings.scanId, scans.id))
        .where(repoFilter)
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
        .where(repoFilter)
        .orderBy(desc(scans.id))
        .limit(10),
    ]);

    const totalFindings = Number(totalResult[0]?.count ?? 0);
    const activeThreats = Number(threatResult[0]?.count ?? 0);
    const shieldedSecrets = Number(shieldedResult[0]?.count ?? 0);
    const purgedKeys = Number(purgedResult[0]?.count ?? 0);

    // Calculate dynamic security score
    let penalty = 0;
    for (const row of severityDistResult) {
      const c = Number(row.count);
      const multiplier = row.status === 'shielded' ? 0.5 : 1;

      if (row.severity === 'critical') penalty += c * 10 * multiplier;
      else if (row.severity === 'high') penalty += c * 5 * multiplier;
      else if (row.severity === 'medium') penalty += c * 2 * multiplier;
      else if (row.severity === 'low') penalty += c * 1 * multiplier;
    }

    const maxMitigation = penalty * 0.8;
    const hygieneBonus = Math.min(maxMitigation, purgedKeys * 5);

    const finalPenalty = penalty - hygieneBonus;

    const securityScore =
      totalFindings === 0 && penalty === 0
        ? 100
        : Math.max(
            1,
            Math.min(100, Math.round(100 * Math.exp(-finalPenalty / 200))),
          );

    return {
      success: true,
      activeThreats,
      securityScore,
      shieldedSecrets,
      purgedKeys,
      ruleDistribution: ruleDistResult,
      recentFindings: recentResult,
      scanHistory: scanHistoryResult,
    };
  } catch (err) {
    console.error('[getDashboardStats] Error:', err);
    return { success: false, error: 'Failed to fetch dashboard stats.' };
  }
}
