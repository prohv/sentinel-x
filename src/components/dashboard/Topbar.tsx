'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, PlusCircle, Loader2, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useStartScan } from '@/hooks/use-start-scan';
import { useScanDirectories } from '@/hooks/use-scan-directories';

const REPO_PATH_KEY = 'sentinel-x-repo-path';

function getCurrentRepoPath(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REPO_PATH_KEY) || '';
}

function extractRepoName(repoPath: string): string {
  if (!repoPath) return 'No repository selected';
  // Extract last folder name from path
  const parts = repoPath.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || repoPath;
}

type ScanType = 'ghost_hunter' | 'git_recent' | 'git_full' | 'git_orphan';

export function Topbar() {
  return (
    <Suspense fallback={<TopbarSkeleton />}>
      <TopbarInner />
    </Suspense>
  );
}

function TopbarSkeleton() {
  return (
    <header className="flex items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
          <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="w-full h-10 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-10 w-24 bg-zinc-200 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    </header>
  );
}

function TopbarInner() {
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [currentRepoPath, setCurrentRepoPath] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setCurrentRepoPath(getCurrentRepoPath());
    // Defer initial read to a callback (not synchronously in effect body)
    const id = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('q', searchTerm);
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router, searchParams]);

  return (
    <>
      <header className="flex items-center justify-between gap-4 w-full">
        {/* Left: Logo + Greeting + Repo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center text-white shrink-0 overflow-hidden">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Sentinel-X Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </Link>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-epilogue font-bold text-lg text-zinc-900 leading-tight">
                shado
              </h1>
              <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="font-manrope text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
              Repository:{' '}
              <span className="font-mono text-zinc-800 font-medium">
                {currentRepoPath ? extractRepoName(currentRepoPath) : '—'}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full text-zinc-400 focus-within:text-violet-600 transition-colors shadow-sm rounded-lg">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search specific Rule IDs or File Paths..."
              className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-manrope placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors font-manrope shadow-sm"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">New Scan</span>
          </button>
        </div>
      </header>

      {showDialog && <ScanDialog onClose={() => setShowDialog(false)} />}
    </>
  );
}

function ScanDialog({ onClose }: { onClose: () => void }) {
  const lastRepoPath = getCurrentRepoPath();
  const startScan = useStartScan();
  const { data: dirsData, isLoading: dirsLoading } = useScanDirectories();
  const dirs = dirsData?.success ? dirsData.dirs : [];

  const [repoPath, setRepoPath] = useState(
    lastRepoPath || (dirs.length > 0 ? dirs[0].path : ''),
  );
  const [scanType, setScanType] = useState<ScanType>('ghost_hunter');

  async function handleStart() {
    const result = await startScan.mutateAsync({ repoPath, scanType });
    if (result.success) {
      localStorage.setItem(REPO_PATH_KEY, repoPath);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
        >
          <X size={18} />
        </button>

        <h3 className="font-epilogue font-semibold text-lg text-zinc-900 mb-4">
          New Scan
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Repository
            </label>
            {dirsLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500">
                <Loader2 size={14} className="animate-spin" /> Loading
                repositories...
              </div>
            ) : (
              <select
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              >
                {dirs.map((dir) => (
                  <option key={dir.path} value={dir.path}>
                    🔀 {dir.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Scan Type
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value as ScanType)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option value="ghost_hunter">Ghost Hunter (filesystem)</option>
              <option value="git_recent">Git Recent (last 50 commits)</option>
              <option value="git_full">Git Full (all history)</option>
              <option value="git_orphan">Git Orphan (dangling blobs)</option>
            </select>
          </div>

          {startScan.isPending && (
            <p className="text-sm text-zinc-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Starting scan...
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={startScan.isPending || !repoPath.trim()}
            className="w-full rounded-lg bg-violet-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {startScan.isPending ? 'Starting...' : 'Start Scan'}
          </button>
        </div>
      </div>
    </div>
  );
}
