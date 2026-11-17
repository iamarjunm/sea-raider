'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, BookOpen, Menu as MenuIcon, Music2, Repeat, Square, Volume2, VolumeX } from 'lucide-react';
import { PlayMode, MODE_CONFIGS } from '../../lib/slot-engine';
import { formatMoney, toSocialText } from '../../lib/currency';
import { soundManager, AudioState } from '../../lib/audio';
import PixiSpinButton from './PixiSpinButton';

export interface ControlPanelProps {
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
  activeMode?: PlayMode;
  /** Optional direct cost multiplier override so this bar can be used across any game without mode coupling. */
  costMultiplier?: number;
  /** Optional direct total spin cost override. */
  totalBetCost?: number;
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
  helmAssetSrc?: string;
}

/** Counts a win up smoothly; resets to 0 instantly. */
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
    const duration = Math.min(1350, 360 + Math.log10(1 + (target - from)) * 250);
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

export function UniversalBetBar(props: ControlPanelProps) {
  const {
    balance,
    betLevel,
    onIncreaseBet,
    onDecreaseBet,
    lastWin,
    isSpinning,
    onSpin,
    isAutoActive,
    autoSpinsRemaining,
    onOpenAuto,
    onStopAuto,
    activeMode = 'base',
    costMultiplier,
    totalBetCost,
    onOpenPaytable,
    onOpenMenu,
    currency,
    isSocial,
    canBet,
    isBonusActive = false,
    bonusSpinsRemaining = 0,
    bonusTotalSpins = 0,
    bonusFinale = false,
    onSkipBonus,
    isSimulationPaused = false,
    isTurbo = false,
    helmAssetSrc,
  } = props;

  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(soundManager.getAudioState());
  const audioMenuRef = useRef<HTMLDivElement>(null);

  const resolvedMultiplier =
    typeof costMultiplier === 'number'
      ? costMultiplier
      : MODE_CONFIGS[activeMode]?.costMultiplier ?? 1;
  const activeBetCost =
    typeof totalBetCost === 'number' ? totalBetCost : betLevel * resolvedMultiplier;

  const { value: shownWin, isCounting } = useCountUp(lastWin);
  const betLocked = isSpinning || isAutoActive || isBonusActive || isSimulationPaused;
  const spinDisabled = isSimulationPaused || (!isSpinning && (!canBet || isAutoActive || isBonusActive));
  const isReady = !isSpinning && !spinDisabled;
  const isInfiniteAuto = !Number.isFinite(autoSpinsRemaining) || autoSpinsRemaining > 9999;
  const autoCountDisplay = isInfiniteAuto ? '∞' : String(autoSpinsRemaining);

  useEffect(() => soundManager.subscribe(setAudioState), []);
  useEffect(() => {
    if (!isAudioMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(event.target as Node)) {
        setIsAudioMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [isAudioMenuOpen]);

  return (
    <div className="universal-betbar-wrap relative z-20 mx-auto w-full max-w-[1120px] px-1.5 pb-1.5 sm:px-4 sm:pb-3 select-none">
      <section
        className="game-console universal-betbar relative isolate grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 overflow-visible px-3 py-2 sm:gap-4 sm:px-5 sm:py-2"
        aria-label="Game controls"
      >
        <span className="console-rivet console-rivet--tl" aria-hidden="true" />
        <span className="console-rivet console-rivet--tr" aria-hidden="true" />
        <span className="console-rivet console-rivet--bl" aria-hidden="true" />
        <span className="console-rivet console-rivet--br" aria-hidden="true" />

        {/* LEFT: Menu + Info buttons & Inset Balance / Bet Amount Panel */}
        <div className="console-left flex min-w-0 items-center justify-self-stretch gap-1.5 sm:gap-3">
          <div className="console-nav flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenMenu}
              title={toSocialText("Captain's Log & Settings", isSocial)}
              aria-label="Open settings"
              className="console-icon-button"
            >
              <MenuIcon size={16} strokeWidth={2.3} />
            </button>
            <button
              type="button"
              onClick={onOpenPaytable}
              title={toSocialText('Paytable & Symbol Rules', isSocial)}
              aria-label="Game rules"
              className="console-icon-button"
            >
              <BookOpen size={16} strokeWidth={2.2} />
            </button>
          </div>

          <div className="console-wallet min-w-0 flex-1 sm:flex-none">
            <div className="console-balance-line flex min-w-0 items-baseline justify-between gap-1 sm:gap-3">
              <span className="console-label">{toSocialText('BALANCE', isSocial)}</span>
              <strong className="console-balance tabular-nums">{formatMoney(balance, currency)}</strong>
            </div>
            <div className="console-bet-line flex items-center justify-between gap-1">
              <span className="console-label whitespace-nowrap">{toSocialText('AMOUNT', isSocial)}</span>
              <div className="console-bet-controls flex min-w-0 items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={onDecreaseBet}
                  disabled={betLocked}
                  aria-label="Decrease play amount"
                  className="console-stepper"
                >
                  <span>−</span>
                </button>
                <strong className="console-play-amount whitespace-nowrap tabular-nums">
                  {formatMoney(betLevel, currency)}
                </strong>
                <button
                  type="button"
                  onClick={onIncreaseBet}
                  disabled={betLocked}
                  aria-label="Increase play amount"
                  className="console-stepper"
                >
                  <span>+</span>
                </button>
              </div>
            </div>
            <div className="console-cost text-right tabular-nums">
              {toSocialText('COST', isSocial)} {formatMoney(activeBetCost, currency)}
              {resolvedMultiplier !== 1 ? ` · ${resolvedMultiplier}×` : ''}
            </div>
          </div>
        </div>

        {/* CENTRE: Helm-Wheel Spin Button + Compact Linear Autoplay Button to its right */}
        <div className="console-center flex shrink-0 items-center justify-center gap-2 sm:gap-3">
          <PixiSpinButton
            onSpin={onSpin}
            isSpinning={isSpinning}
            disabled={spinDisabled}
            isBonusActive={isBonusActive}
            bonusSpinsRemaining={bonusSpinsRemaining}
            bonusTotalSpins={bonusTotalSpins}
            bonusFinale={bonusFinale}
            isAutoActive={isAutoActive}
            isTurbo={isTurbo}
            isReady={isReady}
            isSocial={isSocial}
            assetSrc={helmAssetSrc}
          />

          {!isBonusActive &&
            (isAutoActive ? (
              <button
                type="button"
                onClick={onStopAuto}
                className="console-autobtn console-autobtn--stop"
                title="Stop autoplay"
                aria-label={`Stop autoplay, ${autoCountDisplay} spins left`}
              >
                <Square size={10} strokeWidth={0} fill="currentColor" className="shrink-0" />
                <span className="console-autobtn__label tabular-nums">{autoCountDisplay}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuto}
                disabled={isSpinning || isSimulationPaused}
                title={toSocialText('Auto Play Settings', isSocial)}
                aria-label={toSocialText('Autoplay', isSocial)}
                className="console-autobtn"
              >
                <Repeat size={12} strokeWidth={2.4} className="shrink-0" />
                <span className="console-autobtn__label">AUTO</span>
              </button>
            ))}

          {isBonusActive && onSkipBonus && (
            <button
              type="button"
              onClick={onSkipBonus}
              aria-label="Skip remaining bonus spins"
              title="Skip bonus and show the round total"
              className="console-skip"
            >
              <span className="hidden sm:inline">SKIP BONUS</span>
              <span className="sm:hidden">SKIP</span>
            </button>
          )}
        </div>

        {/* RIGHT: Inset WIN Display & Far-Right Sound Button */}
        <div className="console-right flex min-w-0 items-center justify-end justify-self-stretch gap-1.5 sm:gap-3">
          <div
            className={`console-win min-w-0 flex-1 text-center ${
              lastWin > 0 ? 'console-win--hot' : ''
            } ${isCounting ? 'console-win--counting' : ''}`}
          >
            <span className="console-label block">
              {isBonusActive ? toSocialText('TOTAL WIN', isSocial) : toSocialText('WIN', isSocial)}
            </span>
            <strong className="console-win-amount block whitespace-nowrap tabular-nums">
              {formatMoney(shownWin, currency)}
            </strong>
          </div>

          <div className="console-actions relative flex shrink-0 items-center" ref={audioMenuRef}>
            <button
              type="button"
              onClick={() => {
                soundManager.startMusic();
                setIsAudioMenuOpen((open) => !open);
              }}
              title="Audio & Volume Settings"
              aria-label="Audio settings"
              className={`console-icon-button ${
                audioState.masterMuted ? 'console-icon-button--muted' : ''
              }`}
            >
              {audioState.masterMuted ? <VolumeX size={17} strokeWidth={2.2} /> : <Volume2 size={17} strokeWidth={2.2} />}
            </button>

            {isAudioMenuOpen && (
              <div className="hud-audio-popover absolute bottom-[calc(100%+12px)] right-0 z-50 flex w-64 flex-col gap-3 p-4">
                <div className="flex items-center justify-between border-b border-[#b58538]/25 pb-2.5">
                  <span className="hud-audio-popover__title">Audio Mix</span>
                  <button
                    type="button"
                    onClick={() => soundManager.toggleMute()}
                    className={`hud-audio-popover__mute ${audioState.masterMuted ? 'is-muted' : ''}`}
                  >
                    {audioState.masterMuted ? 'MUTED' : 'SOUND ON'}
                  </button>
                </div>
                <label className="flex flex-col gap-1.5 text-[11px] font-bold text-[#e6d5b5]">
                  <span className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-[#c9a460]">
                      <Music2 size={13} /> SHANTIES
                    </span>
                    <span className="tabular-nums text-[#f4ead5]">
                      {audioState.musicMuted ? 'MUTED' : `${Math.round(audioState.musicVolume * 100)}%`}
                    </span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.musicMuted ? 0 : audioState.musicVolume}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      soundManager.setMusicVolume(value);
                      if (audioState.musicMuted) soundManager.setMusicMuted(false);
                      soundManager.startMusic();
                    }}
                    className="hud-audio-range w-full"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] font-bold text-[#e6d5b5]">
                  <span className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-[#c9a460]">
                      <AudioLines size={13} /> SOUND EFFECTS
                    </span>
                    <span className="tabular-nums text-[#f4ead5]">
                      {audioState.sfxMuted ? 'MUTED' : `${Math.round(audioState.sfxVolume * 100)}%`}
                    </span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioState.sfxMuted ? 0 : audioState.sfxVolume}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      soundManager.setSfxVolume(value);
                      if (audioState.sfxMuted) soundManager.setSfxMuted(false);
                    }}
                    className="hud-audio-range w-full"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default UniversalBetBar;
