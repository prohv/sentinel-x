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

//Core: find exact commit where a secret appeared/deleted
export async function traceSecret(
  repoPath: string,
  secret: string,
): Promise<TraceResult> {
  const git = simpleGit(repoPath);
  const touched: {
    commitHash: string;
    author: string;
    date: string;
    file: string;
  }[] = [];

  try {
    const pickaxe = await git.raw(
      'log',
      '-S',
      secret,
      '--format=%H|%an|%aI|%s',
      '--',
    );

    for (const entry of pickaxe.split('\n').filter(Boolean)) {
      const [hash, author, date, subject] = entry.split('|');
      if (!hash) continue;

      //to find which file changed in this commit
      const changed = await git.raw(
        'diff-tree',
        '--no-commit-id',
        '--name-only',
        '-r',
        hash,
      );
      const file = changed.split('\n').filter(Boolean)[0] || '';

      touched.push({
        commitHash: hash,
        author: author ?? '',
        date: date ?? '',
        file,
      });
    }
  } catch {
    return { secret, firstSeen: null, lastSeen: null, touchedCommits: [] };
  }

  return {
    secret,
    firstSeen: touched[0] ?? null,
    lastSeen: touched[touched.length - 1] ?? null,
    touchedCommits: touched,
  };
}

//Core: scan last N commits
export async function scanRecentHistory(
  repoPath: string,
  depth: number = COMMIT_DEPTH,
): Promise<GitCommitFinding[]> {
  const git = simpleGit(repoPath);
  const findings: GitCommitFinding[] = [];

  let log;
  try {
    log = await git.log({ maxCount: depth });
  } catch {
    return [];
  }

  for (const commit of log.all) {
    const diff = await git.show([commit.hash, '--unified=0']);
    const addedLines = diff
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'));

    for (const line of addedLines) {
      const lineFindings = analyzeLine(
        line,
        commit.hash,
        commit.author_name || 'unknown',
        commit.date || '',
      );

      for (const f of lineFindings) {
        findings.push({ ...f, path: `git:${commit.hash}` });
      }
    }
  }

  return findings;
}

//Core: full history walk with progress callback
export async function* auditFullHistory(
  repoPath: string,
  fromCheckpoint?: string,
): AsyncGenerator<
  GitCommitFinding,
  { totalScanned: number; checkpoint: string | null },
  unknown
> {
  const git = simpleGit(repoPath);
  let totalScanned = 0;
  let checkpoint: string | null = null;

  let allHashes: string[];
  try {
    const list = await git.raw('rev-list', '--all');
    allHashes = list.split('\n').filter(Boolean);

    // resume from checkpoint
    if (fromCheckpoint) {
      const idx = allHashes.indexOf(fromCheckpoint);
      if (idx !== -1) allHashes = allHashes.slice(idx + 1);
    }
  } catch {
    return { totalScanned: 0, checkpoint: null };
  }

  for (const hash of allHashes) {
    let logEntry;
    try {
      logEntry = (await git.log({ maxCount: 1, from: hash })).latest;
    } catch {
      continue;
    }

    if (!logEntry) continue;

    const diff = await git.show([hash, '--unified=0']);
    const changedLines = diff
      .split('\n')
      .filter(
        (line) =>
          (line.startsWith('+') || line.startsWith('-')) &&
          !line.startsWith('---') &&
          !line.startsWith('+++'),
      );

    for (const line of changedLines) {
      const lineFindings = analyzeLine(
        line,
        hash,
        logEntry.author_name || 'unknown',
        logEntry.date || '',
      );

      for (const f of lineFindings) {
        yield { ...f, path: `git:${hash}` };
      }
    }

    totalScanned++;
    checkpoint = hash;
  }

  return { totalScanned, checkpoint };
}
