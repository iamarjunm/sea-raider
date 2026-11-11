'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import startRanges from '../maths/bonus-multiplier-ranges.json';

interface BonusMultiplierRollerProps {
  isOpen: boolean;
  scatterCount: number;
  startMultiplier: number;
  onComplete: () => void;
}

export default function BonusMultiplierRoller({
  isOpen,
  scatterCount,
  startMultiplier,
  onComplete,
}: BonusMultiplierRollerProps) {
  const range = startRanges[String(scatterCount) as keyof typeof startRanges] ?? startRanges['3'];
  const [shownMultiplier, setShownMultiplier] = useState<number | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const [rollTick, setRollTick] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const alternatives = range.values.filter((value) => value !== startMultiplier);
    const ticks = 20;
    let index = 0;
    const roll = () => {
      if (cancelled) return;
      if (index >= ticks) {
        setRollTick(ticks);
        setShownMultiplier(startMultiplier);
        setIsSettled(true);
        timeoutRef.current = setTimeout(() => {
          if (!cancelled) onCompleteRef.current();
        }, 650);
        return;
      }

      const optionIndex = (index * 7 + scatterCount) % Math.max(1, alternatives.length);
      setShownMultiplier(alternatives[optionIndex] ?? startMultiplier);
      setRollTick(index + 1);
      index += 1;
      // Ease the reel down as it approaches the preselected RGS value.
      const delay = 34 + index * 7;
      timeoutRef.current = setTimeout(roll, delay);
    };

    timeoutRef.current = setTimeout(roll, 90);
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, range, scatterCount, startMultiplier]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bonus-multiplier-roll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-[#02070d]/90 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${scatterCount}-scatter bonus starting multiplier roll`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,104,112,.28),transparent_50%),radial-gradient(ellipse_at_70%_55%,rgba(245,158,11,.16),transparent_42%)]" />
          <motion.div
            initial={{ y: 24, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex w-full max-w-[900px] flex-col items-center text-center"
          >
            <p className="text-[10px] font-black tracking-[.34em] text-[#9ae4dc] sm:text-xs">BONUS FEATURE AWARDED</p>
            <h2 className="mt-2 text-xl font-black tracking-[.12em] text-[#fff0c8] drop-shadow-[0_2px_12px_rgba(245,158,11,.35)] sm:text-3xl">
              START MULTIPLIER
            </h2>
            <p className="mt-2 text-[10px] font-bold tracking-[.14em] text-white/65 sm:text-xs">
              {scatterCount} SCATTERS · START RANGE {range.min}×–{range.max}×
            </p>

            <div className="relative mt-4 aspect-[1917/762] w-full max-w-[880px] drop-shadow-[0_18px_46px_rgba(0,0,0,.65)] sm:mt-6">
              <Image
                src="/assets/sea-raider/bonus-multiplier-roller.png"
                alt=""
                fill
                priority
                sizes="(max-width: 900px) 94vw, 880px"
                className="object-contain"
              />
              <div className="absolute left-[15%] top-[35%] flex h-[39%] w-[70%] items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={`${rollTick}-${shownMultiplier ?? 'ready'}`}
                    initial={{ y: '-120%', opacity: 0.12, filter: 'blur(5px)', rotateX: 40 }}
                    animate={{ y: '0%', opacity: 1, filter: 'blur(0px)', rotateX: 0 }}
                    exit={{ y: '120%', opacity: 0, filter: 'blur(5px)', rotateX: -35 }}
                    transition={{ duration: isSettled ? 0.44 : 0.16, ease: [0.18, 0.78, 0.22, 1] }}
                    className={`tabular-nums font-black leading-none tracking-[.04em] ${
                      isSettled
                        ? 'text-5xl text-[#ffe39a] drop-shadow-[0_0_18px_rgba(255,185,57,.72)] sm:text-7xl md:text-8xl'
                        : 'text-4xl text-[#d5e9e1] drop-shadow-[0_0_12px_rgba(63,211,202,.5)] sm:text-6xl md:text-7xl'
                    }`}
                  >
                    {shownMultiplier === null ? '···' : `${shownMultiplier.toLocaleString('en-US')}×`}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <motion.p
              key={isSettled ? 'settled' : 'rolling'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-[9px] font-black tracking-[.2em] text-amber-100/75 sm:mt-3 sm:text-[10px]"
            >
              {isSettled ? 'START VALUE LOCKED · THE FEATURE BEGINS NEXT' : 'ROLLING TO THE SAVED GAME RESULT'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
