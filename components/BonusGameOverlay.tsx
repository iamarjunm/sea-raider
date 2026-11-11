'use client';

import React from 'react';
import { formatMoney, toSocialText } from '../lib/currency';

interface BonusGameOverlayProps {
  bonusType: 'curse' | 'ghost' | 'legend' | 'ethereal';
  spinsRemaining: number;
  totalSpins: number;
  currentMultiplier: number;
  totalAccumulatedWin: number;
  currency: string;
  isSocial: boolean;
  retriggerSpins: number;
  finale?: boolean;
}

export default function BonusGameOverlay({
  bonusType,
  spinsRemaining,
  totalSpins,
  currentMultiplier,
  totalAccumulatedWin,
  currency,
  isSocial,
  retriggerSpins,
  finale = false,
}: BonusGameOverlayProps) {
  return (
    <div className="absolute bottom-[105px] sm:bottom-[130px] md:bottom-[150px] inset-x-0 z-30 flex items-center justify-center pointer-events-none px-4">
      <div className="px-5 py-1.5 sm:px-8 sm:py-2 rounded-full bg-black/85 border-2 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.7)] flex items-center gap-3 sm:gap-6 animate-pulse backdrop-blur-sm">
        {/* Spins count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-amber-200 uppercase font-black tracking-wider">
            {finale ? 'WILD SURGE' : `${toSocialText('FREE SPINS', isSocial)}:`}
          </span>
          <span className="text-sm sm:text-lg font-black text-white tracking-widest">
            {finale ? 'FINAL SPIN' : `${spinsRemaining} / ${totalSpins}`}
          </span>
        </div>

        {/* Retrigger Alert */}
        {retriggerSpins > 0 && (
          <div className="px-2.5 py-0.5 bg-yellow-400 text-black font-black text-[10px] sm:text-xs rounded-full animate-bounce">
            +{retriggerSpins} SPINS!
          </div>
        )}

        {/* Multiplier if active */}
        {currentMultiplier > 1 && (
          <div className="flex items-center gap-1 border-l border-amber-400/40 pl-3 sm:pl-5">
            <span className="text-[10px] sm:text-xs text-amber-200 uppercase font-black">
              MULTIPLIER:
            </span>
            <span className="text-sm sm:text-lg font-black text-amber-400">
              {currentMultiplier}x
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
