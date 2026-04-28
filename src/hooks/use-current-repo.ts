'use client';

import { useState, useEffect } from 'react';

const REPO_PATH_KEY = 'sentinel-x-repo-path';

export function useCurrentRepo() {
  const [repoPath, setRepoPath] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const stored = localStorage.getItem(REPO_PATH_KEY);
      if (stored !== repoPath) {
        setRepoPath(stored || '');
      }
    };
    const id = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, [repoPath]);

  return repoPath;
}
