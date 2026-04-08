import { spawn } from 'node:child_process';
import simpleGit from 'simple-git';
import { PATTERNS } from './patterns';
import type { GitCommitFinding, TraceResult } from '@/types/scanner';

//Consts
const COMMIT_DEPTH = 50;

//Sieve — fast gate for clean lines
const MASTER_PATTERN = new RegExp(
  PATTERNS.map((p) => p.regex.source).join('|'),
  'gi',
);

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

  //fast gate: skip clean lines
  if (!MASTER_PATTERN.test(line)) return findings;

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
      const [hash, author, date] = entry.split('|');
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
    firstSeen: touched[touched.length - 1] ?? null,
    lastSeen: touched[0] ?? null,
    touchedCommits: [...touched].reverse(),
  };
}

//Core: scan last N commits
export async function scanRecentHistory(
  repoPath: string,
  depth: number = COMMIT_DEPTH,
): Promise<GitCommitFinding[]> {
  console.log(`[scanRecentHistory] Scanning: ${repoPath}, depth: ${depth}`);
  const git = simpleGit(repoPath);
  const findings: GitCommitFinding[] = [];

  let log;
  try {
    log = await git.log({ maxCount: depth });
  } catch (err) {
    console.error('[scanRecentHistory] Failed to read git log:', err);
    return [];
  }

  console.log(`[scanRecentHistory] Found ${log.all.length} commits`);

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

  console.log(`[scanRecentHistory] Total findings: ${findings.length}`);
  return findings;
}

//Core: full history walk with progress callback
export async function* auditFullHistory(
  repoPath: string,
  _fromCheckpoint?: string,
): AsyncGenerator<
  GitCommitFinding,
  { totalScanned: number; checkpoint: string | null },
  unknown
> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _checkpoint = _fromCheckpoint;
  let totalScanned = 0;
  let checkpoint: string | null = null;

  //single stream
  const proc = spawn(
    'git',
    [
      'log',
      '-p',
      '--all',
      '--unified=0',
      '--format=COMMIT_START%n%H%n%an%n%aI',
    ],
    { cwd: repoPath },
  );

  if (!proc.stdout) {
    console.error('[auditFullHistory] No stdout from git log');
    return { totalScanned: 0, checkpoint: null };
  }

  proc.stderr?.on('data', (data: Buffer) => {
    console.error('[auditFullHistory] git stderr:', data.toString());
  });

  proc.on('error', (err) => {
    console.error('[auditFullHistory] Process error:', err);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[auditFullHistory] git log exited with code ${code}`);
    }
  });

  const decoder = new TextDecoder();
  let buffer = '';
  let currentHash = '';
  let currentAuthor = '';
  let currentDate = '';
  let lineState: 'idle' | 'hash' | 'author' | 'date' = 'idle';

  for await (const chunk of proc.stdout) {
    buffer += decoder.decode(chunk, { stream: true });

    while (true) {
      const nl = buffer.indexOf('\n');
      if (nl === -1) break;

      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);

      if (line === 'COMMIT_START') {
        lineState = 'hash';
        continue;
      }

      if (lineState === 'hash') {
        currentHash = line;
        currentAuthor = '';
        currentDate = '';
        lineState = 'author';
        continue;
      }

      if (lineState === 'author') {
        currentAuthor = line;
        lineState = 'date';
        continue;
      }

      if (lineState === 'date') {
        currentDate = line;
        lineState = 'idle';
        totalScanned++;
        checkpoint = currentHash;
        continue;
      }

      //diff lines
      if (
        currentHash &&
        (line.startsWith('+') || line.startsWith('-')) &&
        !line.startsWith('---') &&
        !line.startsWith('+++')
      ) {
        const lineFindings = analyzeLine(
          line,
          currentHash,
          currentAuthor || 'unknown',
          currentDate,
        );

        for (const f of lineFindings) {
          yield { ...f, path: `git:${currentHash}` };
        }
      }
    }
  }

  return { totalScanned, checkpoint };
}

//Core: dangling blobs from reflog
export async function* huntOrphanBlobs(
  repoPath: string,
): AsyncGenerator<GitCommitFinding, { totalScanned: number }, unknown> {
  let totalScanned = 0;

  //collect blob hashes
  let objectsOutput: string;
  try {
    const git = simpleGit(repoPath);
    objectsOutput = await git.raw('rev-list', '--objects', '--all', '--reflog');
  } catch (err) {
    console.error('[huntOrphanBlobs] Failed to read git objects:', err);
    return { totalScanned: 0 };
  }

  const blobs: { hash: string; filePath: string }[] = [];
  for (const blobLine of objectsOutput
    .split('\n')
    .filter((line) => line.trim() && line.includes(' '))) {
    const [hash, ...pathParts] = blobLine.trim().split(' ');
    const filePath = pathParts.join(' ');
    if (hash && filePath) blobs.push({ hash, filePath });
  }

  if (blobs.length === 0) return { totalScanned: 0 };

  //batch feed all hashes at once
  const proc = spawn('git', ['cat-file', '--batch'], { cwd: repoPath });

  if (!proc.stdin || !proc.stdout) {
    return { totalScanned: 0 };
  }

  //write all hashes to stdin
  for (const blob of blobs) {
    proc.stdin.write(blob.hash + '\n');
  }
  proc.stdin.end();

  //parse batch output
  const decoder = new TextDecoder();
  let buffer = '';
  let currentFilePath = '';
  let remainingBytes = 0;

  //build hash→filepath map for lookup
  const blobMap = new Map(blobs.map((b) => [b.hash, b.filePath]));

  proc.stderr?.on('data', (data: Buffer) => {
    console.error('[huntOrphanBlobs]', data.toString());
  });

  for await (const chunk of proc.stdout) {
    buffer += decoder.decode(chunk, { stream: true });

    while (true) {
      if (remainingBytes > 0) {
        //reading blob content
        if (buffer.length < remainingBytes) break;

        const content = buffer.slice(0, remainingBytes);
        buffer = buffer.slice(remainingBytes);
        remainingBytes = 0;

        //strip trailing \n from content
        const lines = content.endsWith('\n')
          ? content.slice(0, -1).split('\n')
          : content.split('\n');

        for (const line of lines) {
          const lineFindings = analyzeLine(line, `orphan:batch`, 'orphan', '');

          for (const f of lineFindings) {
            yield { ...f, path: `orphan:${currentFilePath}` };
          }
        }

        totalScanned++;
        continue;
      }

      //parse header: "<hash> blob <size>"
      const nl = buffer.indexOf('\n');
      if (nl === -1) break;

      const header = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);

      const parts = header.split(' ');
      if (parts.length < 3) {
        //skip malformed headers
        continue;
      }

      const hash = parts[0];
      const size = parseInt(parts[2], 10);
      if (isNaN(size)) continue;

      currentFilePath = blobMap.get(hash) || '';
      remainingBytes = size;
    }
  }

  return { totalScanned };
}
