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
