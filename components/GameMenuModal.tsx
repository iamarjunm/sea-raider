'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Anchor, Compass, Maximize2, ScrollText, X, Zap } from 'lucide-react';
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
          className="hud-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="captains-log-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 14, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="hud-cabinet hud-menu w-full max-w-[490px]"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="hud-cabinet__bracket hud-cabinet__bracket--tl" aria-hidden="true" />
            <span className="hud-cabinet__bracket hud-cabinet__bracket--tr" aria-hidden="true" />
            <span className="hud-cabinet__bracket hud-cabinet__bracket--bl" aria-hidden="true" />
            <span className="hud-cabinet__bracket hud-cabinet__bracket--br" aria-hidden="true" />

            <header className="hud-autoplay__header">
              <div className="hud-autoplay__badge" aria-hidden="true">
                <Compass size={18} strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="hud-kicker">SEA RAIDER · BRIDGE CONTROLS</p>
                <h2 id="captains-log-title" className="hud-title">
                  Captain&apos;s Log
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close captain's log"
                className="hud-close-btn"
              >
                <X size={17} strokeWidth={2.6} />
              </button>
            </header>

            <div className="hud-autoplay__body">
              <ul className="flex flex-col gap-2.5">
                <li className="hud-menu-row">
                  <span className="hud-menu-row__icon">
                    <Zap size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="hud-menu-row__title">Turbo Spins</div>
                    <div className="hud-menu-row__sub">Cycle Off, Turbo and Ultra speeds</div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTurbo}
                    className={`hud-action-pill ${turboLevel > 0 ? 'is-active' : ''}`}
                    aria-label={`Turbo: ${turboLabel}. Change speed`}
                  >
                    {turboLabel}
                  </button>
                </li>

                <li className="hud-menu-row">
                  <span className="hud-menu-row__icon">
                    <Maximize2 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="hud-menu-row__title">Full Screen</div>
                    <div className="hud-menu-row__sub">Edge-to-edge voyage on the open sea</div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className="hud-action-pill"
                  >
                    Toggle
                  </button>
                </li>

                <li className="hud-menu-row">
                  <span className="hud-menu-row__icon">
                    <ScrollText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="hud-menu-row__title">
                      {toSocialText('Paytable & Rules', isSocial)}
                    </div>
                    <div className="hud-menu-row__sub">
                      20 fixed paylines, symbol values &amp; bonus triggers
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPaytable();
                    }}
                    className="hud-action-pill is-gold"
                  >
                    Open
                  </button>
                </li>
              </ul>

              <div className="hud-summary-strip mt-1">
                <div className="hud-summary-strip__cell">
                  <span className="hud-summary-strip__label">THEORETICAL RTP</span>
                  <strong className="hud-summary-strip__value text-[#4de2d1] tabular-nums">
                    {MAX_RTP_PERCENT.toFixed(2)}%
                  </strong>
                </div>
                <div className="hud-summary-strip__cell text-center">
                  <span className="hud-summary-strip__label">VOLATILITY</span>
                  <strong className="hud-summary-strip__value text-[#ff9d8a]">
                    Very High
                  </strong>
                </div>
                <div className="hud-summary-strip__cell text-right">
                  <span className="hud-summary-strip__label">MAX WIN</span>
                  <strong className="hud-summary-strip__value text-[#f2c464] tabular-nums">
                    50,000×
                  </strong>
                </div>
              </div>

              <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9eb0b5]/75">
                <Anchor size={11} className="text-[#c9a460]" /> Fair winds, captain
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
