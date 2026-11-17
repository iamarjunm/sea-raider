'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BonusType } from '../lib/slot-engine';
import LivingCaptain from './scene/LivingCaptain';

interface BonusIntroModalProps {
  isOpen: boolean;
  bonusType: BonusType;
  scatterCount: number;
  spinsAwarded: number;
  onStart: () => void;
}

const BONUS_COPY: Record<
  string,
  { title: string; subtitle: string; badge: string; accent: string }
> = {
  curse: {
    title: 'CURSE OF THE HIGH SEAS',
    subtitle: 'THE TIDE HAS TURNED',
    badge: 'CURSED WATERS CHARTER',
    accent: '#25d8df',
  },
  ghost: {
    title: "GHOST CAPTAIN'S REVENGE",
    subtitle: 'THE FLEET ANSWERS YOUR CALL',
    badge: 'PHANTOM ARMADA CHARTER',
    accent: '#d6a449',
  },
  legend: {
    title: 'PIRATE LEGEND',
    subtitle: 'A LEGENDARY VOYAGE BEGINS',
    badge: 'SOVEREIGN PLUNDER CHARTER',
    accent: '#ffb22e',
  },
  ethereal: {
    title: 'ETHEREAL CATACLYSM',
    subtitle: 'THE OCEAN REVEALS ITS POWER',
    badge: 'ABYSSAL CROWN CHARTER',
    accent: '#48e5d8',
  },
};

