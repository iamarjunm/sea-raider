'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, BookOpen, Menu as MenuIcon, Music2, Repeat, Volume2, VolumeX } from 'lucide-react';
import { PlayMode, MODE_CONFIGS } from '../../lib/slot-engine';
import { formatMoney, toSocialText } from '../../lib/currency';
import { soundManager, AudioState } from '../../lib/audio';
import HelmWheel from '../scene/HelmWheel';

interface ControlPanelProps {
  balance: number;
  betLevel: number;
  onIncreaseBet: () => void;
  onDecreaseBet: () => void;
  lastWin: number;
  isSpinning: boolean;
  onSpin: () => void;
  isAutoActive: boolean;
  autoSpinsRemaining: number;
  onOpenAuto: () => void;
  onStopAuto: () => void;
  activeMode: PlayMode;
  onOpenPaytable: () => void;
  onOpenMenu: () => void;
  currency: string;
  isSocial: boolean;
  canBet: boolean;
  isBonusActive?: boolean;
  bonusSpinsRemaining?: number;
  bonusTotalSpins?: number;
  bonusFinale?: boolean;
  onSkipBonus?: () => void;
  isSimulationPaused?: boolean;
  isTurbo?: boolean;
}

/** Counts a win up like coins tumbling onto the tray; resets to 0 instantly. */
function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const [isCounting, setIsCounting] = useState(false);
  const valueRef = useRef(target);

  useEffect(() => {
    const from = valueRef.current;
    if (target <= from || target <= 0) {
      valueRef.current = target;
      const t = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(t);
    }
    const duration = Math.min(1400, 380 + Math.log10(1 + (target - from)) * 260);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (target - from) * eased;
      valueRef.current = next;
      setValue(next);
      if (p < 1) frame = requestAnimationFrame(tick);
      else setIsCounting(false);
    };
    setIsCounting(true);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      valueRef.current = target;
    };
  }, [target]);

  return { value, isCounting };
}

