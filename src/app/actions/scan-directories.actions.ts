'use server';

import { resolve } from 'path';
import { discoverRepos, findNearestAnchor } from '@/lib/scanner/discovery';
import type { DiscoveredRepo } from '@/lib/scanner/discovery';

export type DirEntry = DiscoveredRepo;

export async function scanDirectories(
  rootPath?: string,
): Promise<
  | { success: true; dirs: DirEntry[]; autoPath?: string }
  | { success: false; error: string }
> {
  const cwd = process.cwd();

  // 1. Boundary: Handle Upward Traversal to find anchor
  const anchorPath = await findNearestAnchor(cwd);

  // 2. Resolve Search Root
  // Priority: argument -> CLI env var -> Detected Anchor -> CWD
  const scanRoot =
    rootPath ?? process.env.SENTINEL_SCAN_PATH ?? anchorPath ?? cwd;

  try {
    // 3. Perform Bounded BFS Search
    const dirs = await discoverRepos(scanRoot);

    // 4. Heuristic: If we are inside a repo, it should be the auto-detected one
    if (anchorPath) {
      const anchorInDirs = dirs.find((d) => d.path === anchorPath);
      if (anchorInDirs) {
        anchorInDirs.isAutoDetected = true;
      } else {
        // If it wasn't in the sub-search but we found it upwardly,
        // add it explicitly as the "Hero" repo
        const { basename } = await import('path');
        const { stat } = await import('fs/promises');
        const gitPath = resolve(anchorPath, '.git');
        let isGit = false;
        try {
          isGit = (await stat(gitPath)).isDirectory();
        } catch {}

        dirs.unshift({
          name: basename(anchorPath),
          path: anchorPath,
          isGitRepo: isGit,
          isAutoDetected: true,
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