export default function BonusIntroModal({
  isOpen,
  bonusType,
  scatterCount,
  spinsAwarded,
  onStart,
}: BonusIntroModalProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onStart]);

  const copy = BONUS_COPY[bonusType] || BONUS_COPY.curse;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bonus-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bonus-intro fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#030911] px-3 py-3 sm:px-8 sm:py-5 lg:px-12"
          onClick={onStart}
          role="dialog"
          aria-modal="true"
          aria-label={`${copy.title}, ${spinsAwarded} free spins`}
          style={{ '--bonus-accent': copy.accent } as React.CSSProperties}
        >
          <Image
            src="/assets/sea-raider/opening/bonus-intro-background.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="bonus-intro__backdrop absolute inset-0 object-cover"
          />
          <div className="bonus-intro__shade pointer-events-none absolute inset-0" />

          {/* Living Captain on the Port Side */}
          <motion.div
            className="bonus-intro__captain pointer-events-none absolute bottom-[-5%] left-[-4%] z-10 h-[86vh] w-[min(48vw,640px)]"
            initial={shouldReduceMotion ? { opacity: 1 } : { x: -180, opacity: 0, rotate: -5 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 86, damping: 18, mass: 1 }}
          >
            <LivingCaptain label="Pirate captain raising his cutlass" />
          </motion.div>

          {/* Weathered Ship-Log Charter & Carved Timber Signboard */}
          <motion.section
            className="bonus-intro__content bonus-charter relative z-20 ml-auto w-full max-w-[610px] text-center lg:mr-[3vw]"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scaleY: 0.22, scaleX: 0.9, y: -18 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scaleY: [0.22, 1.04, 0.985, 1],
                    scaleX: [0.9, 0.98, 1.01, 1],
                    y: [-18, 4, -1, 0],
                  }
            }
            transition={{
              delay: 0.08,
              duration: 0.52,
              times: [0, 0.62, 0.84, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Top Turned Mahogany & Brass Scroll Beam */}
            <span className="bonus-charter__beam bonus-charter__beam--top" aria-hidden="true" />

            <div className="bonus-charter__board relative overflow-hidden">
              {/* Brass Corner Rivets */}
              <span className="bonus-charter__rivet bonus-charter__rivet--tl" aria-hidden="true" />
              <span className="bonus-charter__rivet bonus-charter__rivet--tr" aria-hidden="true" />
              <span className="bonus-charter__rivet bonus-charter__rivet--bl" aria-hidden="true" />
              <span className="bonus-charter__rivet bonus-charter__rivet--br" aria-hidden="true" />

              {/* Subtle Nautical Compass Rose Watermark */}
              <svg
                className="bonus-charter__watermark pointer-events-none"
                viewBox="0 0 200 200"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" />
                <circle cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M100 8 L112 88 L192 100 L112 112 L100 192 L88 112 L8 100 L88 88 Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M38 38 L92 84 L162 38 L116 92 L162 162 L108 116 L38 162 L84 108 Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>

              {/* Crimson & Brass Wax Eyebrow Plaque */}
              <div className="bonus-charter__eyebrow-wrap">
                <span className="bonus-charter__eyebrow">
                  <span className="bonus-charter__eyebrow-star" aria-hidden="true">✦</span>
                  BONUS ROUND AWARDED
                  <span className="bonus-charter__eyebrow-star" aria-hidden="true">✦</span>
                </span>
              </div>

              {/* Big Hand-Set Pirate Title */}
              <h2 className="bonus-charter__title pirate-display">
                {copy.title}
              </h2>

              {/* High-Contrast Carved Wood & Brass Sub-Head Banner */}
              <div className="bonus-charter__subhead-bar">
                <span className="bonus-charter__subhead-ornament" aria-hidden="true" />
                <p className="bonus-charter__subhead">{copy.subtitle}</p>
                <span className="bonus-charter__subhead-ornament" aria-hidden="true" />
              </div>

              {/* Twin Engraved Brass Medallions for Scatters & Free Spins */}
              <div className="bonus-intro__stats bonus-charter__medallions">
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { scale: 1.45, opacity: 0, rotate: -8 }
                  }
                  animate={{ scale: [1.45, 0.92, 1.04, 1], opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.24, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="bonus-medallion"
                >
                  <div className="bonus-medallion__coin">
                    <span className="bonus-medallion__rim" aria-hidden="true" />
                    <span className="bonus-medallion__value tabular-nums">{scatterCount}</span>
                    <span className="bonus-medallion__unit">LANDED</span>
                  </div>
                  <span className="bonus-medallion__plate">SCATTERS</span>
                </motion.div>

                <div className="bonus-charter__medallion-divider" aria-hidden="true">
                  <span />
                  <i>⚓</i>
                  <span />
                </div>

                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { scale: 1.45, opacity: 0, rotate: 8 }
                  }
                  animate={{ scale: [1.45, 0.92, 1.04, 1], opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.32, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="bonus-medallion bonus-medallion--spins"
                >
                  <div className="bonus-medallion__coin">
                    <span className="bonus-medallion__rim" aria-hidden="true" />
                    <span className="bonus-medallion__value tabular-nums">{spinsAwarded}</span>
                    <span className="bonus-medallion__unit">AWARDED</span>
                  </div>
                  <span className="bonus-medallion__plate">FREE SPINS</span>
                </motion.div>
              </div>

              {/* Legible Ship's Ledger Note for Starting Multiplier */}
              <div className="bonus-charter__ledger-note">
                <div className="bonus-charter__ledger-title">
                  THE MULTIPLIER IS STILL HIDDEN
                </div>
                <p className="bonus-charter__ledger-desc">
                  Watch the reel reveal your starting value before the first spin.
                </p>
              </div>

              {/* Crafted Brass & Crimson Captain's Command Button */}
              <motion.button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onStart();
                }}
                whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.025 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                className="bonus-charter__cta"
              >
                <span className="bonus-charter__cta-rivet bonus-charter__cta-rivet--l" aria-hidden="true" />
                <span className="bonus-charter__cta-label">PLAY BONUS</span>
                <span className="bonus-charter__cta-rivet bonus-charter__cta-rivet--r" aria-hidden="true" />
                <span className="bonus-charter__cta-sheen" aria-hidden="true" />
              </motion.button>

              <p className="bonus-charter__hint">TAP TO CONTINUE · SPACE</p>
            </div>

            {/* Bottom Turned Mahogany & Brass Scroll Beam */}
            <span className="bonus-charter__beam bonus-charter__beam--bottom" aria-hidden="true" />
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
