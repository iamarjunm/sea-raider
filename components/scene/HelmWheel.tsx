'use client';

import React, { useEffect, useRef } from 'react';

interface HelmWheelProps {
  isSpinning: boolean;
  isTurbo?: boolean;
  className?: string;
  /** Squash applied to match the painted perspective (1 = face-on). */
  squash?: number;
  /** Peak idle swing in degrees. */
  idleSwing?: number;
}

/**
 * The frame's ship's wheel. At rest a helmsman works it back and forth against the
 * swell; while the reels spin it is spun hard over, then springs back to the idle
 * sway as they land. Driven by rAF so the hand-off is continuous (no snapping).
 */
export default function HelmWheel({ isSpinning, isTurbo = false, className = '', squash = 0.88, idleSwing = 24 }: HelmWheelProps) {
  const wheelRef = useRef<HTMLImageElement>(null);
  const spinRef = useRef({ isSpinning, isTurbo });

  useEffect(() => {
    spinRef.current = { isSpinning, isTurbo };
  }, [isSpinning, isTurbo]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let angle = 0;
    let velocity = 0;
    let last = performance.now();
    let frame = 0;
    const start = last;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const { isSpinning: spinning, isTurbo: turbo } = spinRef.current;
      if (spinning) {
        const target = turbo ? 760 : 460;
        velocity += (target - velocity) * Math.min(1, dt * 3.2);
      } else {
        const idle = idleSwing * Math.sin(t * 0.48) + idleSwing * 0.3 * Math.sin(t * 1.21 + 1.1);
        const base = Math.round((angle - idle) / 360) * 360;
        const target = base + idle;
        // Lightly under-damped spring: the wheel overshoots a touch, like a real helm.
        velocity += (7 * (target - angle) - 4.2 * velocity) * dt;
      }
      angle += velocity * dt;
      el.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [idleSwing]);

  return (
    <div className={`helm-wheel ${className}`} style={{ transform: `translate(-50%, -50%) scaleY(${squash})` }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={wheelRef} src="/assets/sea-raider/scene/helm-wheel.png" alt="" draggable={false} className="helm-wheel__img" />
    </div>
  );
}
