'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LivingCaptain from './LivingCaptain';
import { formatMoney } from '../../lib/currency';

export interface CaptainCameoState {
  id: number;
  amount: number;
  multiple: number;
}

interface CaptainCameoProps {
  cameo: CaptainCameoState | null;
  currency: string;
}

const SHOUTS = [
  'Arr! Fine plunder!',
  'Haul it aboard!',
  'Treasure, me hearties!',
  'Now that be a prize!',
  'Gold on the deck!',
];

/**
 * On a decent win the captain swings up from the bottom-left corner, sword raised,
 * shouts the haul, then ducks back below deck.
 */
export default function CaptainCameo({ cameo, currency }: CaptainCameoProps) {
  return (
    <AnimatePresence>
      {cameo && (
        <motion.div
          key={cameo.id}
          className="captain-cameo pointer-events-none fixed bottom-0 left-0 z-[15]"
          initial={{ x: '-75%', y: '28%', rotate: -10, opacity: 0 }}
          animate={{ x: '-6%', y: '4%', rotate: 0, opacity: 1 }}
          exit={{ x: '-80%', y: '30%', rotate: -12, opacity: 0, transition: { duration: 0.45, ease: [0.6, 0, 0.8, 0.4] } }}
          transition={{ type: 'spring', stiffness: 170, damping: 17, mass: 0.9 }}
          aria-hidden="true"
        >
          <LivingCaptain isStriking className="captain-cameo__figure" />
          <motion.div
            className="captain-cameo__shout"
            initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{ delay: 0.28, type: 'spring', stiffness: 420, damping: 18 }}
          >
            <span className="captain-cameo__line">{SHOUTS[cameo.id % SHOUTS.length]}</span>
            <span className="captain-cameo__amount tabular-nums">+{formatMoney(cameo.amount, currency)}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
