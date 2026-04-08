'use client';

import {
  Settings,
  FileBarChart2,
  Activity,
  Clock,
  Loader2,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const statusStyle: Record<
  string,
  { dot: string; label: (s: string, f: number) => string }
> = {
  running: {
    dot: 'bg-violet-500 ring-4 ring-violet-200 animate-pulse',
    label: () => 'In Progress',
  },
  completed: {
    dot: 'bg-emerald-500',
    label: (_, f) => `Found ${f} ghosts`,
  },
  failed: {
    dot: 'bg-rose-500',
    label: () => 'Scan failed',
  },
};

export function SidebarLog() {
  const { data, isLoading } = useDashboardStats();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const scans = data?.success ? data.scanHistory : [];
  const hasActiveScan = scans.some((s) => s.status === 'running');

  const handleReportClick = () => {
    setIsNavigating(true);
    router.push('/dashboard/report');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Scan History */}
      <div className="flex-1 px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-epilogue font-semibold text-lg text-zinc-900 flex items-center gap-2">
            <Activity size={20} className="text-violet-600" />
            The Sentinel Log
          </h2>
          {hasActiveScan && (
            <span className="text-xs font-manrope font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded-full">
              Live Monitor
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-zinc-300" size={24} />
          </div>
        ) : scans.length === 0 ? (
          <p className="text-zinc-400 text-sm font-manrope text-center py-8">
            No scans yet. Hit &quot;New Scan&quot; to get started.
          </p>
        ) : (
          <div className="relative mt-6">
            <div className="absolute top-2 bottom-0 left-[11px] w-0.5 bg-zinc-200 z-0" />

            <div className="space-y-10 relative z-10">
              {scans.map((scan) => {
                const style = statusStyle[scan.status] ?? statusStyle.completed;
                const time = scan.startedAt
                  ? formatTimeAgo(scan.startedAt)
                  : '';

                return (
                  <div key={scan.id} className="flex items-start gap-4">
                    <div className="bg-zinc-50/50 p-1.5 rounded-full shrink-0 relative">
                      <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                    </div>
                    <div className="flex-1 flex justify-between items-start pt-0.5">
                      <div>
                        <p className="font-manrope font-semibold text-sm text-zinc-900">
                          {scanTypeLabel(scan.type)}
                        </p>
                        <p
                          className={`font-manrope text-xs mt-1 ${
                            scan.status === 'running'
                              ? 'text-violet-600 font-medium'
                              : scan.status === 'failed'
                                ? 'text-rose-500'
                                : 'text-zinc-500'
                          }`}
                        >
                          {style.label(scan.status, scan.totalFindings)}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-zinc-200 shadow-sm">
                        <Clock size={10} /> {time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-6 pt-6 pb-8 border-t border-zinc-200 bg-white">
        <h2 className="font-epilogue font-semibold text-sm text-zinc-500 mb-4 uppercase tracking-widest">
          Quick Actions
        </h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReportClick}
            disabled={isNavigating}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-violet-50 text-left transition-colors text-sm font-manrope text-zinc-700 bg-white border border-zinc-200 shadow-sm group hover:border-violet-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-violet-100 flex items-center justify-center text-zinc-600 group-hover:text-violet-600 transition-colors">
              {isNavigating ? (
                <Loader2 size={16} className="animate-spin text-violet-600" />
              ) : (
                <FileBarChart2 size={16} />
              )}
            </div>
            <div>
              <span className="font-semibold block text-zinc-900">
                {isNavigating ? 'Generating...' : 'Export Report'}
              </span>
              <span className="text-[11px] text-zinc-400">
                Management-ready briefing
              </span>
            </div>
          </button>

          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-50 text-left transition-colors text-sm font-manrope text-zinc-700 bg-white border border-zinc-200 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
              <Settings size={16} />
            </div>
            <span className="font-medium">Rule Configurations</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function scanTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ghost_hunter: 'Ghost Hunter Scan',
    git_recent: 'Recent Git Scan',
    git_full: 'Full Git History',
    git_orphan: 'Orphan Blob Hunt',
  };
  return labels[type] ?? type;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 5) return 'Now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
