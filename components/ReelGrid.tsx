'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { SymbolId, SYMBOL_METAS, PAYLINES, PaylineHit } from '../lib/slot-engine';
import { formatMoney } from '../lib/currency';
import ExplosionEffect, { ExplosionItem } from './common/ExplosionEffect';
import HelmWheel from './scene/HelmWheel';
import PaylineStream from './scene/PaylineStream';
import Swashbuckler from './scene/Swashbuckler';

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

/**
 * Distinct per-symbol win choreography:
 * Anticipation crouch -> scale overshoot pop -> characteristic wobble -> settle.
 */
function getWinAnimation(symId: SymbolId) {
  switch (symId) {
    case 'WILD':
      return {
        scaleX: [1, 1.09, 0.94, 1.24, 1.08, 1.15, 1.08],
        scaleY: [1, 0.89, 1.26, 1.18, 1.06, 1.15, 1.08],
        rotate: [0, -3, 6.5, -5.5, 3.5, -1.5, 0],
        y: [0, 3, -10, -5, -2, -5, -2],
      };
    case 'SCATTER':
      return {
        scaleX: [1, 1.07, 0.95, 1.2, 1.05, 1.12, 1.06],
        scaleY: [1, 0.9, 1.24, 1.16, 1.04, 1.12, 1.06],
        rotate: [0, -5, 4.5, -3, 1.5, 0],
        y: [0, 4, -11, -4, -1, -3, -1],
      };
    case 'H1': // Captain Sea Raider
      return {
        scaleX: [1, 1.08, 0.95, 1.22, 1.06, 1.13, 1.07],
        scaleY: [1, 0.9, 1.25, 1.18, 1.05, 1.13, 1.07],
        rotate: [0, -2.5, 3.5, -2, 1, 0],
        y: [0, 3, -9, -3, -1, -4, -2],
      };
    case 'H2': // Dual Flintlocks — twin recoil kick
      return {
        scaleX: [1, 1.08, 0.95, 1.2, 1.05, 1.11, 1.06],
        scaleY: [1, 0.9, 1.22, 1.15, 1.04, 1.11, 1.06],
        rotate: [0, 5, -10, 6.5, -3, 1, 0],
        y: [0, 3, -8, -2, 0, -3, -1],
      };
    case 'H3': // Treasure Chest — heavy lid bounce
      return {
        scaleX: [1, 1.1, 0.93, 1.21, 1.04, 1.12, 1.06],
        scaleY: [1, 0.87, 1.26, 1.14, 1.06, 1.12, 1.06],
        rotate: [0, -2, 3, -2.5, 1, 0],
        y: [0, 4, -11, -1, -5, -2, -1],
      };
    case 'H4': // Golden Compass — needle snap
      return {
        scaleX: [1, 1.07, 0.95, 1.19, 1.05, 1.11, 1.06],
        scaleY: [1, 0.91, 1.21, 1.15, 1.04, 1.11, 1.06],
        rotate: [0, -10, 14, -6, 2.5, 0],
        y: [0, 3, -7, -2, 0, -2, -1],
      };
    default: // Low-tier Royals (Ace, King, Queen, Jack, Ten)
      return {
        scaleX: [1, 1.07, 0.95, 1.18, 1.03, 1.09, 1.05],
        scaleY: [1, 0.9, 1.2, 1.14, 1.02, 1.09, 1.05],
        rotate: [0, -2.5, 3, -1.8, 0.8, 0],
        y: [0, 3, -7, -1, -3, -1],
      };
  }
}

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

  // Key that replays symbol win choreography whenever a new active line cycles in
  const winCycleKey = activeHit
    ? `hit-${activeHitIndex}-${activeHit.lineIndex}-${activeHit.winAmount}`
    : isWinOnBoard
    ? 'win-all'
    : 'idle';

  return (
    <div
      className={`reel-cabinet relative w-full max-w-[1600px] aspect-[1672/941] flex items-center justify-center select-none ${
        isWinOnBoard ? 'reel-cabinet--win' : ''
      }`}
    >
      <div className="frame-box relative w-full h-full">
        {/* 1. Background Frame Layer: restores the C-scroll arch cutouts, spins the helm wheel, and renders the 5 painted window panes */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {/* Restores the gold C-scrolls & carved arch next to the helm wheel so nothing looks cut out */}
          <div
            className=" helm-arch-restore absolute inset-0"
            style={{ clipPath: 'inset(10.0% 41.2% 84.8% 41.2%)' }}
          >
            <Image
              src="/assets/aistudio/frame_e548f7c1.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 1600px) 100vw, 1600px"
              className="object-contain"
            />
          </div>

          <HelmWheel
            isSpinning={anyReelSpinning}
            isTurbo={isTurbo}
            className="absolute left-1/2 top-[12.33%] w-[16.75%] z-[2]"
          />

          <Image
            src="/assets/sea-raider/scene/frame-no-wheel.webp"
            alt="Slot Frame"
            fill
            priority
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-contain z-[3]"
          />
        </div>

        {/* 2. 5-Column Reel Interior aligned to the exact 5 window panes of the frame (13.88%..86.48% X, 22.10%..79.40% Y) */}
        <div className="reel-window-grid absolute left-[13.88%] top-[22.10%] w-[72.60%] h-[57.30%] z-[10]">
          {/* Particle Explosions Overlay on the Grid */}
          <ExplosionEffect explosions={explosions} onComplete={onExplosionComplete} />

          {captainRevealCount !== null && (
            <div
              className="captain-scatter-reveal animate-captain-reveal absolute -left-[14%] -top-[20%] z-50 h-[145%] w-[52%] pointer-events-none"
              aria-hidden="true"
            >
              <Swashbuckler delay={0.25} className="captain-scatter-figure" />
              <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-300/80 bg-[#130b05]/95 px-2.5 py-1 text-[9px] sm:text-xs font-black tracking-wider text-amber-200 shadow-lg">
                {captainRevealCount} SCATTERS ABOARD
              </div>
            </div>
          )}

          {captainRevealCount !== null &&
            captainRevealReel !== null &&
            captainRevealRow !== null &&
            (() => {
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
                      transition={{ duration: 1.45, times: [0, 0.65, 1], ease: 'easeOut' }}
                    />
                    <g className="captain-strike-flare" transform={`translate(${targetX} ${targetY})`}>
                      <circle r="32" fill="url(#captain-slash-gradient)" opacity=".9" />
                      <path
                        d="M-36 0H36M0-36V36M-25-25L25 25M25-25L-25 25"
                        stroke="#fff6c5"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>
                </div>
              );
            })()}

          {/* Progressive payline trace through winning cell centres */}
          {currentLinePath && activeHit && !anyReelSpinning && (
            <PaylineStream
              line={currentLinePath}
              hitCells={activeHit.positions}
              streamKey={`${activeHitIndex}-${activeHit.lineIndex}-${activeHit.winAmount}`}
            />
          )}

          {/* 5 Reels */}
          {[0, 1, 2, 3, 4].map((colIdx) => {
            const isSpinning = spinningReels[colIdx];
            const isTeasing = teaseReels[colIdx];
            const colSymbols = grid[colIdx] || ['L1', 'L2', 'L3'];
            const colHasWinning =
              !isSpinning &&
              [0, 1, 2].some((r) => winningCoords.has(`${colIdx},${r}`));
            const colHasWild =
              !isSpinning &&
              colSymbols.some((sym) => sym === 'WILD');

            return (
              <div
                key={colIdx}
                className={`reel-column relative h-full ${
                  isSpinning ? 'overflow-hidden z-[10]' : 'overflow-visible'
                } ${
                  captainRevealCount !== null && captainRevealReel === colIdx
                    ? 'captain-scatter-impact ring-2 ring-amber-200 bg-amber-300/20 z-[35]'
                    : isTeasing
                    ? 'reel-column--tease z-[25]'
                    : colHasWinning
                    ? 'z-[28]'
                    : colHasWild
                    ? 'z-[22]'
                    : 'z-[12]'
                }`}
              >
                {/* IF SPINNING: Render continuous downward rolling reel strip */}
                {isSpinning ? (
                  <div
                    className={`w-full flex flex-col ${
                      isTurbo ? 'reel-rolling-strip-turbo' : 'reel-rolling-strip'
                    }`}
                    style={{ height: '800%' }}
                  >
                    {ROLLING_STRIP.map((symId, stripIdx) => {
                      const meta = SYMBOL_METAS[symId] || SYMBOL_METAS.L1;
                      return (
                        <div
                          key={stripIdx}
                          className="w-full flex items-center justify-center p-1 sm:p-2"
                          style={{ height: '4.166667%' }}
                        >
                          <div className="reel-symbol-art relative w-full h-full aspect-square flex items-center justify-center opacity-95">
                            <Image
                              src={meta.asset}
                              alt={meta.name}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 120px, 240px"
                              className="object-contain"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* IF STOPPED: 3 Stopped Symbols with physical slot landing bounce */
                  <motion.div
                    key={`${colIdx}-${colSymbols.join('-')}`}
                    initial={{ y: -32 }}
                    animate={{ y: [-32, 9, -3, 0] }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full flex flex-col justify-between"
                  >
                    {[0, 1, 2].map((rowIdx) => {
                      const symId = colSymbols[rowIdx] || 'L5';
                      const meta = SYMBOL_METAS[symId] || SYMBOL_METAS.L5;
                      const isWinning = winningCoords.has(`${colIdx},${rowIdx}`);
                      const isDimmed = isWinOnBoard && !isWinning;
                      const isScatter = symId === 'SCATTER';
                      const isWild = symId === 'WILD';
                      const isCaptainRevealCell =
                        captainRevealReel === colIdx && captainRevealRow === rowIdx;
                      const isCaptainCut =
                        isCaptainRevealCell && captainRevealPhase === 'cut';
                      const isCaptainScatterReveal =
                        isCaptainRevealCell &&
                        captainRevealPhase === 'scatter' &&
                        isScatter;

                      // Ensure Wild (Golden Skull) & winning symbols ALWAYS stack above neighbours
                      const cellZClass = isWinning && isWild
                        ? 'z-[38]'
                        : isWinning
                        ? 'z-[34]'
                        : isWild
                        ? 'z-[26]'
                        : isScatter
                        ? 'z-[24]'
                        : 'z-[10]';

                      const staggerDelay = colIdx * 0.065;

                      return (
                        <div
                          key={rowIdx}
                          className={`reel-cell relative w-full h-1/3 flex items-center justify-center p-0.5 sm:p-1 ${cellZClass} ${
                            isDimmed ? 'reel-cell--dimmed' : ''
                          } ${isWinning ? 'reel-cell--winning' : ''} ${
                            isWild ? 'reel-cell--wild' : ''
                          }`}
                        >
                          {/* Winning cell: crisp gold frame sweep + warm spotlight */}
                          {isWinning && (
                            <div
                              key={`frame-${winCycleKey}-${colIdx}-${rowIdx}`}
                              className="win-cell-frame pointer-events-none"
                              style={{ '--win-delay': `${staggerDelay}s` } as React.CSSProperties}
                              aria-hidden="true"
                            >
                              <span className="win-cell-frame__spotlight" />
                              <svg
                                className="win-cell-frame__svg"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                              >
                                <rect
                                  x="4"
                                  y="4"
                                  width="92"
                                  height="92"
                                  rx="10"
                                  ry="10"
                                  className="win-cell-frame__Casing"
                                />
                                <rect
                                  x="4"
                                  y="4"
                                  width="92"
                                  height="92"
                                  rx="10"
                                  ry="10"
                                  pathLength="100"
                                  className="win-cell-frame__sweep"
                                />
                              </svg>
                              <span className="win-cell-frame__corner win-cell-frame__corner--tl" />
                              <span className="win-cell-frame__corner win-cell-frame__corner--tr" />
                              <span className="win-cell-frame__corner win-cell-frame__corner--bl" />
                              <span className="win-cell-frame__corner win-cell-frame__corner--br" />
                            </div>
                          )}

                          {/* Scatter aura during anticipation */}
                          {isScatter && isAnticipationActive && (
                            <div className="reel-scatter-aura absolute inset-1 rounded-full pointer-events-none" />
                          )}

                          {/* Wild Golden Skull subtle emblem halo (sits behind the skull art, above neighbour cells) */}
                          {isWild && (
                            <div
                              className={`reel-wild-aura absolute inset-1 rounded-full pointer-events-none ${
                                isWinning ? 'reel-wild-aura--winning' : ''
                              }`}
                            />
                          )}

                          {/* Symbol Artwork with Anticipation -> Overshoot Pop -> Wobble -> Settle */}
                          <motion.div
                            key={`${symId}-${isWinning ? winCycleKey : 'rest'}`}
                            className={`reel-symbol-art relative w-full h-full aspect-square flex items-center justify-center ${
                              isCaptainScatterReveal ? 'captain-scatter-appearance' : ''
                            } ${isWinning ? 'symbol-win-flash' : ''}`}
                            style={
                              isWinning
                                ? ({ '--flash-delay': `${staggerDelay}s` } as React.CSSProperties)
                                : undefined
                            }
                            animate={
                              isCaptainCut
                                ? { opacity: 0.3, scale: 0.92 }
                                : isWinning
                                ? getWinAnimation(symId)
                                : isScatter && isAnticipationActive
                                ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] }
                                : isWild
                                ? { scale: [1, 1.045, 1], rotate: [0, -1.2, 1.2, 0] }
                                : { scaleX: 1, scaleY: 1, rotate: 0, y: 0 }
                            }
                            transition={
                              isWinning
                                ? {
                                    duration: 0.68,
                                    delay: staggerDelay,
                                    times: [0, 0.12, 0.28, 0.46, 0.66, 0.84, 1],
                                    ease: [0.22, 1, 0.36, 1],
                                  }
                                : isWild
                                ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                                : isScatter && isAnticipationActive
                                ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
                                : { duration: 0.2 }
                            }
                          >
                            {!isCaptainCut && (
                              <Image
                                src={meta.asset}
                                alt={meta.name}
                                fill
                                unoptimized
                                sizes="(max-width: 640px) 120px, 240px"
                                className={`object-contain ${
                                  isWinning
                                    ? 'reel-symbol-img--winning'
                                    : isWild
                                    ? 'reel-symbol-img--wild'
                                    : ''
                                }`}
                              />
                            )}
                            {isCaptainCut && (
                              <div
                                className="captain-sliced-symbol absolute inset-[5%] z-20"
                                aria-hidden="true"
                              >
                                <Image
                                  src={meta.asset}
                                  alt=""
                                  fill
                                  unoptimized
                                  sizes="240px"
                                  className="captain-slice-upper object-contain"
                                />
                                <Image
                                  src={meta.asset}
                                  alt=""
                                  fill
                                  unoptimized
                                  sizes="240px"
                                  className="captain-slice-lower object-contain"
                                />
                                <div className="captain-cut-flash absolute left-[12%] top-1/2 h-[3px] w-[76%] -rotate-[42deg] rounded-full" />
                              </div>
                            )}
                            {isCaptainScatterReveal && (
                              <div
                                className="captain-scatter-burst absolute inset-[-20%] z-20 rounded-full"
                                aria-hidden="true"
                              />
                            )}
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Foreground Frame Overhangs: keeps the frame's bottom Pirate Skull & top corner gold scrolls cleanly above the reel interior */}
        <div
          className="frame-foreground-skull absolute inset-0 z-[24] pointer-events-none"
          style={{
            clipPath:
              'polygon(40.5% 81.2%, 44.5% 76.8%, 55.5% 76.8%, 59.5% 81.2%, 62% 100%, 38% 100%)',
          }}
          aria-hidden="true"
        >
          <Image
            src="/assets/sea-raider/scene/frame-no-wheel.webp"
            alt=""
            fill
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-contain"
          />
        </div>

        <div
          className="frame-foreground-corners absolute inset-0 z-[24] pointer-events-none"
          style={{
            clipPath: 'inset(0% 0% 78.4% 0%)',
          }}
          aria-hidden="true"
        >
          <Image
            src="/assets/sea-raider/scene/frame-no-wheel.webp"
            alt=""
            fill
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-contain"
          />
        </div>

        {/* 4. Living Lantern Glows */}
        <div className="absolute inset-0 z-[25] pointer-events-none" aria-hidden="true">
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className={`frame-lantern frame-lantern--${side} ${lanternState}`}>
              <span className="frame-lantern__halo" />
              <span className="frame-lantern__rays" />
              <span className="frame-lantern__core" />
            </div>
          ))}
        </div>

        {/* 5. Crafted Carved Naval Win-Line Plaque (no blurry scaled text, includes symbol icon, count & amount) */}
        {activeHit && !anyReelSpinning && (
          <div className="payout-plaque-anchor absolute inset-x-0 top-[23.2%] z-[45] flex justify-center pointer-events-none">
            <motion.div
              key={`${activeHit.lineIndex}-${activeHit.winAmount}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="payout-plaque"
            >
              <span className="payout-plaque__rivet payout-plaque__rivet--tl" aria-hidden="true" />
              <span className="payout-plaque__rivet payout-plaque__rivet--tr" aria-hidden="true" />
              <span className="payout-plaque__rivet payout-plaque__rivet--bl" aria-hidden="true" />
              <span className="payout-plaque__rivet payout-plaque__rivet--br" aria-hidden="true" />

              <span className="payout-plaque__line">
                LINE {String(activeHit.lineIndex).padStart(2, '0')}
              </span>

              <span className="payout-plaque__sep" aria-hidden="true">◆</span>

              <span className="payout-plaque__symbol">
                <span className="payout-plaque__icon">
                  <Image
                    src={SYMBOL_METAS[activeHit.symbol]?.asset || '/assets/sea-raider/ace.png'}
                    alt=""
                    fill
                    sizes="28px"
                    className="object-contain"
                  />
                </span>
                <span className="payout-plaque__combo">
                  {activeHit.count}× {(SYMBOL_METAS[activeHit.symbol]?.name || activeHit.symbol).toUpperCase()}
                </span>
              </span>

              <span className="payout-plaque__sep" aria-hidden="true">◆</span>

              <span className="payout-plaque__amount tabular-nums">
                +{formatMoney(activeHit.winAmount, currency)}
              </span>

              {activeHit.multiplier > 1 && (
                <span className="payout-plaque__mult tabular-nums">
                  {activeHit.multiplier}×
                </span>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
