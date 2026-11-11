'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

interface WildSurgeAnnouncementProps {
  wildCount: number;
  linesAwarded: number;
}

export default function WildSurgeAnnouncement({ wildCount, linesAwarded }: WildSurgeAnnouncementProps) {
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
        initial={{ opacity: 0, scale: .72, y: 22, rotateX: -14 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 190, damping: 19 }}
      >
        <span className="wild-surge-announcement__flare" />
        <motion.div
          className="wild-surge-announcement__wild relative"
          initial={{ scale: .55, rotate: -18 }}
          animate={{ scale: [ .55, 1.08, 1 ], rotate: 0 }}
          transition={{ duration: .7, ease: 'easeOut' }}
        >
          <Image src="/assets/sea-raider/wild.png" alt="" fill sizes="92px" className="object-contain" />
        </motion.div>
        <p className="wild-surge-announcement__eyebrow">THE BONUS FINALE</p>
        <h2 className="wild-surge-announcement__title">WILD SURGE!</h2>
        <p className="wild-surge-announcement__detail">{wildCount} Wilds gathered · {linesAwarded} {linesAwarded === 1 ? 'row' : 'rows'} charged</p>
        <motion.div className="wild-surge-announcement__rule" initial={{ scaleX: .1 }} animate={{ scaleX: 1 }} transition={{ delay: .15, duration: .45 }} />
        <p className="wild-surge-announcement__hint">SURGE SPIN INCOMING</p>
      </motion.div>
    </motion.div>
  );
}
