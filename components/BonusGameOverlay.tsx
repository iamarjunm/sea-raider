'use client';

import React from 'react';
import { toSocialText } from '../lib/currency';

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
  spinsRemaining,
  totalSpins,
  currentMultiplier,
  isSocial,
  retriggerSpins,
  finale = false,
}: BonusGameOverlayProps) {
  return (
    <div className="bonus-game-overlay absolute bottom-[105px] sm:bottom-[130px] md:bottom-[150px] inset-x-0 z-30 flex items-center justify-center pointer-events-none px-4">
      <div className="bonus-game-overlay__plaque flex items-center gap-3 sm:gap-5">
        <span className="bonus-game-overlay__rivet bonus-game-overlay__rivet--tl" aria-hidden="true" />
        <span className="bonus-game-overlay__rivet bonus-game-overlay__rivet--tr" aria-hidden="true" />
        <span className="bonus-game-overlay__rivet bonus-game-overlay__rivet--bl" aria-hidden="true" />
        <span className="bonus-game-overlay__rivet bonus-game-overlay__rivet--br" aria-hidden="true" />

        {/* Spins count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="bonus-game-overlay__label">
            {finale ? 'WILD SURGE' : `${toSocialText('FREE SPINS', isSocial)}:`}
          </span>
          <span className="bonus-game-overlay__value tabular-nums">
            {finale ? 'FINAL SPIN' : `${spinsRemaining} / ${totalSpins}`}
          </span>
        </div>

        {/* Retrigger Alert */}
        {retriggerSpins > 0 && (
          <div className="bonus-game-overlay__retrigger">
            +{retriggerSpins} SPINS!
          </div>
        )}

        {/* Multiplier if active */}
        {currentMultiplier > 1 && (
          <div className="flex items-center gap-1.5 border-l border-[#c8963f]/35 pl-3 sm:pl-4">
            <span className="bonus-game-overlay__label">MULTIPLIER:</span>
            <span className="bonus-game-overlay__mult tabular-nums">
              {currentMultiplier}×
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
