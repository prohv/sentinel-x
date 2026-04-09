'use server';

import { db } from '@/lib/db';
import { findings, scans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { traceSecret } from '@/lib/scanner/git-scanner';
import { type FindingRow } from './scan-types';
import { type TraceResult } from '@/types/scanner';

// Reusing extraction logic from purge-secret
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

export interface ForensicsResult {
  success: boolean;
  finding?: FindingRow;
  trace?: TraceResult;
  error?: string;
}

export async function getSecretForensics(
  findingId: number,
): Promise<ForensicsResult> {
  try {
    const result = await db
      .select({
        finding: findings,
        scan: scans,
      })
      .from(findings)
      .innerJoin(scans, eq(findings.scanId, scans.id))
      .where(eq(findings.id, findingId))
      .limit(1);

    if (result.length === 0)
      return { success: false, error: 'Finding not found' };

    const { finding, scan } = result[0];
    const secret = extractSecret(finding.snippet, finding.rule);

    if (!secret)
      return { success: false, error: 'Could not extract secret from snippet' };

    const trace = await traceSecret(scan.repoPath, secret);

    return {
      success: true,
      finding,
      trace,
    };
  } catch (err) {
    console.error('[getSecretForensics] error:', err);
    return { success: false, error: String(err) };
  }
}
