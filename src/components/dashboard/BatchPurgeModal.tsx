'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Flame,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Activity,
  Database,
  History,
  Search,
  FileCheck,
  Check,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  purgeStepPreFlight,
  purgeStepBackup,
  purgeStepSurgery,
  purgeStepIncinerate,
  purgeStepVerify,
  purgeStepAudit,
} from '@/app/actions/purge-secret.actions';
import { db } from '@/lib/db';
import type { FindingRow } from '@/app/actions/scan-types';

// We fetch findings client-side via the hook rather than importing db directly
import { useFindings } from '@/hooks/use-findings';

type StepStatus = 'pending' | 'running' | 'done' | 'failed';

interface UIStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

const STEP_DEFS = [
  { id: 'preflight', label: 'Pre-Flight Check' },
  { id: 'backup', label: 'Shadow Backup' },
  { id: 'surgery', label: 'History Surgery' },
  { id: 'incinerate', label: 'Forensic Incineration' },
  { id: 'verify', label: 'Verification Scan' },
  { id: 'audit', label: 'Audit Log' },
];

const freshSteps = (): UIStep[] =>
  STEP_DEFS.map((s) => ({ ...s, status: 'pending' }));

type QueueItem = {
  finding: FindingRow;
  steps: UIStep[];
  result: 'pending' | 'running' | 'done' | 'failed';
};

