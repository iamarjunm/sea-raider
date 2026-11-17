'use client';

import React, { useId } from 'react';

const SRC = '/assets/sea-raider/sword-captain.png';
const W = 1086;
const H = 1448;

interface LivingCaptainProps {
  className?: string;
  /** Raise the sword arm higher and faster (e.g. during the scatter strike). */
  isStriking?: boolean;
  label?: string;
}

/**
 * The sword captain as a poised character rig built from the painted illustration:
 *  - the figure breathes and sways gently with the deck swell (transform-only, zero blur/displacement)
 *  - the free-floating bandana tail sways subtly from its knot pivot in the sea breeze
 *  - warm lantern firelight flickers across him and a crisp glint runs along the cutlass blade
 */
export default function LivingCaptain({ className = '', isStriking = false, label }: LivingCaptainProps) {
  const id = `lc${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ref = (name: string) => `url(#${name}-${id})`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax meet"
      className={`living-captain h-full w-full overflow-visible ${isStriking ? 'living-captain--strike' : ''} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* Base body excludes only the free-floating bandana tips on the left so they can sway without double edges. */}
        <clipPath id={`body-${id}`} clipPathUnits="userSpaceOnUse">
          <polygon points={`0,0 ${W},0 ${W},${H} 0,${H} 0,452 442,452 478,352 280,352 280,452 0,452`} />
        </clipPath>
        <clipPath id={`ribbon-${id}`} clipPathUnits="userSpaceOnUse">
          <polygon points="280,352 478,352 442,452 280,452" />
        </clipPath>
        <clipPath id={`blade-${id}`} clipPathUnits="userSpaceOnUse">
          <polygon points="330,170 1050,-20 1100,40 410,300" />
        </clipPath>
        <mask id={`alpha-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} style={{ maskType: 'alpha' }}>
          <image href={SRC} width={W} height={H} />
        </mask>
        <linearGradient id={`glint-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fffbe8" stopOpacity="0.92" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`firelight-${id}`} gradientUnits="userSpaceOnUse" cx="-120" cy="820" r="900">
          <stop offset="0" stopColor="#ffb357" stopOpacity="0.62" />
          <stop offset="0.58" stopColor="#ff8a2a" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`moonlight-${id}`} gradientUnits="userSpaceOnUse" cx="1250" cy="200" r="900">
          <stop offset="0" stopColor="#8fd8ff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8fd8ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="living-captain__body">
        <image href={SRC} width={W} height={H} clipPath={ref('body')} />

        <g className="living-captain__ribbon" clipPath={ref('ribbon')}>
          <image href={SRC} width={W} height={H} />
        </g>

        <g clipPath={ref('blade')} mask={ref('alpha')}>
          <rect className="living-captain__glint" x="-260" y="-200" width="220" height="760" fill={ref('glint')} transform="rotate(20)" />
        </g>

        <g mask={ref('alpha')} className="living-captain__light">
          <rect className="living-captain__fire" width={W} height={H} fill={ref('firelight')} />
          <rect width={W} height={H} fill={ref('moonlight')} />
        </g>
      </g>
    </svg>
  );
}
