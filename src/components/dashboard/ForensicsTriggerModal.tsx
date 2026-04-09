'use client';

import { useRouter } from 'next/navigation';
import {
  Clock,
  X,
  ShieldAlert,
  ChevronRight,
  Activity,
  Flame,
} from 'lucide-react';
import { useFindings } from '@/hooks/use-findings';

export function ForensicsTriggerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { data, isLoading } = useFindings({ limit: 100, status: 'open' });
  const findings = data?.success ? data.items : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300 font-manrope">
      <div className="bg-white rounded-[24px] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-200/50 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/50 rounded-t-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-950 flex items-center justify-center shadow-sm">
              <Clock className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-epilogue font-bold text-zinc-900 text-lg">
                Secret Forensics
              </h3>
              <p className="text-xs text-zinc-500">
                Pick a cold case to trace its Git history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 bg-white hover:bg-zinc-100 rounded-full transition-colors border border-zinc-200 shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Activity className="animate-spin text-violet-600" size={24} />
            </div>
          ) : findings.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <ShieldAlert className="text-emerald-500" size={28} />
              </div>
              <h4 className="font-epilogue font-bold text-zinc-900 mb-1">
                No Active Threats
              </h4>
              <p className="text-sm text-zinc-500">
                No secrets found to analyze.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {findings.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onClose();
                    router.push(`/dashboard/forensics?id=${f.id}`);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-zinc-100 bg-white hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md transition-all group flex items-center gap-4"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      f.severity === 'critical'
                        ? 'bg-rose-50 border-rose-100'
                        : 'bg-orange-50 border-orange-100'
                    }`}
                  >
                    {f.severity === 'critical' ? (
                      <Flame className="text-rose-500" size={16} />
                    ) : (
                      <ShieldAlert className="text-orange-500" size={16} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          f.severity === 'critical'
                            ? 'bg-rose-500 text-white'
                            : 'bg-orange-500 text-white'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <p className="font-epilogue font-semibold text-zinc-900 text-sm truncate">
                        {f.rule}
                      </p>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-500 truncate">
                      {f.path}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 group-hover:border-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
