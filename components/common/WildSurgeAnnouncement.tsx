'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

interface WildSurgeAnnouncementProps {
  wildCount: number;
  linesAwarded: number;
}

export default function WildSurgeAnnouncement({
  wildCount,
  linesAwarded,
}: WildSurgeAnnouncementProps) {
  return (
    <motion.div
      className="wild-surge-announcement fixed inset-0 z-[85] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="assertive"
    >
      <div className="wild-surge-announcement__shade absolute inset-0" />
      <motion.div
        className="wild-surge-announcement__card relative flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.84, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="wild-surge-announcement__rivet wild-surge-announcement__rivet--tl" aria-hidden="true" />
        <span className="wild-surge-announcement__rivet wild-surge-announcement__rivet--tr" aria-hidden="true" />
        <span className="wild-surge-announcement__rivet wild-surge-announcement__rivet--bl" aria-hidden="true" />
        <span className="wild-surge-announcement__rivet wild-surge-announcement__rivet--br" aria-hidden="true" />

        <span className="wild-surge-announcement__flare" aria-hidden="true" />

        <motion.div
          className="wild-surge-announcement__wild relative"
          initial={{ scale: 0.6, rotate: -14 }}
          animate={{ scale: [0.6, 1.14, 1], rotate: [0, 4, 0] }}
          transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/assets/sea-raider/wild.png"
            alt=""
            fill
            sizes="96px"
            className="object-contain"
          />
        </motion.div>

        <p className="wild-surge-announcement__eyebrow">THE BONUS FINALE</p>
        <h2 className="wild-surge-announcement__title">WILD SURGE!</h2>
        <p className="wild-surge-announcement__detail">
          {wildCount} Wilds Gathered · {linesAwarded}{' '}
          {linesAwarded === 1 ? 'Row' : 'Rows'} Charged
        </p>

        <motion.div
          className="wild-surge-announcement__rule"
          initial={{ scaleX: 0.1 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.12, duration: 0.38 }}
        />

        <p className="wild-surge-announcement__hint">SURGE SPIN INCOMING</p>
      </motion.div>
    </motion.div>
  );
}
