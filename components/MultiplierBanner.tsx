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
  const isSurge = multiplier > 1;
  const formattedMultiplier = new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 5,
  }).format(multiplier);

  return (
    <div
      className={`game-multiplier-banner relative aspect-[1304/500] select-none flex items-center justify-center ${
        isSurge ? 'game-multiplier-banner--surge' : ''
      } ${isBonusActive ? 'game-multiplier-banner--bonus' : ''}`}
    >
      {/* Bespoke Pirate Cannons, Flintlocks & Gold Filigree Plaque Asset */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/sea-raider/ui/multiplier-banner-frame.png"
          alt="Game Multiplier Frame"
          fill
          priority
          unoptimized
          sizes="340px"
          className="object-contain"
        />
      </div>

      {/* Central Carved Mahogany Plaque Content (strictly bounded within the 25.5%..74.5% x 29.5%..70.5% wooden recess) */}
      <div className="game-multiplier-banner__inner absolute left-[25.5%] right-[25.5%] top-[29.5%] bottom-[29.5%] z-10 flex flex-col items-center justify-center overflow-hidden text-center">
        {/* Crisp Engraved Label */}
        <span className="game-multiplier-banner__label">
          {label}
        </span>

        {/* Mechanical Drum Roll Value (No blurry text filters) */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${isBonusActive ? rollId : 0}-${multiplier}`}
            initial={{ y: '-90%', opacity: 0 }}
            animate={{
              y: '0%',
              opacity: 1,
              scale: rollCue === 'rise' ? [0.92, 1.14, 1] : 1,
            }}
            exit={{ y: '90%', opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="game-multiplier-banner__value-wrap relative flex items-center justify-center"
            title={`${multiplier}×`}
            aria-label={`${isBonusActive ? 'Bonus multiplier' : 'Game multiplier'} ${multiplier} times`}
          >
            <span
              className={`game-multiplier-banner__value tabular-nums ${
                isSurge ? 'is-surge' : ''
              }`}
            >
              {formattedMultiplier}×
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bonus Roll Status Micro-Plate — pinned on the lower brass rim only when active */}
      <AnimatePresence mode="wait">
        {isBonusActive && rollCue && (
          <motion.span
            key={`${rollId}-${rollCue}`}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`game-multiplier-banner__cue game-multiplier-banner__cue--${rollCue} absolute bottom-[12%] left-1/2 -translate-x-1/2 z-20`}
          >
            {rollCue === 'rise'
              ? '▲ RISING'
              : rollCue === 'hold'
              ? '◆ LOCKED'
              : '★ START'}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
