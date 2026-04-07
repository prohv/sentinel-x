import { Shield, Search, PlusCircle } from 'lucide-react';

export function Topbar() {
  return (
    <header className="flex items-center justify-between gap-4 w-full">
      {/* Left: Logo + Greeting + Repo */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0">
          <Shield size={20} />
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
          <p className="font-manrope text-xs text-zinc-500 mt-0.5">
            Repository:{' '}
            <span className="font-mono text-zinc-800 font-medium">
              sentinel-x/core
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
            placeholder="Search specific Rule IDs or File Paths..."
            className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-manrope placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors font-manrope shadow-sm">
          <PlusCircle size={16} />
          <span className="hidden sm:inline">New Scan</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-zinc-200 border border-zinc-300 overflow-hidden shrink-0 flex items-center justify-center text-zinc-600 font-bold text-sm">
          SH
        </div>
      </div>
    </header>
  );
}
