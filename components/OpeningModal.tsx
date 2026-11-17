'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
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
  const shouldReduceMotion = useReducedMotion();

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
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onContinue}
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-title"
    >
      <Image
        src="/assets/sea-raider/opening/opening-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="opener-backdrop absolute inset-0 -z-20 object-cover"
      />
      <div className="opener-vignette pointer-events-none absolute inset-0 -z-10" />
      <div className="opener-sea-light pointer-events-none absolute inset-0 -z-10" />

      <div className="opener-scene relative flex h-full max-h-[900px] w-full max-w-[1600px] flex-col items-center justify-between py-[1vh] sm:py-[2vh]">
        <header className="opener-heading relative flex shrink-0 flex-col items-center text-center">
          <div className="opener-studio absolute right-[-9vw] top-[8%] hidden h-11 w-32 opacity-85 lg:block xl:right-[-16vw] xl:h-14 xl:w-40">
            <Image
              src="/assets/aistudio/provider_logo_ee1a8c04.webp"
              alt="Ethereal Gold Studios"
              fill
              sizes="160px"
              className="object-contain"
            />
          </div>
          <motion.div
            className="relative h-[clamp(44px,10vh,98px)] w-[clamp(180px,25vw,340px)]"
            initial={shouldReduceMotion ? { opacity: 1 } : { y: -24, opacity: 0, scale: 0.88 }}
            animate={{ y: 0, opacity: 1, scale: [1.04, 0.98, 1] }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/assets/aistudio/logo_37cf1416.webp"
              alt="Sea Raider"
              fill
              priority
              sizes="340px"
              className="object-contain drop-shadow-[0_5px_20px_rgba(0,0,0,.9)]"
            />
          </motion.div>
          <p
            id="opening-title"
            className="-mt-1 text-[10px] font-black tracking-[.38em] text-[#e6f4f1] drop-shadow-[0_2px_4px_#000] sm:text-sm sm:tracking-[.56em]"
          >
            ECHOES OF THE WARRIOR
          </p>
          <div className="opener-rule mt-1.5 flex items-center gap-2 sm:mt-3 sm:gap-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#f4cd78] sm:w-24" />
            <span className="text-[10px] font-black tracking-[.26em] text-[#ffe5a6] drop-shadow-[0_2px_5px_#000] sm:text-base sm:tracking-[.4em]">
              A VOYAGE OF LEGENDS
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#f4cd78] sm:w-24" />
          </div>
        </header>

        <section
          className="opener-facts relative grid w-full grid-cols-3 items-stretch gap-2 sm:gap-5 lg:gap-8"
          aria-label="Game highlights"
        >
          {facts.map((fact, index) => (
            <motion.article
              key={fact.title}
              className={`opener-fact ${fact.className} relative flex min-w-0 flex-col items-center justify-end px-4 pb-5 pt-3 text-center sm:px-5 sm:pb-6`}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12 + index * 0.1, duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={fact.card}
                alt=""
                fill
                sizes="(max-width: 639px) 78vw, 32vw"
                className="opener-card-art pointer-events-none absolute inset-0"
              />
              <div className="opener-card-copy relative z-10 flex w-full flex-col items-center">
                <h2 className="opener-fact-title text-[10px] font-black leading-tight tracking-[.09em] text-[#ffe8ad] drop-shadow-[0_2px_4px_#000] sm:text-lg sm:tracking-[.15em]">
                  {toSocialText(fact.title, isSocial)}
                </h2>
                <p className="opener-fact-detail mt-1 max-w-[34ch] text-[8.5px] font-semibold leading-snug text-[#f2f5f3] drop-shadow-[0_2px_4px_#000] sm:mt-2 sm:text-xs sm:leading-relaxed">
                  {toSocialText(fact.detail, isSocial)}
                </p>
                <span className="opener-fact-note mt-1 text-[8px] font-black tracking-[.1em] text-[#8ef0e6] drop-shadow-[0_2px_4px_#000] sm:mt-2 sm:text-[11px] sm:tracking-[.18em]">
                  {toSocialText(fact.note, isSocial)}
                </span>
              </div>
            </motion.article>
          ))}
        </section>

        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onContinue();
          }}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.03 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="opener-continue relative shrink-0 px-6 py-2 text-xs font-black tracking-[.2em] text-[#fff2cf] sm:px-10 sm:py-3 sm:text-xl sm:tracking-[.25em]"
        >
          {toSocialText('PRESS TO CONTINUE', isSocial)}
          <span className="opener-continue-ornament pointer-events-none absolute inset-x-0 -bottom-1 h-2" />
        </motion.button>
      </div>
    </motion.div>
  );
}
