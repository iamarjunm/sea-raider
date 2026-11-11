'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface MultiplierBannerProps {
  multiplier: number;
  label?: string;
  isBonusActive?: boolean;
  rollId?: number;
  rollCue?: 'start' | 'rise' | 'hold' | null;
}

export default function MultiplierBanner({
  multiplier,
  label = 'WIN MULTIPLIER',
  isBonusActive = false,
  rollId = 0,
  rollCue = null,
}: MultiplierBannerProps) {
  // If in base game and multiplier is 1x, we can show subtle 1x or feature surge
  const isSurge = multiplier > 1;
  const formattedMultiplier = new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 5,
  }).format(multiplier);

  return (
    <div className="relative w-36 sm:w-48 md:w-56 aspect-[1774/887] select-none flex items-center justify-center drop-shadow-[0_8px_25px_rgba(0,0,0,0.85)]">
      {/* Background Pirate Skull & Scimitars Component Frame */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/aistudio/image_5a86e7dd.webp"
          alt="Multiplier Frame"
          fill
          priority
          sizes="256px"
          className={`object-contain transition-all duration-300 ${
            isSurge ? 'filter drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]' : ''
          }`}
        />
      </div>

      {/* Central Plaque Content */}
      <div className="relative z-10 w-[66%] h-[60%] mt-[4%] flex flex-col items-center justify-center overflow-hidden text-center">
        {/* Subtle Label */}
        <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-amber-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {label}
        </span>

        {/* Each saved bonus value rolls into the plaque, including a HOLD. */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${isBonusActive ? rollId : 0}-${multiplier}`}
            initial={{ y: '-115%', opacity: 0.15, filter: 'blur(4px)', rotateX: 32 }}
            animate={{ y: '0%', opacity: 1, filter: 'blur(0px)', rotateX: 0 }}
            exit={{ y: '115%', opacity: 0, filter: 'blur(4px)', rotateX: -24 }}
            transition={{ duration: 0.64, ease: [0.18, 0.78, 0.22, 1] }}
            className="relative flex h-7 items-baseline justify-center sm:h-9"
            title={`${multiplier}×`}
            aria-label={`${isBonusActive ? 'Bonus multiplier' : 'Game multiplier'} ${multiplier} times`}
          >
            <span
              className={`text-base sm:text-xl md:text-2xl font-black tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
                isSurge
                  ? 'bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-600 bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                  : 'text-amber-100'
              }`}
            >
              {formattedMultiplier}X
            </span>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {isBonusActive && rollCue && (
            <motion.span
              key={`${rollId}-${rollCue}`}
              initial={{ opacity: 0, y: -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`mt-0.5 rounded-full border px-1.5 py-[1px] text-[6px] font-black leading-none tracking-[.16em] sm:text-[7px] ${
                rollCue === 'rise'
                  ? 'border-emerald-300/60 bg-emerald-950/80 text-emerald-200 shadow-[0_0_8px_rgba(52,211,153,.4)]'
                  : rollCue === 'hold'
                    ? 'border-amber-100/35 bg-black/65 text-amber-100/75'
                    : 'border-cyan-200/45 bg-cyan-950/70 text-cyan-100'
              }`}
            >
              {rollCue === 'rise' ? '↑ RISE' : rollCue === 'hold' ? '— HOLD' : 'BONUS START'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
