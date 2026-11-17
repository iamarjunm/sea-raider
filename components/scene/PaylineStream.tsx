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

/**
 * Builds a crisp path through cell centers with subtle rounded corners at bends
 * so paylines read like precision-machined slot traces rather than wobbly tubes.
 */
function buildPaylinePath(points: [number, number][], extendEnds = false): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;

  const pts: [number, number][] = extendEnds
    ? [
        [Math.max(18, points[0][0] - 58), points[0][1]],
        ...points,
        [Math.min(982, points[points.length - 1][0] + 58), points[points.length - 1][1]],
      ]
    : points;

  const cornerRadius = 22;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const v1x = curr[0] - prev[0];
    const v1y = curr[1] - prev[1];
    const len1 = Math.hypot(v1x, v1y);

    const v2x = next[0] - curr[0];
    const v2y = next[1] - curr[1];
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 1 || len2 < 1) {
      d += ` L${curr[0].toFixed(1)},${curr[1].toFixed(1)}`;
      continue;
    }

    const r = Math.min(cornerRadius, len1 * 0.35, len2 * 0.35);
    const startX = curr[0] - (v1x / len1) * r;
    const startY = curr[1] - (v1y / len1) * r;
    const endX = curr[0] + (v2x / len2) * r;
    const endY = curr[1] + (v2y / len2) * r;

    d += ` L${startX.toFixed(1)},${startY.toFixed(1)} Q${curr[0].toFixed(1)},${curr[1].toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`;
  }

  const last = pts[pts.length - 1];
  d += ` L${last[0].toFixed(1)},${last[1].toFixed(1)}`;
  return d;
}

/**
 * Progressive, hand-crafted slot payline trace:
 * - Draws progressively left-to-right through the winning cell centres
 * - Crisp dark-bronze contrast backing + burnished gold core + travelling specular pulse
 * - Staggered compass-diamond node flares on each winning cell
 */
export default function PaylineStream({ line, hitCells, streamKey }: PaylineStreamProps) {
  const uid = `pl${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const allCenters = useMemo<[number, number][]>(
    () => line.map(([c, r]) => [(c + 0.5) * CELL_W, (r + 0.5) * CELL_H]),
    [line]
  );

  const hitCenters = useMemo<[number, number][]>(() => {
    const sorted = [...hitCells].sort((a, b) => a[0] - b[0]);
    return sorted.map(([c, r]) => [(c + 0.5) * CELL_W, (c >= 0 ? (r + 0.5) * CELL_H : 300)]);
  }, [hitCells]);

  const fullGuidePath = useMemo(() => buildPaylinePath(allCenters, false), [allCenters]);
  const hitTracePath = useMemo(
    () => buildPaylinePath(hitCenters.length >= 2 ? hitCenters : allCenters, false),
    [hitCenters, allCenters]
  );

  if (!fullGuidePath) return null;

  return (
    <svg
      key={streamKey}
      className="payline-stream absolute inset-0 z-[32] h-full w-full overflow-visible pointer-events-none"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`pl-gold-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e5a12b" />
          <stop offset="28%" stopColor="#ffe89b" />
          <stop offset="55%" stopColor="#fff9df" />
          <stop offset="80%" stopColor="#ffd466" />
          <stop offset="100%" stopColor="#d4881c" />
        </linearGradient>
        <linearGradient id={`pl-comet-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffd86e" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#8ef5ec" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`pl-node-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffef4" />
          <stop offset="48%" stopColor="#ffd768" />
          <stop offset="100%" stopColor="#9c5b0e" />
        </radialGradient>
      </defs>

      {/* Subtle full-line guide across all 5 reels so the complete payline pattern is legible */}
      <motion.path
        d={fullGuidePath}
        fill="none"
        stroke="#120903"
        strokeOpacity={0.55}
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={fullGuidePath}
        fill="none"
        stroke="#d89b38"
        strokeOpacity={0.38}
        strokeWidth={2}
        strokeDasharray="8 8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Active winning connection trace: dark casing + burnished gold + bright ivory core */}
      <motion.path
        d={hitTracePath}
        fill="none"
        stroke="#160a02"
        strokeOpacity={0.88}
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={hitTracePath}
        fill="none"
        stroke={`url(#pl-gold-${uid})`}
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={hitTracePath}
        fill="none"
        stroke="#fff9e2"
        strokeOpacity={0.92}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Travelling highlight pulse sweeping left-to-right along the connected payline */}
      <path
        d={hitTracePath}
        className="payline-stream__comet"
        fill="none"
        stroke={`url(#pl-comet-${uid})`}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray="18 82"
      />

      {/* Staggered compass-star nodes at each winning cell centre */}
      {hitCells.map(([c, r]) => {
        const cx = (c + 0.5) * CELL_W;
        const cy = (r + 0.5) * CELL_H;
        const delay = 0.04 + c * 0.065;
        return (
          <g key={`${c}-${r}`} transform={`translate(${cx} ${cy})`}>
            {/* Crisp shockwave ring */}
            <motion.circle
              r={42}
              fill="none"
              stroke="#ffe38e"
              strokeWidth={2.5}
              initial={{ scale: 0.25, opacity: 0 }}
              animate={{ scale: [0.25, 1.18], opacity: [0, 0.85, 0] }}
              transition={{ delay, duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Engraved gold diamond node */}
            <motion.g
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ scale: [0, 1.28, 1], rotate: [0, 0, 0], opacity: 1 }}
              transition={{ delay, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <polygon
                points="0,-13 13,0 0,13 -13,0"
                fill="#1b0d04"
                stroke="#ffd873"
                strokeWidth={2.2}
              />
              <polygon
                points="0,-8 8,0 0,8 -8,0"
                fill={`url(#pl-node-${uid})`}
              />
              <circle r={2.5} fill="#ffffff" />
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}
