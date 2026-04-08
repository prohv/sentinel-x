'use server';

import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';

export type DirEntry = {
  name: string;
  path: string;
  isGitRepo: boolean;
};

export async function scanDirectories(
  rootPath: string = resolve(process.cwd(), '..'),
): Promise<
  { success: true; dirs: DirEntry[] } | { success: false; error: string }
> {
  try {
    const entries = await readdir(rootPath, { withFileTypes: true });

    const dirs: DirEntry[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Skip hidden dirs except those that might be repos
      if (entry.name.startsWith('.') && entry.name !== '.github') continue;

      // Skip common non-repo directories
      const skipDirs = new Set([
        'node_modules',
        '.next',
        'dist',
        'build',
        '.git',
        'vendor',
      ]);
      if (skipDirs.has(entry.name)) continue;

      const fullPath = join(rootPath, entry.name);

      // Check if it's a git repo (has .git folder)
      let isGitRepo = false;
      try {
        const gitPath = join(fullPath, '.git');
        const gitStat = await stat(gitPath);
        isGitRepo = gitStat.isDirectory();
      } catch {
        // Not a git repo, but still include it
      }

      dirs.push({
        name: entry.name,
        path: fullPath,
        isGitRepo,
      });
    }

    // Sort: git repos first, then alphabetically
    dirs.sort((a, b) => {
      if (a.isGitRepo !== b.isGitRepo) return b.isGitRepo ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, dirs };
  } catch (err) {
    console.error('[scanDirectories] Error:', err);
    return { success: false, error: 'Failed to scan directories.' };
  }
}
