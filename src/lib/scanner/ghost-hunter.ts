import { Glob } from 'bun';
import path from 'node:path';
import type { GhostFinding, PatternRule } from '@/types/scanner';

//Consts
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '.out',
  'vendor',
]);

const MAX_FILE_SIZE = parseInt(process.env.MAX_SCAN_SIZE || '5242880', 10); // 5 MB

//Pattern Library
const PATTERNS: PatternRule[] = [
  {
    name: 'GitHub Token',
    regex: /ghp_[A-Za-z0-9_]{36,}/g,
    severity: 'critical',
  },
  {
    name: 'Stripe Secret Key',
    regex: /sk_(live|test)_[A-Za-z0-9]{20,}/g,
    severity: 'critical',
  },
  {
    name: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
  },
  {
    name: 'Generic API Key',
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})/gi,
    severity: 'high',
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    severity: 'critical',
  },
  {
    name: 'Password Assignment',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^\s"']{8,})/gi,
    severity: 'high',
  },
  {
    name: 'Connection String',
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s"'`]+/gi,
    severity: 'high',
  },
];

//Entropy Calculation
function shannonEntropy(input: string): number {
  if (!input) return 0;
  const freq: Record<string, number> = {};
  for (const c of input) freq[c] = (freq[c] || 0) + 1;

  let entropy = 0;
  const len = input.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

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

//ENV Loader (Taint Baseline)
async function loadEnvKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  try {
    const envFile = Bun.file('.env');
    if (envFile.size > 0) {
      const text = await envFile.text();
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key] = trimmed.split('=');
          if (key) keys.add(key.trim());
        }
      }
    }
  } catch {
    // if .env doesn't exist — no taint baseline
  }
  return keys;
}

//Core
export async function* ghostHunter(
  rootDir: string = process.cwd(),
): AsyncGenerator<GhostFinding, void, unknown> {
  const envKeys = await loadEnvKeys();

  //async file discovery
  const scanner = new Glob('**/*').scan({ dot: true, cwd: rootDir });

  for await (const filePath of scanner) {
    const fullPath = path.join(rootDir, filePath);

    //skip extra
    const parts = filePath.split(/[\\/]/);
    if (parts.some((part: string) => IGNORED_DIRS.has(part))) continue;

    //read file
    const file = Bun.file(fullPath);
    if (file.size > MAX_FILE_SIZE) continue;
    if (file.size === 0) continue;

    const text = await file.text();
    const lines = text.split('\n');

    // + entropy + taint analysis
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const rule of PATTERNS) {
        // Reset regex state
        rule.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = rule.regex.exec(line)) !== null) {
          const matched = match[0];

          //Entropy boost for unknown formats
          let confidence = 0.7; //baseline for pattern match
          if (rule.entropyThreshold !== undefined) {
            const entropy = shannonEntropy(matched);
            if (entropy >= rule.entropyThreshold) {
              confidence = Math.min(1, confidence + 0.2);
            }
          }

          //Taint check
          for (const key of envKeys) {
            if (line.includes(key) && filePath !== '.env') {
              confidence = 1.0;
              break;
            }
          }

          //yield structured finding
          yield {
            path: filePath,
            line: lineNum + 1, // 1-based for display
            confidence,
            snippet: extractSnippet(line, matched),
            rule: rule.name,
            severity: rule.severity,
          };
        }
      }
    }
  }
}
