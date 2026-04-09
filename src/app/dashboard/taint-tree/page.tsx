import { Activity, GitMerge, FileCode2 } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TaintTreePage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const findingId = searchParams.id;

  return (
    <div className="flex-1 h-[calc(100vh-64px)] bg-zinc-50 overflow-hidden flex flex-col relative animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-epilogue font-bold text-zinc-900 flex items-center gap-2">
              <GitMerge className="text-violet-600" size={18} />
              Taint Tree Analysis
            </h1>
            <p className="font-manrope text-[11px] text-zinc-500 tracking-wide mt-0.5">
              AST PROPAGATION • FINDING #{findingId || 'UNKNOWN'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-zinc-200 shadow-xl flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-5 border border-violet-200 relative">
            <div className="absolute inset-0 border border-violet-400 rounded-2xl animate-ping opacity-20"></div>
            <FileCode2 className="text-violet-600" size={28} />
          </div>
          <h2 className="font-epilogue font-bold text-lg text-zinc-900 mb-2">
            Analyzing Syntax Tree
          </h2>
          <p className="font-manrope text-sm text-zinc-500 leading-relaxed mb-6">
            Loading AST and mapping the lateral propagation of this secret
            within the file.
          </p>

          <div className="flex items-center gap-3 text-violet-600 bg-violet-50 px-4 py-2 rounded-lg text-xs font-semibold">
            <Activity className="animate-spin" size={14} />
            Tracing data sinks...
          </div>
        </div>
      </div>
    </div>
  );
}
