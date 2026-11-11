'use client';

import { useState } from 'react';
import ReelGrid from './ReelGrid';
import BonusGameOverlay from './BonusGameOverlay';
import {
  evaluateBonusSpinFrame,
  MODE_CONFIGS,
  PlayMode,
  rgsRoundToSpinResult,
  SymbolId,
} from '../lib/slot-engine';
import { formatMoney, microToStandard, toSocialText } from '../lib/currency';
import { RgsReplay } from '../lib/rgs-client';
import { shouldShowCaptainReveal } from '../lib/captain-reveal';
import { advanceBonusPayoutProgress, createBonusPayoutProgress, sumLinePayouts } from '../lib/bonus-line-payout';
import WildSurgeMeter from './common/WildSurgeMeter';
import WildSurgeAnnouncement from './common/WildSurgeAnnouncement';

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function ReplayScreen({ replay, mode, amountMicro, currency, isSocial }: {
  replay: RgsReplay; mode: PlayMode; amountMicro: number; currency: string; isSocial: boolean;
}) {
  const baseBet = microToStandard(amountMicro);
  const cost = replay.costMultiplier || MODE_CONFIGS[mode].costMultiplier;
  const result = rgsRoundToSpinResult({ state: replay.state, payoutMultiplier: replay.payoutMultiplier }, mode, baseBet);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stops, setStops] = useState([false, false, false, false, false]);
  const [grid, setGrid] = useState<SymbolId[][]>(result.grid);
  const [visibleHits, setVisibleHits] = useState(result.lineHits);
  const [activeHitIndex, setActiveHitIndex] = useState<number | null>(null);
  const [displayWin, setDisplayWin] = useState(0);
  const [bonusSpinsRemaining, setBonusSpinsRemaining] = useState(0);
  const [bonusTotalSpins, setBonusTotalSpins] = useState(0);
  const [bonusSpinNumber, setBonusSpinNumber] = useState(0);
  const [bonusWildCount, setBonusWildCount] = useState(0);
  const [surgeAnnouncement, setSurgeAnnouncement] = useState(false);
  const [retriggerSpins, setRetriggerSpins] = useState(0);
  const [wildMultiplier, setWildMultiplier] = useState(result.wildMultiplier);
  const [captainReveal, setCaptainReveal] = useState<{ count: number; reel: number; row: number; phase: 'cut' | 'scatter' } | null>(null);
  const realCost = baseBet * cost;
  const frames = result.bonusSpinFrames ?? [];
  const bonusLineWinTotal = frames.reduce((sum, frame) => {
    const evaluated = evaluateBonusSpinFrame(frame, baseBet);
    return sum + sumLinePayouts(evaluated.lineHits);
  }, 0) + (result.wildSurge?.linesAwarded
    ? (() => {
        const evaluated = evaluateBonusSpinFrame(result.wildSurge.frame, baseBet);
        return sumLinePayouts(evaluated.lineHits);
      })()
    : 0);

  const animateBoard = async (board: SymbolId[][], revealFeature = false, scatterCount = 0) => {
    const scatterCells = board.flatMap((reel, reelIndex) => reel.flatMap((symbol, rowIndex) => symbol === 'SCATTER' ? [{ reel: reelIndex, row: rowIndex }] : []));
    const stagedScatter = revealFeature && scatterCells.length >= 3 && shouldShowCaptainReveal(board)
      ? scatterCells[Math.min(4, scatterCells.length - 1)]
      : null;
    setStops([true, true, true, true, true]);
    for (let reel = 0; reel < 5; reel++) {
      await wait(330);
      const landedColumn = [...board[reel]];
      if (stagedScatter?.reel === reel) landedColumn[stagedScatter.row] = 'L2';
      setGrid((current) => current.map((column, index) => index === reel ? landedColumn : column));
      setStops((current) => current.map((value, index) => index === reel ? false : value));
    }
    if (stagedScatter) {
      await wait(1700);
      setCaptainReveal({ count: scatterCount, reel: stagedScatter.reel, row: stagedScatter.row, phase: 'cut' });
      await wait(1400);
      setCaptainReveal({ count: scatterCount, reel: stagedScatter.reel, row: stagedScatter.row, phase: 'scatter' });
      setGrid((current) => current.map((column, index) => index === stagedScatter.reel ? board[index] : column));
      await wait(500);
      setCaptainReveal(null);
    }
  };

  const play = async () => {
    if (playing) return;
    setStarted(true);
    setPlaying(true);
    setDisplayWin(0);
    setBonusSpinNumber(0);
    setBonusSpinsRemaining(0);
    setBonusTotalSpins(0);
    setBonusWildCount(0);
    setSurgeAnnouncement(false);
    setRetriggerSpins(0);
    setWildMultiplier(result.wildMultiplier);
    setVisibleHits([]);
    setActiveHitIndex(null);

    await animateBoard(result.grid, result.bonusTriggered, result.scatterCount);

    if (result.bonusTriggered && result.bonusType && frames.length > 0) {
      let totalSpins = result.bonusSpinsAwarded || frames.length;
      const payoutProgress = createBonusPayoutProgress(bonusLineWinTotal, result.totalWin);
      setBonusSpinsRemaining(totalSpins);
      setBonusTotalSpins(totalSpins);
      await wait(900);
      for (let spinIndex = 0; spinIndex < frames.length; spinIndex++) {
        const frame = frames[spinIndex];
        const freeSpin = evaluateBonusSpinFrame(frame, baseBet);
        await animateBoard(frame.board);
        setBonusWildCount((count) => count + frame.board.reduce((total, reel) => total + reel.filter((symbol) => symbol === 'WILD').length, 0));
        setBonusSpinNumber(spinIndex + 1);
        totalSpins += freeSpin.retriggerSpins;
        setBonusTotalSpins(totalSpins);
        setBonusSpinsRemaining(totalSpins - spinIndex - 1);
        setRetriggerSpins(freeSpin.retriggerSpins);
        setWildMultiplier(freeSpin.multiplier);

        const visibleBonusHits = freeSpin.lineHits;
        setVisibleHits(visibleBonusHits);
        const isFinalFrame = spinIndex === frames.length - 1 && !result.wildSurge?.linesAwarded;
        for (let hitIndex = 0; hitIndex < visibleBonusHits.length; hitIndex++) {
          setActiveHitIndex(hitIndex);
          setDisplayWin(advanceBonusPayoutProgress(
            visibleBonusHits[hitIndex].winAmount,
            payoutProgress,
            isFinalFrame && hitIndex === visibleBonusHits.length - 1,
          ));
          await wait(1460);
        }
        setActiveHitIndex(null);
        if (visibleBonusHits.length === 0 && isFinalFrame) {
          setDisplayWin(advanceBonusPayoutProgress(0, payoutProgress, true));
        }
        setBonusSpinsRemaining(totalSpins - spinIndex - 1);
        await wait(320);
        setRetriggerSpins(0);
      }
      if (result.wildSurge && result.wildSurge.linesAwarded > 0) {
        setSurgeAnnouncement(true);
        await wait(1800);
        setSurgeAnnouncement(false);
        const surge = evaluateBonusSpinFrame(result.wildSurge.frame, baseBet);
        await animateBoard(surge.grid);
        setBonusSpinNumber(frames.length + 1);
        setWildMultiplier(surge.multiplier);
        const surgeHits = surge.lineHits;
        setVisibleHits(surgeHits);
        for (let hitIndex = 0; hitIndex < surgeHits.length; hitIndex++) {
          setActiveHitIndex(hitIndex);
          setDisplayWin(advanceBonusPayoutProgress(
            surgeHits[hitIndex].winAmount,
            payoutProgress,
            hitIndex === surgeHits.length - 1,
          ));
          await wait(1460);
        }
        setActiveHitIndex(null);
        if (surgeHits.length === 0) setDisplayWin(advanceBonusPayoutProgress(0, payoutProgress, true));
      }
    } else {
      for (let hitIndex = 0; hitIndex < result.lineHits.length; hitIndex++) {
        setActiveHitIndex(hitIndex);
        setDisplayWin(result.lineHits.slice(0, hitIndex + 1).reduce((sum, hit) => sum + hit.winAmount, 0));
        await wait(560);
      }
    }

    setActiveHitIndex(null);
    setDisplayWin(result.totalWin);
    setPlaying(false);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white flex flex-col items-center justify-center p-2 sm:p-4" data-replay="true">
      <div className="w-full max-w-5xl h-full max-h-[900px] flex flex-col items-center justify-center gap-2 sm:gap-4">
        <header className="text-center shrink-0">
          <div className="text-amber-300 font-black tracking-[.12em] sm:tracking-[.22em] text-xs sm:text-base">SEA RAIDER · {toSocialText(MODE_CONFIGS[mode].name, isSocial)} · {toSocialText('REPLAY', isSocial)}</div>
      <div className="mt-1 flex flex-wrap justify-center gap-x-3 text-[10px] sm:text-sm text-slate-200">
            <span>{toSocialText('PLAY AMOUNT', isSocial)}: {formatMoney(baseBet, currency)}</span>
            {cost !== 1 && <span>{toSocialText('MULTIPLIER', isSocial)}: {cost}× · {toSocialText('REAL COST', isSocial)}: {formatMoney(realCost, currency)}</span>}
            <span>{toSocialText('WIN', isSocial)}: {formatMoney(displayWin, currency)}</span>
          </div>
          {result.bonusTriggered && <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-emerald-300 sm:text-xs">
            {toSocialText('Feature awarded', isSocial)} · {toSocialText(result.bonusType ?? 'bonus', isSocial)} · {result.bonusSpinsAwarded} {toSocialText('spins', isSocial)} · {toSocialText('full round result', isSocial)}
          </div>}
          {result.bonusTriggered && frames.length === 0 && <div className="mt-1 max-w-xl text-[9px] text-amber-100/75 sm:text-xs">
            {toSocialText('This math version saved the feature trigger and total, but not its individual bonus-spin boards. Publish the updated math version to replay the complete feature.', isSocial)}
          </div>}
        </header>
        <div className="w-full max-w-[950px] flex-1 min-h-0 flex items-center justify-center relative">
          <ReelGrid grid={grid} spinningReels={stops} teaseReels={[false,false,false,false,false]} winningHits={started ? visibleHits : []} activeHitIndex={activeHitIndex} wildMultiplier={wildMultiplier} isBonusActive={bonusSpinNumber > 0} explosions={[]} onExplosionComplete={() => {}} landedScatterCount={started ? result.scatterCount : 0} captainRevealCount={captainReveal?.count ?? null} captainRevealReel={captainReveal?.reel ?? null} captainRevealRow={captainReveal?.row ?? null} captainRevealPhase={captainReveal?.phase ?? null} isTurbo={false} currency={currency} />
          {result.bonusTriggered && result.bonusType && bonusSpinNumber > 0 && <BonusGameOverlay
            bonusType={result.bonusType}
            spinsRemaining={bonusSpinsRemaining}
            totalSpins={bonusTotalSpins}
            currentMultiplier={wildMultiplier}
            totalAccumulatedWin={displayWin}
            currency={currency}
            isSocial={isSocial}
            retriggerSpins={retriggerSpins}
            finale={bonusSpinNumber > frames.length}
          />}
          {result.bonusTriggered && result.bonusType && started && bonusSpinNumber > 0 && (
            <WildSurgeMeter bonusType={result.bonusType} wildCount={bonusWildCount} className="absolute -bottom-10 left-1/2 z-30 -translate-x-1/2 pointer-events-none" />
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button disabled={playing} onClick={play} className="rounded-lg bg-amber-400 px-4 py-2 text-xs sm:text-base font-black text-black disabled:opacity-60">
            {started ? toSocialText('PLAY AGAIN', isSocial) : toSocialText('START REPLAY', isSocial)}
          </button>
        </div>
      </div>
      {surgeAnnouncement && result.wildSurge && <WildSurgeAnnouncement wildCount={result.wildSurge.wildCount} linesAwarded={result.wildSurge.linesAwarded} />}
    </main>
  );
}
