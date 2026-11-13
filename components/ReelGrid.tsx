'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { SymbolId, SYMBOL_METAS, PAYLINES, PaylineHit } from '../lib/slot-engine';
import { formatMoney } from '../lib/currency';
import ExplosionEffect, { ExplosionItem } from './common/ExplosionEffect';
import HelmWheel from './scene/HelmWheel';
import PaylineStream from './scene/PaylineStream';
import LivingCaptain from './scene/LivingCaptain';

interface ReelGridProps {
  grid: SymbolId[][];
  spinningReels: boolean[];
  teaseReels: boolean[];
  winningHits: PaylineHit[];
  activeHitIndex: number | null;
  wildMultiplier: number;
  isBonusActive: boolean;
  explosions?: ExplosionItem[];
  onExplosionComplete?: (id: string) => void;
  landedScatterCount?: number;
  captainRevealCount?: number | null;
  captainRevealReel?: number | null;
  captainRevealRow?: number | null;
  captainRevealPhase?: 'cut' | 'scatter' | null;
  isTurbo?: boolean;
  currency?: string;
  /** Force the frame lanterns to blaze (e.g. while a big-win celebration plays). */
  lanternBlaze?: boolean;
}

// 12-symbol reel strip doubled to 24 for seamless infinite downward rolling
const STRIP_BASE: SymbolId[] = [
  'H1', 'L2', 'H3', 'WILD', 'L1', 'H2', 'L4', 'SCATTER', 'H4', 'L3', 'L5', 'H1',
];
const ROLLING_STRIP: SymbolId[] = [...STRIP_BASE, ...STRIP_BASE];

