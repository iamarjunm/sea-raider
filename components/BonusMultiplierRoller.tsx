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
  const range =
    startRanges[String(scatterCount) as keyof typeof startRanges] ??
    startRanges['3'];
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
    const alternatives = range.values.filter(
      (value) => value !== startMultiplier
    );
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

      const optionIndex =
        (index * 7 + scatterCount) % Math.max(1, alternatives.length);
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
          className="bonus-roller-modal fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-[#02070d]/92 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${scatterCount}-scatter bonus starting multiplier roll`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,104,112,.26),transparent_52%),radial-gradient(ellipse_at_50%_55%,rgba(245,158,11,.18),transparent_46%)]" />
          <motion.div
            initial={{ y: 20, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-[900px] flex-col items-center text-center"
          >
            <span className="bonus-roller__kicker">
              ★ BONUS FEATURE AWARDED ★
            </span>
            <h2 className="bonus-roller__title mt-2">
              STARTING MULTIPLIER
            </h2>
            <p className="bonus-roller__range mt-1.5">
              {scatterCount} SCATTERS · RANGE {range.min}×–{range.max}×
            </p>

            <div className="relative mt-4 aspect-[1917/762] w-full max-w-[860px] drop-shadow-[0_20px_48px_rgba(0,0,0,.78)] sm:mt-5">
              <Image
                src="/assets/sea-raider/bonus-multiplier-roller.png"
                alt=""
                fill
                priority
                sizes="(max-width: 900px) 94vw, 860px"
                className="object-contain"
              />
              <div className="absolute left-[15%] top-[35%] flex h-[39%] w-[70%] items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={`${rollTick}-${shownMultiplier ?? 'ready'}`}
                    initial={{ y: '-110%', opacity: 0 }}
                    animate={{
                      y: '0%',
                      opacity: 1,
                      scale: isSettled ? [0.88, 1.16, 1] : 1,
                    }}
                    exit={{ y: '110%', opacity: 0 }}
                    transition={{
                      duration: isSettled ? 0.42 : 0.14,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`bonus-roller__value tabular-nums ${
                      isSettled ? 'is-settled' : 'is-rolling'
                    }`}
                  >
                    {shownMultiplier === null
                      ? '···'
                      : `${shownMultiplier.toLocaleString('en-US')}×`}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <motion.p
              key={isSettled ? 'settled' : 'rolling'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bonus-roller__foot mt-2 sm:mt-3 ${
                isSettled ? 'is-settled' : ''
              }`}
            >
              {isSettled
                ? '◆ START MULTIPLIER LOCKED · ENTERING FREE SPINS ◆'
                : 'ROLLING STARTING MULTIPLIER…'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
