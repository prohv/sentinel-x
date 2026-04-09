'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, PlusCircle, Loader2, X, Flame } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useStartScan } from '@/hooks/use-start-scan';
import { useScanDirectories } from '@/hooks/use-scan-directories';
import { useBatchPurge } from '@/components/dashboard/BatchPurgeContext';
import { BatchPurgeModal } from '@/components/dashboard/BatchPurgeModal';

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

  const { isBatchMode, setBatchMode, selectedIds } = useBatchPurge();
  const [showBatchWarning, setShowBatchWarning] = useState(false);
  const [showBatchPurge, setShowBatchPurge] = useState(false);

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
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center text-white shrink-0 overflow-hidden">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Sentinel-X Logo"
                width={36}
                height={36}
                className="object-contain"
              />
            </Link>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-epilogue font-bold text-lg text-zinc-900 leading-tight">
                Sentinel X
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
          {!isBatchMode ? (
            <button
              onClick={() => setShowBatchWarning(true)}
              className="flex items-center gap-2 bg-purple-100 text-purple-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors font-manrope shadow-sm"
            >
              <Flame size={16} />
              <span className="hidden sm:inline">Batch Purge</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBatchMode(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors font-manrope"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBatchPurge(true)}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-2 bg-violet-950 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-900 transition-all font-manrope shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Flame size={16} />
                <span className="hidden sm:inline">
                  Purge {selectedIds.length}
                </span>
              </button>
            </div>
          )}

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

      {showBatchWarning && (
        <BatchWarningModal
          onClose={() => setShowBatchWarning(false)}
          onAccept={() => {
            setShowBatchWarning(false);
            setBatchMode(true);
          }}
        />
      )}

      {showBatchPurge && (
        <BatchPurgeModal
          selectedIds={selectedIds}
          onClose={() => {
            setShowBatchPurge(false);
            setBatchMode(false);
          }}
        />
      )}
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

function BatchWarningModal({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <Flame className="text-rose-500" size={20} />
          </div>
          <h3 className="font-epilogue font-bold text-xl text-zinc-900">
            Batch Purge Mode
          </h3>
        </div>

        <div className="space-y-4 font-manrope text-sm text-zinc-600 leading-relaxed bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
          <p>
            You are entering <strong>Targeted Batch Mode</strong>. This allows
            you to select multiple secrets to be permanently eradicated from
            your repository&apos;s Git history.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-rose-700/80 font-medium">
            <li>Do not push or pull code during this operation.</li>
            <li>
              The process will be run sequentially to avoid `.git` lock
              corruption.
            </li>
            <li>
              This action is irreversible. Ensure you know what you are
              targeting.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-zinc-600 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-colors"
          >
            I understand, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
