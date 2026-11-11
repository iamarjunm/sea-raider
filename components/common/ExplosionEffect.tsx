'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ExplosionItem {
  id: string;
  xPercent: number; // 0..100% within grid
  yPercent: number; // 0..100% within grid
  type: 'wild' | 'bigwin';
  label?: string;
}

interface ExplosionEffectProps {
  explosions: ExplosionItem[];
  onComplete?: (id: string) => void;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  rotation: number;
  isCoin: boolean;
}

// Deterministic pseudo-random helper to comply with React 19 component purity
function pseudoRandom(seed: number) {
  const x = Math.sin(seed + 1.618) * 10000;
  return x - Math.floor(x);
}

function SingleExplosion({
  item,
  onComplete,
}: {
  item: ExplosionItem;
  onComplete?: (id: string) => void;
}) {
  const particles: Particle[] = useMemo(() => {
    const count = item.type === 'bigwin' ? 28 : 18;
    const colors =
      item.type === 'bigwin'
        ? ['#f59e0b', '#fbbf24', '#fef08a', '#fb7185', '#38bdf8']
        : ['#f59e0b', '#fbbf24', '#fef08a', '#ea580c', '#ffffff'];

    return Array.from({ length: count }, (_, i) => {
      const r1 = pseudoRandom(i * 17 + 1);
      const r2 = pseudoRandom(i * 23 + 2);
      const r3 = pseudoRandom(i * 31 + 3);
      const r4 = pseudoRandom(i * 41 + 4);
      const r5 = pseudoRandom(i * 47 + 5);

      const angle = (i / count) * 2 * Math.PI + (r1 - 0.5) * 0.4;
      const distance = 50 + r2 * (item.type === 'bigwin' ? 140 : 90);
      const size = 6 + r3 * 8;
      const color = colors[Math.floor(r4 * colors.length)];
      const rotation = r5 * 720 - 360;
      const isCoin = i % 3 === 0;

      return {
        id: i,
        angle,
        distance,
        size,
        color,
        rotation,
        isCoin,
      };
    });
  }, [item.type]);

  return (
    <div
      className="absolute pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
    >
      {/* 1. Core expanding shockwave ring */}
      <motion.div
        initial={{ scale: 0.1, opacity: 1 }}
        animate={{ scale: item.type === 'bigwin' ? 3.5 : 2.5, opacity: 0 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
        onAnimationComplete={() => onComplete?.(item.id)}
        className="absolute -inset-16 rounded-full border-2 border-amber-300 pointer-events-none"
        style={{
          background:
            item.type === 'bigwin'
              ? 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(225,29,72,0.3) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(234,88,12,0.3) 50%, transparent 75%)',
          boxShadow: '0 0 30px rgba(245,158,11,0.9), inset 0 0 20px rgba(251,191,36,0.8)',
        }}
      />

      {/* 2. Secondary fast light burst flash */}
      <motion.div
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute -inset-10 rounded-full bg-amber-200/90 blur-sm pointer-events-none"
      />

      {/* 3. Flying particle shards and doubloons */}
      {particles.map((p) => {
        const targetX = Math.cos(p.angle) * p.distance;
        const targetY = Math.sin(p.angle) * p.distance;

        return (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{
              x: targetX,
              y: targetY + 30, // slight gravity drop
              scale: [1, 1.3, 0],
              opacity: [1, 0.9, 0],
              rotate: p.rotation,
            }}
            transition={{ duration: 0.85, ease: [0.15, 0.85, 0.35, 1.0] }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
            style={{ width: p.size, height: p.size }}
          >
            {p.isCoin ? (
              <div
                className="w-full h-full rounded-full border border-yellow-200 shadow-[0_0_8px_#f59e0b]"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fef08a, #d97706)',
                }}
              />
            ) : (
              <div
                className="w-full h-full rounded-sm rotate-45 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                style={{ backgroundColor: p.color }}
              />
            )}
          </motion.div>
        );
      })}

    </div>
  );
}

export default function ExplosionEffect({
  explosions,
  onComplete,
}: ExplosionEffectProps) {
  if (!explosions || explosions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-40">
      <AnimatePresence>
        {explosions.map((item) => (
          <SingleExplosion key={item.id} item={item} onComplete={onComplete} />
        ))}
      </AnimatePresence>
    </div>
  );
}
