'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  BonusType,
  WILD_SURGE_MAX_LINES,
  WILD_SURGE_WILDS_PER_LINE,
} from '../../maths/slot-engine';

interface WildSurgeMeterProps {
  bonusType: BonusType;
  wildCount: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const PIPS_PER_ROW = 5;

export default function WildSurgeMeter({
  bonusType,
  wildCount,
  className = '',
  orientation = 'horizontal',
}: WildSurgeMeterProps) {
  const threshold = WILD_SURGE_WILDS_PER_LINE[bonusType];
  const chargedRows = Math.min(
    WILD_SURGE_MAX_LINES,
    Math.floor(wildCount / threshold)
  );
  const maxWilds = threshold * WILD_SURGE_MAX_LINES;

  return (
    <section
      className={`wild-surge-meter ${
        orientation === 'vertical'
          ? 'wild-surge-meter--vertical'
          : 'wild-surge-meter--horizontal'
      } ${chargedRows > 0 ? 'wild-surge-meter--charged' : ''} ${className}`}
      aria-label={`Wild Surge meter: ${wildCount} Wilds collected, ${chargedRows} of ${WILD_SURGE_MAX_LINES} rows charged`}
    >
      {/* Bespoke Ornate Pirate Skull, Cutlasses & Brass Gauge Frame (Vertical Mode) */}
      {orientation === 'vertical' ? (
        <div className="wild-surge-meter__art-frame" aria-hidden="true">
          <Image
            src="/assets/sea-raider/ui/wild-surge-meter-frame.png"
            alt=""
            fill
            priority
            unoptimized
            sizes="160px"
            className="object-contain"
          />
        </div>
      ) : (
        <>
          <span className="wild-surge-meter__rivet wild-surge-meter__rivet--tl" aria-hidden="true" />
          <span className="wild-surge-meter__rivet wild-surge-meter__rivet--tr" aria-hidden="true" />
          <span className="wild-surge-meter__rivet wild-surge-meter__rivet--bl" aria-hidden="true" />
          <span className="wild-surge-meter__rivet wild-surge-meter__rivet--br" aria-hidden="true" />
        </>
      )}

      {/* Inner Chamber Content */}
      <div className="wild-surge-meter__chamber">
        {/* Header: Title + Collected Count */}
        <div className="wild-surge-meter__heading">
          <div className="wild-surge-meter__brand">
            {orientation === 'horizontal' && (
              <span className="wild-surge-meter__skull" aria-hidden="true">
                <Image
                  src="/assets/sea-raider/wild.png"
                  alt=""
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              </span>
            )}
            <span className="wild-surge-meter__title">WILD SURGE</span>
          </div>
          <motion.span
            key={wildCount}
            initial={{ scale: 1.22 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            className="wild-surge-meter__count tabular-nums"
          >
            {wildCount}
            <small>WILDS</small>
          </motion.span>
        </div>

        {/* 3 Row Chambers with 5 brass pip sockets each */}
        <div
          className="wild-surge-meter__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={maxWilds}
          aria-valuenow={Math.min(wildCount, maxWilds)}
        >
          {Array.from({ length: WILD_SURGE_MAX_LINES }, (_, index) => {
            const rowNumber = index + 1;
            const segmentWilds = Math.min(
              threshold,
              Math.max(0, wildCount - index * threshold)
            );
            const segmentProgress = segmentWilds / threshold;
            const isRowCharged = segmentProgress >= 1;
            const filledPips = Math.min(
              PIPS_PER_ROW,
              Math.floor(segmentProgress * PIPS_PER_ROW + 0.0001)
            );

            return (
              <div
                key={index}
                className={`wild-surge-meter__segment ${
                  isRowCharged ? 'is-charged' : segmentWilds > 0 ? 'is-filling' : ''
                }`}
              >
                {/* Liquid gold progress backing */}
                <motion.span
                  className="wild-surge-meter__fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: segmentProgress }}
                  transition={{ type: 'spring', stiffness: 210, damping: 24 }}
                />

                {/* Row label + 5 pip sockets + status */}
                <div className="wild-surge-meter__row-inner">
                  <span className="wild-surge-meter__row-label">R{rowNumber}</span>
                  <span className="wild-surge-meter__pips" aria-hidden="true">
                    {Array.from({ length: PIPS_PER_ROW }, (__, pipIdx) => {
                      const isPipLit = pipIdx < filledPips;
                      return (
                        <span
                          key={pipIdx}
                          className={`wild-surge-meter__pip ${
                            isPipLit ? 'is-lit' : ''
                          }`}
                        />
                      );
                    })}
                  </span>
                  <span className="wild-surge-meter__row-stat tabular-nums">
                    {isRowCharged ? 'FULL' : `${segmentWilds}/${threshold}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact status footer */}
        <div className="wild-surge-meter__foot">
          <span>{threshold} / ROW</span>
          <span className="wild-surge-meter__foot-rows tabular-nums">
            {chargedRows}/{WILD_SURGE_MAX_LINES}
          </span>
        </div>
      </div>

      <span className="sr-only">
        Next row at {Math.ceil((wildCount + 1) / threshold) * threshold} Wilds.
      </span>
    </section>
  );
}
