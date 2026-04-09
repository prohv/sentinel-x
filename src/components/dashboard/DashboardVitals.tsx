'use client';

import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Flame,
  Loader2,
} from 'lucide-react';

export function DashboardVitals() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data?.success) {
    return <SkeletonVitals />;
  }

  const {
    activeThreats,
    securityScore,
    shieldedSecrets,
    purgedKeys = 0,
  } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Card 1: Critical */}
      <div className="gradient-taint rounded-2xl p-6 text-white shadow-md min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium opacity-90">
            Active Threats
          </p>
          <AlertTriangle size={20} className="opacity-80" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl">{activeThreats}</p>
          <p className="font-manrope text-xs opacity-80 mt-2">
            Critical & High Findings
          </p>
        </div>
      </div>

      {/* Card 2: Coverage */}
      <div className="gradient-clean rounded-2xl p-6 text-white shadow-md min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium opacity-90">
            Security Score
          </p>
          <ShieldCheck size={20} className="opacity-80" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl">{securityScore}%</p>
          <p className="font-manrope text-xs opacity-80 mt-2">
            Safe code coverage
          </p>
        </div>
      </div>

      {/* Card 3: Shielded */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium bg-gradient-to-br from-cyan-400 to-violet-500 bg-clip-text text-transparent">
            Shielded Secrets
          </p>
          <CheckCircle size={20} className="text-violet-500/80" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl bg-gradient-to-br from-cyan-400 to-violet-500 bg-clip-text text-transparent">
            {shieldedSecrets}
          </p>
          <p className="font-manrope text-xs mt-2 bg-gradient-to-br from-cyan-400 to-violet-500 bg-clip-text text-transparent opacity-80">
            Total resolved findings
          </p>
        </div>
      </div>

      {/* Card 4: Purged */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-manrope text-sm font-medium bg-gradient-to-br from-violet-500 to-indigo-600 bg-clip-text text-transparent">
            Purged Keys
          </p>
          <Flame size={20} className="text-violet-500/80" />
        </div>
        <div>
          <p className="font-epilogue font-bold text-5xl bg-gradient-to-br from-violet-500 to-indigo-600 bg-clip-text text-transparent">
            {purgedKeys}
          </p>
          <p className="font-manrope text-xs mt-2 bg-gradient-to-br from-violet-500 to-indigo-600 bg-clip-text text-transparent opacity-80">
            Forensically removed
          </p>
        </div>
      </div>
    </div>
  );
}

function SkeletonVitals() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex items-center justify-center"
        >
          <Loader2 className="animate-spin text-zinc-300" size={32} />
        </div>
      ))}
    </div>
  );
}