export default function ControlPanel(props: ControlPanelProps) {
  const {
    balance, betLevel, onIncreaseBet, onDecreaseBet, lastWin, isSpinning, onSpin,
    isAutoActive, autoSpinsRemaining, onOpenAuto, onStopAuto, activeMode,
    onOpenPaytable, onOpenMenu, currency, isSocial, canBet,
    isBonusActive = false, bonusSpinsRemaining = 0, bonusTotalSpins = 0,
    bonusFinale = false,
    onSkipBonus, isSimulationPaused = false, isTurbo = false,
  } = props;
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(soundManager.getAudioState());
  const audioMenuRef = useRef<HTMLDivElement>(null);
  const config = MODE_CONFIGS[activeMode];
  const activeBetCost = betLevel * config.costMultiplier;
  const { value: shownWin, isCounting } = useCountUp(lastWin);
  const betLocked = isSpinning || isAutoActive || isBonusActive || isSimulationPaused;
  const spinDisabled = !canBet || isSpinning || isAutoActive || isBonusActive || isSimulationPaused;
  const isReady = !spinDisabled;

  useEffect(() => soundManager.subscribe(setAudioState), []);
  useEffect(() => {
    if (!isAudioMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(event.target as Node)) setIsAudioMenuOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [isAudioMenuOpen]);

  return (
    <div className="relative z-20 mx-auto w-full max-w-[1120px] px-1.5 pb-1.5 sm:px-4 sm:pb-3 select-none">
      <section className="game-console relative isolate grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 overflow-visible px-3 py-2.5 sm:gap-5 sm:px-6 sm:py-2">
        <span className="console-rivet console-rivet--tl" aria-hidden="true" />
        <span className="console-rivet console-rivet--tr" aria-hidden="true" />
        <span className="console-rivet console-rivet--bl" aria-hidden="true" />
        <span className="console-rivet console-rivet--br" aria-hidden="true" />

        <div className="console-left flex min-w-0 items-center justify-self-stretch gap-1.5 sm:gap-3">
          <div className="console-nav flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button onClick={onOpenMenu} title={toSocialText("Captain's Log & Settings", isSocial)} aria-label="Open settings" className="console-icon-button"><MenuIcon size={16} /></button>
            <button onClick={onOpenPaytable} title={toSocialText('Paytable & Symbol Rules', isSocial)} aria-label="Game rules" className="console-icon-button"><BookOpen size={16} /></button>
          </div>

          <div className="console-wallet min-w-0 flex-1 sm:flex-none">
            <div className="console-balance-line flex min-w-0 items-baseline justify-between gap-1 sm:gap-3">
              <span className="console-label">{toSocialText('BALANCE', isSocial)}</span>
              <strong className="console-balance tabular-nums">{formatMoney(balance, currency)}</strong>
            </div>
            <div className="console-bet-line flex items-center justify-between gap-1">
              <span className="console-label whitespace-nowrap">{toSocialText('AMOUNT', isSocial)}</span>
              <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                <button onClick={onDecreaseBet} disabled={betLocked} aria-label="Decrease play amount" className="console-stepper"><span>−</span></button>
                <strong className="console-play-amount whitespace-nowrap tabular-nums">{formatMoney(betLevel, currency)}</strong>
                <button onClick={onIncreaseBet} disabled={betLocked} aria-label="Increase play amount" className="console-stepper"><span>+</span></button>
              </div>
            </div>
            <div className="console-cost text-right tabular-nums">{toSocialText('COST', isSocial)} {formatMoney(activeBetCost, currency)}{activeMode !== 'base' ? ` · ${config.costMultiplier}×` : ''}</div>
          </div>
        </div>

        <div className="console-center flex shrink-0 items-center justify-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onSpin}
            disabled={spinDisabled}
            aria-label={isBonusActive ? bonusFinale ? 'Wild Surge final spin in progress' : `Bonus in progress, ${bonusSpinsRemaining} spins remaining` : toSocialText('Spin', isSocial)}
            className={`console-spin group relative flex shrink-0 flex-col items-center justify-center overflow-visible border-0 text-center ${isBonusActive ? 'console-spin--bonus' : ''} ${isReady ? 'console-spin--ready' : ''} ${isSpinning ? 'console-spin--spinning' : ''}`}
          >
            <span className="console-spin__ripple" aria-hidden="true" />
            <span className="console-spin__ripple console-spin__ripple--late" aria-hidden="true" />
            <HelmWheel isSpinning={isSpinning || isAutoActive} isTurbo={isTurbo} squash={1} idleSwing={7} className="console-spin__helm" />
            <span className="console-spin__medallion" aria-hidden="true" />
            <span className="console-spin-label relative z-10">{isBonusActive ? bonusFinale ? 'SURGE' : 'BONUS' : isSpinning ? '' : toSocialText('SPIN', isSocial)}</span>
            {isBonusActive && <span className="console-spin-count relative z-10 tabular-nums">{bonusFinale ? 'FINAL' : `${bonusSpinsRemaining}/${bonusTotalSpins}`}</span>}
          </button>
          {isBonusActive && onSkipBonus && (
            <button type="button" onClick={onSkipBonus} aria-label="Skip remaining bonus spins" title="Skip bonus and show the round total" className="console-skip">
              <span className="hidden sm:inline">SKIP BONUS</span><span className="sm:hidden">SKIP</span>
            </button>
          )}
        </div>

        <div className="console-right flex min-w-0 items-center justify-self-stretch gap-1.5 sm:gap-3">
          <div className={`console-win min-w-0 flex-1 text-center ${lastWin > 0 ? 'console-win--hot' : ''} ${isCounting ? 'console-win--counting' : ''}`}>
            <span className="console-label block">{isBonusActive ? toSocialText('TOTAL WIN', isSocial) : toSocialText('WIN', isSocial)}</span>
            <strong className="console-win-amount block whitespace-nowrap tabular-nums">{formatMoney(shownWin, currency)}</strong>
          </div>

          <div className="console-actions flex shrink-0 items-center gap-1 sm:gap-1.5" ref={audioMenuRef}>
            {isAutoActive ? (
              <button onClick={onStopAuto} className="console-stop" title="Stop autoplay">STOP <span className="hidden sm:inline tabular-nums">{autoSpinsRemaining}</span></button>
            ) : (
              <button onClick={onOpenAuto} disabled={isSpinning || isBonusActive || isSimulationPaused} title={toSocialText('Auto Play Settings', isSocial)} className="console-auto"><Repeat size={12} strokeWidth={2.6} className="hidden sm:inline" /> AUTO</button>
            )}
            <button onClick={() => { soundManager.startMusic(); setIsAudioMenuOpen((open) => !open); }} title="Audio & Volume Settings" aria-label="Audio settings" className={`console-icon-button ${audioState.masterMuted ? 'console-icon-button--muted' : ''}`}>
              {audioState.masterMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {isAudioMenuOpen && (
              <div className="ship-popover absolute bottom-[calc(100%+12px)] right-0 z-50 flex w-64 flex-col gap-3 p-4">
                <div className="flex items-center justify-between border-b border-[#6b4a22]/40 pb-2">
                  <span className="ship-heading text-lg">Ship&apos;s Band</span>
                  <button onClick={() => soundManager.toggleMute()} className="ship-chip">{audioState.masterMuted ? 'MUTED' : 'SOUND ON'}</button>
                </div>
                <label className="flex flex-col gap-1.5 text-[11px] font-bold text-[#3b2410]">
                  <span className="flex justify-between"><span className="flex items-center gap-1.5"><Music2 size={13} /> SHANTIES</span><span className="tabular-nums">{audioState.musicMuted ? 'MUTED' : `${Math.round(audioState.musicVolume * 100)}%`}</span></span>
                  <input type="range" min="0" max="1" step="0.05" value={audioState.musicMuted ? 0 : audioState.musicVolume} onChange={(event) => { const value = Number(event.target.value); soundManager.setMusicVolume(value); if (audioState.musicMuted) soundManager.setMusicMuted(false); soundManager.startMusic(); }} className="ship-range w-full" />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] font-bold text-[#3b2410]">
                  <span className="flex justify-between"><span className="flex items-center gap-1.5"><AudioLines size={13} /> SOUND EFFECTS</span><span className="tabular-nums">{audioState.sfxMuted ? 'MUTED' : `${Math.round(audioState.sfxVolume * 100)}%`}</span></span>
                  <input type="range" min="0" max="1" step="0.05" value={audioState.sfxMuted ? 0 : audioState.sfxVolume} onChange={(event) => { const value = Number(event.target.value); soundManager.setSfxVolume(value); if (audioState.sfxMuted) soundManager.setSfxMuted(false); }} className="ship-range w-full" />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
