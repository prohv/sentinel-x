'use server';

import { readdir, stat } from 'fs/promises';
import { join, resolve, basename } from 'path';

export type DirEntry = {
  name: string;
  path: string;
  isGitRepo: boolean;
  isAutoDetected?: boolean;
};

async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    const gitStat = await stat(join(dirPath, '.git'));
    return gitStat.isDirectory();
  } catch {
    return false;
  }
}

export async function scanDirectories(
  rootPath?: string,
): Promise<
  | { success: true; dirs: DirEntry[]; autoPath?: string }
  | { success: false; error: string }
> {
  // Priority: argument → CLI env var → parent of cwd (dev fallback)
  const scanRoot =
    rootPath ?? process.env.SENTINEL_SCAN_PATH ?? resolve(process.cwd(), '..');

  try {
    const dirs: DirEntry[] = [];

    // 1. Check if the scanRoot itself is a git repo (zero-config single-repo case)
    if (await isGitRepo(scanRoot)) {
      dirs.push({
        name: basename(scanRoot),
        path: scanRoot,
        isGitRepo: true,
        isAutoDetected: true,
      });
    }

    // 2. Shallow search — one level deep
    const entries = await readdir(scanRoot, { withFileTypes: true });

    const skipDirs = new Set([
      'node_modules',
      '.next',
      'dist',
      'build',
      '.git',
      'vendor',
    ]);

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (skipDirs.has(entry.name)) continue;

      const fullPath = join(scanRoot, entry.name);

      if (!(await isGitRepo(fullPath))) continue;

      // Don't duplicate if scanRoot itself was already added
      if (!dirs.find((d) => d.path === fullPath)) {
        dirs.push({
          name: entry.name,
          path: fullPath,
          isGitRepo: true,
          isAutoDetected: false,
        });
      }
    }

    // Sort: auto-detected first, then alphabetical
    dirs.sort((a, b) => {
      if (a.isAutoDetected && !b.isAutoDetected) return -1;
      if (!a.isAutoDetected && b.isAutoDetected) return 1;
      return a.name.localeCompare(b.name);
    });

    const autoPath = dirs.find((d) => d.isAutoDetected)?.path;

    return { success: true, dirs, autoPath };
  } catch (err) {
    console.error('[scanDirectories] Error:', err);
    return { success: false, error: 'Failed to scan directories.' };
  }
}
