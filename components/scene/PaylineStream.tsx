'use client';

import React, { useId, useMemo } from 'react';
import { motion } from 'motion/react';

interface PaylineStreamProps {
  /** Payline cells as [reel, row]. */
  line: number[][];
  /** Cells that actually paid (the stream splashes on these). */
  hitCells: number[][];
  /** Changes whenever a new line is shown, to replay the pour. */
  streamKey: string;
}

const CELL_W = 200;
const CELL_H = 200;

/** Catmull-Rom through the points, emitted as cubic Bezier segments. */
function smoothPath(points: [number, number][]) {
  if (points.length < 2) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.5;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t * 2, p1[1] + ((p2[1] - p0[1]) / 6) * t * 2];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t * 2, p2[1] - ((p3[1] - p1[1]) / 6) * t * 2];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  r: 2.5 + ((i * 37) % 5),
  dur: 1.5 + ((i * 13) % 7) / 10,
  begin: (i * 0.17) % 1.6,
  dy: ((i * 29) % 11) - 5,
}));

const DROPS = Array.from({ length: 7 }, (_, i) => {
  const a = (-150 + i * 20) * (Math.PI / 180);
  return { x: Math.cos(a) * (34 + (i % 3) * 10), y: Math.sin(a) * (40 + (i % 2) * 14) };
});

/**
 * A winning payline drawn as a stream of sea water: a translucent channel that
 * pours in from the left, a bright current flowing along it, foam bubbles riding
 * the flow, and a splash ring with droplets on every paying symbol.
 */
export default function PaylineStream({ line, hitCells, streamKey }: PaylineStreamProps) {
  const uid = `ps${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const points = useMemo<[number, number][]>(() => {
    const centers = line.map(([c, r]) => [(c + 0.5) * CELL_W, (r + 0.5) * CELL_H] as [number, number]);
    if (centers.length === 0) return [];
    const first = centers[0];
    const last = centers[centers.length - 1];
    return [[-30, first[1]], ...centers, [1030, last[1]]];
  }, [line]);
  const d = useMemo(() => smoothPath(points), [points]);
  if (!d) return null;

  const pathId = `stream-path-${uid}`;
  return (
    <svg key={streamKey} className="payline-stream absolute inset-0 z-30 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`stream-body-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b6f84" />
          <stop offset=".35" stopColor="#1cb7c4" />
          <stop offset=".65" stopColor="#38d6d8" />
          <stop offset="1" stopColor="#0f7f94" />
        </linearGradient>
        <filter id={`stream-ripple-${uid}`} x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.06" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`stream-glow-${uid}`} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <path id={pathId} d={d} />
      </defs>

      {/* Glow under the water */}
      <motion.path
        d={d}
        fill="none"
        stroke="#3fe0e6"
        strokeOpacity={0.45}
        strokeWidth={34}
        strokeLinecap="round"
        filter={`url(#stream-glow-${uid})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.42, ease: [0.3, 0.8, 0.4, 1] }}
      />
      {/* The channel of water itself, with rippled edges */}
      <g filter={`url(#stream-ripple-${uid})`}>
        <motion.path
          d={d}
          fill="none"
          stroke="#05323f"
          strokeOpacity={0.6}
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.42, ease: [0.3, 0.8, 0.4, 1] }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke={`url(#stream-body-${uid})`}
          strokeWidth={15}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.42, ease: [0.3, 0.8, 0.4, 1] }}
        />
      </g>
      {/* Current: bright streaks flowing along the line */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.25 }}>
        <path d={d} className="payline-stream__current" fill="none" stroke="#e9fffd" strokeOpacity={0.9} strokeWidth={4} strokeLinecap="round" strokeDasharray="34 46" />
        <path d={d} className="payline-stream__current payline-stream__current--slow" fill="none" stroke="#9ff3ee" strokeOpacity={0.55} strokeWidth={7} strokeLinecap="round" strokeDasharray="10 70" />
        {BUBBLES.map((b, i) => (
          <circle key={i} r={b.r} cy={b.dy} fill="#f2fffe" fillOpacity={0.75} stroke="#7fe9e8" strokeWidth={1}>
            <animateMotion dur={`${b.dur}s`} begin={`${b.begin}s`} repeatCount="indefinite" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        ))}
      </motion.g>

      {/* Splashes on every paying cell, in order along the line */}
      {hitCells.map(([c, r]) => {
        const cx = (c + 0.5) * CELL_W;
        const cy = (r + 0.5) * CELL_H;
        const delay = 0.12 + (cx / 1000) * 0.32;
        return (
          <g key={`${c}-${r}`} transform={`translate(${cx} ${cy})`}>
            <motion.ellipse
              rx={60}
              ry={60}
              fill="none"
              stroke="#bdfcf7"
              strokeWidth={5}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.25], opacity: [0, 0.95, 0] }}
              transition={{ delay, duration: 0.7, ease: 'easeOut' }}
            />
            <motion.ellipse
              rx={46}
              ry={46}
              fill="none"
              stroke="#3fe0e6"
              strokeWidth={3}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.45], opacity: [0, 0.7, 0] }}
              transition={{ delay: delay + 0.12, duration: 0.8, ease: 'easeOut' }}
            />
            {DROPS.map((drop, j) => (
              <motion.circle
                key={j}
                r={j % 2 ? 4 : 5.5}
                fill="#e6fffc"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: [0, drop.x * 0.7, drop.x], y: [0, drop.y, drop.y + 46], opacity: [0, 1, 0] }}
                transition={{ delay: delay + 0.02 * j, duration: 0.62, ease: 'easeOut', times: [0, 0.45, 1] }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
