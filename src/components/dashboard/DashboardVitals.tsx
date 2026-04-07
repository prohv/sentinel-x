import { AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

export function DashboardVitals() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Gradient - Critical */}
      <div className="gradient-taint rounded-2xl p-6 text-white shadow-md min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium opacity-90">
            Active Threats
          </p>
          <AlertTriangle size={20} className="opacity-80" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl">12</p>
          <p className="font-manrope text-xs opacity-80 mt-2">
            Critical & High Findings
          </p>
        </div>
      </div>

      {/* Card 2: Gradient - Coverage */}
      <div className="gradient-clean rounded-2xl p-6 text-white shadow-md min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium opacity-90">
            Security Score
          </p>
          <ShieldCheck size={20} className="opacity-80" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl">98%</p>
          <p className="font-manrope text-xs opacity-80 mt-2">
            Safe code coverage
          </p>
        </div>
      </div>

      {/* Card 3: Glassmorphism / Neutral - Meta */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium text-zinc-500">
            Shielded Secrets
          </p>
          <CheckCircle size={20} className="text-zinc-400" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl text-zinc-900">845</p>
          <p className="font-manrope text-xs text-zinc-400 mt-2">
            Total resolved findings
          </p>
        </div>
      </div>
    </div>
  );
}
