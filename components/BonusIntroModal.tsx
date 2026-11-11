'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { BonusType } from '../lib/slot-engine';

interface BonusIntroModalProps {
  isOpen: boolean;
  bonusType: BonusType;
  scatterCount: number;
  spinsAwarded: number;
  onStart: () => void;
}

const BONUS_COPY: Record<string, { title: string; subtitle: string; glow: string }> = {
  curse: { title: 'CURSE OF THE HIGH SEAS', subtitle: 'THE TIDE HAS TURNED', glow: '#25d8df' },
  ghost: { title: "GHOST CAPTAIN'S REVENGE", subtitle: 'THE FLEET ANSWERS YOUR CALL', glow: '#b799ff' },
  legend: { title: 'PIRATE LEGEND', subtitle: 'A LEGENDARY VOYAGE BEGINS', glow: '#ffb22e' },
  ethereal: { title: 'ETHEREAL CATACLYSM', subtitle: 'THE OCEAN REVEALS ITS POWER', glow: '#f45aff' },
};

export default function BonusIntroModal({ isOpen, bonusType, scatterCount, spinsAwarded, onStart }: BonusIntroModalProps) {
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
          className="bonus-intro fixed inset-0 z-[80] flex items-center overflow-hidden bg-[#030911] px-4 py-5 sm:px-8 lg:px-12"
          onClick={onStart}
          role="dialog"
          aria-modal="true"
          aria-label={`${copy.title}, ${spinsAwarded} free spins`}
        >
          <Image src="/assets/sea-raider/opening/bonus-intro-background.png" alt="" fill priority sizes="100vw" className="bonus-intro__backdrop absolute inset-0 object-cover" />
          <div className="bonus-intro__shade pointer-events-none absolute inset-0" />

          <motion.div
            className="bonus-intro__captain pointer-events-none absolute bottom-[-5%] left-[-4%] z-10 h-[88vh] w-[min(49vw,660px)]"
            initial={{ x: -220, opacity: 0, rotate: -7 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 76, damping: 18, mass: 1.05 }}
          >
            <Image src="/assets/sea-raider/sword-captain.png" alt="Pirate captain raising his cutlass" fill sizes="(max-width: 640px) 85vw, 660px" className="object-contain object-bottom drop-shadow-[0_0_40px_rgba(0,0,0,.85)]" />
          </motion.div>

          <motion.section
            className="bonus-intro__content relative z-20 ml-auto w-full max-w-[660px] rounded-sm border-l border-amber-200/40 bg-gradient-to-r from-[#04101b]/30 via-[#04101b]/75 to-[#04101b]/20 px-5 py-6 text-center shadow-[-30px_0_80px_rgba(0,0,0,.32)] sm:px-10 sm:py-9 lg:mr-[4vw] lg:text-left"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: .16, duration: .48, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[10px] font-black tracking-[.42em] text-[#8ee7e1] sm:text-xs">BONUS ROUND AWARDED</p>
            <h2 className="mt-3 max-w-[15ch] text-2xl font-black leading-[1.05] text-[#fff0c8] drop-shadow-[0_3px_16px_rgba(255,184,69,.32)] sm:text-4xl lg:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-3 text-xs font-bold tracking-[.16em] text-white/75 sm:text-sm">{copy.subtitle}</p>

            <div className="bonus-intro__stats mt-6 grid grid-cols-2 border-y border-amber-100/25 py-4 sm:mt-8 sm:py-5">
              <div className="flex flex-col items-center gap-1 border-r border-amber-100/25 lg:items-start lg:pl-2">
                <span className="text-3xl font-black leading-none tabular-nums text-white sm:text-4xl">{scatterCount}</span>
                <span className="text-[9px] font-black tracking-[.2em] text-amber-100/75 sm:text-[10px]">SCATTERS</span>
              </div>
              <div className="flex flex-col items-center gap-1 lg:items-start lg:pl-6">
                <span className="text-3xl font-black leading-none tabular-nums text-white sm:text-4xl">{spinsAwarded}</span>
                <span className="text-[9px] font-black tracking-[.2em] text-amber-100/75 sm:text-[10px]">FREE SPINS</span>
              </div>
            </div>

            <div className="mx-auto mt-4 w-fit rounded-full border border-amber-200/35 bg-black/45 px-4 py-2 shadow-[inset_0_1px_rgba(255,255,255,.08)]">
              <p className="text-[9px] font-black tracking-[.18em] text-amber-100/75">THE MULTIPLIER IS STILL HIDDEN</p>
              <p className="mt-1 text-[9px] font-semibold tracking-wide text-white/55">
                Watch the reel reveal your starting value before the first spin.
              </p>
            </div>

            <motion.button
              type="button"
              onClick={(event) => { event.stopPropagation(); onStart(); }}
              whileHover={{ y: -2, scale: 1.025 }}
              whileTap={{ scale: .975 }}
              className="mt-6 min-h-12 w-full max-w-[320px] border border-amber-100/80 bg-[linear-gradient(180deg,#ffe8ad,#d89d36_55%,#865018)] px-8 py-3 text-sm font-black tracking-[.22em] text-[#211404] shadow-[0_8px_30px_rgba(0,0,0,.4),inset_0_1px_rgba(255,255,255,.85)] sm:mt-8 sm:text-base"
            >
              PLAY BONUS
            </motion.button>
            <p className="mt-3 text-[9px] font-bold tracking-[.16em] text-white/50">TAP TO CONTINUE · SPACE</p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
