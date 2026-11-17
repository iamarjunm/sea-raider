'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { PlayMode, MODE_CONFIGS } from '../lib/slot-engine';
import { formatMoney, toSocialText } from '../lib/currency';
import { X } from 'lucide-react';

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
  odds: { label: string; value: string; highlight?: boolean }[];
  type: 'enhancer';
}

const CUSTOM_CARDS: CustomCardDef[] = [
  {
    mode: 'bonus_chance',
    title: 'BONUS CHANCE',
    multiplierBadge: '5×',
    subtitle: '10% TRIGGER · 3-SCATTER RETURNS AT LEAST 5× COST',
    odds: [
      { label: '3 SCATTER', value: '96%' },
      { label: '4 SCATTER', value: '3.5%' },
      { label: '5 SCATTER', value: '0.5%' },
    ],
    type: 'enhancer',
  },
  {
    mode: 'super_bonus',
    title: 'SUPER BONUS CHANCE',
    multiplierBadge: '7×',
    subtitle: '5.5% TRIGGER · 3-SCATTER RETURNS AT LEAST 7× COST',
    odds: [
      { label: '3 SCATTER', value: '55%' },
      { label: '4 SCATTER', value: '40%' },
      { label: '5 SCATTER', value: '5%' },
    ],
    type: 'enhancer',
  },
  {
    mode: 'pirates_chance',
    title: "PIRATES' CHANCE",
    multiplierBadge: '25×',
    subtitle: 'SCATTER OUTCOMES WHEN FEATURE TRIGGERS',
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
    subtitle: '100% FEATURE · ETHEREAL 6-SCATTER RETURNS ≥8,000×',
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
    subtitle: '15% FEATURE · 5-SCATTER ≥750× · ETHEREAL ≥8,000×',
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
  super_bonus: '#d99b38',
  pirates_chance: '#cf3a2b',
  feature_spin: '#38b5c9',
  unknown_bonus: '#e09a2b',
  unknown_extreme: '#2de0d4',
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
  const [confirmBuyMode, setConfirmBuyMode] = useState<PlayMode | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (confirmBuyMode) {
          setConfirmBuyMode(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, confirmBuyMode, onClose]);

  if (!isOpen) return null;

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
    <div
      className="bonus-modal feature-harbor fixed inset-0 z-50 flex flex-col select-none overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={toSocialText('Feature Modes', isSocial)}
    >
      {/* Quarterdeck Carved Header Bar */}
      <header className="feature-harbor__header relative z-30 flex w-full shrink-0 items-center justify-between gap-3">
        <div className="feature-harbor__bet-pill hidden sm:flex items-center gap-2">
          <span className="feature-harbor__bet-label">{toSocialText('BASE BET', isSocial)}</span>
          <strong className="feature-harbor__bet-val tabular-nums">{formatMoney(betLevel, currency)}</strong>
        </div>
        <div className="w-10 sm:hidden" />

        <motion.div
          className="flex flex-col items-center text-center"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="feature-harbor__kicker">{toSocialText('CHOOSE YOUR VOYAGE', isSocial)}</p>
          <h1 className="feature-harbor__title">{toSocialText('Feature Modes', isSocial)}</h1>
          <p className="feature-harbor__sub">
            {toSocialText('Pick a mode once, then spin or run autoplay at its cost per spin', isSocial)}
          </p>
        </motion.div>

        <button
          type="button"
          onClick={onClose}
          aria-label={toSocialText('Close Buy Bonus', isSocial)}
          className="ship-seal-close ship-seal-close--large shrink-0"
        >
          <X size={22} strokeWidth={3} />
        </button>
      </header>

      {/* Responsive 6-Card Bounty Grid — Zero Horizontal Scroll */}
      <div className="feature-harbor__scroll custom-scrollbar relative z-20 flex-1 w-full overflow-y-auto overflow-x-hidden">
        <div className="bounty-grid mx-auto w-full max-w-[1320px]">
          {CUSTOM_CARDS.map((card, idx) => {
            const config = MODE_CONFIGS[card.mode];
            const isCardActive = activeMode === card.mode;
            const cost = betLevel * config.costMultiplier;
            const accent = accentFor(card.mode);

            return (
              <motion.article
                key={card.mode}
                data-mode={card.mode}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 18, scale: 0.96 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
                transition={{
                  duration: 0.32,
                  delay: shouldReduceMotion ? 0 : idx * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => handleCardClick(card.mode)}
                className={`bounty-card group relative flex cursor-pointer flex-col ${
                  isCardActive ? 'bounty-card--active' : ''
                }`}
                style={{ '--accent': accent } as React.CSSProperties}
              >
                {/* Brass Corner Rivets & Top Pin */}
                <span className="bounty-card__pin" aria-hidden="true" />
                <span className="bounty-card__rivet bounty-card__rivet--tl" aria-hidden="true" />
                <span className="bounty-card__rivet bounty-card__rivet--tr" aria-hidden="true" />
                <span className="bounty-card__rivet bounty-card__rivet--bl" aria-hidden="true" />
                <span className="bounty-card__rivet bounty-card__rivet--br" aria-hidden="true" />

                {isCardActive && <span className="bounty-card__active">ACTIVE</span>}

                {/* Top Header Row: Porthole Art + Mode Title + Wax Cost Multiplier Seal */}
                <div className="bounty-card__top">
                  <div className="bounty-card__porthole shrink-0">
                    <span className="bounty-card__porthole-glow" aria-hidden="true" />
                    <div className="bounty-card__art">
                      <Image
                        src={FEATURE_ART[card.mode].src}
                        alt={FEATURE_ART[card.mode].label}
                        fill
                        sizes="96px"
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="bounty-card__heading min-w-0 flex-1">
                    <h2 className="bounty-card__title">{card.title}</h2>
                    <span className="bounty-card__tag">
                      {config.costMultiplier}× {toSocialText('BASE BET', isSocial)}
                    </span>
                  </div>

                  <span
                    className="bounty-card__seal shrink-0"
                    aria-label={`${config.costMultiplier} times the base bet`}
                  >
                    {card.multiplierBadge}
                  </span>
                </div>

                {/* High-Contrast Legible Description Banner */}
                <div className="bounty-card__subtitle">{card.subtitle}</div>

                {/* Trigger Odds Table (Ship's Ledger) */}
                <div className="bounty-card__ledger-wrap">
                  <div className="bounty-card__ledger-head">
                    <span>TRIGGER OUTCOME</span>
                    <span>ODDS</span>
                  </div>
                  <ul className="bounty-card__ledger">
                    {card.odds.map((item) => (
                      <li key={item.label} className={item.highlight ? 'is-highlight' : ''}>
                        <span className="bounty-card__odds-label">{item.label}</span>
                        <i aria-hidden="true" />
                        <b className="bounty-card__odds-val tabular-nums">{item.value}</b>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Carved Wood & Brass Footer: Big Cost + Activate CTA */}
                <div className="bounty-card__footer">
                  <div className="bounty-card__price-block">
                    <div className="bounty-card__cost-label">{toSocialText('Cost per spin', isSocial)}</div>
                    <div className="bounty-card__cost tabular-nums">{formatMoney(cost, currency)}</div>
                  </div>
                  <span className="bounty-card__cta">
                    {isCardActive ? 'Turn off' : 'Activate'}
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
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
            onClick={() => setConfirmBuyMode(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-mode-heading"
          >
            <motion.div
              className="ship-dialog bounty-confirm-dialog w-full max-w-[440px] p-6 flex flex-col items-center text-center"
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, y: 14 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 460, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bounty-confirm-dialog__emblem">
                <Image
                  src={FEATURE_ART[confirmBuyMode].src}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-contain"
                />
              </div>
              <p className="ship-kicker mt-2">{toSocialText('Feature mode charter', isSocial)}</p>
              <h3 id="confirm-mode-heading" className="ship-heading mt-1 text-3xl sm:text-4xl">
                Hoist the colours?
              </h3>
              <div className="ship-rule my-3 w-full" aria-hidden="true" />
              <p className="ship-body text-base">
                {toSocialText('Start', isSocial)}{' '}
                <strong className="font-bold text-[#6e180c]">{MODE_CONFIGS[confirmBuyMode].name}</strong>{' '}
                {toSocialText('at', isSocial)}{' '}
                <strong className="font-bold text-[#14472c] tabular-nums">
                  {formatMoney(betLevel * MODE_CONFIGS[confirmBuyMode].costMultiplier, currency)}
                </strong>{' '}
                {toSocialText('per spin?', isSocial)}
              </p>

              <div className="flex items-center gap-3 mt-6 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmBuyMode(null)}
                  className="ship-button ship-button--ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  className="ship-button flex-1"
                >
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
