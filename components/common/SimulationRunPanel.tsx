'use client';

import React from 'react';
import { formatMoney } from '../../lib/currency';
import { PlayMode } from '../../lib/slot-engine';
import { SpinResult } from '../../lib/slot-engine';
import { SpinSpeed } from './AutoplayModal';

export interface SimulationRun {
  mode: PlayMode;
  total: number;
  completed: number;
  wins: number;
  bonuses: number;
  wagered: number;
  payout: number;
  best: number;
  netHistory: number[];
  speed: SpinSpeed;
  isRunning: boolean;
  isPaused: boolean;
  stopReason: string | null;
  foundBonus?: SpinResult | null;
}

interface SimulationRunPanelProps {
  run: SimulationRun | null;
  currency: string;
  onStop: () => void;
  onResume: () => void;
  onSpeedChange: (speed: SpinSpeed) => void;
  onDismiss: () => void;
  onPlayFoundBonus: () => void;
  onSkipFoundBonus: () => void;
  canResume: boolean;
}

const SPEEDS: SpinSpeed[] = [0.5, 1, 2, 4];

export default function SimulationRunPanel({ run, currency, onStop, onResume, onSpeedChange, onDismiss, onPlayFoundBonus, onSkipFoundBonus, canResume }: SimulationRunPanelProps) {
  if (!run) return null;
  const maxY = Math.max(1, ...run.netHistory);
  const minY = Math.min(-1, ...run.netHistory);
  const points = run.netHistory.map((value, i) => {
    const x = run.netHistory.length < 2 ? 0 : i / (run.netHistory.length - 1) * 100;
    const y = 100 - (value - minY) / (maxY - minY) * 100;
    return `${x},${y}`;
  }).join(' ');
  const zeroY = 100 - (0 - minY) / (maxY - minY) * 100;
  const returnPercent = run.wagered > 0 ? run.payout / run.wagered * 100 : 0;

  return <aside aria-live="polite" className="fixed right-2 top-2 z-[45] w-[min(350px,calc(100vw-16px))] rounded-xl border border-amber-500/70 bg-slate-950/95 p-2.5 text-white shadow-[0_8px_32px_rgba(0,0,0,.8)] backdrop-blur sm:right-4 sm:top-4 sm:p-3">
    <header className="flex items-center justify-between gap-2">
      <div className="min-w-0"><div className="truncate text-[10px] font-black uppercase tracking-wider text-amber-300">Voyage Simulator · {run.isRunning ? 'Running' : run.isPaused ? 'Paused' : 'Complete'}</div><div className="text-[9px] text-slate-400">{run.completed.toLocaleString()} / {run.total.toLocaleString()} · {run.speed}× · wallet plays</div></div>
      {!run.isRunning && !run.isPaused && <button onClick={onDismiss} aria-label="Close session summary" className="h-7 w-7 shrink-0 rounded-md border border-slate-700 text-slate-300">✕</button>}
    </header>
    <div className="mt-2 grid grid-cols-3 gap-1.5 text-[9px] sm:text-[10px]">
      <Metric label="Net" value={formatMoney(run.payout - run.wagered, currency)} highlight />
      <Metric label="Wins / features" value={`${run.wins} / ${run.bonuses}`} />
      <Metric label="Live RTP" value={`${returnPercent.toFixed(1)}%`} />
    </div>
    <div className="mt-2 h-12 overflow-hidden rounded-md border border-slate-800 bg-black/50 p-1"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Live session net result after each completed spin" className="h-full w-full"><line x1="0" x2="100" y1={zeroY} y2={zeroY} stroke="#64748b" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"/><polyline points={points} fill="none" stroke="#fbbf24" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg></div>
    {run.foundBonus && <div className="mt-2 rounded-lg border border-emerald-400/50 bg-emerald-950/60 p-2"><p className="text-[10px] font-black text-emerald-200">{run.foundBonus.scatterCount} scatters found · {run.foundBonus.bonusType} bonus</p><p className="mt-0.5 text-[9px] text-emerald-100/75">Play this bonus round now?</p><div className="mt-2 grid grid-cols-2 gap-2"><button onClick={onPlayFoundBonus} className="rounded-md bg-emerald-400 px-2 py-1.5 text-[9px] font-black uppercase text-black">Play bonus</button><button onClick={onSkipFoundBonus} className="rounded-md border border-emerald-300/60 px-2 py-1.5 text-[9px] font-black uppercase text-emerald-100">Continue voyage</button></div></div>}
    {run.isPaused && !run.foundBonus && <p className="mt-1 text-[9px] font-bold text-emerald-300">{run.stopReason ?? 'Paused.'} Resume when you’re ready.</p>}
    <footer className="mt-2 flex items-center justify-between gap-1">
      <div className="flex items-center gap-1" aria-label="Voyage speed">{SPEEDS.map((speed) => <button key={speed} onClick={() => onSpeedChange(speed)} disabled={!run.isRunning} className={`rounded-md border px-1.5 py-1 text-[9px] font-black ${run.speed === speed ? 'border-amber-300 bg-amber-400 text-black' : 'border-slate-700 bg-slate-900 text-slate-300'} disabled:opacity-40`}>{speed}×</button>)}</div>
      {run.isRunning ? <button onClick={onStop} className="rounded-md border border-red-400/70 bg-red-950 px-2.5 py-1 text-[9px] font-black uppercase text-red-100">Stop</button>
        : run.isPaused && !run.foundBonus ? <button onClick={onResume} disabled={!canResume} className="rounded-md border border-emerald-300 bg-emerald-400 px-2.5 py-1 text-[9px] font-black uppercase text-black disabled:opacity-40">Resume · {run.total - run.completed}</button>
        : <span className="text-[9px] font-bold text-slate-400">Best {formatMoney(run.best, currency)}</span>}
    </footer>
  </aside>;
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className="min-w-0 rounded-md bg-slate-900/80 px-1.5 py-1"><div className="truncate text-slate-400">{label}</div><div className={`truncate font-black ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</div></div>;
}
