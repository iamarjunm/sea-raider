'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Anchor, Maximize2, ScrollText, X, Zap } from 'lucide-react';
import { toSocialText } from '../lib/currency';
import { MAX_RTP_PERCENT } from '../lib/slot-engine';

interface GameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPaytable: () => void;
  turboLevel: 0 | 1 | 2;
  onToggleTurbo: () => void;
  onToggleFullscreen: () => void;
  isSocial: boolean;
}

export default function GameMenuModal({
  isOpen,
  onClose,
  onOpenPaytable,
  turboLevel,
  onToggleTurbo,
  onToggleFullscreen,
  isSocial,
}: GameMenuModalProps) {
  const turboLabel = turboLevel === 2 ? 'Ultra' : turboLevel === 1 ? 'Turbo' : 'Off';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="captains-log"
          className="ship-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="captains-log-title"
        >
          <motion.div
            initial={{ scaleY: 0.08, opacity: 0, y: 24 }}
            animate={{ scaleY: 1, opacity: 1, y: 0 }}
            exit={{ scaleY: 0.08, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="ship-scroll relative w-full max-w-[520px]"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="ship-scroll__rod ship-scroll__rod--top" aria-hidden="true" />
            <div className="ship-dialog ship-dialog--scroll px-5 py-6 sm:px-8 sm:py-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ship-kicker">Sea Raider · Logbook</p>
                  <h2 id="captains-log-title" className="ship-heading mt-1 text-3xl sm:text-4xl">Captain&apos;s Log</h2>
                  <p className="ship-body mt-1 text-xs italic">Settings, rules &amp; the ship&apos;s particulars</p>
                </div>
                <button onClick={onClose} aria-label="Close captain's log" className="ship-seal-close">
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="ship-rule my-4" aria-hidden="true" />

              <ul className="flex flex-col gap-2.5">
                <li className="ship-entry">
                  <span className="ship-entry__icon"><Zap size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="ship-entry__title">Turbo spins</div>
                    <div className="ship-entry__note">Cycle Off, Turbo and Ultra speeds</div>
                  </div>
                  <button onClick={onToggleTurbo} className={`ship-toggle ${turboLevel > 0 ? 'is-on' : ''}`} aria-label={`Turbo: ${turboLabel}. Change speed`}>
                    {turboLabel}
                  </button>
                </li>
                <li className="ship-entry">
                  <span className="ship-entry__icon"><Maximize2 size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="ship-entry__title">Full screen</div>
                    <div className="ship-entry__note">Edge-to-edge voyage on the open sea</div>
                  </div>
                  <button onClick={onToggleFullscreen} className="ship-toggle">Toggle</button>
                </li>
                <li className="ship-entry">
                  <span className="ship-entry__icon"><ScrollText size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="ship-entry__title">{toSocialText('Paytable & rules', isSocial)}</div>
                    <div className="ship-entry__note">20 fixed paylines, symbol values &amp; bonus triggers</div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaytable();
                    }}
                    className="ship-button ship-button--small"
                  >
                    Read
                  </button>
                </li>
              </ul>

              <div className="ship-ledger mt-5 grid grid-cols-3 text-center">
                <div>
                  <div className="ship-ledger__label">Theoretical RTP</div>
                  <div className="ship-ledger__value">{MAX_RTP_PERCENT.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="ship-ledger__label">Volatility</div>
                  <div className="ship-ledger__value ship-ledger__value--red">Very high</div>
                </div>
                <div>
                  <div className="ship-ledger__label">Max win</div>
                  <div className="ship-ledger__value">50,000×</div>
                </div>
              </div>
              <p className="ship-body mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[.2em] opacity-70">
                <Anchor size={11} /> Fair winds, captain
              </p>
            </div>
            <span className="ship-scroll__rod ship-scroll__rod--bottom" aria-hidden="true" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
