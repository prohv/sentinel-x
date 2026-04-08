'use server';

import { db } from '@/lib/db';
import { findings, scans } from '@/lib/db/schema';
import { eq, desc, count, and, like, or } from 'drizzle-orm';
import type { FindingsResult } from './scan-types';
import { FindingsQuerySchema } from './scan-types';

export async function getFindings(input: unknown): Promise<FindingsResult> {
  const parsed = FindingsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { scanId, severity, limit, offset, searchQuery, status } = parsed.data;

  try {
    const conditions = [];
    if (scanId !== undefined) conditions.push(eq(findings.scanId, scanId));
    if (severity) conditions.push(eq(findings.severity, severity));
    if (status) conditions.push(eq(findings.status, status));
    if (searchQuery) {
      conditions.push(
        or(
          like(findings.rule, `%${searchQuery}%`),
          like(findings.path, `%${searchQuery}%`),
        ),
      );
    }

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
          scanType: scans.type,
          repoPath: scans.repoPath,
        })
        .from(findings)
        .leftJoin(scans, eq(findings.scanId, scans.id))
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

export async function exportFindingsCSV(): Promise<
  { success: true; csv: string } | { success: false; error: string }
> {
  try {
    const allFindings = await db
      .select({
        id: findings.id,
        rule: findings.rule,
        severity: findings.severity,
        path: findings.path,
        line: findings.line,
        status: findings.status,
        confidence: findings.confidence,
        author: findings.author,
        commitHash: findings.commitHash,
      })
      .from(findings)
      .orderBy(desc(findings.id));

    if (allFindings.length === 0) {
      return { success: false, error: 'No findings to export.' };
    }

    const headers = [
      'ID',
      'Rule',
      'Severity',
      'Path',
      'Line',
      'Status',
      'Confidence',
      'Author',
      'Commit Hash',
    ];

    // Convert to sanitized CSV string
    const escapeCSV = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [headers.map(escapeCSV).join(',')];

    for (const f of allFindings) {
      const row = [
        f.id,
        f.rule,
        f.severity,
        f.path,
        f.line,
        f.status,
        `${f.confidence}%`,
        f.author || 'system',
        f.commitHash || 'N/A',
      ];
      csvLines.push(row.map(escapeCSV).join(','));
    }

    return { success: true, csv: csvLines.join('\n') };
  } catch (err) {
    console.error('[exportFindingsCSV] Error:', err);
    return { success: false, error: 'Failed to generate CSV export.' };
  }
}

export async function deleteFinding(id: number) {
  try {
    await db.delete(findings).where(eq(findings.id, id));
    return { success: true };
  } catch (err) {
    console.error('[deleteFinding] Error:', err);
    return { success: false, error: 'Failed to delete finding.' };
  }
}

export async function shieldFinding(id: number) {
  try {
    await db
      .update(findings)
      .set({ status: 'shielded' })
      .where(eq(findings.id, id));
    return { success: true };
  } catch (err) {
    console.error('[shieldFinding] Error:', err);
    return { success: false, error: 'Failed to shield finding.' };
  }
}

export async function shieldAllFindings() {
  try {
    await db
      .update(findings)
      .set({ status: 'shielded' })
      .where(eq(findings.status, 'open'));
    return { success: true };
  } catch (err) {
    console.error('[shieldAllFindings] Error:', err);
    return { success: false, error: 'Failed to bulk shield findings.' };
  }
}
