'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, BookOpen, Menu as MenuIcon, Music2, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { PlayMode, MODE_CONFIGS } from '../../lib/slot-engine';
import { formatMoney, toSocialText } from '../../lib/currency';
import { soundManager, AudioState } from '../../lib/audio';

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
}

export default function ControlPanel(props: ControlPanelProps) {
  const {
    balance, betLevel, onIncreaseBet, onDecreaseBet, lastWin, isSpinning, onSpin,
    isAutoActive, autoSpinsRemaining, onOpenAuto, onStopAuto, activeMode,
    onOpenPaytable, onOpenMenu, currency, isSocial, canBet,
    isBonusActive = false, bonusSpinsRemaining = 0, bonusTotalSpins = 0,
    bonusFinale = false,
    onSkipBonus, isSimulationPaused = false,
  } = props;
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(soundManager.getAudioState());
  const audioMenuRef = useRef<HTMLDivElement>(null);
  const config = MODE_CONFIGS[activeMode];
  const activeBetCost = betLevel * config.costMultiplier;

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

        <div className="console-left flex min-w-0 items-center justify-self-stretch gap-1.5 sm:gap-3">
          <div className="console-nav flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button onClick={onOpenMenu} title={toSocialText("Captain's Settings & Menu", isSocial)} aria-label="Open settings" className="console-icon-button"><MenuIcon size={16} /></button>
            <button onClick={onOpenPaytable} title={toSocialText('Paytable & Symbol Rules', isSocial)} aria-label="Game rules" className="console-icon-button"><BookOpen size={16} /></button>
          </div>

          <div className="console-wallet min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-2 py-1.5 sm:flex-none sm:px-3 sm:py-2">
            <div className="console-balance-line flex min-w-0 items-baseline justify-between gap-1 sm:gap-3">
              <span className="console-label">{toSocialText('BALANCE', isSocial)}</span>
              <strong className="console-balance tabular-nums">{formatMoney(balance, currency)}</strong>
            </div>
            <div className="console-bet-line mt-1 flex items-center justify-between gap-1 border-t border-white/10 pt-1 sm:mt-1.5 sm:pt-1.5">
              <span className="console-label whitespace-nowrap">{toSocialText('AMOUNT', isSocial)}</span>
              <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                <button onClick={onDecreaseBet} disabled={isSpinning || isAutoActive || isBonusActive || isSimulationPaused} aria-label="Decrease play amount" className="console-stepper">−</button>
                <strong className="console-play-amount whitespace-nowrap tabular-nums">{formatMoney(betLevel, currency)}</strong>
                <button onClick={onIncreaseBet} disabled={isSpinning || isAutoActive || isBonusActive || isSimulationPaused} aria-label="Increase play amount" className="console-stepper">+</button>
              </div>
            </div>
            <div className="console-cost mt-0.5 text-right tabular-nums">{toSocialText('COST', isSocial)} {formatMoney(activeBetCost, currency)}{activeMode !== 'base' ? ` · ${config.costMultiplier}×` : ''}</div>
          </div>
        </div>

        <div className="console-center flex shrink-0 items-center justify-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onSpin}
            disabled={!canBet || isSpinning || isAutoActive || isBonusActive || isSimulationPaused}
            aria-label={isBonusActive ? bonusFinale ? 'Wild Surge final spin in progress' : `Bonus in progress, ${bonusSpinsRemaining} spins remaining` : toSocialText('Spin', isSocial)}
            className={`console-spin group relative flex shrink-0 flex-col items-center justify-center overflow-visible border-0 text-center transition duration-200 ${isBonusActive ? 'console-spin--bonus' : ''}`}
          >
            <span className="console-spin-glint pointer-events-none absolute inset-0" />
            <span className="console-spin-icon relative z-10"><RotateCw size={21} strokeWidth={2.4} className={isSpinning ? 'animate-spin' : 'transition-transform duration-500 group-hover:rotate-90'} /></span>
            <span className="relative z-10 mt-0.5 text-[8px] font-black tracking-[.19em] sm:text-[10px]">{isBonusActive ? bonusFinale ? 'SURGE' : 'BONUS' : isSpinning ? 'SPINNING' : toSocialText('SPIN', isSocial)}</span>
            {isBonusActive && <span className="relative z-10 text-[7px] font-bold tabular-nums text-cyan-50/80 sm:text-[9px]">{bonusFinale ? 'FINAL SPIN' : `${bonusSpinsRemaining}/${bonusTotalSpins}`}</span>}
          </button>
          {isBonusActive && onSkipBonus && (
            <button type="button" onClick={onSkipBonus} aria-label="Skip remaining bonus spins" title="Skip bonus and show the round total" className="console-skip">
              <span className="hidden sm:inline">SKIP BONUS</span><span className="sm:hidden">SKIP</span>
            </button>
          )}
        </div>

        <div className="console-right flex min-w-0 items-center justify-self-stretch gap-1.5 sm:gap-3">
          <div className="console-win min-w-0 flex-1 rounded-xl border border-emerald-200/20 bg-[#031119]/80 px-2 py-1.5 text-center sm:px-4 sm:py-2">
            <span className="console-label block">{isBonusActive ? toSocialText('TOTAL WIN', isSocial) : toSocialText('WIN', isSocial)}</span>
            <strong className={`console-win-amount mt-0.5 block whitespace-nowrap tabular-nums ${lastWin > 0 ? 'text-emerald-200' : 'text-slate-100'}`}>{formatMoney(lastWin, currency)}</strong>
          </div>

          <div className="console-actions flex shrink-0 items-center gap-1 sm:gap-1.5" ref={audioMenuRef}>
            {isAutoActive ? (
              <button onClick={onStopAuto} className="console-stop" title="Stop autoplay">STOP <span className="hidden sm:inline">({autoSpinsRemaining})</span></button>
            ) : (
              <button onClick={onOpenAuto} disabled={isSpinning || isBonusActive || isSimulationPaused} title={toSocialText('Auto Play Settings', isSocial)} className="console-auto">AUTO</button>
            )}
            <button onClick={() => { soundManager.startMusic(); setIsAudioMenuOpen((open) => !open); }} title="Audio & Volume Settings" aria-label="Audio settings" className={`console-icon-button ${audioState.masterMuted ? 'console-icon-button--muted' : ''}`}>
              {audioState.masterMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {isAudioMenuOpen && (
              <div className="absolute bottom-[calc(100%+10px)] right-0 z-50 flex w-64 flex-col gap-3 rounded-2xl border border-amber-300/50 bg-[#07131c]/[.98] p-4 text-white shadow-[0_12px_44px_rgba(0,0,0,.9)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-200">AUDIO SETTINGS</span>
                  <button onClick={() => soundManager.toggleMute()} className="rounded border border-white/15 px-2 py-0.5 text-[9px] font-black">{audioState.masterMuted ? 'MUTED' : 'SOUND ON'}</button>
                </div>
                <label className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-200">
                  <span className="flex justify-between"><span className="flex items-center gap-1.5"><Music2 size={13} /> MUSIC</span><span>{audioState.musicMuted ? 'MUTED' : `${Math.round(audioState.musicVolume * 100)}%`}</span></span>
                  <input type="range" min="0" max="1" step="0.05" value={audioState.musicMuted ? 0 : audioState.musicVolume} onChange={(event) => { const value = Number(event.target.value); soundManager.setMusicVolume(value); if (audioState.musicMuted) soundManager.setMusicMuted(false); soundManager.startMusic(); }} className="w-full accent-amber-400" />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-200">
                  <span className="flex justify-between"><span className="flex items-center gap-1.5"><AudioLines size={13} /> SOUND EFFECTS</span><span>{audioState.sfxMuted ? 'MUTED' : `${Math.round(audioState.sfxVolume * 100)}%`}</span></span>
                  <input type="range" min="0" max="1" step="0.05" value={audioState.sfxMuted ? 0 : audioState.sfxVolume} onChange={(event) => { const value = Number(event.target.value); soundManager.setSfxVolume(value); if (audioState.sfxMuted) soundManager.setSfxMuted(false); }} className="w-full accent-amber-400" />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
