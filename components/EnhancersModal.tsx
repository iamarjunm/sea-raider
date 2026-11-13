'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { PlayMode, MODE_CONFIGS } from '../lib/slot-engine';
import { formatMoney, toSocialText } from '../lib/currency';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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
    multiplierBadge: '3×',
    subtitle: '5% FEATURE TRIGGER · SCATTER MIX ON TRIGGER',
    themeColor: 'border-teal-400 shadow-[0_0_35px_rgba(45,212,191,0.5)]',
    accentGradient: 'from-[#0b2421] via-[#041412] to-[#020b0a]',
    odds: [
      { label: '3 SCATTER', value: '99%' },
      { label: '4 SCATTER', value: '0.8%' },
      { label: '5 SCATTER', value: '0.2%' },
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

const MODE_ACCENT: Partial<Record<PlayMode, string>> = {
  bonus_chance: '#2ccfd1',
  super_bonus: '#a77bff',
  pirates_chance: '#e2483b',
  feature_spin: '#4f9dff',
  unknown_bonus: '#e26bf0',
  unknown_extreme: '#36dcef',
};

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

  const accentFor = (mode: PlayMode) => MODE_ACCENT[mode] ?? '#2ccfd1';

  return (
    <div className="bonus-modal feature-harbor fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-6 select-none">
      {/* Heading */}
      <div className="relative w-full flex items-center justify-between z-30 pt-1 sm:pt-2">
        <div className="w-10 sm:w-14" />

        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="feature-harbor__kicker">{toSocialText('Choose your voyage', isSocial)}</p>
          <h1 className="feature-harbor__title">{toSocialText('Feature Modes', isSocial)}</h1>
          <p className="feature-harbor__sub">
            {toSocialText('Pick a mode once, then spin or run autoplay at its cost per spin', isSocial)}
          </p>
        </motion.div>

        <button onClick={onClose} aria-label={toSocialText('Close Buy Bonus', isSocial)} className="ship-seal-close ship-seal-close--large">
          <X size={22} strokeWidth={3} />
        </button>
      </div>

      {/* Carousel */}
      <div className="bonus-carousel relative w-full max-w-7xl mx-auto my-auto z-20 flex items-center justify-center gap-2 sm:gap-6 px-1 sm:px-2">
        <button onClick={handlePrevPage} aria-label="Previous Cards" className="brass-arrow">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 md:gap-8 items-stretch justify-center">
          <AnimatePresence mode="popLayout">
            {currentCards.map((card, idx) => {
              const config = MODE_CONFIGS[card.mode];
              const isCardActive = activeMode === card.mode;
              const cost = betLevel * config.costMultiplier;
              const accent = accentFor(card.mode);

              return (
                <motion.div
                  key={card.mode}
                  data-mode={card.mode}
                  initial={{ opacity: 0, y: 30, rotate: idx % 2 ? 1.5 : -1.5 }}
                  animate={{ opacity: 1, y: 0, rotate: idx === 1 ? 0.4 : idx === 0 ? -0.8 : 0.9 }}
                  exit={{ opacity: 0, y: -24 }}
                  whileHover={{ y: -8, rotate: 0, scale: 1.025 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30, delay: idx * 0.04 }}
                  onClick={() => handleCardClick(card.mode)}
                  className={`bounty-card group relative flex cursor-pointer flex-col ${isCardActive ? 'bounty-card--active' : ''}`}
                  style={{ '--accent': accent } as React.CSSProperties}
                >
                  <span className="bounty-card__pin" aria-hidden="true" />
                  <span className="bounty-card__seal" aria-label={`${config.costMultiplier} times the base bet`}>{card.multiplierBadge}</span>
                  {isCardActive && <span className="bounty-card__active">ACTIVE</span>}

                  <div className="bounty-card__porthole">
                    <span className="bounty-card__porthole-glow" aria-hidden="true" />
                    <div className="bounty-card__art">
                      <Image src={FEATURE_ART[card.mode].src} alt={FEATURE_ART[card.mode].label} fill sizes="120px" className="object-contain" />
                    </div>
                  </div>

                  <div className="bounty-card__title">{card.title}</div>
                  <div className="bounty-card__subtitle">{card.subtitle}</div>

                  <ul className="bounty-card__ledger">
                    {card.odds.map((item) => (
                      <li key={item.label} className={item.highlight ? 'is-highlight' : ''}>
                        <span>{item.label}</span>
                        <i aria-hidden="true" />
                        <b>{item.value}</b>
                      </li>
                    ))}
                  </ul>

                  <div className="bounty-card__footer">
                    <div>
                      <div className="bounty-card__cost-label">{toSocialText('Cost per spin', isSocial)}</div>
                      <div className="bounty-card__cost tabular-nums">{formatMoney(cost, currency)}</div>
                    </div>
                    <span className="bounty-card__cta">{isCardActive ? 'Turn off' : 'Activate'}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button onClick={handleNextPage} aria-label="Next Cards" className="brass-arrow">
          <ChevronRight size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Page markers */}
      <div className="relative z-20 flex items-center justify-center gap-2.5 pb-2">
        {Array.from({ length: totalPages }).map((_, pIdx) => (
          <button
            key={pIdx}
            onClick={() => setCurrentPage(pIdx)}
            aria-label={`Page ${pIdx + 1}`}
            className={`harbor-dot ${currentPage === pIdx ? 'is-active' : ''}`}
          />
        ))}
      </div>

      {/* Confirmation for modes costing more than 2x base bet */}
      <AnimatePresence>
        {confirmBuyMode && (
          <motion.div
            className="ship-overlay fixed inset-0 z-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="ship-dialog w-full max-w-[420px] p-6 flex flex-col items-center text-center"
              initial={{ scale: 0.9, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 10 }}
              transition={{ type: 'spring', stiffness: 460, damping: 30 }}
            >
              <p className="ship-kicker">{toSocialText('Feature mode', isSocial)}</p>
              <h3 className="ship-heading mt-1 text-3xl">Hoist the colours?</h3>
              <p className="ship-body mt-3 text-sm">
                {toSocialText('Start', isSocial)}{' '}
                <strong className="text-[#7a1d10]">{MODE_CONFIGS[confirmBuyMode].name}</strong>{' '}
                {toSocialText('at', isSocial)}{' '}
                <strong className="text-[#1d5c3c] tabular-nums">
                  {formatMoney(betLevel * MODE_CONFIGS[confirmBuyMode].costMultiplier, currency)}
                </strong>{' '}
                {toSocialText('per spin?', isSocial)}
              </p>

              <div className="flex items-center gap-3 mt-6 w-full">
                <button onClick={() => setConfirmBuyMode(null)} className="ship-button ship-button--ghost flex-1">
                  Cancel
                </button>
                <button onClick={handleConfirmPurchase} className="ship-button flex-1">
                  Confirm &amp; activate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
