'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { toSocialText } from '../lib/currency';

interface OpeningModalProps {
  isSocial: boolean;
  onContinue: () => void;
}

const facts = [
  {
    className: 'opener-voyages',
    card: '/assets/sea-raider/opening/card-bonus.png',
    title: '4 BONUS VOYAGES',
    detail: '3, 4, 5 or 6 scatters launch a different free-spin feature.',
    note: '10 · 12 · 15 · 10 SPINS',
  },
  {
    className: 'opener-maximum',
    card: '/assets/sea-raider/opening/card-max-win.png',
    title: '25,000× MAX WIN',
    detail: 'Ethereal Cataclysm can reach 50,000×. Six scatters only.',
    note: '50,000× ETHEREAL ONLY',
  },
  {
    className: 'opener-lines',
    card: '/assets/sea-raider/opening/card-paylines.png',
    title: '20 FIXED PAYLINES',
    detail: 'Match symbols from left to right across five reels and three rows.',
    note: '11 ORIGINAL SYMBOLS',
  },
];

export default function OpeningModal({ isSocial, onContinue }: OpeningModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onContinue]);

  return (
    <motion.div
      className="opening-modal fixed inset-0 z-[90] flex items-center justify-center overflow-hidden px-3 py-2 sm:px-7 sm:py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: .3, ease: 'easeOut' }}
      onClick={onContinue}
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-title"
    >
      <Image src="/assets/sea-raider/opening/opening-background.png" alt="" fill priority sizes="100vw" className="opener-backdrop absolute inset-0 -z-20 object-cover" />
      <div className="opener-vignette pointer-events-none absolute inset-0 -z-10" />
      <div className="opener-sea-light pointer-events-none absolute inset-0 -z-10" />

      <div className="opener-scene relative flex h-full max-h-[900px] w-full max-w-[1600px] flex-col items-center justify-between py-[1vh] sm:py-[2vh]">
        <header className="opener-heading relative flex shrink-0 flex-col items-center text-center">
          <div className="opener-studio absolute right-[-9vw] top-[8%] hidden h-11 w-32 opacity-75 lg:block xl:right-[-16vw] xl:h-14 xl:w-40">
            <Image src="/assets/aistudio/provider_logo_ee1a8c04.webp" alt="Ethereal Gold Studios" fill sizes="160px" className="object-contain" />
          </div>
          <motion.div
            className="relative h-[clamp(42px,10vh,98px)] w-[clamp(170px,25vw,340px)]"
            initial={{ y: -24, opacity: 0, scale: .88 }}
            animate={{ y: 0, opacity: 1, scale: [1.04, .98, 1] }}
            transition={{ duration: .65, ease: [ .16, 1, .3, 1 ] }}
          >
            <Image src="/assets/aistudio/logo_37cf1416.webp" alt="Sea Raider" fill priority sizes="340px" className="object-contain drop-shadow-[0_5px_20px_rgba(0,0,0,.9)]" />
          </motion.div>
          <p id="opening-title" className="-mt-1 text-[8px] font-black tracking-[.42em] text-[#d6ece8] drop-shadow-[0_2px_4px_#000] sm:text-sm sm:tracking-[.6em]">
            ECHOES OF THE WARRIOR
          </p>
          <div className="opener-rule mt-1.5 flex items-center gap-2 sm:mt-3 sm:gap-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#f4cd78] sm:w-24" />
            <span className="text-[9px] font-black tracking-[.28em] text-[#ffe5a6] drop-shadow-[0_2px_5px_#000] sm:text-base sm:tracking-[.4em]">A VOYAGE OF LEGENDS</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#f4cd78] sm:w-24" />
          </div>
        </header>

        <section className="opener-facts relative grid w-full grid-cols-3 items-stretch gap-2 sm:gap-5 lg:gap-8" aria-label="Game highlights">
          {facts.map((fact, index) => (
            <motion.article
              key={fact.title}
              className={`opener-fact ${fact.className} relative flex min-w-0 flex-col items-center justify-end px-4 pb-5 pt-3 text-center sm:px-5 sm:pb-6`}
              initial={{ opacity: 0, y: 28, scale: .94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: .14 + index * .12, duration: .48, ease: [ .16, 1, .3, 1 ] }}
            >
              <Image src={fact.card} alt="" fill sizes="(max-width: 639px) 78vw, 32vw" className="opener-card-art pointer-events-none absolute inset-0" />
              <div className="opener-card-copy relative z-10 flex w-full flex-col items-center">
                <h2 className="opener-fact-title text-[8px] font-black leading-tight tracking-[.1em] text-[#ffe3a0] drop-shadow-[0_2px_4px_#000] sm:text-lg sm:tracking-[.16em]">
                  {toSocialText(fact.title, isSocial)}
                </h2>
                <p className="opener-fact-detail mt-1 max-w-[34ch] text-[6px] font-semibold leading-snug text-[#e1e6e3] drop-shadow-[0_2px_4px_#000] sm:mt-2 sm:text-xs sm:leading-relaxed">
                  {toSocialText(fact.detail, isSocial)}
                </p>
                <span className="opener-fact-note mt-1 text-[6px] font-black tracking-[.09em] text-[#7ee2d7] drop-shadow-[0_2px_4px_#000] sm:mt-2 sm:text-[10px] sm:tracking-[.18em]">
                  {toSocialText(fact.note, isSocial)}
                </span>
              </div>
            </motion.article>
          ))}
        </section>

        <motion.button
          type="button"
          onClick={(event) => { event.stopPropagation(); onContinue(); }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: [ .72, 1, .72 ], y: 0 }}
          transition={{ opacity: { duration: 1.7, repeat: Infinity, ease: 'easeInOut' }, y: { delay: .45, duration: .4 } }}
          className="opener-continue relative shrink-0 px-4 py-1.5 text-[11px] font-black tracking-[.2em] text-[#fff2cf] drop-shadow-[0_3px_4px_#000] sm:px-10 sm:py-3 sm:text-2xl sm:tracking-[.25em]"
        >
          {toSocialText('PRESS TO CONTINUE', isSocial)}
          <span className="opener-continue-ornament pointer-events-none absolute inset-x-0 -bottom-1 h-2" />
        </motion.button>
      </div>
    </motion.div>
  );
}
