'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Square } from 'lucide-react';
import { toSocialText } from '../../lib/currency';

export interface PixiSpinButtonProps {
  onSpin: () => void;
  isSpinning: boolean;
  disabled?: boolean;
  isBonusActive?: boolean;
  bonusSpinsRemaining?: number;
  bonusTotalSpins?: number;
  bonusFinale?: boolean;
  isAutoActive?: boolean;
  isTurbo?: boolean;
  isReady?: boolean;
  isSocial?: boolean;
  className?: string;
  assetSrc?: string;
  spinLabel?: string;
  ariaLabel?: string;
}

/**
 * Self-contained ship's-helm wheel Spin Button for the universal bet bar.
 * - Idle state: subtle helmsman sway with matte brass bezel and sea-glass teal medallion.
 * - Press state: tactile anticipation squash and spring release.
 * - Spinning state: continuous wheel rotation with smooth angular acceleration/deceleration
 *   and a crisp stop-state emblem inside the medallion.
 * - Bonus state: displays BONUS / SURGE and remaining spin counter.
 */
export default function PixiSpinButton({
  onSpin,
  isSpinning,
  disabled = false,
  isBonusActive = false,
  bonusSpinsRemaining = 0,
  bonusTotalSpins = 0,
  bonusFinale = false,
  isAutoActive = false,
  isTurbo = false,
  isReady,
  isSocial = false,
  className = '',
  assetSrc = '/assets/sea-raider/scene/helm-wheel.png',
  spinLabel,
  ariaLabel,
}: PixiSpinButtonProps) {
  const wheelRef = useRef<HTMLImageElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const wheelSpinning = isSpinning || isAutoActive;
  const readyState = isReady ?? (!disabled && !isSpinning && !isAutoActive && !isBonusActive);
  const stateRef = useRef({ spinning: wheelSpinning, turbo: isTurbo, pressed: isPressed });

  useEffect(() => {
    stateRef.current = { spinning: wheelSpinning, turbo: isTurbo, pressed: isPressed };
  }, [wheelSpinning, isTurbo, isPressed]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.transform = 'rotate(0deg)';
      return;
    }

    let angle = 0;
    let velocity = 0;
    let last = performance.now();
    const start = last;
    let frame = 0;
    const idleSwing = 5.5;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const { spinning, turbo, pressed } = stateRef.current;

      if (spinning) {
        const targetVelocity = turbo ? 720 : 440;
        velocity += (targetVelocity - velocity) * Math.min(1, dt * 4.2);
      } else if (pressed) {
        // Subtle anticipation wind-up when pressed down
        const base = Math.round(angle / 360) * 360;
        const target = base - 14;
        velocity += (18 * (target - angle) - 6.5 * velocity) * dt;
      } else {
        const idle =
          idleSwing * Math.sin(t * 0.52) +
          idleSwing * 0.28 * Math.sin(t * 1.18 + 0.9);
        const base = Math.round((angle - idle) / 360) * 360;
        const target = base + idle;
        // Lightly under-damped spring so the helm settles with natural weight
        velocity += (8.5 * (target - angle) - 4.8 * velocity) * dt;
      }

      angle += velocity * dt;
      el.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const resolvedAriaLabel =
    ariaLabel ||
    (isBonusActive
      ? bonusFinale
        ? 'Wild Surge final spin in progress'
        : `Bonus in progress, ${bonusSpinsRemaining} spins remaining`
      : isSpinning
      ? toSocialText('Spin in progress', isSocial)
      : toSocialText('Spin', isSocial));

  const resolvedSpinText = spinLabel ?? toSocialText('SPIN', isSocial);

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onSpin();
      }}
      onPointerDown={() => {
        if (!disabled) setIsPressed(true);
      }}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      className={`console-spin group relative flex shrink-0 flex-col items-center justify-center overflow-visible border-0 text-center ${
        isBonusActive ? 'console-spin--bonus' : ''
      } ${readyState ? 'console-spin--ready' : ''} ${
        isSpinning ? 'console-spin--spinning' : ''
      } ${isPressed ? 'console-spin--pressed' : ''} ${className}`}
    >
      <span className="console-spin__ripple" aria-hidden="true" />
      <span className="console-spin__ripple console-spin__ripple--late" aria-hidden="true" />

      <div className="helm-wheel console-spin__helm" style={{ transform: 'translate(-50%, -50%)' }} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={wheelRef}
          src={assetSrc}
          alt=""
          draggable={false}
          className="helm-wheel__img"
        />
      </div>

      <span className="console-spin__medallion" aria-hidden="true" />

      {isBonusActive ? (
        <>
          <span className="console-spin-label relative z-10">
            {bonusFinale ? 'SURGE' : 'BONUS'}
          </span>
          <span className="console-spin-count relative z-10 tabular-nums">
            {bonusFinale ? 'FINAL' : `${bonusSpinsRemaining}/${bonusTotalSpins}`}
          </span>
        </>
      ) : isSpinning ? (
        <span className="console-spin-stop relative z-10 flex flex-col items-center justify-center gap-0.5" aria-hidden="true">
          <Square size={14} strokeWidth={2.2} fill="currentColor" className="console-spin-stop__icon" />
          <span className="console-spin-stop__label">STOP</span>
        </span>
      ) : (
        <span className="console-spin-label relative z-10">{resolvedSpinText}</span>
      )}
    </button>
  );
}
