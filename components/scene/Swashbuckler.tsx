'use client';

import React, { useEffect, useId } from 'react';
import { soundManager } from '../../lib/audio';

// Source art is 1199x1312; the layers are exported at 62% but drawn in source units.
const W = 1199;
const H = 1312;
const PIVOT = { x: 480, y: 545 }; // elbow: the forearm + cutlass swing from here
const BLADE_R = 470;

// Sword angle at rest (pivot -> tip), plus the wind-up / slash rotations used in CSS.
const REST_DEG = 129.5;
const WINDUP_DEG = 100;
const SLASH_DEG = -28;

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: PIVOT.x + Math.cos(a) * r, y: PIVOT.y + Math.sin(a) * r };
}

interface SwashbucklerProps {
  /** Two slashes for bigger hauls. */
  double?: boolean;
  /** Delay before the first wind-up, in seconds (lets him land first). */
  delay?: number;
  className?: string;
}

/**
 * The cartoon swashbuckler as a two-layer puppet: the body sways while the sword
 * forearm winds up over his head and cuts down across the screen, leaving a bright
 * crescent trail and a spark burst at the blade tip.
 */
export default function Swashbuckler({ double = false, delay = 0.35, className = '' }: SwashbucklerProps) {
  const id = `sw${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const cycle = double ? 1.25 : 1.6;

  useEffect(() => {
    // The cut lands ~40% into each cycle.
    const hits = double ? [0, 1] : [0];
    const timers = hits.map((n) => setTimeout(() => soundManager.playSwordSlash(), (delay + cycle * (n + 0.4)) * 1000));
    return () => timers.forEach(clearTimeout);
  }, [cycle, delay, double]);

  const from = polar(REST_DEG + WINDUP_DEG + 4, BLADE_R);
  const to = polar(REST_DEG + SLASH_DEG, BLADE_R);
  const inner = polar(REST_DEG + SLASH_DEG + 8, BLADE_R - 70);
  const innerFrom = polar(REST_DEG + WINDUP_DEG - 4, BLADE_R - 70);
  // Crescent: outer arc counter-clockwise from the raised sword to the cut, back along an inner arc.
  const crescent = `M${from.x},${from.y} A${BLADE_R},${BLADE_R} 0 0 0 ${to.x},${to.y} L${inner.x},${inner.y} A${BLADE_R - 70},${BLADE_R - 70} 0 0 1 ${innerFrom.x},${innerFrom.y} Z`;
  const arc = `M${from.x},${from.y} A${BLADE_R},${BLADE_R} 0 0 0 ${to.x},${to.y}`;

  const style = {
    '--swash-cycle': `${cycle}s`,
    '--swash-delay': `${delay}s`,
    '--swash-count': double ? 2 : 1,
  } as React.CSSProperties;

  return (
    <svg
      viewBox={`0 0 ${W + 120} ${H + 60}`}
      preserveAspectRatio="xMidYMax meet"
      className={`swashbuckler h-full w-full overflow-visible ${className}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-trail`} gradientUnits="userSpaceOnUse" cx={PIVOT.x} cy={PIVOT.y} r={BLADE_R}>
          <stop offset="0.7" stopColor="#7ff3ff" stopOpacity="0" />
          <stop offset="0.88" stopColor="#c8fbff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Art is offset by (80, 40) inside the viewBox; scene.css pivots account for it. */}
      <g transform="translate(80 40)">
      <ellipse className="swashbuckler__shadow" cx="640" cy="1288" rx="300" ry="26" />

      <g className="swashbuckler__body">
        <image href="/assets/sea-raider/scene/swashbuckler-body.webp" width={W} height={H} />
        <g className="swashbuckler__arm">
          <image href="/assets/sea-raider/scene/swashbuckler-arm.webp" width={W} height={H} />
        </g>
        <g className="swashbuckler__trail" filter={`url(#${id}-glow)`}>
          <path d={crescent} fill={`url(#${id}-trail)`} />
          <path d={arc} className="swashbuckler__trail-edge" pathLength={1} fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
        </g>
        <g transform={`translate(${to.x} ${to.y})`}>
          <g className="swashbuckler__spark">
            <path d="M0-70L12-12 70 0 12 12 0 70-12 12-70 0-12-12Z" fill="#fff8d6" />
            <circle r="22" fill="#ffffff" />
          </g>
        </g>
      </g>
      </g>
    </svg>
  );
}
