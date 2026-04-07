'use server';

import { db } from '@/lib/db';
import { scans, findings } from '@/lib/db/schema';
import { desc, count, asc, sql } from 'drizzle-orm';
import type { DashboardStatsResult } from './scan-types';

export async function getDashboardStats(): Promise<DashboardStatsResult> {
  try {
    const [
      threatResult,
      totalResult,
      ruleDistResult,
      recentResult,
      scanHistoryResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(findings)
        .where(
          sql`${findings.severity} = 'critical' OR ${findings.severity} = 'high'`,
        ),

      db.select({ count: count() }).from(findings),

      db
        .select({ rule: findings.rule, count: count() })
        .from(findings)
        .groupBy(findings.rule)
        .orderBy(asc(findings.rule)),

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

    const totalFindings = totalResult?.count ?? 0;
    const activeThreats = threatResult?.count ?? 0;
    const securityScore =
      totalFindings > 0
        ? Math.round(((totalFindings - activeThreats) / totalFindings) * 100)
        : 100;

    return {
      success: true,
      activeThreats,
      securityScore,
      shieldedSecrets: totalFindings,
      ruleDistribution: ruleDistResult,
      recentFindings: recentResult,
      scanHistory: scanHistoryResult,
    };
  } catch (err) {
    console.error('[getDashboardStats] Error:', err);
    return { success: false, error: 'Failed to fetch dashboard stats.' };
  }
}
