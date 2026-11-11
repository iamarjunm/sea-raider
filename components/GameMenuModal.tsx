'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-[540px] bg-gradient-to-b from-[#1c130b] via-[#120b06] to-[#0a0503] rounded-3xl border-2 border-amber-600/80 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-5 sm:p-7 flex flex-col gap-5 text-white"
        >
          {/* Filigree Corner Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400 pointer-events-none rounded-tl" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400 pointer-events-none rounded-tr" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400 pointer-events-none rounded-bl" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400 pointer-events-none rounded-br" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl text-amber-400">📜</span>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-widest uppercase text-amber-300 drop-shadow-md">
                  CAPTAIN&apos;S LOG &amp; SETTINGS
                </h2>
                <p className="text-[10px] sm:text-xs text-amber-200/60 font-semibold">
                  Game controls, statistics &amp; rules
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-amber-950/60 hover:bg-amber-800 border border-amber-600/60 flex items-center justify-center text-amber-200 hover:text-white transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Quick Options */}
          <div className="flex flex-col gap-3">
            {/* Turbo Spin Option */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <span className="text-lg text-amber-400">⚡</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-100">TURBO SPINS</div>
                  <div className="text-[10px] text-amber-200/60">Cycles through Off, Turbo, and Ultra Turbo speeds</div>
                </div>
              </div>
              <button
                onClick={onToggleTurbo}
                className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                  turboLevel > 0
                    ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                    : 'bg-black/60 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {turboLevel === 2 ? 'ULTRA' : turboLevel === 1 ? 'TURBO' : 'OFF'}
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <span className="text-lg text-amber-400">⛶</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-100">FULLSCREEN MODE</div>
                  <div className="text-[10px] text-amber-200/60">Immersive edge-to-edge ocean voyage</div>
                </div>
              </div>
              <button
                onClick={onToggleFullscreen}
                className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-950/80 hover:bg-amber-800 border border-amber-600/70 text-amber-200 hover:text-white transition-all cursor-pointer"
              >
                TOGGLE
              </button>
            </div>

            {/* Paytable & Rules Button */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <span className="text-lg text-amber-400">⚓</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-100">
                    {toSocialText('PAYTABLE & RULES', isSocial)}
                  </div>
                  <div className="text-[10px] text-amber-200/60">20 fixed paylines, symbol values &amp; bonus triggers</div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenPaytable();
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black border border-amber-300 shadow-md transition-all cursor-pointer"
              >
                VIEW
              </button>
            </div>
          </div>

          {/* Session Statistics Overview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black/60 to-amber-950/40 border border-amber-600/30 flex items-center justify-between text-center">
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-wider text-amber-300/70 font-black">THEORETICAL RTP</div>
              <div className="text-xs sm:text-sm font-black text-amber-200 mt-0.5">{MAX_RTP_PERCENT.toFixed(2)}%</div>
            </div>
            <div className="w-px h-7 bg-amber-800/60" />
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-wider text-amber-300/70 font-black">VOLATILITY</div>
              <div className="text-xs sm:text-sm font-black text-red-400 mt-0.5">VERY HIGH ⚡</div>
            </div>
            <div className="w-px h-7 bg-amber-800/60" />
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-wider text-amber-300/70 font-black">MAX WIN</div>
              <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">50,000x (Ethereal)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
