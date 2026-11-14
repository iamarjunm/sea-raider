'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Anchor, Compass, Gauge, Sailboat, X } from 'lucide-react';
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
const BONUS_CHOICES: { key: BonusType; label: string; scatters: number }[] = [
  { key: 'curse', label: 'Curse', scatters: 3 },
  { key: 'ghost', label: 'Ghost', scatters: 4 },
  { key: 'legend', label: 'Legend', scatters: 5 },
  { key: 'ethereal', label: 'Ethereal', scatters: 6 },
];
const SPIN_COUNTS = [10, 25, 50, 100, 250, 500];

export default function AutoplayModal({
  isOpen, onClose, onStartAuto, onStartSimulation, isSocial, activeMode, baseBet, balance, currency, canStartSimulation, isDemo,
}: AutoplayModalProps) {
  const [tab, setTab] = useState<'auto' | 'simulate'>('auto');
  const [selectedSpins, setSelectedSpins] = useState(50);
  const [stopOnWin, setStopOnWin] = useState(false);
  const [stopOnFeature, setStopOnFeature] = useState(false);
  const [speed, setSpeed] = useState<SpinSpeed>(1);
  const [stopBonuses, setStopBonuses] = useState<BonusType[]>([]);

  const spinCost = baseBet * MODE_CONFIGS[activeMode].costMultiplier;
  const maxOutlay = spinCost * selectedSpins;
  const canAffordOneSpin = balance >= spinCost;
  const startDisabled = tab === 'auto' ? !canAffordOneSpin : !canStartSimulation || !canAffordOneSpin;

  const start = () => {
    if (startDisabled) return;
    if (tab === 'auto') onStartAuto({ spins: selectedSpins, stopOnWin, stopOnFeature });
    else onStartSimulation({ spins: selectedSpins, stopOnBonuses: stopBonuses, speed });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="voyage"
          className="ship-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="voyage-title"
        >
          <motion.div
            className="voyage"
            initial={{ y: 40, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="voyage__corner voyage__corner--tl" aria-hidden="true" />
            <span className="voyage__corner voyage__corner--tr" aria-hidden="true" />
            <span className="voyage__corner voyage__corner--bl" aria-hidden="true" />
            <span className="voyage__corner voyage__corner--br" aria-hidden="true" />

            <header className="voyage__header">
              <div className="voyage__helm" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/sea-raider/scene/helm-wheel.png" alt="" draggable={false} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="voyage__kicker">{toSocialText('Chart your course', isSocial)}</p>
                <h2 id="voyage-title" className="voyage__title">{toSocialText('Autoplay Voyage', isSocial)}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="ship-seal-close"><X size={18} strokeWidth={3} /></button>
            </header>

            <div className="voyage__tabs" role="tablist">
              {(['auto', 'simulate'] as const).map((key) => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`voyage__tab ${tab === key ? 'is-active' : ''}`}>
                  {tab === key && <motion.span layoutId="voyage-tab" className="voyage__tab-glow" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {key === 'auto' ? <Sailboat size={14} /> : <Compass size={14} />}
                    {key === 'auto' ? 'Autoplay' : 'Voyage Simulator'}
                  </span>
                </button>
              ))}
            </div>

            <div className="voyage__body">
              <section>
                <h3 className="voyage__label">Number of spins</h3>
                <div className="voyage__coins">
                  {SPIN_COUNTS.map((count) => (
                    <motion.button
                      key={count}
                      onClick={() => setSelectedSpins(count)}
                      whileTap={{ scale: 0.9 }}
                      className={`voyage__coin ${selectedSpins === count ? 'is-active' : ''}`}
                      aria-pressed={selectedSpins === count}
                    >
                      <span className="tabular-nums">{count}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              <AnimatePresence mode="wait" initial={false}>
                {tab === 'auto' ? (
                  <motion.section key="auto" className="voyage__panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
                    <h3 className="voyage__label"><Anchor size={12} /> Drop anchor when</h3>
                    <Lever label="Any win lands" checked={stopOnWin} onChange={setStopOnWin} />
                    <Lever label={toSocialText('A bonus feature triggers', isSocial)} checked={stopOnFeature} onChange={setStopOnFeature} />
                    <p className="voyage__note">Each spin uses the current mode and balance. Speed follows the Turbo button.</p>
                  </motion.section>
                ) : (
                  <motion.section key="sim" className="voyage__panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
                    <h3 className="voyage__label"><Gauge size={12} /> Sailing speed</h3>
                    <div className="voyage__speeds">
                      {SPEEDS.map((value) => (
                        <button key={value} onClick={() => setSpeed(value)} className={`voyage__speed ${speed === value ? 'is-active' : ''}`} aria-pressed={speed === value}>{value}×</button>
                      ))}
                    </div>
                    <h3 className="voyage__label mt-3"><Anchor size={12} /> Heave to on these bonuses</h3>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {BONUS_CHOICES.map(({ key, label, scatters }) => (
                        <Lever key={key} label={<><b className="tabular-nums">{scatters}</b> scatters · {label}</>} checked={stopBonuses.includes(key)} onChange={(checked) => setStopBonuses((old) => checked ? [...old, key] : old.filter((item) => item !== key))} />
                      ))}
                    </div>
                    <p className="voyage__note">Each spin is a real RGS play and debits this {isDemo ? 'demo' : 'live'} session. The run pauses on a selected bonus and stops if the balance can&apos;t cover the next spin.</p>
                  </motion.section>
                )}
              </AnimatePresence>

              <div className="voyage__ledger">
                <div>
                  <span>{MODE_CONFIGS[activeMode].name}</span>
                  <b className="tabular-nums">{formatMoney(spinCost, currency)} <small>/ spin</small></b>
                </div>
                <div>
                  <span>{tab === 'auto' ? 'Up to' : 'Max session spend'}</span>
                  <b className="voyage__ledger-total tabular-nums">{formatMoney(maxOutlay, currency)}</b>
                </div>
              </div>
            </div>

            <footer className="voyage__footer">
              {tab === 'simulate' && !canStartSimulation && (
                <p className="voyage__warning">{toSocialText('This preview has no authenticated RGS wallet. Open Sea Raider through Engine Play Game to connect a demo or live session.', isSocial)}</p>
              )}
              {!canAffordOneSpin && <p className="voyage__warning">Your balance can&apos;t cover one spin at this amount.</p>}
              <motion.button
                onClick={start}
                disabled={startDisabled}
                whileHover={startDisabled ? undefined : { y: -2 }}
                whileTap={startDisabled ? undefined : { scale: 0.97 }}
                className="voyage__start"
              >
                <span className="voyage__start-wave" aria-hidden="true" />
                <span className="relative z-10">{tab === 'auto' ? 'Set sail' : 'Start voyage'}</span>
                <span className="voyage__start-count relative z-10 tabular-nums">{selectedSpins} spins</span>
              </motion.button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Lever({ label, checked, onChange }: { label: React.ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`voyage__lever ${checked ? 'is-on' : ''}`}>
      <span className="min-w-0">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="voyage__switch" aria-hidden="true"><span className="voyage__knob" /></span>
    </label>
  );
}
