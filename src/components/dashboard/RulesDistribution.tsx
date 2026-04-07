// Placeholder for Rules Distribution Chart
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'AWS Keys', value: 57, color: '#f43f5e' }, // rose-500
  { name: 'Private Keys', value: 35, color: '#f59e0b' }, // amber-500
  { name: 'Stripe Tokens', value: 28, color: '#8b5cf6' }, // violet-500
  { name: 'Other', value: 22, color: '#e4e4e7' }, // zinc-200
];

export function RulesDistribution() {
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

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
        <div className="flex items-center justify-between font-manrope text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500"></div>
            <span className="text-zinc-700">AWS Keys</span>
          </div>
          <span className="font-semibold text-zinc-900">40%</span>
        </div>
        <div className="flex items-center justify-between font-manrope text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-zinc-700">Private Keys</span>
          </div>
          <span className="font-semibold text-zinc-900">25%</span>
        </div>
        <div className="flex items-center justify-between font-manrope text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-violet-500"></div>
            <span className="text-zinc-700">Stripe Tokens</span>
          </div>
          <span className="font-semibold text-zinc-900">20%</span>
        </div>
        <div className="flex items-center justify-between font-manrope text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-zinc-200"></div>
            <span className="text-zinc-700">Other</span>
          </div>
          <span className="font-semibold text-zinc-900">15%</span>
        </div>
      </div>
    </div>
  );
}
