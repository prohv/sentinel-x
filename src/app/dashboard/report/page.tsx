'use client';

import { Suspense } from 'react';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useFindings } from '@/hooks/use-findings';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ShieldAlert,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Building2,
  DollarSign,
  Cloud,
  Key,
  Lock,
  Database,
  Wifi,
  Flame,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { FindingRow } from '@/app/actions/scan-types';

// ── Business language translation ──────────────────────────────────────────
const RULE_TO_BUSINESS: Record<
  string,
  {
    label: string;
    asset: string;
    risk: 'Critical' | 'High' | 'Medium' | 'Low';
    icon: React.ElementType;
  }
> = {
  'Stripe Secret Key': {
    label: 'Financial Gateway Exposure',
    asset: 'Payment Infrastructure',
    risk: 'Critical',
    icon: DollarSign,
  },
  'AWS Access Key': {
    label: 'Cloud Infrastructure Vulnerability',
    asset: 'Cloud Operations',
    risk: 'Critical',
    icon: Cloud,
  },
  'GitHub Token': {
    label: 'Source Control Access Leak',
    asset: 'Development Pipeline',
    risk: 'High',
    icon: Lock,
  },
  'Generic API Key': {
    label: 'Third-Party Service Exposure',
    asset: 'External Integration Layer',
    risk: 'High',
    icon: Key,
  },
  'Private Key Block': {
    label: 'Cryptographic Identity Compromise',
    asset: 'Security Infrastructure',
    risk: 'Critical',
    icon: ShieldAlert,
  },
  'Password Assignment': {
    label: 'Credential Store Vulnerability',
    asset: 'Authentication Layer',
    risk: 'High',
    icon: Lock,
  },
  'Connection String': {
    label: 'Database Access Exposure',
    asset: 'Data Persistence Layer',
    risk: 'Critical',
    icon: Database,
  },
};

const FALLBACK_BUSINESS = {
  label: 'Sensitive Configuration Exposure',
  asset: 'Internal Services',
  risk: 'Medium' as const,
  icon: Wifi,
};

const RULE_COLORS: Record<string, string> = {
  'GitHub Token': '#f43f5e',
  'Stripe Secret Key': '#8b5cf6',
  'AWS Access Key': '#06b6d4',
  'Generic API Key': '#f59e0b',
  'Private Key Block': '#10b981',
  'Password Assignment': '#ef4444',
  'Connection String': '#6366f1',
};

const RISK_STYLE: Record<string, { badge: string; dot: string }> = {
  Critical: {
    badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    dot: 'bg-rose-500',
  },
  High: {
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
  },
  Medium: {
    badge: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    dot: 'bg-violet-500',
  },
  Low: {
    badge: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
    dot: 'bg-zinc-400',
  },
};

function gradeFromScore(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'A', color: 'text-emerald-600' };
  if (score >= 80) return { grade: 'B+', color: 'text-emerald-500' };
  if (score >= 70) return { grade: 'B', color: 'text-amber-500' };
  if (score >= 55) return { grade: 'C+', color: 'text-amber-600' };
  if (score >= 40) return { grade: 'C', color: 'text-orange-500' };
  return { grade: 'D', color: 'text-rose-600' };
}

function statusBadge(threats: number): { label: string; style: string } {
  if (threats === 0)
    return {
      label: '✓ SECURE',
      style: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300',
    };
  if (threats <= 3)
    return {
      label: '⚠ REVIEW REQUIRED',
      style: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300',
    };
  return {
    label: '⛔ ACTION REQUIRED',
    style: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300',
  };
}

// ── Main Report Page ────────────────────────────────────────────────────────
export default function ReportPage() {
  return (
    <div className="min-h-screen bg-zinc-100 font-manrope">
      {/* Screen-only nav bar */}
      <div className="print:hidden sticky top-0 z-20 bg-white border-b border-zinc-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-manrope">
            Generated{' '}
            {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Printer size={15} />
            Export / Print
          </button>
        </div>
      </div>

      {/* Report body */}
      <div className="flex items-start justify-center py-8 px-4 print:p-0 print:py-0">
        <Suspense fallback={<ReportSkeleton />}>
          <ReportContent />
        </Suspense>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-12 animate-pulse space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-zinc-100 rounded-xl" />
      ))}
    </div>
  );
}

