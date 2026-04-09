import { readdir, stat } from 'fs/promises';
import { join, basename, dirname, resolve } from 'path';
import { homedir } from 'os';

export interface DiscoveredRepo {
  name: string;
  path: string;
  isGitRepo: boolean;
  isAutoDetected?: boolean;
}

const MAX_DEPTH = 3;
const PRUNING_LIST = new Set([
  'node_modules',
  'bower_components',
  '.git',
  '.svn',
  '.hg',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  'temp',
  'tmp',
  'cache',
  'vendor',
]);

const SIGNATURES = [
  '.git',
  'package.json',
  'go.mod',
  'cargo.toml',
  'sentinel.config.json',
];

/**
 * Discovery Engine: Bounded BFS Repository Search
 * Implementation of the "No-Overkill" blueprint.
 */

async function isRepo(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries.some((entry) => SIGNATURES.includes(entry.name));
  } catch {
    return false;
  }
}

async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    const gitPath = join(dirPath, '.git');
    const s = await stat(gitPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Finds the nearest repository anchor by walking UP from startPath
 * Stops at home directory or root.
 */
export async function findNearestAnchor(
  startPath: string,
): Promise<string | null> {
  let current = resolve(startPath);
  const home = homedir();

  while (current !== dirname(current)) {
    if (await isRepo(current)) return current;
    if (current === home) break;
    current = dirname(current);
  }

  return null;
}

/**
 * Bounded BFS search for repositories
 */
export async function discoverRepos(
  scanRoot: string,
): Promise<DiscoveredRepo[]> {
  const discovered: DiscoveredRepo[] = [];
  const queue: { path: string; depth: number }[] = [
    { path: scanRoot, depth: 0 },
  ];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const { path, depth } = queue.shift()!;

    if (depth > MAX_DEPTH) continue;
    if (seen.has(path)) continue;
    seen.add(path);

    // If this folder itself is a repo, add it and STOP descending
    if (await isRepo(path)) {
      discovered.push({
        name: basename(path) || path,
        path: path,
        isGitRepo: await isGitRepo(path),
      });
      continue; // Boundary rule: Do not look for repos inside repos
    }

    // Otherwise, explore children if depth permits
    if (depth < MAX_DEPTH) {
      try {
        const entries = await readdir(path, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          if (entry.name.startsWith('.')) {
            // Only allow .git at the root anchor check, prune hidden folders during walk
            if (entry.name !== '.git') continue;
          }
          if (PRUNING_LIST.has(entry.name)) continue;

          queue.push({
            path: join(path, entry.name),
            depth: depth + 1,
          });
        }
      } catch (err) {
        // Skip inaccessible folders
      }
    }
  }

  return discovered;
}
