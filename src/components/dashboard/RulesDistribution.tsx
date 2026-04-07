'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { Loader2 } from 'lucide-react';

const RULE_COLORS: Record<string, string> = {
  'GitHub Token': '#f43f5e',
  'Stripe Secret Key': '#8b5cf6',
  'AWS Access Key': '#06b6d4',
  'Generic API Key': '#f59e0b',
  'Private Key Block': '#10b981',
  'Password Assignment': '#ef4444',
  'Connection String': '#6366f1',
};

const DEFAULT_COLOR = '#e4e4e7';

export function RulesDistribution() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data?.success) {
    return <SkeletonChart />;
  }

  const { ruleDistribution } = data;
  const total = ruleDistribution.reduce((sum, r) => sum + Number(r.count), 0);

  if (total === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm h-full flex flex-col items-center justify-center min-h-[250px]">
        <p className="text-zinc-400 text-sm font-manrope">
          No findings yet. Run a scan to see rule distribution.
        </p>
      </div>
    );
  }

  const chartData = ruleDistribution.map((r) => ({
    name: r.rule,
    value: Number(r.count),
    color: RULE_COLORS[r.rule] ?? DEFAULT_COLOR,
  }));

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <h2 className="font-epilogue font-semibold text-lg text-zinc-900">
        Rules Distribution
      </h2>
      <p className="font-manrope text-xs text-zinc-500 mt-0.5">
        Pattern of Failure
      </p>

      <div className="flex-1 flex items-center justify-center min-h-[180px] mt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="block font-epilogue font-bold text-2xl text-zinc-900">
            {total}
          </span>
          <span className="block font-manrope text-[10px] text-zinc-400 uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {chartData.map((entry) => {
          const pct = Math.round((entry.value / total) * 100);
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between font-manrope text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-zinc-700">{entry.name}</span>
              </div>
              <span className="font-semibold text-zinc-900">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm h-full flex flex-col items-center justify-center min-h-[250px]">
      <Loader2 className="animate-spin text-zinc-300" size={32} />
    </div>
  );
}
