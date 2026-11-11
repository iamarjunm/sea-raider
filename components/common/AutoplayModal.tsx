'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BonusType, MODE_CONFIGS, PlayMode } from '../../lib/slot-engine';
import { formatMoney, toSocialText } from '../../lib/currency';

export type SpinSpeed = 0.5 | 1 | 2 | 4;

interface AutoplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAuto: (options: { spins: number; stopOnWin: boolean; stopOnFeature: boolean }) => void;
  onStartSimulation: (options: { spins: number; stopOnBonuses: BonusType[]; speed: SpinSpeed }) => void;
  isSocial: boolean;
  activeMode: PlayMode;
  baseBet: number;
  balance: number;
  currency: string;
  canStartSimulation: boolean;
  isDemo: boolean;
}

const SPEEDS: SpinSpeed[] = [0.5, 1, 2, 4];
const BONUS_CHOICES: { key: BonusType; label: string }[] = [
  { key: 'curse', label: '3 scatters · Curse' },
  { key: 'ghost', label: '4 scatters · Ghost' },
  { key: 'legend', label: '5 scatters · Legend' },
  { key: 'ethereal', label: '6 scatters · Ethereal' },
];
const SIMULATION_SPINS = [10, 25, 50, 100, 250, 500];

export default function AutoplayModal({
  isOpen, onClose, onStartAuto, onStartSimulation, isSocial, activeMode, baseBet, balance, currency, canStartSimulation, isDemo,
}: AutoplayModalProps) {
  const [tab, setTab] = useState<'auto' | 'simulate'>('auto');
  const [selectedSpins, setSelectedSpins] = useState(50);
  const [stopOnWin, setStopOnWin] = useState(false);
  const [stopOnFeature, setStopOnFeature] = useState(false);
  const [speed, setSpeed] = useState<SpinSpeed>(1);
  const [stopBonuses, setStopBonuses] = useState<BonusType[]>([]);

  if (!isOpen) return null;

  const spinCost = baseBet * MODE_CONFIGS[activeMode].costMultiplier;
  const maxOutlay = spinCost * selectedSpins;
  const canAffordOneSpin = balance >= spinCost;
  const startAuto = () => {
    onStartAuto({ spins: selectedSpins, stopOnWin, stopOnFeature });
    onClose();
  };
  const startSimulation = () => {
    onStartSimulation({ spins: selectedSpins, stopOnBonuses: stopBonuses, speed });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4">
        <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.18 }}
          className="max-h-[96dvh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-amber-600/70 bg-gradient-to-b from-[#18110b] via-[#100a06] to-[#080402] p-3 text-white shadow-[0_20px_70px_rgba(0,0,0,.9)] sm:p-5">
          <header className="flex items-start justify-between gap-3 border-b border-amber-900/60 pb-3">
            <div><h2 className="text-sm font-black uppercase tracking-widest text-amber-300 sm:text-lg">⚓ {toSocialText('AUTOPLAY VOYAGE', isSocial)}</h2>
              <p className="mt-1 text-[10px] text-amber-100/65 sm:text-xs">Choose autoplay or chart real RGS spins with the Voyage Simulator.</p></div>
            <button onClick={onClose} aria-label="Close" className="h-8 w-8 shrink-0 rounded-full border border-amber-700/60 text-amber-200 hover:bg-amber-900/60">✕</button>
          </header>

          <div className="my-3 grid grid-cols-2 rounded-xl border border-amber-900/60 bg-black/40 p-1">
            <button onClick={() => setTab('auto')} className={`rounded-lg px-3 py-2 text-xs font-black uppercase ${tab === 'auto' ? 'bg-amber-400 text-black' : 'text-amber-100/70'}`}>Autoplay</button>
            <button onClick={() => setTab('simulate')} className={`rounded-lg px-3 py-2 text-xs font-black uppercase ${tab === 'simulate' ? 'bg-amber-400 text-black' : 'text-amber-100/70'}`}>Voyage Simulator</button>
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-300">Number of spins</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(tab === 'auto' ? [10, 25, 50, 100, 250, 500] : SIMULATION_SPINS).map((count) => <button key={count} onClick={() => setSelectedSpins(count)} className={`h-10 rounded-lg border text-sm font-black ${selectedSpins === count ? 'border-amber-200 bg-amber-400 text-black' : 'border-amber-900 bg-black/60 text-amber-100'}`}>{count}</button>)}
              </div>
            </div>

            {tab === 'simulate' && <div>
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-300">Spin speed</h3>
              <div className="grid grid-cols-4 gap-2">{SPEEDS.map((value) => <button key={value} onClick={() => setSpeed(value)} className={`h-9 rounded-lg border text-xs font-black ${speed === value ? 'border-amber-200 bg-amber-400 text-black' : 'border-amber-900 bg-black/60 text-amber-100'}`}>{value}×</button>)}</div>
              <p className="mt-1 text-[9px] text-slate-400">Controls the pause between real RGS spins. Change speed while the session runs.</p>
            </div>}

            {tab === 'auto' ? <section className="space-y-2 rounded-xl border border-amber-900/60 bg-black/40 p-3">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-amber-300">Stop conditions</h3>
              <CheckRow label="Stop on any win" checked={stopOnWin} onChange={setStopOnWin} />
              <CheckRow label={toSocialText('Stop if Bonus Feature triggers', isSocial)} checked={stopOnFeature} onChange={setStopOnFeature} />
            </section> : <>
              <section className="space-y-2 rounded-xl border border-amber-900/60 bg-black/40 p-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-amber-300">Pause on these bonuses</h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">{BONUS_CHOICES.map(({ key, label }) => <CheckRow key={key} label={label} checked={stopBonuses.includes(key)} onChange={(checked) => setStopBonuses((old) => checked ? [...old, key] : old.filter((item) => item !== key))} />)}</div>
                <p className="text-[9px] text-slate-400">The graph pauses when a selected bonus is found. Play the awarded bonus or settle it and continue.</p>
              </section>
              <section className="rounded-xl border border-amber-400/50 bg-amber-950/40 p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-amber-100/75">Current mode · {MODE_CONFIGS[activeMode].name}</span><span className="text-[10px] font-bold text-amber-100">{formatMoney(spinCost, currency)} / spin</span></div>
                <div className="mt-1 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-amber-100/75">Maximum session spend</span><span className="text-sm font-black text-amber-300">{formatMoney(maxOutlay, currency)}</span></div>
                <p className="mt-1 text-[9px] text-slate-300">Each spin is a real RGS play and debits this {isDemo ? 'demo' : 'live'} session balance. The run stops if the balance cannot cover the next spin.</p>
              </section>
            </>}

            {tab === 'auto' ? <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/30 px-3 py-2"><span className="text-[10px] text-slate-300">Each spin uses the current mode and balance. Speed follows the Turbo button.</span><span className="text-[10px] font-bold text-amber-200">{formatMoney(spinCost, currency)} / spin</span></div> : null}

            {tab === 'auto' ? <div className="flex justify-end"><button onClick={startAuto} disabled={!canAffordOneSpin} className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-300 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-40">Start autoplay · {selectedSpins}</button></div> : <div className="flex flex-col items-end gap-2"><button onClick={startSimulation} disabled={!canStartSimulation || !canAffordOneSpin} className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-300 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-40">Start voyage · {selectedSpins}</button>{!canStartSimulation && <p className="max-w-xs text-right text-[9px] text-amber-100/70">{toSocialText('This preview has no authenticated RGS wallet. Open Sea Raider through Engine Play Game to connect a demo or live session; either session type can run the Voyage Simulator.', isSocial)}</p>}</div>}
          </section>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-2 text-[10px] font-semibold text-amber-100 sm:text-xs"><span>{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 shrink-0 accent-amber-500" /></label>;
}
