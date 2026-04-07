export interface GhostFinding {
  path: string;
  line: number;
  confidence: number; // 0–1
  snippet: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PatternRule {
  name: string;
  regex: RegExp;
  severity: GhostFinding['severity'];
  entropyThreshold?: number;
}

export interface GitCommitFinding extends GhostFinding {
  commitHash: string;
  author: string;
  date: string;
}

export interface TraceResult {
  secret: string;
  firstSeen: {
    commitHash: string;
    author: string;
    date: string;
    file: string;
  } | null;
  lastSeen: {
    commitHash: string;
    author: string;
    date: string;
    file: string;
  } | null;
  touchedCommits: {
    commitHash: string;
    author: string;
    date: string;
    file: string;
  }[];
}
