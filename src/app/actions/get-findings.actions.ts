'use server';

import { db } from '@/lib/db';
import { findings } from '@/lib/db/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import type { FindingsResult } from './scan-types';
import { FindingsQuerySchema } from './scan-types';

export async function getFindings(input: unknown): Promise<FindingsResult> {
  const parsed = FindingsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { scanId, severity, limit, offset } = parsed.data;

  try {
    const conditions = [];
    if (scanId !== undefined) conditions.push(eq(findings.scanId, scanId));
    if (severity) conditions.push(eq(findings.severity, severity));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [itemsResult, countResult] = await Promise.all([
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
        .where(whereClause)
        .orderBy(desc(findings.id))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(findings).where(whereClause),
    ]);

    return {
      success: true,
      items: itemsResult,
      total: countResult[0]?.count ?? 0,
    };
  } catch (err) {
    console.error('[getFindings] Error:', err);
    return { success: false, error: 'Failed to fetch findings.' };
  }
}