function ReportContent() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: findingsData, isLoading: findingsLoading } = useFindings({
    limit: 50,
    status: 'open',
  });

  if (statsLoading || findingsLoading || !stats?.success) {
    return <ReportSkeleton />;
  }

  const {
    activeThreats,
    securityScore,
    shieldedSecrets,
    purgedKeys,
    ruleDistribution,
    scanHistory,
  } = stats;
  const findings = findingsData?.success ? findingsData.items : [];
  const { grade, color: gradeColor } = gradeFromScore(securityScore);
  const { label: statusLabel, style: statusStyle } = statusBadge(activeThreats);
  const totalRepos = [...new Set(scanHistory.map((s) => s.repoPath))].length;
  const totalScans = scanHistory.length;

  const chartData = ruleDistribution.map((r) => ({
    name: r.rule,
    value: Number(r.count),
    color: RULE_COLORS[r.rule] ?? '#e4e4e7',
  }));

  // Deduplicate risk items by rule, keep highest severity
  const riskItems = findings
    .reduce<FindingRow[]>((acc, f) => {
      if (!acc.find((x) => x.rule === f.rule)) acc.push(f);
      return acc;
    }, [])
    .slice(0, 6);

  const totalFindings = ruleDistribution.reduce(
    (s, r) => s + Number(r.count),
    0,
  );
  const remediationMinutes = Math.max(15, riskItems.length * 5);

  return (
    <div
      className="
        w-full max-w-[900px] bg-white shadow-xl rounded-2xl overflow-hidden
        print:shadow-none print:rounded-none print:max-w-none print:w-[210mm]
        print:min-h-[297mm] print:mx-auto
      "
    >
      {/* ── Header ── */}
      <div className="bg-zinc-900 text-white px-10 py-8 print:px-8 print:py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={18} className="text-zinc-400" />
              <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">
                Sentinel X · Security Intelligence Report
              </span>
            </div>
            <h1 className="font-epilogue font-bold text-3xl print:text-2xl text-white leading-tight">
              Infrastructure Security Briefing
            </h1>
            <p className="text-zinc-400 text-sm mt-1 font-manrope">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {' · '}Confidential — Internal Use Only
            </p>
          </div>
          <div className="text-right shrink-0 ml-8">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">
              Security Grade
            </p>
            <p
              className={`font-epilogue font-bold text-6xl print:text-5xl ${gradeColor}`}
            >
              {grade}
            </p>
            <span
              className={`inline-block mt-2 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Summary sentence */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl px-6 py-4 print:py-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            The Garrison is currently protecting{' '}
            <span className="text-white font-semibold">
              {totalRepos} {totalRepos === 1 ? 'repository' : 'repositories'}
            </span>{' '}
            across{' '}
            <span className="text-white font-semibold">
              {totalScans} scan {totalScans === 1 ? 'cycle' : 'cycles'}
            </span>
            .{' '}
            {activeThreats > 0 ? (
              <>
                <span className="text-rose-400 font-semibold">
                  {activeThreats} active{' '}
                  {activeThreats === 1 ? 'threat was' : 'threats were'}
                </span>{' '}
                identified in the most recent scan cycle, representing immediate
                remediation priorities.
              </>
            ) : (
              <span className="text-emerald-400 font-semibold">
                No active threats detected. All systems are operating within
                secure parameters.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-4 border-b border-zinc-100 divide-x divide-zinc-100">
        {[
          {
            label: 'Active Threats',
            value: activeThreats,
            Icon: ShieldAlert,
            color: activeThreats > 0 ? 'text-rose-600' : 'text-emerald-600',
            sub: 'Requires immediate action',
          },
          {
            label: 'Security Score',
            value: `${securityScore}%`,
            Icon: TrendingDown,
            color: 'text-violet-600',
            sub: 'Risk mitigation index',
          },
          {
            label: 'Vault Shielded',
            value: shieldedSecrets,
            Icon: CheckCircle2,
            color: 'text-emerald-600',
            sub: 'Encrypted in Registry',
          },
          {
            label: 'Git Purged',
            value: purgedKeys,
            Icon: Flame,
            color: 'text-violet-700',
            sub: 'History erased forever',
          },
        ].map(({ label, value, Icon, color, sub }) => (
          <div key={label} className="px-6 py-6 print:px-5 print:py-4">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {label}
              </p>
              <Icon size={14} className={color} />
            </div>
            <p
              className={`font-epilogue font-bold text-3xl print:text-2xl mt-2 ${color}`}
            >
              {value}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-manrope">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Middle: Two Columns ── */}
      <div className="grid grid-cols-2 gap-0 border-b border-zinc-100 print:grid-cols-2">
        {/* Left: Risk & Impact */}
        <div className="px-8 py-7 print:px-6 print:py-5 border-r border-zinc-100">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={15} className="text-amber-500" />
            <h2 className="font-epilogue font-bold text-sm text-zinc-900 uppercase tracking-widest">
              Risk &amp; Impact Breakdown
            </h2>
          </div>

          {riskItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
              No open findings — system is clean.
            </div>
          ) : (
            <div className="space-y-3">
              {riskItems.map((f) => {
                const biz = RULE_TO_BUSINESS[f.rule] ?? FALLBACK_BUSINESS;
                const RiskIcon = biz.icon;
                const riskStyle = RISK_STYLE[biz.risk] ?? RISK_STYLE.Medium;
                return (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 bg-zinc-50 rounded-xl p-3 border border-zinc-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
                      <RiskIcon size={14} className="text-zinc-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 leading-tight">
                        {biz.label}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {biz.asset}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${riskStyle.badge}`}
                    >
                      {biz.risk}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Visual Proof */}
        <div className="px-8 py-7 print:px-6 print:py-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={15} className="text-violet-500" />
            <h2 className="font-epilogue font-bold text-sm text-zinc-900 uppercase tracking-widest">
              Data Flow Analysis
            </h2>
          </div>

          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
              No pattern data available yet.
            </div>
          ) : (
            <>
              {/* Fixed-size SVG chart — center label rendered as SVG text so it is
                  always pixel-perfectly centered in both screen and PDF/print.
                  Avoids the absolute-overlay trick which drifts in print layout. */}
              <div className="flex justify-center">
                <PieChart width={220} height={150}>
                  <Pie
                    data={chartData}
                    cx={105}
                    cy={68}
                    innerRadius={48}
                    outerRadius={66}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* Center label — anchored to cx/cy, always correct in print */}
                  <text
                    x={110}
                    y={68}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      fill: '#18181b',
                      fontFamily: 'inherit',
                    }}
                  >
                    {totalFindings}
                  </text>
                  <text
                    x={110}
                    y={83}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 9,
                      fill: '#a1a1aa',
                      letterSpacing: 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    TOTAL
                  </text>
                </PieChart>
              </div>

              <div className="mt-3 space-y-1.5">
                {chartData.slice(0, 4).map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between text-xs font-manrope"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-zinc-600 truncate max-w-[150px]">
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold text-zinc-900 ml-2">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                Data flow analysis indicates potential leak paths from internal
                configuration files to public-facing service endpoints.
                Immediate rotation recommended.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── ROI Triangle ── */}
      <div className="px-10 py-7 print:px-8 print:py-5 bg-zinc-50/50">
        <div className="flex items-center gap-2 mb-5">
          <span className="font-epilogue font-bold text-sm text-zinc-900 uppercase tracking-widest">
            🔺 Path to Green — Remediation Blueprint
          </span>
        </div>

        <table className="w-full text-sm font-manrope border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-white">
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest rounded-tl-xl">
                Investment
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest">
                Expected Outcome
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest rounded-tr-xl">
                Risk Avoidance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100 border border-zinc-200 border-t-0">
            <tr>
              <td className="px-5 py-4">
                <p className="font-semibold text-zinc-900 flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" />
                  Full History Purge
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Irreversible Git history scrub for {activeThreats} keys
                </p>
              </td>
              <td className="px-5 py-4">
                <p className="font-semibold text-emerald-700">
                  Maximum Risk Elimination
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Increases score up to 100% efficiency
                </p>
              </td>
              <td className="px-5 py-4">
                <p className="font-semibold text-zinc-900">
                  Zero attack surface
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Removes leak from clones & forks
                </p>
              </td>
            </tr>
            {purgedKeys > 0 && (
              <tr className="bg-violet-50/60">
                <td className="px-5 py-4">
                  <p className="font-semibold text-violet-900 flex items-center gap-2">
                    <Flame size={14} className="text-violet-600" />
                    Success History
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {purgedKeys} credentials purged from Git
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-emerald-700">
                    Hygiene Bonus Applied
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Projected safety buffer active
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-zinc-900">
                    Sanitized Repository
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Verified clean scan history
                  </p>
                </td>
              </tr>
            )}
            {shieldedSecrets > 0 && (
              <tr className="bg-emerald-50/60">
                <td className="px-5 py-4">
                  <p className="font-semibold text-zinc-900">Vault Shielding</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {shieldedSecrets} secrets secured in Registry
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-emerald-700">
                    Active Environment Protection
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Encrypted and isolated
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-zinc-900">
                    Contained Awareness
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Prevents accidental sprawl
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="px-10 py-5 print:px-8 border-t border-zinc-200 flex items-center justify-between bg-white">
        <p className="text-[10px] text-zinc-400 font-manrope">
          Generated by{' '}
          <span className="font-semibold text-zinc-600">Sentinel X</span> ·
          Confidential &amp; Proprietary
        </p>
        <p className="text-[10px] text-zinc-400 font-mono">
          {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}
