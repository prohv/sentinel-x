import { z } from 'zod';

// Shared types for scan actions
export type ScanType =
  | 'ghost_hunter'
  | 'git_recent'
  | 'git_full'
  | 'git_orphan';

export type ScanStatus = 'running' | 'completed' | 'failed';

export type FindingRow = {
  id: number;
  scanId: number;
  rule: string;
  severity: string;
  path: string;
  line: number;
  confidence: number;
  snippet: string;
  status: string;
  commitHash: string | null;
  author: string | null;
  scanType?: string | null;
  repoPath?: string | null;
};

export type ScanRow = {
  id: number;
  type: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  repoPath: string;
  totalFindings: number;
};

export type RuleDist = {
  rule: string;
  count: number;
};

// Action result types
export type StartScanResult =
  | { success: true; scanId: number }
  | { success: false; error: string };

export type ScanStatusResult =
  | {
      success: true;
      id: number;
      type: string;
      status: string;
      startedAt: Date;
      finishedAt: Date | null;
      repoPath: string;
      totalFindings: number;
      checkpoint: string | null;
    }
  | { success: false; error: string };

export type FindingsResult =
  | { success: true; items: FindingRow[]; total: number }
  | { success: false; error: string };

export type DashboardStatsResult =
  | {
      success: true;
      activeThreats: number;
      securityScore: number;
      shieldedSecrets: number;
      ruleDistribution: RuleDist[];
      recentFindings: FindingRow[];
      scanHistory: ScanRow[];
    }
  | { success: false; error: string };

// Validation schemas
export const StartScanSchema = z.object({
  repoPath: z
    .string()
    .min(1, 'Repo path is required')
    .refine((p) => !p.includes('\0'), 'Invalid path characters'),
  scanType: z.enum(['ghost_hunter', 'git_recent', 'git_full', 'git_orphan']),
});

export const FindingsQuerySchema = z.object({
  scanId: z.number().optional(),
  severity: z.string().optional(),
  searchQuery: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});
