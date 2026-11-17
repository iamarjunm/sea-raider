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
const WINDUP_DEG = 104;
const SLASH_DEG = -32;

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: PIVOT.x + Math.cos(a) * r, y: PIVOT.y + Math.sin(a) * r };
}

const IMPACT_SHARDS = [
  { dx: -115, dy: -65, rot: -38, len: 38, color: '#ffffff' },
  { dx: -145, dy: 18, rot: 12, len: 46, color: '#fde68a' },
  { dx: -95, dy: 92, rot: 48, len: 34, color: '#7dd3fc' },
  { dx: -42, dy: -110, rot: -68, len: 30, color: '#fde68a' },
  { dx: 55, dy: 85, rot: 64, len: 36, color: '#ffffff' },
  { dx: -165, dy: -22, rot: -12, len: 42, color: '#fef08a' },
];

interface SwashbucklerProps {
  /** Two slashes for bigger hauls. */
  double?: boolean;
  /** Delay before the first wind-up, in seconds (lets him land first). */
  delay?: number;
  /** Optional explicit mode; defaults to 'scatter' when used with captain-scatter-figure. */
  variant?: 'cameo' | 'scatter';
  className?: string;
}

/**
 * The swashbuckler as an articulated two-layer character rig:
 *  - Anticipation crouch & lean-back while the cutlass winds up overhead
 *  - Lunge along a curved motion arc with a fast downward cutlass slash
 *  - Crisp multi-layered SVG arc swipe trail (zero Gaussian blur)
 *  - ~80ms hit-stop freeze on impact with directional sparks & shards
 *  - Overshoot follow-through, recovery, and exit
 */
export default function Swashbuckler({ double = false, delay = 0.35, variant, className = '' }: SwashbucklerProps) {
  const id = `sw${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const isScatter = variant === 'scatter' || className.includes('captain-scatter-figure');
  const effectiveDelay = isScatter ? 0.08 : delay;
  const cycle = isScatter ? 2.45 : double ? 1.85 : 2.25;

  useEffect(() => {
    const hits = !isScatter && double ? [0, 1] : [0];
    const slashOffset = isScatter ? 0.56 : cycle * 0.36;
    const timers = hits.map((n) =>
      setTimeout(() => soundManager.playSwordSlash(), (effectiveDelay + n * cycle + slashOffset) * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [cycle, double, effectiveDelay, isScatter]);

  const from = polar(REST_DEG + WINDUP_DEG + 4, BLADE_R);
  const to = polar(REST_DEG + SLASH_DEG, BLADE_R);
  const inner = polar(REST_DEG + SLASH_DEG + 10, BLADE_R - 64);
  const innerFrom = polar(REST_DEG + WINDUP_DEG - 6, BLADE_R - 64);

  const ribbonTo = polar(REST_DEG + SLASH_DEG + 16, BLADE_R - 22);
  const ribbonFrom = polar(REST_DEG + WINDUP_DEG - 10, BLADE_R - 22);
  const ribbonInner = polar(REST_DEG + SLASH_DEG + 24, BLADE_R - 92);
  const ribbonInnerFrom = polar(REST_DEG + WINDUP_DEG - 18, BLADE_R - 92);

  // Crisp outer crescent & inner secondary gold ribbon arc (pure vector geometry, no blur filter).
  const crescent = `M${from.x.toFixed(1)},${from.y.toFixed(1)} A${BLADE_R},${BLADE_R} 0 0 0 ${to.x.toFixed(1)},${to.y.toFixed(1)} L${inner.x.toFixed(1)},${inner.y.toFixed(1)} A${BLADE_R - 64},${BLADE_R - 64} 0 0 1 ${innerFrom.x.toFixed(1)},${innerFrom.y.toFixed(1)} Z`;
  const innerRibbon = `M${ribbonFrom.x.toFixed(1)},${ribbonFrom.y.toFixed(1)} A${BLADE_R - 22},${BLADE_R - 22} 0 0 0 ${ribbonTo.x.toFixed(1)},${ribbonTo.y.toFixed(1)} L${ribbonInner.x.toFixed(1)},${ribbonInner.y.toFixed(1)} A${BLADE_R - 92},${BLADE_R - 92} 0 0 1 ${ribbonInnerFrom.x.toFixed(1)},${ribbonInnerFrom.y.toFixed(1)} Z`;
  const arc = `M${from.x.toFixed(1)},${from.y.toFixed(1)} A${BLADE_R},${BLADE_R} 0 0 0 ${to.x.toFixed(1)},${to.y.toFixed(1)}`;
  const innerArc = `M${innerFrom.x.toFixed(1)},${innerFrom.y.toFixed(1)} A${BLADE_R - 54},${BLADE_R - 54} 0 0 0 ${inner.x.toFixed(1)},${inner.y.toFixed(1)}`;

  const style = {
    '--swash-cycle': `${cycle}s`,
    '--swash-delay': `${effectiveDelay}s`,
    '--swash-count': !isScatter && double ? 2 : 1,
  } as React.CSSProperties;

  return (
    <svg
      viewBox={`0 0 ${W + 120} ${H + 60}`}
      preserveAspectRatio="xMidYMax meet"
      className={`swashbuckler ${isScatter ? 'swashbuckler--scatter' : ''} h-full w-full overflow-visible ${className}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-trail`} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="0.32" stopColor="#bae6fd" stopOpacity="0.65" />
          <stop offset="0.72" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="1" stopColor="#fef08a" stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${id}-gold-ribbon`} gradientUnits="userSpaceOnUse" x1={ribbonFrom.x} y1={ribbonFrom.y} x2={ribbonTo.x} y2={ribbonTo.y}>
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="0.88" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Art is offset by (80, 40) inside the viewBox; scene.css pivots account for it. */}
      <g transform="translate(80 40)">
        <ellipse className="swashbuckler__shadow" cx="640" cy="1288" rx="285" ry="22" />

        <g className="swashbuckler__body">
          <image href="/assets/sea-raider/scene/swashbuckler-body.webp" width={W} height={H} />
          <g className="swashbuckler__arm">
            <image href="/assets/sea-raider/scene/swashbuckler-arm.webp" width={W} height={H} />
          </g>
          <g className="swashbuckler__trail">
            <path d={innerRibbon} fill={`url(#${id}-gold-ribbon)`} />
            <path d={crescent} fill={`url(#${id}-trail)`} />
            <path d={innerArc} className="swashbuckler__trail-edge swashbuckler__trail-edge--inner" pathLength={1} fill="none" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" />
            <path d={arc} className="swashbuckler__trail-edge" pathLength={1} fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" />
          </g>
          <g transform={`translate(${to.x.toFixed(1)} ${to.y.toFixed(1)})`}>
            <g className="swashbuckler__spark">
              <path d="M0-78L11-14 78 0 11 14 0 78-11 14-78 0-11-14Z" fill="#fef08a" />
              <path d="M-44-44L-6-10 44-44 10-6 44 44 6 10-44 44-10 6Z" fill="#ffffff" />
              <circle r="18" fill="#ffffff" />
            </g>
            {IMPACT_SHARDS.map((s, idx) => (
              <g
                key={idx}
                className="swashbuckler__shard"
                style={
                  {
                    '--shard-dx': `${s.dx}px`,
                    '--shard-dy': `${s.dy}px`,
                    '--shard-rot': `${s.rot}deg`,
                  } as React.CSSProperties
                }
              >
                <polygon points={`0,-4 ${s.len},0 0,4 -8,0`} fill={s.color} />
              </g>
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
}
