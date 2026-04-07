'use server';

import { db } from '@/lib/db';
import { scans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ScanStatusResult } from './scan-types';

export async function getScanStatus(scanId: number): Promise<ScanStatusResult> {
  try {
    const scan = await db.query.scans.findFirst({
      where: eq(scans.id, scanId),
    });

    if (!scan) {
      return { success: false, error: 'Scan not found' };
    }

    return {
      success: true,
      id: scan.id,
      type: scan.type,
      status: scan.status,
      startedAt: scan.startedAt,
      finishedAt: scan.finishedAt,
      repoPath: scan.repoPath,
      totalFindings: scan.totalFindings,
      checkpoint: scan.checkpoint,
    };
  } catch (err) {
    console.error('[getScanStatus] Error:', err);
    return { success: false, error: 'Failed to get scan status.' };
  }
}
