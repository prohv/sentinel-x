'use client';

import { Suspense } from 'react';
import { useFindings } from '@/hooks/use-findings';
import {
  Loader2,
  X,
  Server,
  GitCommit,
  FileText,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Flame,
  ShieldOff,
  CircleDot,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { FindingRow } from '@/app/actions/scan-types';
import { useQueryClient } from '@tanstack/react-query';

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
  return (
    <Suspense fallback={<SkeletonStream />}>
      <FindingsStreamInner />
    </Suspense>
  );
}

function FindingsStreamInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const queryClient = useQueryClient();
  const [selectedFinding, setSelectedFinding] = useState<FindingRow | null>(
    null,
  );

  const { data, isLoading } = useFindings({
    limit: 12,
    searchQuery: q,
    status: 'open',
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['findings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

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
                    onClick={() => setSelectedFinding(f)}
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

      {selectedFinding && (
        <FindingDialog
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onSuccess={handleRefresh}
        />
      )}
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

import {
  deleteFinding,
  shieldFinding,
} from '@/app/actions/get-findings.actions';
import {
  purgeStepPreFlight,
  purgeStepBackup,
  purgeStepSurgery,
  purgeStepIncinerate,
  purgeStepVerify,
  purgeStepAudit,
} from '@/app/actions/purge-secret.actions';

// ── Step definitions ──────────────────────────────────────────────────────
type StepStatus = 'pending' | 'running' | 'done' | 'failed';
interface UIStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  ts?: number;
}

const INITIAL_STEPS: UIStep[] = [
  { id: 'preflight', label: 'Pre-Flight Integrity Check', status: 'pending' },
  { id: 'backup', label: 'Shadow Backup (.git clone)', status: 'pending' },
  { id: 'surgery', label: 'Filter-Branch History Rewrite', status: 'pending' },
  { id: 'incinerate', label: 'Forensic Incineration', status: 'pending' },
  { id: 'verify', label: 'Mini-Scan Verification', status: 'pending' },
  { id: 'audit', label: 'Sovereign Audit Log', status: 'pending' },
];

// ── FindingDialog ─────────────────────────────────────────────────────────

function FindingDialog({
  finding,
  onClose,
  onSuccess,
}: {
  finding: FindingRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isShielding, setIsShielding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successType, setSuccessType] = useState<'shield' | 'delete' | null>(
    null,
  );
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  if (!finding) return null;

  // Hand off to PurgeProgressModal
  if (showPurgeModal) {
    return (
      <PurgeProgressModal
        finding={finding}
        onClose={() => {
          setShowPurgeModal(false);
          onSuccess();
          onClose();
        }}
      />
    );
  }

  // Inline confirmation before the irreversible surgery
  if (showPurgeConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-violet-950 px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <Flame size={18} className="text-rose-400" />
              <h2 className="font-epilogue font-bold text-lg text-white">
                Confirm Purge
              </h2>
            </div>
            <p className="text-violet-300 text-xs font-manrope">
              This operation is permanent and cannot be undone.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="font-semibold text-rose-800 mb-2 flex items-center gap-2 text-sm">
                <AlertTriangle size={14} /> Irreversible History Rewrite
              </p>
              <ul className="text-rose-700 text-xs space-y-1 list-disc list-inside">
                <li>
                  All commit hashes in{' '}
                  <span className="font-mono font-bold">
                    {finding.repoPath?.split(/[/\\]/).pop()}
                  </span>{' '}
                  will change
                </li>
                <li>
                  The secret will be replaced with{' '}
                  <span className="font-mono">[REDACTED by Sentinel X]</span>
                </li>
                <li>
                  A shadow backup of <span className="font-mono">.git/</span> is
                  created before surgery
                </li>
              </ul>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                Target Rule
              </p>
              <p className="text-sm font-semibold text-zinc-900">
                {finding.rule}
              </p>
              <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                {finding.path}
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              onClick={() => setShowPurgeConfirm(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowPurgeConfirm(false);
                setShowPurgeModal(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-950 hover:bg-violet-900 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-950/30"
            >
              <Flame size={15} /> Confirm Purge
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleFalsePositive() {
    setIsDeleting(true);
    await deleteFinding(finding.id);
    onSuccess();
    setSuccessType('delete');
    setTimeout(() => {
      onClose();
    }, 2500);
  }

  async function handleShield() {
    setIsShielding(true);
    await shieldFinding(finding.id);
    onSuccess();
    setSuccessType('shield');
    setTimeout(() => {
      onClose();
    }, 4500);
  }

  if (successType === 'shield') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center justify-center animate-in zoom-in-95 duration-300 overflow-hidden">
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <h2 className="font-epilogue font-bold text-xl text-zinc-900 mb-2 text-center">
              Shield Deployed!
            </h2>
            <p className="text-sm text-zinc-500 text-center font-manrope leading-relaxed mb-6">
              The artifact trace has been verified, encrypted, and isolated in
              the secure Vault registry.
            </p>
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left flex items-start gap-3">
              <AlertTriangle
                className="text-amber-500 shrink-0 mt-0.5"
                size={16}
              />
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                  Next Steps
                </h4>
                <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
                  Be sure to rotate this key at the provider level soon to fully
                  secure the repo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (successType === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5 ring-8 ring-blue-50">
            <Trash2 className="text-blue-500" size={28} />
          </div>
          <h2 className="font-epilogue font-bold text-xl text-zinc-900 mb-2">
            False Positive Verified
          </h2>
          <p className="text-sm text-zinc-500 text-center font-manrope leading-relaxed">
            Artifact explicitly removed from the active threats list and
            permanently deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${severityColor[finding.severity]?.dot ?? 'bg-zinc-500'} text-white`}
              >
                {finding.severity} THREAT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200">
                {finding.scanType?.replace('git_', '') || 'HUNTER'}
              </span>
            </div>
            <h2 className="font-epilogue font-bold text-xl text-zinc-900">
              {finding.rule}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors border border-transparent hover:border-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Path Trace */}
          <div>
            <h3 className="font-epilogue font-semibold text-sm text-zinc-900 mb-3 flex items-center gap-2">
              <Server size={14} className="text-zinc-400" /> Compromise Trace
            </h3>
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 font-mono text-xs text-zinc-600 space-y-2 flex flex-col">
              <div className="flex items-start gap-2">
                <span className="text-zinc-400 pt-0.5">Exact File:</span>
                <span className="font-semibold text-zinc-900 break-all bg-white px-2 py-0.5 rounded shadow-sm border border-zinc-200">
                  {(() => {
                    let rawPath = finding.path;
                    if (rawPath.startsWith('orphan:'))
                      rawPath = rawPath.replace('orphan:', '');
                    else if (rawPath.startsWith('git:'))
                      return `[Commit Diff Hash] ${rawPath.replace('git:', '')}`;
                    const baseRepo = finding.repoPath
                      ? `${finding.repoPath.replace(/\/$/, '')}/`
                      : '';
                    return `${baseRepo}${rawPath}`;
                  })()}
                  {finding.line > 0 && ` : Line ${finding.line}`}
                </span>
              </div>
            </div>
          </div>

          {/* Git Meta */}
          {finding.commitHash && (
            <div>
              <h3 className="font-epilogue font-semibold text-sm text-zinc-900 mb-3 flex items-center gap-2">
                <GitCommit size={14} className="text-zinc-400" /> Commit Context
              </h3>
              <div className="flex items-center gap-4 bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <div className="flex-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                    Author
                  </p>
                  <p className="text-sm font-medium text-zinc-900">
                    {finding.author || 'Unknown'}
                  </p>
                </div>
                <div className="flex-1 border-l border-zinc-200 pl-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                    Hash
                  </p>
                  <p className="text-sm font-mono text-zinc-900 bg-white px-2 py-0.5 rounded shadow-sm border border-zinc-200 inline-block">
                    {finding.commitHash.substring(0, 8)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Code Snippet */}
          <div>
            <h3 className="font-epilogue font-semibold text-sm text-zinc-900 mb-3 flex items-center gap-2">
              <FileText size={14} className="text-zinc-400" /> Source Evidence
            </h3>
            <div className="bg-[#18181b] rounded-xl p-4 overflow-x-auto border border-zinc-800 shadow-inner">
              <pre className="font-mono text-[13px] text-zinc-300 leading-relaxed">
                <code>{finding.snippet}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-between gap-3">
          <p className="font-manrope text-xs text-zinc-500">
            Confidence:{' '}
            <span className="font-semibold text-zinc-700">
              {finding.confidence}%
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFalsePositive}
              disabled={isDeleting || isShielding}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-sm text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <AlertTriangle size={16} className="text-zinc-400" />
              )}
              Flag False Positive
            </button>
            <button
              onClick={() => setShowPurgeConfirm(true)}
              disabled={isDeleting || isShielding}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-sm text-white bg-violet-950 rounded-lg shadow-sm hover:bg-violet-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Flame size={15} /> Purge
            </button>
            <button
              onClick={handleShield}
              disabled={isDeleting || isShielding}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-sm text-white bg-violet-600 rounded-lg shadow-sm hover:bg-violet-500 transition-colors shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isShielding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Verify &amp; Shield
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PurgeProgressModal — white, sequential live step updates ──────────────

function PurgeProgressModal({
  finding,
  onClose,
}: {
  finding: FindingRow;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<UIStep[]>(
    INITIAL_STEPS.map((s) => ({ ...s })),
  );
  const [done, setDone] = useState(false);
  const [pristine, setPristine] = useState(false);
  const [overallSuccess, setOverallSuccess] = useState(false);

  const updateStep = (id: string, status: StepStatus, detail?: string) =>
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status, detail, ts: Date.now() } : s,
      ),
    );

  // Each await yields a re-render — the user sees each step flip in real time
  useEffect(() => {
    async function run() {
      updateStep('preflight', 'running');
      const r1 = await purgeStepPreFlight(finding);
      updateStep('preflight', r1.success ? 'done' : 'failed', r1.detail);
      if (!r1.success) {
        setDone(true);
        return;
      }

      updateStep('backup', 'running');
      const r2 = await purgeStepBackup(finding);
      updateStep('backup', r2.success ? 'done' : 'failed', r2.detail);
      if (!r2.success) {
        setDone(true);
        return;
      }

      updateStep('surgery', 'running');
      const r3 = await purgeStepSurgery(finding);
      updateStep('surgery', r3.success ? 'done' : 'failed', r3.detail);
      if (!r3.success) {
        setDone(true);
        return;
      }

      updateStep('incinerate', 'running');
      const r4 = await purgeStepIncinerate(finding);
      updateStep('incinerate', r4.success ? 'done' : 'failed', r4.detail);
      if (!r4.success) {
        setDone(true);
        return;
      }

      updateStep('verify', 'running');
      const r5 = await purgeStepVerify(finding);
      updateStep('verify', 'done', r5.detail);
      setPristine(r5.pristine);

      updateStep('audit', 'running');
      const r6 = await purgeStepAudit(finding);
      updateStep('audit', r6.success ? 'done' : 'failed', r6.detail);

      setOverallSuccess(r6.success);
      setDone(true);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    queryClient.invalidateQueries({ queryKey: ['findings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    onClose();
  }

  const formatTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleTimeString('en-US', { hour12: false }) : '';

  const stepIcon = (status: StepStatus) => {
    if (status === 'done')
      return (
        <span className="text-emerald-500 font-bold text-base leading-none">
          ✓
        </span>
      );
    if (status === 'failed')
      return (
        <span className="text-rose-500 font-bold text-base leading-none">
          ✗
        </span>
      );
    if (status === 'running')
      return <CircleDot size={14} className="text-violet-600 animate-pulse" />;
    return <span className="text-zinc-300 text-base leading-none">·</span>;
  };

  const isRunning = steps.some((s) => s.status === 'running');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${done ? (overallSuccess ? 'bg-emerald-100' : 'bg-rose-100') : 'bg-violet-100'}`}
            >
              <Flame
                size={17}
                className={
                  done
                    ? overallSuccess
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                    : 'text-violet-600'
                }
              />
            </div>
            <div>
              <p className="font-epilogue font-bold text-zinc-900 text-sm">
                {done
                  ? overallSuccess
                    ? 'Sanitization Complete'
                    : 'Purge Failed'
                  : 'Purge in Progress…'}
              </p>
              <p className="text-zinc-400 text-xs font-mono mt-0.5 truncate max-w-[280px]">
                {finding.rule} ·{' '}
                {finding.path.split(/[/\\]/).slice(-2).join('/')}
              </p>
            </div>
          </div>
          {isRunning && (
            <Loader2
              size={16}
              className="text-violet-500 animate-spin shrink-0"
            />
          )}
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-3.5">
          {steps.map((s) => (
            <div key={s.id}>
              <div className="flex items-center gap-3">
                <div className="w-5 flex items-center justify-center shrink-0">
                  {stepIcon(s.status)}
                </div>
                <p
                  className={`text-sm flex-1 font-manrope ${
                    s.status === 'done'
                      ? 'text-zinc-700'
                      : s.status === 'failed'
                        ? 'text-rose-600 font-medium'
                        : s.status === 'running'
                          ? 'text-violet-700 font-semibold'
                          : 'text-zinc-300'
                  }`}
                >
                  {s.label}
                </p>
                {s.ts && (
                  <span className="text-zinc-400 text-[10px] font-mono shrink-0">
                    {formatTime(s.ts)}
                  </span>
                )}
              </div>
              {s.detail && (
                <p className="ml-8 mt-1 text-[11px] text-zinc-400 leading-relaxed font-mono">
                  └ {s.detail}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Result banner */}
        {done && (
          <div
            className={`mx-6 mb-5 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
              !overallSuccess
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : pristine
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {!overallSuccess ? (
              <>
                <ShieldOff size={15} className="shrink-0" /> Purge failed —
                shadow backup preserved for manual recovery
              </>
            ) : pristine ? (
              <>
                <CheckCircle size={15} className="shrink-0" /> PRISTINE — Secret
                confirmed absent from all reachable history
              </>
            ) : (
              <>
                <AlertTriangle size={15} className="shrink-0" /> PARTIAL —
                Traces may remain in edge branches. Manual review advised.
              </>
            )}
          </div>
        )}

        {/* Close — appears only after completion */}
        {done && (
          <div className="px-6 pb-6">
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
