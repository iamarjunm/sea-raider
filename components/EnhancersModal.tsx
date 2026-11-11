'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { PlayMode, MODE_CONFIGS } from '../lib/slot-engine';
import { formatMoney, toSocialText } from '../lib/currency';
import StudioCardFrame from './common/StudioCardFrame';

interface EnhancersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: PlayMode;
  onSelectMode: (mode: PlayMode) => void;
  betLevel: number;
  currency: string;
  isSocial: boolean;
}

interface CustomCardDef {
  mode: PlayMode;
  title: string;
  multiplierBadge: string;
  subtitle: string;
  themeColor: string; // Tailwind border / glow
  accentGradient: string; // Tailwind bg
  odds: { label: string; value: string; highlight?: boolean }[];
  type: 'enhancer';
}

const CUSTOM_CARDS: CustomCardDef[] = [
  {
    mode: 'bonus_chance',
    title: 'BONUS CHANCE',
    multiplierBadge: '1.5×',
    subtitle: 'SCATTER OUTCOMES WHEN FEATURE TRIGGERS',
    themeColor: 'border-teal-400 shadow-[0_0_35px_rgba(45,212,191,0.5)]',
    accentGradient: 'from-[#0b2421] via-[#041412] to-[#020b0a]',
    odds: [
      { label: '3 SCATTER', value: '~ 60%' },
      { label: '4 SCATTER', value: '~ 30%' },
      { label: '5 SCATTER', value: '~ 10%' },
    ],
    type: 'enhancer',
  },
  {
    mode: 'super_bonus',
    title: 'SUPER BONUS CHANCE',
    multiplierBadge: '5×',
    subtitle: 'SCATTER OUTCOMES WHEN FEATURE TRIGGERS',
    themeColor: 'border-purple-400 shadow-[0_0_35px_rgba(192,132,252,0.5)]',
    accentGradient: 'from-[#200b33] via-[#120420] to-[#08020e]',
    odds: [
      { label: '3 SCATTER', value: '~ 45%' },
      { label: '4 SCATTER', value: '~ 40%' },
      { label: '5 SCATTER', value: '~ 15%' },
    ],
    type: 'enhancer',
  },
  {
    mode: 'pirates_chance',
    title: "PIRATES' CHANCE",
    multiplierBadge: '25×',
    subtitle: 'SCATTER OUTCOMES WHEN FEATURE TRIGGERS',
    themeColor: 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.55)]',
    accentGradient: 'from-[#330c0c] via-[#1a0505] to-[#0a0202]',
    odds: [
      { label: '3 SCATTER', value: '~ 15%' },
      { label: '4 SCATTER', value: '~ 25%' },
      { label: '5 SCATTER', value: '~ 60%', highlight: true },
    ],
    type: 'enhancer',
  },
  {
    mode: 'feature_spin',
    title: 'FEATURE SPIN',
    multiplierBadge: '10×',
    subtitle: 'WILD SURGE FEATURE · GUARANTEED WILD',
    themeColor: 'border-blue-400 shadow-[0_0_35px_rgba(96,165,250,0.5)]',
    accentGradient: 'from-[#081a33] via-[#040e1f] to-[#020710]',
    odds: [
      { label: 'WILD SURGE', value: '100% Guaranteed', highlight: true },
      { label: 'MULTIPLIER', value: 'Up to 10x' },
      { label: 'OUTCOME', value: 'Instant Round' },
    ],
    type: 'enhancer',
  },
  {
    mode: 'unknown_bonus',
    title: 'UNKNOWN BONUS',
    multiplierBadge: '250×',
    subtitle: '100% FEATURE GUARANTEED',
    themeColor: 'border-fuchsia-400 shadow-[0_0_40px_rgba(232,121,249,0.55)]',
    accentGradient: 'from-[#2a0833] via-[#18031e] to-[#09010c]',
    odds: [
      { label: '3 SCATTER', value: '~ 52.0%' },
      { label: '4 SCATTER', value: '~ 36.9%' },
      { label: '5 SCATTER', value: '~ 11.0%' },
      { label: 'ETHEREAL (6 SCAT)', value: '~ 0.1%', highlight: true },
    ],
    type: 'enhancer',
  },
  {
    mode: 'unknown_extreme',
    title: 'UNKNOWN EXTREME',
    multiplierBadge: '500×',
    subtitle: 'MYSTERY OUTCOME DISTRIBUTION',
    themeColor: 'border-cyan-400 shadow-[0_0_45px_rgba(34,211,238,0.6)]',
    accentGradient: 'from-[#04282c] via-[#02171a] to-[#01090a]',
    odds: [
      { label: 'NO FEATURE', value: '~ 85.0%' },
      { label: 'HIDDEN BONUS (5 SCAT)', value: '~ 13.0%', highlight: true },
      { label: 'ETHEREAL BONUS (6 SCAT)', value: '~ 2.0%', highlight: true },
    ],
    type: 'enhancer',
  },
];

