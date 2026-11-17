'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Gauge, Play, Repeat, ShieldAlert, Sparkles, Trophy, X } from 'lucide-react';
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

type SpinCountOption = 10 | 25 | 50 | 100 | 250 | 'infinite';
const SPIN_COUNT_OPTIONS: { value: SpinCountOption; label: string; sub: string }[] = [
  { value: 10, label: '10', sub: 'SPINS' },
  { value: 25, label: '25', sub: 'SPINS' },
  { value: 50, label: '50', sub: 'SPINS' },
  { value: 100, label: '100', sub: 'SPINS' },
  { value: 250, label: '250', sub: 'SPINS' },
  { value: 'infinite', label: '∞', sub: 'UNTIL STOP' },
];

export default function AutoplayModal({
  isOpen,
  onClose,
  onStartAuto,
  onStartSimulation,
  isSocial,
  activeMode,
  baseBet,
  balance,
  currency,
  canStartSimulation,
  isDemo,
}: AutoplayModalProps) {
  const [tab, setTab] = useState<'auto' | 'simulate'>('auto');
  const [selectedOption, setSelectedOption] = useState<SpinCountOption>(50);
  const [stopOnWin, setStopOnWin] = useState(false);
  const [stopOnFeature, setStopOnFeature] = useState(true);
  const [stopOnLossGuard, setStopOnLossGuard] = useState(true);
  const [speed, setSpeed] = useState<SpinSpeed>(1);
  const [stopBonuses, setStopBonuses] = useState<BonusType[]>([]);

  const spinCost = baseBet * MODE_CONFIGS[activeMode].costMultiplier;
  const resolvedSpins =
    selectedOption === 'infinite'
      ? tab === 'auto'
        ? Number.POSITIVE_INFINITY
        : 500
      : selectedOption;
  const isInfinite = selectedOption === 'infinite' && tab === 'auto';
  const maxOutlay = isInfinite ? balance : spinCost * resolvedSpins;
  const canAffordOneSpin = balance >= spinCost;
  const startDisabled = tab === 'auto' ? !canAffordOneSpin : !canStartSimulation || !canAffordOneSpin;

  const start = () => {
    if (startDisabled) return;
    if (tab === 'auto') {
      onStartAuto({ spins: resolvedSpins, stopOnWin, stopOnFeature });
    } else {
      onStartSimulation({ spins: resolvedSpins, stopOnBonuses: stopBonuses, speed });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="autoplay-modal-backdrop"
          className="hud-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="autoplay-modal-title"
        >
          <motion.div
            className="hud-cabinet hud-autoplay"
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.97, opacity: 0, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="hud-cabinet__bracket hud-cabinet__bracket--tl" aria-hidden="true" />
            <span className="hud-cabinet__bracket hud-cabinet__bracket--tr" aria-hidden="true" />
            <span className="hud-cabinet__bracket hud-cabinet__bracket--bl" aria-hidden="true" />
            <span className="hud-cabinet__bracket hud-cabinet__bracket--br" aria-hidden="true" />

            {/* Header */}
            <header className="hud-autoplay__header">
              <div className="hud-autoplay__badge" aria-hidden="true">
                <Repeat size={18} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="hud-kicker">{toSocialText('AUTOMATED HELM CONTROL', isSocial)}</p>
                <h2 id="autoplay-modal-title" className="hud-title">
                  {toSocialText('Autoplay Settings', isSocial)}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close autoplay settings"
                className="hud-close-btn"
              >
                <X size={17} strokeWidth={2.6} />
              </button>
            </header>

            {/* Mode Switcher */}
            <div className="hud-segmented" role="tablist">
              {(['auto', 'simulate'] as const).map((key) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(key)}
                    className={`hud-segmented__btn ${active ? 'is-active' : ''}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="autoplay-seg-pill"
                        className="hud-segmented__pill"
                        transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      {key === 'auto' ? <Repeat size={13} /> : <Compass size={13} />}
                      {key === 'auto' ? 'Autoplay' : 'Voyage Simulator'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="hud-autoplay__body custom-scrollbar">
              {/* Spin Count Chips */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="hud-section-label">NUMBER OF SPINS</h3>
                  <span className="text-[10px] font-bold tracking-wider text-[#9db4b8] tabular-nums">
                    {isInfinite ? 'CONTINUOUS RUN' : `${resolvedSpins} SPINS SELECTED`}
                  </span>
                </div>
                <div className="hud-spin-chips">
                  {SPIN_COUNT_OPTIONS.map((opt) => {
                    const active = selectedOption === opt.value;
                    const displayLabel =
                      opt.value === 'infinite' && tab === 'simulate' ? '500' : opt.label;
                    const displaySub =
                      opt.value === 'infinite' && tab === 'simulate' ? 'MAX SIM' : opt.sub;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setSelectedOption(opt.value)}
                        aria-pressed={active}
                        className={`hud-spin-chip ${active ? 'is-active' : ''}`}
                      >
                        <span className="hud-spin-chip__num tabular-nums">{displayLabel}</span>
                        <span className="hud-spin-chip__sub">{displaySub}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Stop Conditions / Simulator Options */}
              <AnimatePresence mode="wait" initial={false}>
                {tab === 'auto' ? (
                  <motion.section
                    key="auto-panel"
                    className="hud-inset-panel"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.14 }}
                  >
                    <h3 className="hud-section-label mb-2">STOP CONDITIONS</h3>
                    <div className="flex flex-col divide-y divide-[#b58538]/15">
                      <ToggleRow
                        icon={<Sparkles size={14} className="text-[#4de2d1]" />}
                        title={toSocialText('Stop on Bonus Feature', isSocial)}
                        subtitle="Halt autoplay when 3+ Scatters trigger Free Spins"
                        checked={stopOnFeature}
                        onChange={setStopOnFeature}
                      />
                      <ToggleRow
                        icon={<Trophy size={14} className="text-[#f2c464]" />}
                        title={toSocialText('Stop on Single Win', isSocial)}
                        subtitle="Halt autoplay immediately when any winning spin lands"
                        checked={stopOnWin}
                        onChange={setStopOnWin}
                      />
                      <ToggleRow
                        icon={<ShieldAlert size={14} className="text-[#e08b6b]" />}
                        title="Stop on Insufficient Balance"
                        subtitle="Automatically stops if balance cannot cover the active spin cost"
                        checked={stopOnLossGuard}
                        onChange={setStopOnLossGuard}
                      />
                    </div>
                  </motion.section>
                ) : (
                  <motion.section
                    key="sim-panel"
                    className="hud-inset-panel space-y-3"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.14 }}
                  >
                    <div>
                      <h3 className="hud-section-label mb-2">
                        <Gauge size={12} /> SIMULATION SPEED
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {SPEEDS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSpeed(value)}
                            aria-pressed={speed === value}
                            className={`hud-speed-chip tabular-nums ${speed === value ? 'is-active' : ''}`}
                          >
                            {value}×
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="hud-section-label mb-1.5">PAUSE ON BONUS TIERS</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y sm:divide-y-0 divide-[#b58538]/15">
                        {BONUS_CHOICES.map(({ key, label, scatters }) => (
                          <ToggleRow
                            key={key}
                            compact
                            title={
                              <span>
                                <strong className="text-[#f2c464] tabular-nums">{scatters} Scatters</strong> · {label}
                              </span>
                            }
                            checked={stopBonuses.includes(key)}
                            onChange={(checked) =>
                              setStopBonuses((old) =>
                                checked ? [...old, key] : old.filter((item) => item !== key)
                              )
                            }
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] leading-snug text-[#9eb0b5]">
                        Each spin is a real RGS play and debits this {isDemo ? 'demo' : 'live'} session. Pauses on selected bonuses.
                      </p>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Dark Wood & Brass Summary Ledger (Parchment-Free) */}
              <div className="hud-summary-strip">
                <div className="hud-summary-strip__cell">
                  <span className="hud-summary-strip__label">ACTIVE MODE</span>
                  <strong className="hud-summary-strip__value text-[#f4ead5]">
                    {toSocialText(MODE_CONFIGS[activeMode].name, isSocial)}
                  </strong>
                </div>
                <div className="hud-summary-strip__cell">
                  <span className="hud-summary-strip__label">{toSocialText('COST / SPIN', isSocial)}</span>
                  <strong className="hud-summary-strip__value text-[#f2c464] tabular-nums">
                    {formatMoney(spinCost, currency)}
                  </strong>
                </div>
                <div className="hud-summary-strip__cell text-right">
                  <span className="hud-summary-strip__label">
                    {isInfinite ? 'SESSION LIMIT' : 'MAX OUTLAY'}
                  </span>
                  <strong className="hud-summary-strip__value text-[#56dcd4] tabular-nums">
                    {isInfinite ? 'Until Stopped' : formatMoney(maxOutlay, currency)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer & Start Button */}
            <footer className="hud-autoplay__footer">
              {tab === 'simulate' && !canStartSimulation && (
                <p className="hud-warning-banner">
                  {toSocialText(
                    'This preview has no authenticated RGS wallet. Open Sea Raider through Engine Play Game to connect a demo or live session.',
                    isSocial
                  )}
                </p>
              )}
              {!canAffordOneSpin && (
                <p className="hud-warning-banner">
                  Your balance cannot cover one spin at {formatMoney(spinCost, currency)}.
                </p>
              )}

              <button
                type="button"
                onClick={start}
                disabled={startDisabled}
                className="hud-primary-cta"
              >
                <span className="flex items-center gap-2">
                  <Play size={16} fill="currentColor" />
                  <span>{tab === 'auto' ? 'START AUTOPLAY' : 'START VOYAGE'}</span>
                </span>
                <span className="hud-primary-cta__badge tabular-nums">
                  {isInfinite ? '∞ SPINS' : `${resolvedSpins} SPINS`}
                </span>
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  checked,
  onChange,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label className={`hud-toggle-row ${compact ? 'hud-toggle-row--compact' : ''} ${checked ? 'is-on' : ''}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0">
          <div className="hud-toggle-row__title">{title}</div>
          {subtitle && <div className="hud-toggle-row__sub">{subtitle}</div>}
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="hud-switch" aria-hidden="true">
        <span className="hud-switch__thumb" />
      </span>
    </label>
  );
}
