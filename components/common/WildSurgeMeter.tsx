'use client';

import { motion } from 'motion/react';
import { BonusType, WILD_SURGE_MAX_LINES, WILD_SURGE_WILDS_PER_LINE } from '../../maths/slot-engine';

interface WildSurgeMeterProps {
  bonusType: BonusType;
  wildCount: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function WildSurgeMeter({ bonusType, wildCount, className = '', orientation = 'horizontal' }: WildSurgeMeterProps) {
  const threshold = WILD_SURGE_WILDS_PER_LINE[bonusType];
  const nextLine = Math.min(WILD_SURGE_MAX_LINES, Math.floor(wildCount / threshold));

  return (
    <section
      className={`wild-surge-meter ${orientation === 'vertical' ? 'wild-surge-meter--vertical' : ''} ${className}`}
      aria-label={`Wild Surge meter: ${wildCount} Wilds collected, ${nextLine} of ${WILD_SURGE_MAX_LINES} rows charged`}
    >
      <div className="wild-surge-meter__heading">
        <span className="wild-surge-meter__title">{orientation === 'vertical' ? <>WILD<br />SURGE</> : 'WILD SURGE'}</span>
        <span className="wild-surge-meter__count tabular-nums">{wildCount} <small>WILDS</small></span>
      </div>
      <div className="wild-surge-meter__track" role="progressbar" aria-valuemin={0} aria-valuemax={threshold * WILD_SURGE_MAX_LINES} aria-valuenow={Math.min(wildCount, threshold * WILD_SURGE_MAX_LINES)}>
        {Array.from({ length: WILD_SURGE_MAX_LINES }, (_, index) => {
          const segmentProgress = Math.min(1, Math.max(0, (wildCount - index * threshold) / threshold));
          return (
            <span className="wild-surge-meter__segment" key={index}>
              <motion.span className="wild-surge-meter__fill" initial={orientation === 'vertical' ? { scaleY: 0 } : { scaleX: 0 }} animate={orientation === 'vertical' ? { scaleY: segmentProgress } : { scaleX: segmentProgress }} transition={{ type: 'spring', stiffness: 180, damping: 24 }} />
            </span>
          );
        })}
      </div>
      <div className="wild-surge-meter__foot">
        <span>{orientation === 'vertical' ? `${threshold} / ROW` : `${threshold} WILDS / ROW`}</span>
        <span>{nextLine}/{WILD_SURGE_MAX_LINES} ROWS</span>
      </div>
      <span className="sr-only">Next row at {Math.ceil((wildCount + 1) / threshold) * threshold} Wilds.</span>
      <span aria-hidden="true" className="wild-surge-meter__shine" />
    </section>
  );
}
