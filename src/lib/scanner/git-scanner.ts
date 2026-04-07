import simpleGit from 'simple-git';
import { PATTERNS } from './patterns';
import type { GitCommitFinding, TraceResult } from '@/types/scanner';

//Consts
const COMMIT_DEPTH = 50;

//Snippet Extractor
function extractSnippet(lineContent: string, match: string): string {
  const idx = lineContent.indexOf(match);
  if (idx === -1) return lineContent.trim();
  const start = Math.max(0, idx - 30);
  const end = Math.min(lineContent.length, idx + match.length + 30);
  const snippet = lineContent.slice(start, end).trim();
  return start > 0
    ? `…${snippet}`
    : snippet.length < lineContent.length
      ? `${snippet}…`
      : snippet;
}

//Analysis
function analyzeLine(
  line: string,
  commitHash: string,
  author: string,
  date: string,
): Omit<GitCommitFinding, 'path'>[] {
  const findings: Omit<GitCommitFinding, 'path'>[] = [];

  for (const rule of PATTERNS) {
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.regex.exec(line)) !== null) {
      findings.push({
        line: 0,
        confidence: 0.8,
        snippet: extractSnippet(line, match[0]),
        rule: rule.name,
        severity: rule.severity,
        commitHash,
        author,
        date,
      });
    }
  }

  return findings;
}