const FEATURE_ART: Record<PlayMode, { src: string; label: string }> = {
  base: { src: '/assets/sea-raider/scatter.png', label: 'Galleon' },
  bonus_chance: { src: '/assets/sea-raider/scatter.png', label: 'Galleon' },
  super_bonus: { src: '/assets/sea-raider/compass.png', label: 'Compass' },
  pirates_chance: { src: '/assets/sea-raider/captain.png', label: 'Captain' },
  feature_spin: { src: '/assets/sea-raider/wild.png', label: 'Wild crest' },
  unknown_bonus: { src: '/assets/sea-raider/treasure-chest.png', label: 'Treasure chest' },
  unknown_extreme: { src: '/assets/sea-raider/wild.png', label: 'Wild crest' },
};

export default function EnhancersModal({
  isOpen,
  onClose,
  activeMode,
  onSelectMode,
  betLevel,
  currency,
  isSocial,
}: EnhancersModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(false);
  const [confirmBuyMode, setConfirmBuyMode] = useState<PlayMode | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsCompactViewport(media.matches);
    update();
    const handleChange = () => {
      setCurrentPage(0);
      update();
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  if (!isOpen) return null;

  const cardsPerPage = isCompactViewport ? 1 : 3;
  const totalPages = Math.ceil(CUSTOM_CARDS.length / cardsPerPage);
  const currentCards = CUSTOM_CARDS.slice(currentPage * cardsPerPage, currentPage * cardsPerPage + cardsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleCardClick = (mode: PlayMode) => {
    const config = MODE_CONFIGS[mode];
    if (activeMode === mode) {
      onSelectMode('base');
      onClose();
      return;
    }
    if (config.costMultiplier > 2) {
      setConfirmBuyMode(mode);
    } else {
      onSelectMode(mode);
      onClose();
    }
  };

  const handleConfirmPurchase = () => {
    if (!confirmBuyMode) return;
    onSelectMode(confirmBuyMode);
    setConfirmBuyMode(null);
    onClose();
  };

  return (
    <div className="bonus-modal fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-6 select-none animate-fadeIn bg-slate-950/75">
      {/* Feature mode selector heading */}
      <div className="relative w-full flex items-center justify-between z-30 pt-1 sm:pt-3">
        <div className="w-12 sm:w-16" />

        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-black text-slate-100 tracking-tight">
            {toSocialText('FEATURE MODES', isSocial)}
          </h1>
          <p className="text-[9px] sm:text-sm text-slate-400 font-medium tracking-wide mt-0.5 uppercase">
            {toSocialText('Choose a mode once, then spin or run autoplay at its cost per spin', isSocial)}
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label={toSocialText('Close Buy Bonus', isSocial)}
          className="relative w-9 h-9 sm:w-14 sm:h-14 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        >
          <Image
            src="/assets/aistudio/x_f55ae377.webp"
            alt="Close"
            fill
            priority
            sizes="56px"
            className="object-contain"
          />
        </button>
      </div>

      {/* Center Carousel: Left Arrow + 3 Custom Cards + Right Arrow */}
      <div className="bonus-carousel relative w-full max-w-7xl mx-auto my-auto z-20 flex items-center justify-center gap-2 sm:gap-6 px-2">
        {/* Left Arrow Button */}
        <button
          onClick={handlePrevPage}
          aria-label="Previous Cards"
          className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-lg sm:text-2xl font-bold transition-all cursor-pointer z-30"
        >
          ❮
        </button>

        {/* 3 Custom Cards Visible at a Time */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 md:gap-8 items-center justify-center">
          <AnimatePresence mode="popLayout">
            {currentCards.map((card, idx) => {
              const config = MODE_CONFIGS[card.mode];
              const isCardActive = activeMode === card.mode;
              const cost = betLevel * config.costMultiplier;

              return (
                <motion.div
                  key={card.mode}
                  data-mode={card.mode}
                  initial={{ opacity: 0, scale: 0.88, y: 25 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -25 }}
                  transition={{ duration: 0.28, delay: idx * 0.05 }}
                  onClick={() => handleCardClick(card.mode)}
                  className={`bonus-card-item group relative flex flex-col items-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    isCardActive ? 'scale-[1.02]' : ''
                  }`}
                >
                  {/* Active Indicator Badge */}
                  {isCardActive && (
                    <div className="absolute -top-3.5 z-30 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs sm:text-sm rounded-full shadow-[0_0_20px_#10b981] animate-bounce">
                      ACTIVE
                    </div>
                  )}

                  {/* Original in-game card art keeps the buy screen coherent with Sea Raider. */}
                  <StudioCardFrame
                    tint={card.mode === 'unknown_bonus' ? 'rgba(80, 8, 80, .34)' : card.mode === 'unknown_extreme' ? 'rgba(0, 95, 105, .32)' : card.mode === 'feature_spin' ? 'rgba(0, 60, 110, .3)' : 'rgba(2, 35, 42, .3)'}
                    className={`studio-buy-card relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[370px] min-h-[250px] sm:min-h-[310px] rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${card.accentGradient} border ${
                      isCardActive
                        ? 'border-amber-300 ring-2 ring-amber-400/50 shadow-xl'
                        : 'border-slate-700 hover:border-slate-500 shadow-lg'
                    }`}
                  >
                    <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-amber-200/20 bg-amber-300/10 blur-[1px]" />
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="feature-card-art relative h-12 w-12 sm:h-[58px] sm:w-[58px]">
                          <Image src={FEATURE_ART[card.mode].src} alt={FEATURE_ART[card.mode].label} fill sizes="58px" className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,.65)]" />
                        </div>
                        <div className="text-left"><div className="text-[8px] font-black tracking-[.2em] text-cyan-100/65">SEA RAIDER · FEATURE</div><div className="mt-1 text-[9px] font-bold tracking-wider text-amber-100/65">{FEATURE_ART[card.mode].label.toUpperCase()}</div></div>
                      </div>
                      <span className="rounded-full border border-amber-100/35 bg-black/45 px-2.5 py-1 text-xs font-black text-amber-100">{card.multiplierBadge}</span>
                    </div>
                    <div className="relative mt-2 text-center">
                      <div className="text-base sm:text-xl font-black tracking-widest text-white">{card.title}</div>
                      <div className="mt-1 text-[9px] sm:text-[10px] font-bold tracking-[.18em] text-amber-200/75">{card.subtitle}</div>
                    </div>
                    <div className="relative my-2 space-y-1 rounded-xl border border-white/10 bg-black/35 p-2">
                      {card.odds.map((item) => <div key={item.label} className="flex justify-between gap-2 text-[9px] sm:text-[10px]"><span className="text-slate-300">{item.label}</span><span className={item.highlight ? 'font-black text-amber-300' : 'font-bold text-white'}>{item.value}</span></div>)}
                    </div>
                    <div className="relative flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          {toSocialText('Activation cost', isSocial)}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-amber-400 px-2 py-1 text-xs sm:text-sm font-bold text-slate-950">
                        {formatMoney(cost, currency)}
                      </span>
                    </div>
                  </StudioCardFrame>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleNextPage}
          aria-label="Next Cards"
          className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-lg sm:text-2xl font-bold transition-all cursor-pointer z-30"
        >
          ❯
        </button>
      </div>

      {/* Bottom Carousel Indicator Dots */}
      <div className="relative z-20 flex items-center justify-center gap-2 pb-2">
        {Array.from({ length: totalPages }).map((_, pIdx) => (
          <button
            key={pIdx}
            onClick={() => setCurrentPage(pIdx)}
            aria-label={`Page ${pIdx + 1}`}
            className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
              currentPage === pIdx
                ? 'bg-amber-400 w-8 shadow-[0_0_12px_rgba(245,158,11,0.9)]'
                : 'bg-amber-900/60 hover:bg-amber-700'
            }`}
          />
        ))}
      </div>

      {/* Confirmation Dialog for modes costing more than 2x base bet */}
      {confirmBuyMode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-[420px] rounded-3xl bg-gradient-to-b from-[#1c130b] via-[#120b06] to-[#0a0503] border-2 border-amber-500 p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.95)]">
            <h3 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide uppercase drop-shadow-md">
              CONFIRM FEATURE MODE
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              {toSocialText('Are you sure you want to start', isSocial)}{' '}
              <span className="text-amber-300 font-black">
                {MODE_CONFIGS[confirmBuyMode].name}
              </span>{' '}
              {toSocialText('for', isSocial)}{' '}
              <span className="text-emerald-400 font-black">
                {formatMoney(
                  betLevel * MODE_CONFIGS[confirmBuyMode].costMultiplier,
                  currency
                )}
              </span>
              ?
            </p>

            <div className="flex items-center gap-4 mt-6 w-full">
              <button
                onClick={() => setConfirmBuyMode(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                CONFIRM &amp; ACTIVATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
