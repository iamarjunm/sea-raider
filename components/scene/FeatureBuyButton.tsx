'use client';

import React from 'react';
import Image from 'next/image';
import { toSocialText } from '../../lib/currency';

interface FeatureBuyButtonProps {
  onClick: () => void;
  isSocial: boolean;
  activeModeName?: string | null;
  compact?: boolean;
}

/**
 * The "Get Bonus" entry point as a carved mahogany-and-brass treasure plaque:
 * a chest crest over a riveted crimson-and-brass signboard with crisp engraved lettering.
 */
export default function FeatureBuyButton({
  onClick,
  isSocial,
  activeModeName,
  compact = false,
}: FeatureBuyButtonProps) {
  const label = isSocial ? 'PLAY FEATURE' : 'GET BONUS';
  return (
    <button
      type="button"
      onClick={onClick}
      title={toSocialText('Select a Feature Mode', isSocial)}
      aria-label={toSocialText('Select Feature Mode', isSocial)}
      className={`feature-buy ${compact ? 'feature-buy--compact' : ''} ${
        activeModeName ? 'feature-buy--active' : ''
      }`}
    >
      <span className="feature-buy__glow" aria-hidden="true" />
      <span className="feature-buy__chest" aria-hidden="true">
        <Image
          src="/assets/sea-raider/treasure-chest.png"
          alt=""
          fill
          sizes="96px"
          className="object-contain"
        />
        <span className="feature-buy__sparkle feature-buy__sparkle--a" />
        <span className="feature-buy__sparkle feature-buy__sparkle--b" />
      </span>
      <span className="feature-buy__banner">
        <span className="feature-buy__rivet feature-buy__rivet--tl" aria-hidden="true" />
        <span className="feature-buy__rivet feature-buy__rivet--tr" aria-hidden="true" />
        <span className="feature-buy__rivet feature-buy__rivet--bl" aria-hidden="true" />
        <span className="feature-buy__rivet feature-buy__rivet--br" aria-hidden="true" />
        <span className="feature-buy__label">{label}</span>
        <span className="feature-buy__sub">
          {activeModeName ? (
            <>
              <span className="feature-buy__gem" aria-hidden="true" />
              {activeModeName} ON
            </>
          ) : (
            toSocialText('FEATURE MODES', isSocial)
          )}
        </span>
        <span className="feature-buy__sheen" aria-hidden="true" />
      </span>
    </button>
  );
}
