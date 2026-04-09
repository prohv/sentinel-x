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
        .where(sql`${findings.status} = 'open'`),
      db
        .select({ count: count() })
        .from(findings)
        .where(sql`${findings.status} = 'shielded'`),

      db
        .select({ count: count() })
        .from(findings)
        .where(sql`${findings.status} = 'purged'`),

      db.select({ count: count() }).from(findings),

      db
        .select({ rule: findings.rule, count: count() })
        .from(findings)
        .where(sql`${findings.status} = 'open'`)
        .groupBy(findings.rule)
        .orderBy(asc(findings.rule)),

      db
        .select({
          status: findings.status,
          severity: findings.severity,
          count: count(),
        })
        .from(findings)
        .where(sql`${findings.status} IN ('open', 'shielded')`)
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
    const purgedKeys = Number(purgedResult[0]?.count ?? 0);

    // Calculate dynamic security score with an emphasis on actual resolution (Purging)
    let penalty = 0;
    for (const row of severityDistResult) {
      const c = Number(row.count);
      // Shielding leaves 50% of the penalty intact (tech debt), making it exactly half as effective as purging.
      const multiplier = row.status === 'shielded' ? 0.5 : 1;

      if (row.severity === 'critical') penalty += c * 10 * multiplier;
      else if (row.severity === 'high') penalty += c * 5 * multiplier;
      else if (row.severity === 'medium') penalty += c * 2 * multiplier;
      else if (row.severity === 'low') penalty += c * 1 * multiplier;
    }

    // Purging completely eradicates risk.
    // It provides a "hygiene bonus" that can mitigate up to 80% of the active penalty.
    const maxMitigation = penalty * 0.8;
    const hygieneBonus = Math.min(maxMitigation, purgedKeys * 5);

    const finalPenalty = penalty - hygieneBonus;

    // Exponential decay curve: using a softer denominator (150) so scores are more forgiving.
    // E.g., 1 open critical = 93% score. 5 open criticals = 71% score.
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
