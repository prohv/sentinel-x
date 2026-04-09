'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft,
  GitCommit,
  User,
  Calendar,
  FileCode,
  Search,
  Activity,
  AlertTriangle,
  History,
} from 'lucide-react';
import Link from 'next/link';
import {
  getSecretForensics,
  type ForensicsResult,
} from '@/app/actions/forensics.actions';

export default function ForensicsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const findingId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ForensicsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!findingId) {
        setError('No finding ID provided');
        setLoading(false);
        return;
      }

      const result = await getSecretForensics(parseInt(findingId));
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to analyze history');
      }
      setLoading(false);
    }

    fetchData();
  }, [findingId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-64px)] bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center border border-violet-200 animate-pulse">
            <Search className="text-violet-600 animate-spin" size={24} />
          </div>
          <p className="font-epilogue font-bold text-zinc-900">
            Consulting Git Pickaxe...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 h-[calc(100vh-64px)] bg-zinc-50">
        <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-xl max-w-sm text-center">
          <AlertTriangle className="text-rose-500 mx-auto mb-4" size={32} />
          <h2 className="font-epilogue font-bold text-lg text-zinc-900 mb-2">
            Forensics Failed
          </h2>
          <p className="text-sm text-zinc-500 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const history = data.trace?.touchedCommits || [];

  return (
    <div className="flex-1 h-[calc(100vh-64px)] bg-zinc-50 overflow-hidden flex flex-col relative animate-in fade-in duration-500 font-manrope">
      {/* Header */}
      <div className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="h-6 w-px bg-zinc-200" />
          <div>
            <h1 className="font-epilogue font-bold text-zinc-900 flex items-center gap-2">
              <History className="text-violet-600" size={18} />
              Secret Forensics
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mt-0.5">
              History Reconstruction • Finding #{findingId}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-zinc-200" />

            <div className="space-y-12">
              {history.map((commit, idx) => {
                const isFirstSeen = idx === 0;
                const isLastSeen = idx === history.length - 1;

                return (
                  <div key={commit.commitHash} className="relative pl-16 group">
                    {/* Circle */}
                    <div
                      className={`absolute left-0 w-14 h-14 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm border ${
                        isFirstSeen
                          ? 'bg-violet-950 border-violet-900 text-white'
                          : isLastSeen
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'bg-white border-zinc-200 text-zinc-400 group-hover:border-violet-300 group-hover:text-violet-600'
                      }`}
                    >
                      {isFirstSeen ? (
                        <Activity size={20} />
                      ) : isLastSeen ? (
                        <FileCode size={20} />
                      ) : (
                        <GitCommit size={20} />
                      )}
                    </div>

                    <div
                      className={`bg-white border p-6 rounded-[24px] transition-all shadow-sm group-hover:shadow-md ${
                        isFirstSeen
                          ? 'border-violet-100 ring-4 ring-violet-50/50'
                          : 'border-zinc-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block ${
                              isFirstSeen
                                ? 'bg-violet-100 text-violet-700'
                                : isLastSeen
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {isFirstSeen
                              ? 'Infection Origin'
                              : isLastSeen
                                ? 'Last Detection'
                                : 'Propagation Event'}
                          </span>
                          <h3 className="font-epilogue font-bold text-zinc-900 text-lg">
                            {commit.message?.split('\n')[0] ||
                              'Commit trace detected'}
                          </h3>
                        </div>
                        <div className="bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 flex items-center gap-2">
                          <code className="text-[11px] font-mono text-zinc-500">
                            {commit.commitHash.substring(0, 8)}
                          </code>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                              Author
                            </p>
                            <p className="text-xs font-semibold text-zinc-700">
                              {commit.author}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                              Date
                            </p>
                            <p className="text-xs font-semibold text-zinc-700">
                              {new Date(commit.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <FileCode size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                              Target File
                            </p>
                            <p className="text-xs font-semibold text-zinc-700 truncate">
                              {commit.file || 'Multiple files'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 ml-16 bg-violet-50 rounded-[24px] p-8 border border-violet-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-200/50 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-violet-200 shadow-sm">
                  <Activity className="text-violet-600" size={20} />
                </div>
                <h3 className="font-epilogue font-bold text-xl text-zinc-900">
                  Forensic Summary
                </h3>
              </div>
              <p className="text-zinc-600 text-sm font-manrope leading-relaxed max-w-2xl">
                This secret was first introduced by{' '}
                <span className="text-violet-700 font-bold">
                  {history[0]?.author}
                </span>{' '}
                on{' '}
                <span className="text-violet-700 font-bold">
                  {new Date(history[0]?.date).toLocaleDateString()}
                </span>
                . It has survived through{' '}
                <span className="text-violet-700 font-bold">
                  {history.length} lifecycle events
                </span>{' '}
                across the repository history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
