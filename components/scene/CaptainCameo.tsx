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
export const CAMEO_DURATION_MS = 3800;

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
          initial={{ x: '68%', y: '32%', scaleX: 0.92, scaleY: 0.88, rotate: 15, opacity: 0 }}
          animate={{ x: '0%', y: '0%', scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 }}
          exit={{
            x: ['0%', '-4%', '78%'],
            y: ['0%', '4%', '38%'],
            rotate: [0, -4, 16],
            opacity: [1, 1, 0],
            transition: { duration: 0.44, times: [0, 0.22, 1], ease: [0.55, 0, 0.85, 0.35] },
          }}
          transition={{ duration: 0.46, ease: [0.22, 1.28, 0.36, 1] }}
          aria-hidden="true"
        >
          <Swashbuckler variant="cameo" double={cameo.multiple >= 10} delay={0.18} className="captain-cameo__figure" />
          <motion.div
            className="captain-cameo__shout"
            initial={{ scale: 0.4, y: 12, opacity: 0, rotate: -9 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotate: -3 }}
            transition={{ delay: 0.62, duration: 0.38, ease: [0.22, 1.35, 0.36, 1] }}
          >
            <span className="captain-cameo__line">{SHOUTS[cameo.id % SHOUTS.length]}</span>
            <span className="captain-cameo__amount tabular-nums">+{formatMoney(cameo.amount, currency)}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
