'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { formatMoney, toSocialText } from '../../lib/currency';
import { soundManager } from '../../lib/audio';

interface WinCelebrationProps {
  winAmount: number;
  betAmount: number;
  currency: string;
  isSocial: boolean;
  onDismiss: () => void;
  isTotalWin?: boolean;
}

type WinTier = 'big' | 'huge' | 'mega' | 'epic' | 'legendary' | 'total';

interface TierConfig {
  title: string;
  sub: string;
  badgeAsset: string;
  accentGradient: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
}

const TIER_CONFIGS: Record<WinTier, TierConfig> = {
  big: {
    title: 'BIG WIN!',
    sub: 'TREASURE SECURED',
    badgeAsset: '/assets/sea-raider/wild.png',
    accentGradient: 'from-amber-500 via-yellow-400 to-amber-600',
    borderColor: 'border-amber-400',
    textColor: 'from-yellow-100 via-amber-300 to-amber-600',
    glowColor: 'rgba(245,158,11,0.85)',
  },
  huge: {
    title: 'HUGE WIN!',
    sub: 'CHEST OF SPANISH GOLD',
    badgeAsset: '/assets/sea-raider/treasure-chest.png',
    accentGradient: 'from-emerald-400 via-teal-300 to-emerald-600',
    borderColor: 'border-emerald-400',
    textColor: 'from-emerald-100 via-teal-300 to-emerald-500',
    glowColor: 'rgba(52,211,153,0.85)',
  },
  mega: {
    title: 'MEGA WIN!',
    sub: 'GALLEON PLUNDER',
    badgeAsset: '/assets/sea-raider/compass.png',
    accentGradient: 'from-purple-400 via-fuchsia-300 to-purple-600',
    borderColor: 'border-fuchsia-400',
    textColor: 'from-purple-100 via-fuchsia-300 to-purple-500',
    glowColor: 'rgba(217,70,239,0.85)',
  },
  epic: {
    title: 'EPIC WIN!',
    sub: 'SCOURGE OF THE SEAS',
    badgeAsset: '/assets/sea-raider/captain.png',
    accentGradient: 'from-red-500 via-rose-400 to-amber-500',
    borderColor: 'border-rose-400',
    textColor: 'from-rose-100 via-amber-300 to-red-500',
    glowColor: 'rgba(244,63,94,0.9)',
  },
  legendary: {
    title: 'LEGENDARY WIN!',
    sub: 'ETHEREAL KRAKEN MASTER',
    badgeAsset: '/assets/sea-raider/scatter.png',
    accentGradient: 'from-yellow-300 via-amber-200 to-yellow-500',
    borderColor: 'border-yellow-300',
    textColor: 'from-white via-yellow-200 to-amber-400',
    glowColor: 'rgba(253,224,71,0.95)',
  },
  total: {
    title: 'TOTAL WIN!',
    sub: 'VOYAGE COMPLETED',
    badgeAsset: '/assets/sea-raider/treasure-chest.png',
    accentGradient: 'from-yellow-400 via-amber-300 to-orange-500',
    borderColor: 'border-amber-300',
    textColor: 'from-yellow-100 via-amber-300 to-amber-600',
    glowColor: 'rgba(245,158,11,0.95)',
  },
};

