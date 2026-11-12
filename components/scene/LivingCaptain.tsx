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
 * The sword captain as a lightly rigged puppet built from the single painting:
 *  - the whole figure breathes and leans with the ship
 *  - the sword arm is a separate layer that rises and settles from the shoulder
 *  - his bandana tails and sash ripple in the wind (animated displacement)
 *  - lantern firelight flickers across him and a glint runs along the blade
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
        {/* Body keeps everything below the raised arm; the arm layer owns the rest. */}
        <clipPath id={`body-${id}`} clipPathUnits="userSpaceOnUse">
          <polygon points={`0,600 300,580 320,460 400,300 560,215 ${W},45 ${W},${H} 0,${H}`} />
        </clipPath>
        <clipPath id={`arm-${id}`} clipPathUnits="userSpaceOnUse">
          <polygon points={`-40,-40 ${W + 40},-40 ${W + 40},45 560,215 400,300 320,460 300,620 360,900 -40,900`} />
        </clipPath>
        <linearGradient id={`armfade-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset="0.43" stopColor="#fff" />
          <stop offset="0.56" stopColor="#000" />
        </linearGradient>
        <mask id={`armmask-${id}`} maskUnits="userSpaceOnUse" x="-80" y="-80" width={W + 160} height={H + 160}>
          <rect x="-80" y="-80" width={W + 160} height={H + 160} fill={ref('armfade')} />
        </mask>
        <clipPath id={`blade-${id}`} clipPathUnits="userSpaceOnUse">
          <polygon points="330,170 1050,-20 1100,40 410,300" />
        </clipPath>
        <mask id={`alpha-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} style={{ maskType: 'alpha' }}>
          <image href={SRC} width={W} height={H} />
        </mask>
        <radialGradient id={`ribbonfeather-${id}`} gradientUnits="userSpaceOnUse" cx="415" cy="575" r="150">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`ribbonmask-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect x="0" y="0" width={W} height={H} fill={ref('ribbonfeather')} />
        </mask>
        <radialGradient id={`sashfeather-${id}`} gradientUnits="userSpaceOnUse" cx="250" cy="1400" r="330">
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`sashmask-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect x="0" y="0" width={W} height={H} fill={ref('sashfeather')} />
        </mask>
        <filter id={`flutter-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="3" result="wind">
            <animate attributeName="baseFrequency" dur="2.6s" values="0.012 0.03;0.016 0.038;0.012 0.03" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="wind" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <linearGradient id={`glint-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fffbe8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`firelight-${id}`} gradientUnits="userSpaceOnUse" cx="-120" cy="820" r="900">
          <stop offset="0" stopColor="#ffb357" stopOpacity="0.75" />
          <stop offset="0.6" stopColor="#ff8a2a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`moonlight-${id}`} gradientUnits="userSpaceOnUse" cx="1250" cy="200" r="900">
          <stop offset="0" stopColor="#8fd8ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#8fd8ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="living-captain__body">
        <image href={SRC} width={W} height={H} clipPath={ref('body')} />

        <g mask={ref('sashmask')}>
          <g filter={ref('flutter')}>
            <image href={SRC} width={W} height={H} clipPath={ref('body')} />
          </g>
        </g>

        <g mask={ref('ribbonmask')}>
          <g filter={ref('flutter')}>
            <image href={SRC} width={W} height={H} clipPath={ref('body')} />
          </g>
        </g>

        <g className="living-captain__arm" clipPath={ref('arm')} mask={ref('armmask')}>
          <image href={SRC} width={W} height={H} />
          <g clipPath={ref('blade')} mask={ref('alpha')}>
            <rect className="living-captain__glint" x="-260" y="-200" width="220" height="760" fill={ref('glint')} transform="rotate(20)" />
          </g>
        </g>

        <g mask={ref('alpha')} className="living-captain__light">
          <rect className="living-captain__fire" width={W} height={H} fill={ref('firelight')} />
          <rect width={W} height={H} fill={ref('moonlight')} />
        </g>
      </g>
    </svg>
  );
}
