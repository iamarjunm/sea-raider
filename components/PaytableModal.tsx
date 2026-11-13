'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SYMBOL_METAS, PAYLINES, MODE_CONFIGS, MAX_RTP_PERCENT } from '../lib/slot-engine';
import { toSocialText } from '../lib/currency';
import mathSummary from '../maths/math-summary.json';
import bonusStartRanges from '../maths/bonus-multiplier-ranges.json';

interface PaytableModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSocial: boolean;
}

export default function PaytableModal({ isOpen, onClose, isSocial }: PaytableModalProps) {
  const [activeTab, setActiveTab] = useState<'paytable' | 'modes' | 'rules' | 'controls'>('paytable');
  const startRangeLabel = (scatterCount: number) => {
    const range = bonusStartRanges[String(scatterCount) as keyof typeof bonusStartRanges];
    return range ? `${range.min}×–${range.max}×` : '—';
  };
  const startStopsLabel = (scatterCount: number) => {
    const range = bonusStartRanges[String(scatterCount) as keyof typeof bonusStartRanges];
    return range?.values.map((value) => `${value}×`).join(' · ') ?? '—';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      {/* Container Dialog */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-950 border-2 border-amber-500/60 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden">
        {/* Header with Title and Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-8">
              <Image
                src="/assets/aistudio/logo_37cf1416.webp"
                alt="Sea Raider Logo"
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-amber-300">
              {toSocialText('GAME RULES & PAYTABLE', isSocial)}
            </h2>
          </div>

          <button
            onClick={onClose}
            title="Close"
            className="relative w-9 h-9 hover:scale-105 active:scale-95 transition-transform"
          >
            <Image
              src="/assets/aistudio/x_f55ae377.webp"
              alt="Close"
              fill
              sizes="36px"
              className="object-contain"
            />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-900/80 border-b border-amber-500/20 text-xs sm:text-sm font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('paytable')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'paytable'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {toSocialText('Symbol Wins', isSocial)}
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'modes'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {toSocialText('Modes & Features', isSocial)}
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {toSocialText('Paylines & Free Spins', isSocial)}
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'controls'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {toSocialText('Controls Guide & Disclaimer', isSocial)}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-sm text-slate-300">
          {/* TAB 1: SYMBOL WINS */}
          {activeTab === 'paytable' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-amber-300 mb-1">
                  {toSocialText('SPECIAL SYMBOLS', isSocial)}
                </h3>
                <p className="mb-3 text-xs text-slate-400">
                  {toSocialText('Symbol values are per active line. The selected total play is divided evenly across 20 fixed lines, and wins from separate lines are added together.', isSocial)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WILD */}
                  <div className="flex items-center gap-4 p-3 bg-black/40 border border-amber-500/30 rounded-xl">
                    <div className="relative w-16 h-16 shrink-0">
                      <Image
                        src={SYMBOL_METAS.WILD.asset}
                        alt="Wild"
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-extrabold text-amber-300">WILD (GOLDEN SKULL)</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {toSocialText('Substitutes for every symbol except Scatter. When a Wild Surge is active, its shown multiplier applies to each winning payline.', isSocial)}
                      </p>
                      <div className="text-xs font-semibold text-emerald-400 mt-1">
                        5: {SYMBOL_METAS.WILD.payouts[5]}x · 4: {SYMBOL_METAS.WILD.payouts[4]}x · 3: {SYMBOL_METAS.WILD.payouts[3]}x
                      </div>
                    </div>
                  </div>

                  {/* SCATTER */}
                  <div className="flex items-center gap-4 p-3 bg-black/40 border border-amber-500/30 rounded-xl">
                    <div className="relative w-16 h-16 shrink-0">
                      <Image
                        src={SYMBOL_METAS.SCATTER.asset}
                        alt="Scatter"
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-extrabold text-amber-300">SCATTER (PIRATE GALLEON)</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Land 3 or more Scatters anywhere on the reels to trigger Free Spins bonus!
                      </p>
                      <div className="text-xs font-semibold text-amber-200 mt-1">
                        3 Scat: 10 Spins · 4 Scat: 12 Super Spins · 5 Scat: 15 Legend Spins · 6 Scat: Ethereal Cataclysm!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <section className="rounded-xl border border-amber-500/30 bg-black/40 p-3">
                <h3 className="text-sm font-black text-amber-300">{toSocialText('HOW LINE WINS ARE CALCULATED', isSocial)}</h3>
                <p className="mt-1 text-xs text-slate-300">
                  {toSocialText('Base-game line win = listed symbol payout × ((base play × selected mode cost) ÷ 20) × the active game multiplier. In Free Spins, each line uses the listed symbol payout × (base play ÷ 20) × the displayed bonus multiplier. Every bonus connection, including Wild Surge, uses its saved multiplier and contributes its exact line amount to the total. The displayed line wins add up to the round result returned by Engine.', isSocial)}
                </p>
              </section>

              {/* HIGH PAYING SYMBOLS */}
              <div>
                <h3 className="text-base font-black text-amber-300 mb-2">
                  {toSocialText('HIGH-TIER PIRATE SYMBOLS', isSocial)}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['H1', 'H2', 'H3', 'H4'] as const).map((id) => {
                    const meta = SYMBOL_METAS[id];
                    return (
                      <div
                        key={id}
                        className="flex flex-col items-center p-3 bg-black/40 border border-slate-800 rounded-xl text-center"
                      >
                        <div className="relative w-16 h-16 mb-2">
                          <Image
                            src={meta.asset}
                            alt={meta.name}
                            fill
                            sizes="64px"
                            className="object-contain"
                          />
                        </div>
                        <span className="font-bold text-xs text-amber-100">{meta.name}</span>
                        <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                          <div>5: <strong className="text-amber-300">{meta.payouts[5]}x</strong></div>
                          <div>4: <strong className="text-amber-300">{meta.payouts[4]}x</strong></div>
                          <div>3: <strong className="text-amber-300">{meta.payouts[3]}x</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LOW PAYING ROYALS */}
              <div>
                <h3 className="text-base font-black text-amber-300 mb-2">
                  {toSocialText('LOW-TIER ROYALS', isSocial)}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(['L1', 'L2', 'L3', 'L4', 'L5'] as const).map((id) => {
                    const meta = SYMBOL_METAS[id];
                    return (
                      <div
                        key={id}
                        className="flex flex-col items-center p-2.5 bg-black/40 border border-slate-800 rounded-xl text-center"
                      >
                        <div className="relative w-14 h-14 mb-1.5">
                          <Image
                            src={meta.asset}
                            alt={meta.name}
                            fill
                            sizes="56px"
                            className="object-contain"
                          />
                        </div>
                        <span className="font-bold text-xs text-slate-300">{meta.name}</span>
                        <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                          <div>5: <strong className="text-slate-200">{meta.payouts[5]}x</strong></div>
                          <div>4: <strong className="text-slate-200">{meta.payouts[4]}x</strong></div>
                          <div>3: <strong className="text-slate-200">{meta.payouts[3]}x</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODES & ENHANCERS */}
          {activeTab === 'modes' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-400">
                All theoretical Return to Player (RTP) percentages are calibrated to stay at or below {MAX_RTP_PERCENT.toFixed(2)}%, with strict win caps.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {Object.values(MODE_CONFIGS).map((cfg) => (
                  <div
                    key={cfg.id}
                    className="p-4 bg-black/50 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-300 text-base">
                          {toSocialText(cfg.name, isSocial)}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded">
                          Cost: {cfg.costMultiplier}x
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{toSocialText(cfg.description, isSocial)}</p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 text-xs">
                      <div className="text-right">
                        <div className="text-slate-400">RTP</div>
                        <div className="font-bold text-emerald-400">{cfg.rtp.toFixed(2)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400">Max Win</div>
                        <div className="font-bold text-amber-200">{cfg.maxWin}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exact Mystery Odds Table (Rule [266]) */}
              <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl">
                <h4 className="font-black text-purple-300 mb-2">
                  ACCURATE MYSTERY MODE PROBABILITY BREAKDOWN
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-black/40 rounded-lg">
                    <strong className="text-amber-300 block mb-1">Unknown Bonus (250x):</strong>
                    <div>• 3 Scatters: ~52.0%</div>
                    <div>• 4 Scatters: ~36.9%</div>
                    <div>• 5 Scatters: ~11.0%</div>
                    <div>• Ethereal Bonus (6 Scatters): ~0.1%</div>
                  </div>

                  <div className="p-3 bg-black/40 rounded-lg">
                    <strong className="text-red-300 block mb-1">Unknown Extreme (500x):</strong>
                    <div>• No Bonus (Bust): ~85.0%</div>
                    <div>• Hidden Bonus (5 Scatters): ~13.0%</div>
                    <div>• Ethereal Bonus (6 Scatters): ~2.0%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYLINES & RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-amber-300 mb-2">
                  20 FIXED PAYLINES (LEFT-TO-RIGHT)
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {toSocialText('Winning combinations pay from left to right, starting from the leftmost reel on adjacent reels along the 20 predefined paylines. Only the highest win per active line is awarded.', isSocial)}
                </p>

                {/* 20 Paylines Visual Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {PAYLINES.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-black/40 border border-slate-800 rounded-lg flex flex-col items-center"
                    >
                      <span className="text-[10px] text-amber-400 font-bold mb-1">Line {idx + 1}</span>
                      <div className="grid grid-cols-5 gap-0.5 w-16 h-10 bg-black/80 p-0.5 rounded border border-slate-700">
                        {[0, 1, 2].map((r) =>
                          [0, 1, 2, 3, 4].map((c) => {
                            const isSelected = line.some(([lc, lr]) => lc === c && lr === r);
                            return (
                              <div
                                key={`${c}-${r}`}
                                className={`rounded-xs ${
                                  isSelected ? 'bg-amber-400' : 'bg-slate-800/50'
                                }`}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free Games & Bonus Features */}
              <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl space-y-3">
                <h4 className="font-black text-amber-300">
                  FREE SPINS & BONUS ROUNDS EXPLAINED
                </h4>
                <p className="text-xs text-slate-300">
                  Before the first Free Spin, a custom multiplier reel reveals the starting value already selected by the game result. The reel is a presentation of that saved result; it does not change or reroll the outcome. During the feature, each spin rolls to its saved multiplier; RISE means it increased and HOLD means it stayed the same. It never decreases, and that spin’s multiplier applies to every winning line.
                </p>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-amber-200">1. Curse of the High Seas (3 Scatters):</strong>
                    <p className="text-slate-400">Awards 10 Free Spins. Starting range: {startRangeLabel(3)}. Available starting stops: {startStopsLabel(3)}. Wilds land randomly; every Wild revealed fills the Wild Surge meter.</p>
                  </div>
                  <div>
                    <strong className="text-purple-300">2. Ghost Captain&apos;s Revenge (4 Scatters - Super Bonus Chance):</strong>
                    <p className="text-slate-400">Awards 12 Free Spins. Starting range: {startRangeLabel(4)}. Available starting stops: {startStopsLabel(4)}. At least one Wild lands on reel 2 each spin.</p>
                  </div>
                  <div>
                    <strong className="text-red-400">3. Pirate Legend Jackpot (5 Scatters - Mega Bonus):</strong>
                    <p className="text-slate-400">{toSocialText(`Awards 15 Free Spins. Starting range: ${startRangeLabel(5)}. Available starting stops: ${startStopsLabel(5)}. One Wild lands on each of reels 2, 3, and 4 per spin. Five-scatter rounds return at least 1,500× the base play and can reach 25,000×.`, isSocial)}</p>
                  </div>
                  <div>
                    <strong className="text-fuchsia-400">4. Ethereal Cataclysm (6 Scatters - Mythic Jackpot):</strong>
                    <p className="text-slate-400">{toSocialText(`Awards 10 Ethereal Spins. Starting range: ${startRangeLabel(6)}. Available starting stops: ${startStopsLabel(6)}. Each reel can receive a Wild. Six-scatter rounds return at least 8,000× the base play and can reach 50,000×.`, isSocial)}</p>
                  </div>
                  <div className="rounded-lg border border-amber-400/20 bg-black/20 p-3 text-slate-300">
                    <strong className="text-amber-200">Wild Surge finale:</strong> Every Wild symbol appearing on a bonus spin adds 1 to the meter; Wilds do not stick between spins. At the end of the bonus, each charged meter row adds a full horizontal Wild line to one final surge spin (maximum 3 rows). The meter threshold is 5 Wilds per row in Curse, 20 in Ghost, 45 in Legend, and 30 in Ethereal. The row positions are selected by the precomputed game result.
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-emerald-300">
                    <strong>Retriggers:</strong> Landing 2 Scatters during any Free Spins round awards +3 additional spins; 3 or more Scatters awards +5 spins!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTROLS & DISCLAIMER */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Controls interaction guide (Stake Engine [235]) */}
              <div>
                <h3 className="text-base font-black text-amber-300 mb-3">
                  INTERACTIVE CONTROLS GUIDE
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Spin Button:</strong>
                    <p className="text-slate-400 mt-0.5">{toSocialText('Places a bet and spins the 5 reels at the current bet level and active mode.', isSocial)}</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Spacebar:</strong>
                    <p className="text-slate-400 mt-0.5">{toSocialText('Pressing the spacebar triggers a bet exactly like the main Spin button without scrolling the viewport.', isSocial)}</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">{toSocialText('Bet + / - Buttons:', isSocial)}</strong>
                    <p className="text-slate-400 mt-0.5">{toSocialText('Adjusts the base bet size across authorized dynamic bet levels for your currency.', isSocial)}</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Auto Play:</strong>
                    <p className="text-slate-400 mt-0.5">{toSocialText('Opens the configuration panel to select 10, 25, 50, 100, 250, or 500 spins and optional stop conditions. Spin speed follows the Turbo control. While autoplay is running, Stop ends the run before another spin.', isSocial)}</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Turbo / Speed Toggle:</strong>
                    <p className="text-slate-400 mt-0.5">Each press cycles through normal speed, Turbo, and Ultra Turbo. Autoplay follows the selected setting.</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">{toSocialText('Voyage Simulator:', isSocial)}</strong>
                    <p className="text-slate-400 mt-0.5">{toSocialText('Select the number and pace of spins and which features pause the graph. Each real RGS play is deducted from the session balance. During a run, change its pace with the speed buttons or choose Stop. Choose Resume to continue a paused run. Play a found feature or settle it before continuing. Close the session summary when the run is finished.', isSocial)}</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Skip Bonus:</strong>
                    <p className="text-slate-400 mt-0.5">Ends the remaining bonus spins immediately and opens the round total. If a large win is already in the result, the confirmation says so; skipping remains available.</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">{toSocialText('Bonus Buy / Enhancers:', isSocial)}</strong>
                    <p className="text-slate-400 mt-0.5">{toSocialText('Opens the Enhancers menu to activate Bonus Chance, Super Bonus Chance, Pirates Chance, or Feature modes.', isSocial)}</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Sound Toggle:</strong>
                    <p className="text-slate-400 mt-0.5">The speaker opens audio settings. Master mute silences music and effects; separate sliders and mute controls adjust each group.</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Menu:</strong>
                    <p className="text-slate-400 mt-0.5">Opens the captain&apos;s settings, including turbo and fullscreen controls.</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Info:</strong>
                    <p className="text-slate-400 mt-0.5">Opens this rules, symbols, modes, and win guide.</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-slate-800 rounded-lg">
                    <strong className="text-amber-300">Fullscreen:</strong>
                    <p className="text-slate-400 mt-0.5">The toggle in Menu expands the game to fill or leave fullscreen.</p>
                  </div>
                </div>
              </div>

              {/* Official Engine Disclaimer Verbatim (Stake Engine [185]) */}
              <div className="p-4 bg-black/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-2">
                <h4 className="font-bold text-slate-200">GENERAL DISCLAIMER & REGULATIONS</h4>
                <p>
                  Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Engine.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
