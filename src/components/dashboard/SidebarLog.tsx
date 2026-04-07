import { Settings, DownloadCloud, Activity, Clock } from 'lucide-react';

export function SidebarLog() {
  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Scan History (The Main Event) - Top Section */}
      <div className="flex-1 px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-epilogue font-semibold text-lg text-zinc-900 flex items-center gap-2">
            <Activity size={20} className="text-violet-600" />
            The Sentinel Log
          </h2>
          <span className="text-xs font-manrope font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded-full">
            Live Monitor
          </span>
        </div>

        <div className="relative mt-6">
          {/* Vertical Line */}
          <div className="absolute top-2 bottom-0 left-[11px] w-0.5 bg-zinc-200 z-0"></div>

          <div className="space-y-10 relative z-10">
            {/* Timeline Item 1: Running */}
            <div className="flex items-start gap-4">
              <div className="bg-zinc-50/50 p-1.5 rounded-full shrink-0 relative">
                <div className="w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-200 animate-pulse"></div>
              </div>
              <div className="flex-1 flex justify-between items-start pt-0.5">
                <div>
                  <p className="font-manrope font-semibold text-sm text-zinc-900">
                    Deep System Scan
                  </p>
                  <p className="font-manrope text-xs text-violet-600 font-medium mt-1">
                    In Progress (42%)
                  </p>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-zinc-200 shadow-sm">
                  <Clock size={10} /> Now
                </span>
              </div>
            </div>

            {/* Timeline Item 2: Completed */}
            <div className="flex items-start gap-4">
              <div className="bg-zinc-50/50 p-1.5 rounded-full shrink-0 relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex-1 flex justify-between items-start pt-0.5">
                <div>
                  <p className="font-manrope font-semibold text-sm text-zinc-900">
                    Full Repo Scan
                  </p>
                  <p className="font-manrope text-xs text-zinc-500 mt-1">
                    Found 3 ghosts
                  </p>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 mt-1">
                  10:42 AM
                </span>
              </div>
            </div>

            {/* Timeline Item 3: Failed */}
            <div className="flex items-start gap-4">
              <div className="bg-zinc-50/50 p-1.5 rounded-full shrink-0 relative">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              </div>
              <div className="flex-1 flex justify-between items-start pt-0.5">
                <div>
                  <p className="font-manrope font-semibold text-sm text-zinc-900">
                    Delta Scan
                  </p>
                  <p className="font-manrope text-xs text-rose-500 mt-1">
                    Regex timeout
                  </p>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 mt-1">
                  09:15 AM
                </span>
              </div>
            </div>

            {/* Timeline Item 4: Completed */}
            <div className="flex items-start gap-4">
              <div className="bg-zinc-50/50 p-1.5 rounded-full shrink-0 relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex-1 flex justify-between items-start pt-0.5">
                <div>
                  <p className="font-manrope font-semibold text-sm text-zinc-900">
                    Full Repo Scan
                  </p>
                  <p className="font-manrope text-xs text-zinc-500 mt-1">
                    Clean (0 findings)
                  </p>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 mt-1">
                  Yesterday
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Bottom Section */}
      <div className="px-6 pt-6 pb-8 border-t border-zinc-200 bg-white">
        <h2 className="font-epilogue font-semibold text-sm text-zinc-500 mb-4 uppercase tracking-widest">
          Quick Actions
        </h2>
        <div className="flex flex-col gap-3">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-50 text-left transition-colors text-sm font-manrope text-zinc-700 bg-white border border-zinc-200 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
              <DownloadCloud size={16} />
            </div>
            <span className="font-medium">Export CSV Report</span>
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