export default function WinCelebration({
  winAmount,
  betAmount,
  currency,
  isSocial,
  onDismiss,
  isTotalWin = false,
}: WinCelebrationProps) {
  const [displayedWin, setDisplayedWin] = useState<number>(0);
  const [isCountupFinished, setIsCountupFinished] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<WinTier>(isTotalWin ? 'total' : 'big');
  const [tierShake, setTierShake] = useState<number>(0);

  const multiplier = betAmount > 0 ? winAmount / betAmount : 0;
  const isFinishedRef = useRef(false);

  // Progressive tier transitions during count-up
  const updateTierForAmount = useCallback(
    (amount: number) => {
      if (isTotalWin) return;
      const currentMult = betAmount > 0 ? amount / betAmount : 0;

      let targetKey: WinTier = 'big';
      if (currentMult >= 80) {
        targetKey = 'legendary';
      } else if (currentMult >= 45) {
        targetKey = 'epic';
      } else if (currentMult >= 25) {
        targetKey = 'mega';
      } else if (currentMult >= 15) {
        targetKey = 'huge';
      } else {
        targetKey = 'big';
      }

      setCurrentTier((prev) => {
        if (prev !== targetKey) {
          soundManager.playWin(true);
          setTierShake((s) => s + 1);
          return targetKey;
        }
        return prev;
      });
    },
    [betAmount, isTotalWin]
  );

  const handleClickOrSpace = useCallback(() => {
    if (!isFinishedRef.current) {
      // A click fast-forwards the count-up once; the finished amount stays put.
      isFinishedRef.current = true;
      setIsCountupFinished(true);
      setDisplayedWin(winAmount);
      updateTierForAmount(winAmount);
      soundManager.playWin(true);
    } else {
      onDismiss();
    }
  }, [winAmount, updateTierForAmount, onDismiss]);

  // Keyboard shortcut listener (Space or Enter)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleClickOrSpace();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClickOrSpace]);

  // Progressive rolling count-up effect using Date.now() for rock-solid timing
  useEffect(() => {
    const duration = isTotalWin ? 2200 : Math.min(1800 + multiplier * 15, 3000);
    const startTime = Date.now();

    const countTimer = setInterval(() => {
      if (isFinishedRef.current) {
        clearInterval(countTimer);
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -8 * progress);
      const currentVal = winAmount * ease;

      setDisplayedWin(currentVal);
      updateTierForAmount(currentVal);

      if (progress >= 1) {
        isFinishedRef.current = true;
        setIsCountupFinished(true);
        setDisplayedWin(winAmount);
        updateTierForAmount(winAmount);
        clearInterval(countTimer);
        soundManager.playWin(true);
      }
    }, 30);

    return () => {
      clearInterval(countTimer);
    };
  // Do not restart the count-up when the parent recreates its dismiss handler.
  }, [winAmount, betAmount, isTotalWin, multiplier, updateTierForAmount]);

  const cfg = TIER_CONFIGS[currentTier];

  return (
    <div
      onClick={handleClickOrSpace}
      className="win-celebration fixed inset-0 z-[85] flex flex-col items-center justify-center overflow-hidden p-3 sm:p-6 select-none"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(27,54,60,.5),rgba(1,6,12,.9)_70%)] backdrop-blur-[3px]" />
      <motion.div className="win-celebration__rays pointer-events-none absolute inset-[-30%]" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
      <div className="win-celebration__horizon pointer-events-none absolute inset-x-0 bottom-0 h-[28%]" />

      <motion.div
        key={`${currentTier}-${tierShake}`}
        initial={{ opacity: 0, y: 45, scale: .72, rotateX: 14 }}
        animate={{ opacity: 1, y: [0, -3, 0], scale: [1.04, .99, 1], rotateX: 0 }}
        transition={{ y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }, scale: { duration: .45, ease: 'easeOut' }, opacity: { duration: .25 }, rotateX: { duration: .45 } }}
        className="win-celebration__card relative z-10 flex w-[min(420px,calc(100vw-28px))] flex-col items-center overflow-hidden rounded-[28px] border border-amber-100/55 px-5 pb-5 pt-4 text-center sm:w-[min(520px,calc(100vw-48px))] sm:rounded-[36px] sm:px-9 sm:pb-8 sm:pt-7"
      >
        <div className="pointer-events-none absolute inset-x-[9%] top-0 h-px bg-gradient-to-r from-transparent via-amber-100 to-transparent" />
        <motion.div className="win-celebration__halo pointer-events-none absolute left-1/2 top-[-20%] h-64 w-64 -translate-x-1/2 rounded-full" animate={{ scale: [0.88, 1.1, 0.88], opacity: [.42, .78, .42] }} transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }} />

        <motion.div
          className="relative mb-1 h-[92px] w-[112px] sm:mb-2 sm:h-[138px] sm:w-[160px]"
          animate={{ y: [0, -7, 0], rotate: [-2, 2, -2], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image src={cfg.badgeAsset} alt="" fill sizes="160px" className="object-contain drop-shadow-[0_0_24px_rgba(255,190,75,.62)]" />
        </motion.div>

        <div className="relative z-10 flex flex-col items-center">
          <span className="mb-1 text-[8px] font-black tracking-[.32em] text-cyan-100/70 sm:text-[10px]">SEA RAIDER · VOYAGE COMPLETE</span>
          <h2 className="text-2xl font-black uppercase leading-none tracking-[.09em] text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_2px_12px_rgba(0,0,0,.95)] sm:text-4xl">
            {cfg.title}
          </h2>
          <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[.22em] text-amber-200/80 sm:mt-2 sm:text-xs">
            {cfg.sub}
          </span>
        </div>

        <div className="win-celebration__amount relative z-10 my-3 flex w-full flex-col items-center rounded-2xl px-3 py-3 sm:my-5 sm:rounded-3xl sm:py-4">
          <div className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_2px_14px_rgba(0,0,0,.95)] sm:text-6xl">
            {formatMoney(displayedWin, currency)}
          </div>
          {!isTotalWin && (
            <span className="mt-1 text-[10px] font-black tracking-[.18em] text-cyan-100/75 sm:text-sm">
              ({multiplier.toFixed(1)}x {toSocialText('Total Bet', isSocial)})
            </span>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <span className="text-[9px] font-black uppercase tracking-[.22em] text-amber-100 sm:text-xs">
            {isCountupFinished ? '[ TAP TO CONTINUE ]' : '[ TAP TO REVEAL ]'}
          </span>
          <span className="mt-1 text-[8px] text-slate-300/55">{toSocialText('The displayed total is the amount won.', isSocial)}</span>
        </div>
      </motion.div>
    </div>
  );
}
