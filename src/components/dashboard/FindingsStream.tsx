'use client';

import { useFindings } from '@/hooks/use-findings';
import { Loader2 } from 'lucide-react';

const severityColor: Record<string, { text: string; dot: string }> = {
  critical: { text: 'text-rose-600', dot: 'bg-rose-500' },
  high: { text: 'text-amber-600', dot: 'bg-amber-500' },
  medium: { text: 'text-violet-600', dot: 'bg-violet-500' },
  low: { text: 'text-zinc-500', dot: 'bg-zinc-400' },
};

const SEVERITY_CAPITALIZED: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function FindingsStream() {
  const { data, isLoading } = useFindings({ limit: 12 });

  if (isLoading || !data?.success) {
    return <SkeletonStream />;
  }

  const { items, total } = data;
  const newCount = items.filter(
    (f) => f.severity === 'critical' || f.severity === 'high',
  ).length;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="font-epilogue font-semibold text-lg text-zinc-900">
            The Spectral Stream
          </h2>
          <p className="font-manrope text-xs text-zinc-500 mt-0.5">
            Latest findings work queue
          </p>
        </div>
        <span className="bg-rose-50 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-rose-200">
          {newCount} New
        </span>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[350px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-zinc-400 text-sm font-manrope">
            No findings yet. Run a scan to start detecting secrets.
          </div>
        ) : (
          <table className="w-full text-sm text-left font-manrope">
            <thead className="bg-zinc-50 sticky top-0 z-10 border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3 font-medium text-xs text-zinc-500 uppercase tracking-widest">
                  Severity
                </th>
                <th className="px-5 py-3 font-medium text-xs text-zinc-500 uppercase tracking-widest">
                  Path
                </th>
                <th className="px-5 py-3 font-medium text-xs text-zinc-500 uppercase tracking-widest text-right">
                  Detected
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((f) => {
                const colors = severityColor[f.severity] ?? severityColor.low;
                return (
                  <tr
                    key={f.id}
                    className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${colors.text}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${colors.dot}`}
                        />
                        {SEVERITY_CAPITALIZED[f.severity] ?? f.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-900">{f.rule}</p>
                      <p className="font-mono text-xs text-zinc-500 mt-0.5 truncate max-w-[260px]">
                        {f.path}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-400 text-xs">
                      {total - items.indexOf(f)}/{total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SkeletonStream() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-[300px] items-center justify-center">
      <Loader2 className="animate-spin text-zinc-300" size={32} />
    </div>
  );
}
