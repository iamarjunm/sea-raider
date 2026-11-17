'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Award, Compass, Crown, Grid, ShieldCheck, Sliders, Sparkles, X } from 'lucide-react';
import { SYMBOL_METAS, PAYLINES, MODE_CONFIGS, MAX_RTP_PERCENT } from '../lib/slot-engine';
import { toSocialText } from '../lib/currency';
import bonusStartRanges from '../maths/bonus-multiplier-ranges.json';

interface PaytableModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSocial: boolean;
}

type PaytableTab = 'paytable' | 'modes' | 'rules' | 'controls';

export default function PaytableModal({ isOpen, onClose, isSocial }: PaytableModalProps) {
  const [activeTab, setActiveTab] = useState<PaytableTab>('paytable');

  const startRangeLabel = (scatterCount: number) => {
    const range = bonusStartRanges[String(scatterCount) as keyof typeof bonusStartRanges];
    return range ? `${range.min}×–${range.max}×` : '—';
  };
  const startStopsLabel = (scatterCount: number) => {
    const range = bonusStartRanges[String(scatterCount) as keyof typeof bonusStartRanges];
    return range?.values.map((value) => `${value}×`).join(' · ') ?? '—';
  };

  if (!isOpen) return null;

  const tabs: { id: PaytableTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'paytable',
      label: toSocialText('Symbol Wins', isSocial),
      shortLabel: toSocialText('Symbols', isSocial),
      icon: <Crown size={14} />,
    },
    {
      id: 'modes',
      label: toSocialText('Modes & Features', isSocial),
      shortLabel: toSocialText('Modes', isSocial),
      icon: <Compass size={14} />,
    },
    {
      id: 'rules',
      label: toSocialText('Paylines & Free Spins', isSocial),
      shortLabel: toSocialText('Paylines', isSocial),
      icon: <Grid size={14} />,
    },
    {
      id: 'controls',
      label: toSocialText('Controls & Disclaimer', isSocial),
      shortLabel: toSocialText('Controls', isSocial),
      icon: <Sliders size={14} />,
    },
  ];

  return (
    <div
      className="hud-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paytable-modal-title"
    >
      <div
        className="hud-cabinet hud-paytable"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-cabinet__bracket hud-cabinet__bracket--tl" aria-hidden="true" />
        <span className="hud-cabinet__bracket hud-cabinet__bracket--tr" aria-hidden="true" />
        <span className="hud-cabinet__bracket hud-cabinet__bracket--bl" aria-hidden="true" />
        <span className="hud-cabinet__bracket hud-cabinet__bracket--br" aria-hidden="true" />

        {/* Header */}
        <header className="hud-paytable__header">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-8 w-24 sm:h-9 sm:w-28 shrink-0">
              <Image
                src="/assets/aistudio/logo_37cf1416.webp"
                alt="Sea Raider Logo"
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="hud-kicker">SHIP&apos;S CODEX · 20 FIXED LINES · UP TO 50,000×</p>
              <h2 id="paytable-modal-title" className="hud-title truncate">
                {toSocialText('GAME RULES & PAYTABLE', isSocial)}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close game rules and paytable"
            className="hud-close-btn"
          >
            <X size={18} strokeWidth={2.6} />
          </button>
        </header>

        {/* Handcrafted Wood & Brass Navigation Tabs (No horizontal scroll) */}
        <nav className="hud-paytable__tabs" role="tablist" aria-label="Paytable sections">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`hud-paytable__tab ${isActive ? 'is-active' : ''}`}
              >
                <span className="hud-paytable__tab-icon">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Modal Body */}
        <div className="hud-paytable__body custom-scrollbar">
          {/* TAB 1: SYMBOL WINS */}
          {activeTab === 'paytable' && (
            <div className="space-y-5">
              {/* Special Symbols */}
              <section>
                <div className="hud-section-header">
                  <div>
                    <h3 className="hud-section-title">
                      {toSocialText('SPECIAL SYMBOLS', isSocial)}
                    </h3>
                    <p className="hud-section-sub">
                      {toSocialText(
                        'Symbol values are per active line. The selected total play is divided evenly across 20 fixed lines, and wins from separate lines are added together.',
                        isSocial
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                  {/* WILD */}
                  <div className="hud-special-card hud-special-card--wild">
                    <div className="hud-special-card__top">
                      <div className="hud-symbol-medallion hud-symbol-medallion--lg">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                          <Image
                            src={SYMBOL_METAS.WILD.asset}
                            alt="Wild"
                            fill
                            sizes="80px"
                            className="object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="hud-badge hud-badge--teal">SUBSTITUTE &amp; SURGE</span>
                        <h4 className="hud-special-card__name mt-1">WILD (GOLDEN SKULL)</h4>
                        <p className="hud-special-card__desc">
                          {toSocialText(
                            'Substitutes for every symbol except Scatter. When a Wild Surge is active, its shown multiplier applies to each winning payline.',
                            isSocial
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="hud-special-card__payouts">
                      {([5, 4, 3] as const).map((cnt) => (
                        <div key={cnt} className="hud-special-card__pay-pill">
                          <span className="hud-special-card__pay-cnt">{cnt} OF A KIND</span>
                          <strong className="hud-special-card__pay-val tabular-nums">
                            {SYMBOL_METAS.WILD.payouts[cnt]}×
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SCATTER */}
                  <div className="hud-special-card hud-special-card--scatter">
                    <div className="hud-special-card__top">
                      <div className="hud-symbol-medallion hud-symbol-medallion--lg">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                          <Image
                            src={SYMBOL_METAS.SCATTER.asset}
                            alt="Scatter"
                            fill
                            sizes="80px"
                            className="object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="hud-badge hud-badge--gold">BONUS TRIGGER</span>
                        <h4 className="hud-special-card__name mt-1">SCATTER (PIRATE GALLEON)</h4>
                        <p className="hud-special-card__desc">
                          Land 3 or more Scatters anywhere on the reels to trigger Free Spins bonus!
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-[#b58538]/20 text-[11px]">
                      <div className="hud-scatter-tier">
                        <span className="text-[#c9a460] font-bold">3 Scatters</span>
                        <strong className="text-[#f4ead5] tabular-nums">10 Spins</strong>
                      </div>
                      <div className="hud-scatter-tier">
                        <span className="text-[#c9a460] font-bold">4 Scatters</span>
                        <strong className="text-[#4de2d1] tabular-nums">12 Super Spins</strong>
                      </div>
                      <div className="hud-scatter-tier">
                        <span className="text-[#c9a460] font-bold">5 Scatters</span>
                        <strong className="text-[#f2c464] tabular-nums">15 Legend Spins</strong>
                      </div>
                      <div className="hud-scatter-tier">
                        <span className="text-[#c9a460] font-bold">6 Scatters</span>
                        <strong className="text-[#e89eff] tabular-nums">Ethereal Cataclysm!</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* High-Tier Pirate Symbols */}
              <section>
                <div className="hud-section-header mb-2.5">
                  <h3 className="hud-section-title">
                    {toSocialText('HIGH-TIER PIRATE SYMBOLS', isSocial)}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['H1', 'H2', 'H3', 'H4'] as const).map((id) => {
                    const meta = SYMBOL_METAS[id];
                    return (
                      <div key={id} className="hud-symbol-card hud-symbol-card--high">
                        <div className="hud-symbol-medallion">
                          <div className="relative h-16 w-16 sm:h-[72px] sm:w-[72px]">
                            <Image
                              src={meta.asset}
                              alt={meta.name}
                              fill
                              sizes="72px"
                              className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
                            />
                          </div>
                        </div>
                        <div className="hud-symbol-card__name">{meta.name}</div>
                        <div className="hud-symbol-card__table">
                          {([5, 4, 3] as const).map((cnt) => (
                            <div key={cnt} className="hud-symbol-card__row">
                              <span className="hud-symbol-card__cnt tabular-nums">{cnt}×</span>
                              <strong className="hud-symbol-card__val tabular-nums">
                                {meta.payouts[cnt]}×
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Low-Tier Royals */}
              <section>
                <div className="hud-section-header mb-2.5">
                  <h3 className="hud-section-title">
                    {toSocialText('LOW-TIER ROYALS', isSocial)}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(['L1', 'L2', 'L3', 'L4', 'L5'] as const).map((id) => {
                    const meta = SYMBOL_METAS[id];
                    return (
                      <div key={id} className="hud-symbol-card hud-symbol-card--low">
                        <div className="hud-symbol-medallion hud-symbol-medallion--sm">
                          <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                            <Image
                              src={meta.asset}
                              alt={meta.name}
                              fill
                              sizes="56px"
                              className="object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]"
                            />
                          </div>
                        </div>
                        <div className="hud-symbol-card__name">{meta.name}</div>
                        <div className="hud-symbol-card__table">
                          {([5, 4, 3] as const).map((cnt) => (
                            <div key={cnt} className="hud-symbol-card__row">
                              <span className="hud-symbol-card__cnt tabular-nums">{cnt}×</span>
                              <strong className="hud-symbol-card__val tabular-nums">
                                {meta.payouts[cnt]}×
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* How Line Wins Are Calculated */}
              <section className="hud-callout">
                <h3 className="hud-callout__title">
                  {toSocialText('HOW LINE WINS ARE CALCULATED', isSocial)}
                </h3>
                <p className="hud-callout__body">
                  {toSocialText(
                    'Base-game line win = listed symbol payout × ((base play × selected mode cost) ÷ 20) × the active game multiplier. In Free Spins, each line uses the listed symbol payout × (base play ÷ 20) × the displayed bonus multiplier. Every bonus connection, including Wild Surge, uses its saved multiplier and contributes its exact line amount to the total. The displayed line wins add up to the round result returned by Engine.',
                    isSocial
                  )}
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: MODES & FEATURES */}
          {activeTab === 'modes' && (
            <div className="space-y-5">
              <div className="hud-callout">
                <p className="hud-callout__body">
                  All theoretical Return to Player (RTP) percentages are calibrated to stay at or below{' '}
                  <strong className="text-[#f2c464] tabular-nums">{MAX_RTP_PERCENT.toFixed(2)}%</strong>, with strict win caps.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.values(MODE_CONFIGS).map((cfg) => (
                  <div key={cfg.id} className="hud-mode-card">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="hud-mode-card__title">
                          {toSocialText(cfg.name, isSocial)}
                        </h4>
                        <span className="hud-badge hud-badge--gold tabular-nums">
                          {toSocialText('Cost', isSocial)}: {cfg.costMultiplier}×
                        </span>
                      </div>
                      <p className="hud-mode-card__desc">
                        {toSocialText(cfg.description, isSocial)}
                      </p>
                    </div>

                    <div className="hud-mode-card__stats">
                      <div className="hud-mode-card__stat">
                        <span className="hud-mode-card__stat-label">RTP</span>
                        <strong className="hud-mode-card__stat-val text-[#4de2d1] tabular-nums">
                          {cfg.rtp.toFixed(2)}%
                        </strong>
                      </div>
                      <div className="hud-mode-card__stat">
                        <span className="hud-mode-card__stat-label">MAX WIN</span>
                        <strong className="hud-mode-card__stat-val text-[#f2c464] tabular-nums">
                          {cfg.maxWin}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exact Mystery Odds Table */}
              <section className="hud-inset-panel">
                <h4 className="hud-section-title mb-3 flex items-center gap-2">
                  <Sparkles size={15} className="text-[#f2c464]" />
                  ACCURATE MYSTERY MODE PROBABILITY BREAKDOWN
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="hud-prob-box">
                    <strong className="hud-prob-box__title text-[#f2c464]">
                      Unknown Bonus (250×):
                    </strong>
                    <ul className="space-y-1.5 mt-2">
                      <li className="hud-prob-row">
                        <span>3 Scatters (Curse)</span>
                        <strong className="tabular-nums">~52.0%</strong>
                      </li>
                      <li className="hud-prob-row">
                        <span>4 Scatters (Ghost)</span>
                        <strong className="tabular-nums">~36.9%</strong>
                      </li>
                      <li className="hud-prob-row">
                        <span>5 Scatters (Legend)</span>
                        <strong className="tabular-nums">~11.0%</strong>
                      </li>
                      <li className="hud-prob-row">
                        <span>Ethereal Bonus (6 Scatters)</span>
                        <strong className="text-[#4de2d1] tabular-nums">~0.1%</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="hud-prob-box">
                    <strong className="hud-prob-box__title text-[#ff9d8a]">
                      Unknown Extreme (500×):
                    </strong>
                    <ul className="space-y-1.5 mt-2">
                      <li className="hud-prob-row">
                        <span>No Bonus (Bust)</span>
                        <strong className="tabular-nums">~85.0%</strong>
                      </li>
                      <li className="hud-prob-row">
                        <span>Hidden Bonus (5 Scatters)</span>
                        <strong className="text-[#f2c464] tabular-nums">~13.0%</strong>
                      </li>
                      <li className="hud-prob-row">
                        <span>Ethereal Bonus (6 Scatters)</span>
                        <strong className="text-[#4de2d1] tabular-nums">~2.0%</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: PAYLINES & FREE SPINS */}
          {activeTab === 'rules' && (
            <div className="space-y-5">
              {/* Free Spins & Bonus Rounds Explained */}
              <section className="hud-inset-panel space-y-3.5">
                <div>
                  <h3 className="hud-section-title flex items-center gap-2">
                    <Award size={16} className="text-[#f2c464]" />
                    FREE SPINS &amp; BONUS ROUNDS EXPLAINED
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#cbbca0]">
                    Before the first Free Spin, a custom multiplier reel reveals the starting value already selected by the game result. The reel is a presentation of that saved result; it does not change or reroll the outcome. During the feature, each spin rolls to its saved multiplier; RISE means it increased and HOLD means it stayed the same. It never decreases, and that spin’s multiplier applies to every winning line.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="hud-bonus-tier-card">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#f2c464] text-[13px]">
                        1. Curse of the High Seas
                      </strong>
                      <span className="hud-badge hud-badge--gold">3 SCATTERS · 10 SPINS</span>
                    </div>
                    <p className="mt-1.5 text-[#cbbca0] leading-relaxed">
                      Awards 10 Free Spins. Starting range: <strong className="text-[#f4ead5] tabular-nums">{startRangeLabel(3)}</strong>. Available starting stops: <span className="text-[#e6d5b5] tabular-nums">{startStopsLabel(3)}</span>. Wilds land randomly; every Wild revealed fills the Wild Surge meter.
                    </p>
                  </div>

                  <div className="hud-bonus-tier-card">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#4de2d1] text-[13px]">
                        2. Ghost Captain&apos;s Revenge
                      </strong>
                      <span className="hud-badge hud-badge--teal">4 SCATTERS · 12 SPINS</span>
                    </div>
                    <p className="mt-1.5 text-[#cbbca0] leading-relaxed">
                      Awards 12 Free Spins. Starting range: <strong className="text-[#f4ead5] tabular-nums">{startRangeLabel(4)}</strong>. Available starting stops: <span className="text-[#e6d5b5] tabular-nums">{startStopsLabel(4)}</span>. At least one Wild lands on reel 2 each spin.
                    </p>
                  </div>

                  <div className="hud-bonus-tier-card">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#ff9d8a] text-[13px]">
                        3. Pirate Legend Jackpot
                      </strong>
                      <span className="hud-badge hud-badge--gold">5 SCATTERS · 15 SPINS</span>
                    </div>
                    <p className="mt-1.5 text-[#cbbca0] leading-relaxed">
                      {toSocialText(
                        `Awards 15 Free Spins. Starting range: ${startRangeLabel(5)}. Available starting stops: ${startStopsLabel(5)}. One Wild lands on each of reels 2, 3, and 4 per spin. Standard five-scatter rounds return at least 1,500× the base play; Unknown Extreme five-scatter rounds at least 750×. Both can reach 25,000×.`,
                        isSocial
                      )}
                    </p>
                  </div>

                  <div className="hud-bonus-tier-card">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#e89eff] text-[13px]">
                        4. Ethereal Cataclysm
                      </strong>
                      <span className="hud-badge hud-badge--teal">6 SCATTERS · 10 SPINS</span>
                    </div>
                    <p className="mt-1.5 text-[#cbbca0] leading-relaxed">
                      {toSocialText(
                        `Awards 10 Ethereal Spins. Starting range: ${startRangeLabel(6)}. Available starting stops: ${startStopsLabel(6)}. Each reel can receive a Wild. Six-scatter rounds return at least 8,000× the base play and can reach 50,000×.`,
                        isSocial
                      )}
                    </p>
                  </div>
                </div>

                <div className="hud-callout">
                  <strong className="text-[#f2c464] text-xs uppercase tracking-wider">Wild Surge Finale:</strong>
                  <p className="mt-1 text-xs leading-relaxed text-[#d9ccb4]">
                    Every Wild symbol appearing on a bonus spin adds 1 to the meter; Wilds do not stick between spins. At the end of the bonus, each charged meter row adds a full horizontal Wild line to one final surge spin (maximum 3 rows). The meter threshold is 5 Wilds per row in Curse, 20 in Ghost, 45 in Legend, and 30 in Ethereal. The row positions are selected by the precomputed game result.
                  </p>
                </div>

                <div className="rounded-lg border border-[#4de2d1]/30 bg-[#07262c]/60 px-3.5 py-2.5 text-xs text-[#9ef0e8]">
                  <strong className="text-[#4de2d1]">Retriggers:</strong> Landing 2 Scatters during any Free Spins round awards +3 additional spins; 3 or more Scatters awards +5 spins!
                </div>
              </section>

              {/* 20 Fixed Paylines Diagrams */}
              <section>
                <div className="hud-section-header mb-3">
                  <h3 className="hud-section-title">
                    20 FIXED PAYLINES (LEFT-TO-RIGHT)
                  </h3>
                  <p className="hud-section-sub">
                    {toSocialText(
                      'Winning combinations pay from left to right, starting from the leftmost reel on adjacent reels along the 20 predefined paylines. Only the highest win per active line is awarded.',
                      isSocial
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {PAYLINES.map((line, idx) => {
                    const ordered = [...line].sort((a, b) => a[0] - b[0]);
                    const polylinePoints = ordered
                      .map(([c, r]) => `${c * 22 + 11},${r * 16 + 8}`)
                      .join(' ');
                    return (
                      <div key={idx} className="hud-payline-card">
                        <div className="hud-payline-card__head">
                          <span className="hud-payline-card__num tabular-nums">
                            LINE {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <svg
                          viewBox="0 0 110 48"
                          className="hud-payline-svg"
                          aria-label={`Payline ${idx + 1}`}
                        >
                          {/* Background 5x3 grid cells */}
                          {[0, 1, 2].map((r) =>
                            [0, 1, 2, 3, 4].map((c) => {
                              const active = line.some(([lc, lr]) => lc === c && lr === r);
                              return (
                                <rect
                                  key={`${c}-${r}`}
                                  x={c * 22 + 3}
                                  y={r * 16 + 2}
                                  width={16}
                                  height={12}
                                  rx={2.5}
                                  fill={active ? 'rgba(242, 196, 100, 0.22)' : 'rgba(255, 255, 255, 0.04)'}
                                  stroke={active ? '#e2ac4a' : 'rgba(255, 255, 255, 0.08)'}
                                  strokeWidth={active ? 1.2 : 0.8}
                                />
                              );
                            })
                          )}
                          {/* Connected payline path */}
                          <polyline
                            points={polylinePoints}
                            fill="none"
                            stroke="#f2c464"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Active nodes */}
                          {ordered.map(([c, r]) => (
                            <circle
                              key={`dot-${c}-${r}`}
                              cx={c * 22 + 11}
                              cy={r * 16 + 8}
                              r="3.2"
                              fill="#fff3c4"
                              stroke="#8a5a18"
                              strokeWidth="1.2"
                            />
                          ))}
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: CONTROLS & DISCLAIMER */}
          {activeTab === 'controls' && (
            <div className="space-y-5">
              <section>
                <div className="hud-section-header mb-3">
                  <h3 className="hud-section-title">INTERACTIVE CONTROLS GUIDE</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Spin Button:</strong>
                    <p className="hud-control-card__desc">
                      {toSocialText('Places a bet and spins the 5 reels at the current bet level and active mode.', isSocial)}
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Spacebar:</strong>
                    <p className="hud-control-card__desc">
                      {toSocialText('Pressing the spacebar triggers a bet exactly like the main Spin button without scrolling the viewport.', isSocial)}
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">
                      {toSocialText('Bet + / - Buttons:', isSocial)}
                    </strong>
                    <p className="hud-control-card__desc">
                      {toSocialText('Adjusts the base bet size across authorized dynamic bet levels for your currency.', isSocial)}
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Auto Play:</strong>
                    <p className="hud-control-card__desc">
                      {toSocialText('Opens the configuration panel to select 10, 25, 50, 100, 250, or ∞ spins and optional stop conditions. Spin speed follows the Turbo control. While autoplay is running, Stop ends the run before another spin.', isSocial)}
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Turbo / Speed Toggle:</strong>
                    <p className="hud-control-card__desc">
                      Each press cycles through normal speed, Turbo, and Ultra Turbo. Autoplay follows the selected setting.
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">
                      {toSocialText('Voyage Simulator:', isSocial)}
                    </strong>
                    <p className="hud-control-card__desc">
                      {toSocialText('Select the number and pace of spins and which features pause the graph. Each real RGS play is deducted from the session balance. During a run, change its pace with the speed buttons or choose Stop. Choose Resume to continue a paused run. Play a found feature or settle it before continuing. Close the session summary when the run is finished.', isSocial)}
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Skip Bonus:</strong>
                    <p className="hud-control-card__desc">
                      Ends the remaining bonus spins immediately and opens the round total. If a large win is already in the result, the confirmation says so; skipping remains available.
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">
                      {toSocialText('Bonus Buy / Enhancers:', isSocial)}
                    </strong>
                    <p className="hud-control-card__desc">
                      {toSocialText('Opens the Enhancers menu to activate Bonus Chance, Super Bonus Chance, Pirates Chance, or Feature modes.', isSocial)}
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Sound Toggle:</strong>
                    <p className="hud-control-card__desc">
                      The speaker opens audio settings. Master mute silences music and effects; separate sliders and mute controls adjust each group.
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Menu:</strong>
                    <p className="hud-control-card__desc">
                      Opens the captain&apos;s settings, including turbo and fullscreen controls.
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Info:</strong>
                    <p className="hud-control-card__desc">
                      Opens this rules, symbols, modes, and win guide.
                    </p>
                  </div>
                  <div className="hud-control-card">
                    <strong className="hud-control-card__title">Fullscreen:</strong>
                    <p className="hud-control-card__desc">
                      The toggle in Menu expands the game to fill or leave fullscreen.
                    </p>
                  </div>
                </div>
              </section>

              {/* Official Engine Disclaimer Verbatim */}
              <section className="hud-callout">
                <h4 className="hud-callout__title flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#f2c464]" />
                  GENERAL DISCLAIMER &amp; REGULATIONS
                </h4>
                <p className="hud-callout__body">
                  Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Engine.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