export function BatchPurgeModal({
  selectedIds,
  onClose,
}: {
  selectedIds: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data } = useFindings({ limit: 200, status: 'open' });
  const findingsRaw = data?.success ? data.items : [];

  const findings = findingsRaw.filter((f) =>
    selectedIds.includes(f.id.toString()),
  );

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const hasRun = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize queue once findings are loaded
  useEffect(() => {
    if (findings.length > 0 && queue.length === 0) {
      setQueue(
        findings.map((f) => ({
          finding: f,
          steps: freshSteps(),
          result: 'pending',
        })),
      );
    }
  }, [findings.length]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector('[data-active="true"]');
      active?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIdx, queue]);

  // Sequential purge engine — mirrors the single-purge PurgeProgressModal exactly
  useEffect(() => {
    if (queue.length === 0 || hasRun.current) return;
    hasRun.current = true;

    async function runAll() {
      for (let i = 0; i < queue.length; i++) {
        setCurrentIdx(i);

        // Mark item as running
        setQueue((prev) => {
          const clone = [...prev];
          clone[i] = { ...clone[i], result: 'running' };
          return clone;
        });

        const finding = queue[i].finding;

        const updateStep = (
          id: string,
          status: StepStatus,
          detail?: string,
        ) => {
          setQueue((prev) => {
            const clone = [...prev];
            clone[i] = {
              ...clone[i],
              steps: clone[i].steps.map((s) =>
                s.id === id ? { ...s, status, detail } : s,
              ),
            };
            return clone;
          });
        };

        let ok = true;

        // ── Replicate single purge pipeline exactly ──────────────────────
        updateStep('preflight', 'running');
        const r1 = await purgeStepPreFlight(finding);
        updateStep('preflight', r1.success ? 'done' : 'failed', r1.detail);
        if (!r1.success) {
          ok = false;
        }

        if (ok) {
          updateStep('backup', 'running');
          const r2 = await purgeStepBackup(finding);
          updateStep('backup', r2.success ? 'done' : 'failed', r2.detail);
          if (!r2.success) {
            ok = false;
          }
        }

        if (ok) {
          updateStep('surgery', 'running');
          const r3 = await purgeStepSurgery(finding);
          updateStep('surgery', r3.success ? 'done' : 'failed', r3.detail);
          if (!r3.success) {
            ok = false;
          }
        }

        if (ok) {
          updateStep('incinerate', 'running');
          const r4 = await purgeStepIncinerate(finding);
          updateStep('incinerate', r4.success ? 'done' : 'failed', r4.detail);
          if (!r4.success) {
            ok = false;
          }
        }

        if (ok) {
          updateStep('verify', 'running');
          const r5 = await purgeStepVerify(finding);
          updateStep('verify', 'done', r5.detail);
        }

        if (ok) {
          updateStep('audit', 'running');
          const r6 = await purgeStepAudit(finding);
          updateStep('audit', r6.success ? 'done' : 'failed', r6.detail);
          ok = r6.success;
        }

        setQueue((prev) => {
          const clone = [...prev];
          clone[i] = { ...clone[i], result: ok ? 'done' : 'failed' };
          return clone;
        });
      }

      setFinished(true);
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }

    runAll();
  }, [queue.length]);

  const getStepIcon = (id: string, status: StepStatus) => {
    if (status === 'running')
      return <Loader2 size={14} className="animate-spin text-violet-600" />;
    if (status === 'failed') return <X size={14} className="text-rose-500" />;
    if (status === 'done')
      return <Check size={14} className="text-emerald-500" />;
    const iconProps = { size: 14, className: 'text-zinc-300' };
    switch (id) {
      case 'preflight':
        return <Activity {...iconProps} />;
      case 'backup':
        return <Database {...iconProps} />;
      case 'surgery':
        return <History {...iconProps} />;
      case 'incinerate':
        return <Flame {...iconProps} />;
      case 'verify':
        return <Search {...iconProps} />;
      case 'audit':
        return <FileCheck {...iconProps} />;
      default:
        return null;
    }
  };

  const doneCount = queue.filter((q) => q.result === 'done').length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-200/50 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-zinc-50/50 px-8 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors duration-500 ${
                finished
                  ? 'bg-emerald-500 text-white'
                  : 'bg-violet-950 text-white'
              }`}
            >
              {finished ? (
                <ShieldCheck size={20} />
              ) : (
                <Flame size={20} className="animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-epilogue font-bold text-zinc-900 text-lg leading-tight">
                {finished
                  ? 'Batch Sanitization Complete'
                  : 'Batch Purge Pipeline'}
              </h3>
              <p className="text-zinc-500 text-xs font-manrope mt-0.5">
                {finished
                  ? `${doneCount} of ${queue.length} secrets eradicated from history`
                  : `Processing ${currentIdx + 1} of ${queue.length}`}
              </p>
            </div>
          </div>
          {finished && (
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors border border-transparent hover:border-zinc-200"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Scrollable Queue */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto divide-y divide-zinc-100"
        >
          {queue.map((item, idx) => {
            const isActive = item.result === 'running';
            const isDone = item.result === 'done';
            const isFailed = item.result === 'failed';

            return (
              <div
                key={item.finding.id}
                data-active={isActive}
                className={`px-8 py-5 transition-all duration-300 ${isActive ? 'bg-violet-50/40' : ''}`}
              >
                {/* Item Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-200'
                        : isFailed
                          ? 'bg-rose-50 border-rose-200'
                          : isActive
                            ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-100'
                            : 'bg-white border-zinc-100 opacity-40'
                    }`}
                  >
                    {isActive && (
                      <Loader2
                        size={14}
                        className="text-violet-600 animate-spin"
                      />
                    )}
                    {isDone && (
                      <Check
                        size={14}
                        className="text-emerald-500"
                        strokeWidth={3}
                      />
                    )}
                    {isFailed && <X size={14} className="text-rose-500" />}
                    {item.result === 'pending' && (
                      <span className="w-2 h-2 rounded-full bg-zinc-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-epilogue font-semibold text-sm truncate ${isActive ? 'text-violet-950' : isDone ? 'text-zinc-600' : 'text-zinc-400'}`}
                    >
                      {item.finding.rule}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-400 truncate">
                      {item.finding.path}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      isDone
                        ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200'
                        : isFailed
                          ? 'text-rose-700 bg-rose-50 ring-1 ring-rose-200'
                          : isActive
                            ? 'text-violet-700 bg-violet-100'
                            : 'text-zinc-400 bg-zinc-100'
                    }`}
                  >
                    {item.result}
                  </span>
                </div>

                {/* Step minilist — visible only when active or done/failed */}
                {(isActive || isDone || isFailed) && (
                  <div className="ml-10 space-y-1.5">
                    {item.steps.map((step, sIdx) => (
                      <div key={step.id} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          {getStepIcon(step.id, step.status)}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-xs font-medium ${step.status === 'running' ? 'text-violet-700' : step.status === 'failed' ? 'text-rose-600' : step.status === 'done' ? 'text-zinc-600' : 'text-zinc-300'}`}
                          >
                            {step.label}
                          </p>
                          {step.detail && (
                            <p className="text-[10px] text-zinc-400 font-manrope mt-0.5 leading-tight">
                              {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {finished && (
          <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/80 shrink-0 flex items-center justify-between">
            <div>
              <p className="font-epilogue font-semibold text-zinc-900 text-sm">
                {doneCount} of {queue.length} secrets successfully eradicated
              </p>
              <p className="font-manrope text-xs text-zinc-400 mt-0.5">
                Git history has been rewritten for all completed targets.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-violet-950 hover:bg-violet-900 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