export default function ReelGrid({
  grid,
  spinningReels,
  teaseReels,
  winningHits,
  activeHitIndex,
  wildMultiplier,
  isBonusActive,
  explosions = [],
  onExplosionComplete,
  landedScatterCount = 0,
  captainRevealCount = null,
  captainRevealReel = null,
  captainRevealRow = null,
  captainRevealPhase = null,
  isTurbo = false,
  currency = 'USD',
  lanternBlaze = false,
}: ReelGridProps) {
  // Active hit for connection detail
  const activeHit = activeHitIndex !== null ? winningHits[activeHitIndex] : null;

  // Collect coordinates of winning symbols for current highlighted hit (or all hits)
  const winningCoords = React.useMemo(() => {
    const coords = new Set<string>();
    if (activeHitIndex !== null && winningHits[activeHitIndex]) {
      for (const [c, r] of winningHits[activeHitIndex].positions) {
        coords.add(`${c},${r}`);
      }
    } else {
      for (const hit of winningHits) {
        for (const [c, r] of hit.positions) {
          coords.add(`${c},${r}`);
        }
      }
    }
    return coords;
  }, [winningHits, activeHitIndex]);

  // Current active line definition for SVG path drawing
  const currentLinePath = React.useMemo(() => {
    if (activeHitIndex === null || !winningHits[activeHitIndex]) return null;
    const hit = winningHits[activeHitIndex];
    const lineDef = PAYLINES[hit.lineIndex - 1];
    if (!lineDef) return null;
    return lineDef;
  }, [winningHits, activeHitIndex]);

  const isAnticipationActive = landedScatterCount >= 1 && teaseReels.some((t) => t);
  const anyReelSpinning = spinningReels.some((s) => s);
  const isWinOnBoard = winningHits.length > 0 && !anyReelSpinning;
  const lanternState = lanternBlaze || isWinOnBoard ? 'is-blazing' : isAnticipationActive ? 'is-tense' : '';

  return (
    <div className={`reel-cabinet relative w-full max-w-[1600px] aspect-[16/9.6] flex items-center justify-center p-2 sm:p-4 select-none ${isWinOnBoard ? 'reel-cabinet--win' : ''}`}>
      {/* Frame: a turning helm behind the cut-out frame art, and two living lanterns */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center">
        <div className="frame-box relative w-full aspect-[1672/941]">
          <div className="helm-backing absolute" />
          <HelmWheel isSpinning={anyReelSpinning} isTurbo={isTurbo} className="absolute left-1/2 top-[12.33%] w-[16.75%]" />
          <Image
            src="/assets/sea-raider/scene/frame-no-wheel.webp"
            alt="Slot Frame"
            fill
            priority
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-contain"
          />
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className={`frame-lantern frame-lantern--${side} ${lanternState}`}>
              <span className="frame-lantern__halo" />
              <span className="frame-lantern__rays" />
              <span className="frame-lantern__core" />
            </div>
          ))}
        </div>
      </div>

      {/* 5-Column Grid Interior positioned directly over the 5 window panes */}
      <div className="relative z-10 w-[78%] h-[68%] mt-[1.5%] grid grid-cols-5 gap-1.5 sm:gap-3 px-1 py-1">
        {/* Particle Explosions Overlay on the Grid */}
        <ExplosionEffect explosions={explosions} onComplete={onExplosionComplete} />

        {captainRevealCount !== null && (
          <div className="captain-scatter-reveal animate-captain-reveal absolute -left-[16%] -top-[24%] z-50 h-[145%] w-[48%] pointer-events-none" aria-hidden="true">
            <LivingCaptain isStriking className={captainRevealPhase === 'cut' ? 'captain-portrait-strike' : ''} />
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-300/80 bg-[#130b05]/90 px-2 py-1 text-[8px] sm:text-xs font-black tracking-wide text-amber-200 shadow-lg">
              {captainRevealCount} SCATTERS ABOARD
            </div>
          </div>
        )}

        {captainRevealCount !== null && captainRevealReel !== null && captainRevealRow !== null && (() => {
          const targetX = (captainRevealReel + 0.5) * 200;
          const targetY = (captainRevealRow + 0.5) * 200;
          const originX = 24;
          const originY = 235;
          const dx = targetX - originX;
          const dy = targetY - originY;
          const controlX = originX + dx * 0.48;
          const controlY = Math.min(targetY, originY - 55);
          return (
            <div className="captain-sword-slash absolute inset-0 z-[60] pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="captain-slash-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#6cc9ef" stopOpacity="0" />
                    <stop offset=".45" stopColor="#e8ffff" />
                    <stop offset="1" stopColor="#fff0a2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={`M${originX} ${originY} Q${controlX} ${controlY} ${targetX} ${targetY}`}
                  className="captain-slash-trail"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 1], opacity: [0, 0.95, 0] }}
                  transition={{ duration: 0.92, times: [0, 0.67, 1], ease: 'easeOut' }}
                />
                <g className="captain-strike-flare" transform={`translate(${targetX} ${targetY})`}>
                  <circle r="32" fill="url(#captain-slash-gradient)" opacity=".9" />
                  <path d="M-36 0H36M0-36V36M-25-25L25 25M25-25L-25 25" stroke="#fff6c5" strokeWidth="4" strokeLinecap="round" />
                </g>
              </svg>
            </div>
          );
        })()}

        {/* Winning line: a stream of sea water pouring through the paying symbols */}
        {currentLinePath && activeHit && !anyReelSpinning && (
          <PaylineStream
            line={currentLinePath}
            hitCells={activeHit.positions}
            streamKey={`${activeHitIndex}-${activeHit.lineIndex}-${activeHit.winAmount}`}
          />
        )}

        {/* Connection payout plaque */}
        {activeHit && !anyReelSpinning && (
          <motion.div
            key={`${activeHit.lineIndex}-${activeHit.winAmount}`}
            initial={{ opacity: 0, y: 12, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className="payout-plaque absolute -bottom-5 sm:-bottom-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap pointer-events-none"
          >
            <span className="payout-plaque__line">LINE {String(activeHit.lineIndex).padStart(2, '0')}</span>
            <span className="payout-plaque__combo">{activeHit.count}× {SYMBOL_METAS[activeHit.symbol]?.name || activeHit.symbol}</span>
            <span className="payout-plaque__amount tabular-nums">+{formatMoney(activeHit.winAmount, currency)}</span>
          </motion.div>
        )}

        {/* 5 Reels */}
        {[0, 1, 2, 3, 4].map((colIdx) => {
          const isSpinning = spinningReels[colIdx];
          const isTeasing = teaseReels[colIdx];
          const colSymbols = grid[colIdx] || ['L1', 'L2', 'L3'];

          return (
            <div
              key={colIdx}
              className={`relative h-full rounded transition-all duration-300 overflow-hidden ${
                captainRevealCount !== null && captainRevealReel === colIdx
                  ? 'captain-scatter-impact border-2 border-amber-200 bg-amber-300/30 shadow-[0_0_30px_rgba(255,223,100,0.9)] z-30'
                  : isTeasing
                  ? 'border-2 border-amber-400/80 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.5)] z-20'
                  : 'bg-slate-900/40'
              }`}
            >
              {/* IF SPINNING: Render continuous downward rolling reel strip */}
              {isSpinning ? (
                <div
                  className={`w-full flex flex-col ${
                    isTurbo ? 'reel-rolling-strip-turbo' : 'reel-rolling-strip'
                  }`}
                  style={{ height: '800%' }} // 24 symbols -> each is 1/3 of column height
                >
                  {ROLLING_STRIP.map((symId, stripIdx) => {
                    const meta = SYMBOL_METAS[symId] || SYMBOL_METAS.L1;
                    return (
                      <div
                        key={stripIdx}
                        className="w-full flex items-center justify-center p-1 sm:p-2"
                        style={{ height: '4.166667%' }} // 1/24 of 800% = 1/3 of column height
                      >
                        <div className="reel-symbol-art relative w-full h-full aspect-square flex items-center justify-center opacity-95">
                          <Image
                            src={meta.asset}
                            alt={meta.name}
                            fill
                            sizes="(max-width: 640px) 50px, 85px"
                            className="object-contain"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* IF STOPPED: 3 Stopped Symbols with authentic physical slot landing bounce */
                <motion.div
                  key={`${colIdx}-${colSymbols.join('-')}`}
                  initial={{ y: -35 }}
                  animate={{ y: [-35, 10, -2, 0] }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  className="w-full h-full flex flex-col justify-between"
                >
                  {[0, 1, 2].map((rowIdx) => {
                    const symId = colSymbols[rowIdx] || 'L5';
                    const meta = SYMBOL_METAS[symId] || SYMBOL_METAS.L5;
                    const isWinning = winningCoords.has(`${colIdx},${rowIdx}`);
                    const isScatter = symId === 'SCATTER';
                    const isWild = symId === 'WILD';
                    const isCaptainRevealCell = captainRevealReel === colIdx && captainRevealRow === rowIdx;
                    const isCaptainCut = isCaptainRevealCell && captainRevealPhase === 'cut';
                    const isCaptainScatterReveal = isCaptainRevealCell && captainRevealPhase === 'scatter' && isScatter;

                    return (
                      <motion.div
                        key={rowIdx}
                        className={`relative w-full h-1/3 flex items-center justify-center p-0.5 sm:p-1.5 transition-transform duration-200 ${
                          isWinning
                            ? 'scale-105 z-10'
                            : isScatter && isAnticipationActive
                            ? 'scale-108 z-20'
                            : ''
                        }`}
                        animate={isWinning ? { scale: [1, 1.055, 1] } : { scale: 1 }}
                        transition={isWinning ? { duration: 0.55, ease: 'easeOut', repeat: 1 } : { duration: 0.18 }}
                      >
                        {/* Winning cell: a lit pool of sea water under the symbol */}
                        {isWinning && <div className="win-cell-pool absolute inset-1 pointer-events-none" />}

                        {/* Subtle Scatter glow during anticipation */}
                        {isScatter && (
                          <div
                            className={`absolute inset-0 rounded-full pointer-events-none ${
                              isAnticipationActive
                                ? 'border border-amber-400/90 bg-amber-400/25 shadow-[0_0_18px_rgba(245,158,11,0.7)] animate-pulse z-10'
                                : 'bg-red-600/15 filter blur-sm'
                            }`}
                          />
                        )}

                        {/* Subtle Wild glow */}
                        {isWild && (
                          <div className="absolute inset-0 rounded-full bg-amber-400/20 filter blur-sm pointer-events-none" />
                        )}

                        {/* Symbol Image */}
                        <motion.div
                          key={symId}
                          className={`reel-symbol-art relative w-full h-full aspect-square flex items-center justify-center ${isCaptainScatterReveal ? 'captain-scatter-appearance' : ''} ${isWinning ? 'symbol-win-flash' : ''}`}
                          animate={
                            isCaptainCut ? { opacity: 0.3, scale: 0.92 } :
                            isScatter ? { scale: [0.52, 1.28, 0.94, 1], rotate: [-9, 5, -2, 0], filter: ['brightness(1.9)', 'brightness(1)'] } :
                            isWild ? { scale: isWinning ? [1, 1.16, 1.04, 1] : [1, 1.045, 1], rotate: isWinning ? [0, -7, 7, 0] : [0, -1.5, 1.5, 0] } :
                            symId === 'H3' && isWinning ? { y: [0, -10, 0], rotate: [0, -3, 3, 0], scale: [1, 1.15, 1] } :
                            symId === 'H4' && isWinning ? { rotate: [0, 45, 360], scale: [1, 1.1, 1] } :
                            symId === 'H2' && isWinning ? { rotate: [0, -10, 7, 0], x: [0, 4, -3, 0], scale: [1, 1.12, 1] } :
                            symId === 'H1' && isWinning ? { y: [0, -5, 0], rotate: [0, 2, -2, 0], scale: [1, 1.13, 1] } :
                            isWinning ? { y: [0, -6, 0], scale: [1, 1.12, 1] } :
                            isScatter && isAnticipationActive ? { scale: [1, 1.08, 1], rotate: [0, 2, 0] } :
                            { scale: 1, rotate: 0, x: 0, y: 0 }
                          }
                          transition={
                            isScatter ? { duration: 0.82, delay: colIdx * 0.12, ease: [0.16, 1, 0.3, 1] } :
                            isWild && !isWinning ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } :
                            { duration: isWinning ? 0.68 : 0.2, delay: isWinning ? colIdx * 0.045 : 0, ease: 'easeOut', repeat: isWinning ? 1 : 0 }
                          }
                        >
                          {!isCaptainCut && (
                            <Image
                              src={meta.asset}
                              alt={meta.name}
                              fill
                              sizes="(max-width: 640px) 50px, (max-width: 1024px) 75px, 85px"
                              className={`object-contain transition-transform ${
                                isWinning ? 'drop-shadow-[0_0_14px_rgba(255,207,94,0.95)]' : ''
                              }`}
                            />
                          )}
                          {isCaptainCut && (
                            <div className="captain-sliced-symbol absolute inset-[5%] z-20" aria-hidden="true">
                              <Image src={meta.asset} alt="" fill sizes="85px" className="captain-slice-upper object-contain" />
                              <Image src={meta.asset} alt="" fill sizes="85px" className="captain-slice-lower object-contain" />
                              <div className="captain-cut-flash absolute left-[12%] top-1/2 h-[3px] w-[76%] -rotate-[42deg] rounded-full" />
                            </div>
                          )}
                          {isCaptainScatterReveal && <div className="captain-scatter-burst absolute inset-[-20%] z-20 rounded-full" aria-hidden="true" />}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
