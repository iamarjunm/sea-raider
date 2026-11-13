'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Swashbuckler from './Swashbuckler';
import { formatMoney } from '../../lib/currency';

export interface CaptainCameoState {
  id: number;
  amount: number;
  multiple: number;
}

interface CaptainCameoProps {
  cameo: CaptainCameoState | null;
  currency: string;
  /** Sit above the big-win celebration instead of behind the console. */
  elevated?: boolean;
}

const SHOUTS = [
  'Arr! Fine plunder!',
  'Haul it aboard!',
  'Treasure, me hearties!',
  'Now that be a prize!',
  'Gold on the deck!',
];

/** How long the cameo stays on screen (page.tsx clears it after this). */
export const CAMEO_DURATION_MS = 3200;

/**
 * When money is won the swashbuckler leaps up from the bottom-right corner (mirrored
 * to face the reels, clear of the Get Bonus and Turbo controls on the left), winds up
 * and cuts the air with his cutlass (twice for a big haul), shouts the prize, then
 * drops back out to the right.
 */
export default function CaptainCameo({ cameo, currency, elevated = false }: CaptainCameoProps) {
  return (
    <AnimatePresence>
      {cameo && (
        <motion.div
          key={cameo.id}
          className={`captain-cameo pointer-events-none fixed bottom-0 right-0 ${elevated ? 'z-[90]' : 'z-[15]'}`}
          initial={{ x: '70%', y: '35%', rotate: 14, opacity: 0 }}
          animate={{ x: '0%', y: '0%', rotate: 0, opacity: 1 }}
          exit={{ x: '75%', y: '40%', rotate: 16, opacity: 0, transition: { duration: 0.42, ease: [0.6, 0, 0.8, 0.4] } }}
          transition={{ type: 'spring', stiffness: 230, damping: 19, mass: 0.85 }}
          aria-hidden="true"
        >
          <Swashbuckler double={cameo.multiple >= 10} className="captain-cameo__figure" />
          <motion.div
            className="captain-cameo__shout"
            initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{ delay: 0.75, type: 'spring', stiffness: 420, damping: 18 }}
          >
            <span className="captain-cameo__line">{SHOUTS[cameo.id % SHOUTS.length]}</span>
            <span className="captain-cameo__amount tabular-nums">+{formatMoney(cameo.amount, currency)}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
