'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { formatMoney, toSocialText } from '../../lib/currency';
import { soundManager } from '../../lib/audio';

interface WinCelebrationProps {
  winAmount: number;
  betAmount: number;
  currency: string;
  isSocial: boolean;
  onDismiss: () => void;
  isTotalWin?: boolean;
}

type WinTier = 'big' | 'huge' | 'mega' | 'epic' | 'legendary' | 'total';

interface TierConfig {
  title: string;
  sub: string;
  shortLabel: string;
  badgeAsset: string;
  accentHex: string;
  trimHex: string;
  ribbonBg: string;
  rank: number;
}

const TIER_ORDER: WinTier[] = ['big', 'huge', 'mega', 'epic', 'legendary'];

const TIER_CONFIGS: Record<WinTier, TierConfig> = {
  big: {
    title: 'BIG WIN!',
    sub: 'TREASURE SECURED',
    shortLabel: 'BIG',
    badgeAsset: '/assets/sea-raider/wild.png',
    accentHex: '#e8b44c',
    trimHex: '#2ccfd1',
    ribbonBg: 'linear-gradient(180deg, #6e2214 0%, #461209 58%, #290904 100%)',
    rank: 1,
  },
  huge: {
    title: 'HUGE WIN!',
    sub: 'CHEST OF SPANISH GOLD',
    shortLabel: 'HUGE',
    badgeAsset: '/assets/sea-raider/treasure-chest.png',
    accentHex: '#f2c155',
    trimHex: '#46dfd5',
    ribbonBg: 'linear-gradient(180deg, #0f4c54 0%, #082e35 58%, #04191e 100%)',
    rank: 2,
  },
  mega: {
    title: 'MEGA WIN!',
    sub: 'GALLEON PLUNDER',
    shortLabel: 'MEGA',
    badgeAsset: '/assets/sea-raider/compass.png',
    accentHex: '#ffcf60',
    trimHex: '#e5533d',
    ribbonBg: 'linear-gradient(180deg, #8c1d14 0%, #590f0a 58%, #330604 100%)',
    rank: 3,
  },
  epic: {
    title: 'EPIC WIN!',
    sub: 'SCOURGE OF THE SEAS',
    shortLabel: 'EPIC',
    badgeAsset: '/assets/sea-raider/captain.png',
    accentHex: '#ffe078',
    trimHex: '#ff7847',
    ribbonBg: 'linear-gradient(180deg, #9e1b12 0%, #640d08 55%, #380503 100%)',
    rank: 4,
  },
  legendary: {
    title: 'LEGENDARY WIN!',
    sub: 'ETHEREAL KRAKEN MASTER',
    shortLabel: 'MAX',
    badgeAsset: '/assets/sea-raider/scatter.png',
    accentHex: '#fff0a8',
    trimHex: '#66f7ed',
    ribbonBg: 'linear-gradient(180deg, #5e390e 0%, #382006 55%, #1e1002 100%)',
    rank: 5,
  },
  total: {
    title: 'TOTAL WIN!',
    sub: 'VOYAGE COMPLETED',
    shortLabel: 'TOTAL',
    badgeAsset: '/assets/sea-raider/treasure-chest.png',
    accentHex: '#ffd978',
    trimHex: '#3dd6d0',
    ribbonBg: 'linear-gradient(180deg, #7c1f14 0%, #4c1009 58%, #280704 100%)',
    rank: 5,
  },
};

interface CoinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  spinPhase: number;
  spinSpeed: number;
  rollAngle: number;
  rollSpeed: number;
  bounced: boolean;
  layer: 0 | 1 | 2;
  motif: 0 | 1 | 2;
}

const BURST_PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angleDeg = (i * 360) / 18 + (i % 2 === 0 ? 6 : -6);
  const dist = 125 + (i % 3) * 42;
  const size = i % 3 === 0 ? 9 : i % 2 === 0 ? 6 : 4;
  return { id: i, angleDeg, dist, size, isStar: i % 3 === 0 };
});

export default function WinCelebration({
  winAmount,
  betAmount,
  currency,
  isSocial,
  onDismiss,
  isTotalWin = false,
}: WinCelebrationProps) {
  const [displayedWin, setDisplayedWin] = useState<number>(0);
  const [isCountupFinished, setIsCountupFinished] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<WinTier>(isTotalWin ? 'total' : 'big');
  const [tierShake, setTierShake] = useState<number>(0);

  const shouldReduceMotion = useReducedMotion();
  const multiplier = betAmount > 0 ? winAmount / betAmount : 0;
  const isFinishedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spawnBurstRef = useRef<((count: number, intensity: number) => void) | null>(null);

  // Progressive tier transitions during count-up
  const updateTierForAmount = useCallback(
    (amount: number) => {
      if (isTotalWin) return;
      const currentMult = betAmount > 0 ? amount / betAmount : 0;

      let targetKey: WinTier = 'big';
      if (currentMult >= 80) {
        targetKey = 'legendary';
      } else if (currentMult >= 45) {
        targetKey = 'epic';
      } else if (currentMult >= 25) {
        targetKey = 'mega';
      } else if (currentMult >= 15) {
        targetKey = 'huge';
      } else {
        targetKey = 'big';
      }

      setCurrentTier((prev) => {
        if (prev !== targetKey) {
          soundManager.playWin(true);
          setTierShake((s) => s + 1);
          spawnBurstRef.current?.(32, 1.25);
          return targetKey;
        }
        return prev;
      });
    },
    [betAmount, isTotalWin]
  );

  const handleClickOrSpace = useCallback(() => {
    if (!isFinishedRef.current) {
      // A click fast-forwards the count-up once; the finished amount stays put.
      isFinishedRef.current = true;
      setIsCountupFinished(true);
      setDisplayedWin(winAmount);
      updateTierForAmount(winAmount);
      spawnBurstRef.current?.(28, 1.15);
      soundManager.playWin(true);
    } else {
      onDismiss();
    }
  }, [winAmount, updateTierForAmount, onDismiss]);

  // Keyboard shortcut listener (Space or Enter)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleClickOrSpace();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClickOrSpace]);

  // Progressive rolling count-up effect using Date.now() for rock-solid timing
  useEffect(() => {
    const duration = isTotalWin ? 2200 : Math.min(1800 + multiplier * 15, 3000);
    const startTime = Date.now();

    const countTimer = setInterval(() => {
      if (isFinishedRef.current) {
        clearInterval(countTimer);
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -8 * progress);
      const currentVal = winAmount * ease;

      setDisplayedWin(currentVal);
      updateTierForAmount(currentVal);

      if (progress >= 1) {
        isFinishedRef.current = true;
        setIsCountupFinished(true);
        setDisplayedWin(winAmount);
        updateTierForAmount(winAmount);
        spawnBurstRef.current?.(26, 1.1);
        clearInterval(countTimer);
        soundManager.playWin(true);
      }
    }, 30);

    return () => {
      clearInterval(countTimer);
    };
    // Do not restart the count-up when the parent recreates its dismiss handler.
  }, [winAmount, betAmount, isTotalWin, multiplier, updateTierForAmount]);

  // Physics-driven Spanish Doubloon Coin Shower on 2D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shouldReduceMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const coins: CoinParticle[] = [];
    const MAX_COINS = 85;

    const createFountainCoin = (intensity = 1): CoinParticle => {
      const layerRand = Math.random();
      const layer: 0 | 1 | 2 = layerRand < 0.35 ? 0 : layerRand < 0.78 ? 1 : 2;
      const baseR = layer === 0 ? 11 + Math.random() * 4 : layer === 1 ? 15 + Math.random() * 5 : 21 + Math.random() * 6;
      const spreadX = (Math.random() - 0.5) * Math.min(width * 0.32, 260);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.92;
      const speed = (520 + Math.random() * 460) * intensity * (0.85 + layer * 0.1);

      return {
        x: width * 0.5 + spreadX,
        y: height * 0.52 + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        radius: baseR,
        spinPhase: Math.random() * Math.PI * 2,
        spinSpeed: (5.5 + Math.random() * 7.5) * (Math.random() < 0.5 ? 1 : -1),
        rollAngle: (Math.random() - 0.5) * 0.6,
        rollSpeed: (Math.random() - 0.5) * 3.2,
        bounced: false,
        layer,
        motif: (Math.floor(Math.random() * 3) as 0 | 1 | 2),
      };
    };

    const createShowerCoin = (): CoinParticle => {
      const layerRand = Math.random();
      const layer: 0 | 1 | 2 = layerRand < 0.4 ? 0 : layerRand < 0.8 ? 1 : 2;
      const baseR = layer === 0 ? 11 + Math.random() * 4 : layer === 1 ? 15 + Math.random() * 5 : 20 + Math.random() * 6;
      return {
        x: width * (0.12 + Math.random() * 0.76),
        y: -baseR * 2 - Math.random() * 140,
        vx: (Math.random() - 0.5) * 150,
        vy: 80 + Math.random() * 180,
        radius: baseR,
        spinPhase: Math.random() * Math.PI * 2,
        spinSpeed: (5 + Math.random() * 7) * (Math.random() < 0.5 ? 1 : -1),
        rollAngle: (Math.random() - 0.5) * 0.5,
        rollSpeed: (Math.random() - 0.5) * 2.6,
        bounced: false,
        layer,
        motif: (Math.floor(Math.random() * 3) as 0 | 1 | 2),
      };
    };

    const spawnBurst = (count: number, intensity = 1) => {
      for (let i = 0; i < count; i++) {
        if (coins.length >= MAX_COINS) {
          coins.shift();
        }
        coins.push(createFountainCoin(intensity));
      }
    };

    spawnBurstRef.current = spawnBurst;
    // Initial celebratory eruption
    spawnBurst(36, 1.08);

    let lastTime = performance.now();
    let spawnAccumulator = 0;

    const drawDoubloon = (c: CoinParticle) => {
      const scaleX = Math.cos(c.spinPhase);
      const absScaleX = Math.max(0.08, Math.abs(scaleX));
      const sinPhase = Math.sin(c.spinPhase);
      const r = c.radius;
      const edgeThickness = Math.max(2.2, r * 0.24) * sinPhase;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rollAngle);

      // Soft drop shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(2, 5, r * absScaleX, r * 0.96, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3D Coin Rim / Milled Edge Thickness when tilted
      ctx.fillStyle = '#5e380b';
      ctx.beginPath();
      ctx.ellipse(edgeThickness, 0, r * absScaleX, r, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8b5715';
      ctx.beginPath();
      ctx.ellipse(edgeThickness * 0.5, 0, r * absScaleX, r, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Coin Face with scaleX flip
      ctx.save();
      ctx.scale(absScaleX, 1);

      const faceGrad = ctx.createLinearGradient(-r, -r, r, r);
      if (scaleX >= 0) {
        faceGrad.addColorStop(0, '#fff7cf');
        faceGrad.addColorStop(0.28, '#f5c453');
        faceGrad.addColorStop(0.68, '#c68621');
        faceGrad.addColorStop(1, '#75460a');
      } else {
        faceGrad.addColorStop(0, '#ebd388');
        faceGrad.addColorStop(0.35, '#d69c31');
        faceGrad.addColorStop(0.75, '#9e6312');
        faceGrad.addColorStop(1, '#5e3606');
      }

      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer bevel ring
      ctx.lineWidth = Math.max(1.2, r * 0.08);
      ctx.strokeStyle = '#4e2d06';
      ctx.stroke();

      // Inner stamped doubloon ring
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.strokeStyle = 'rgba(255, 246, 200, 0.65)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
      ctx.stroke();

      // Stamped pirate crest (cross / diamond / star) in the center
      ctx.fillStyle = 'rgba(92, 51, 8, 0.58)';
      ctx.beginPath();
      if (c.motif === 0) {
        // Spanish Cross potent
        const arm = r * 0.38;
        const w = r * 0.13;
        ctx.rect(-w, -arm, w * 2, arm * 2);
        ctx.rect(-arm, -w, arm * 2, w * 2);
      } else if (c.motif === 1) {
        // Compass diamond
        const d = r * 0.4;
        ctx.moveTo(0, -d);
        ctx.lineTo(d * 0.7, 0);
        ctx.lineTo(0, d);
        ctx.lineTo(-d * 0.7, 0);
        ctx.closePath();
      } else {
        // Sovereign shield core
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      }
      ctx.fill();

      // Specular glint flash when coin faces the light
      if (absScaleX > 0.72) {
        const glintAlpha = (absScaleX - 0.72) / 0.28;
        ctx.fillStyle = `rgba(255, 253, 236, ${(glintAlpha * 0.55).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(-r * 0.24, -r * 0.26, r * 0.34, r * 0.16, -0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Continuous rain of doubloons while celebration is open
      spawnAccumulator += dt;
      const spawnInterval = isFinishedRef.current ? 0.085 : 0.042;
      while (spawnAccumulator >= spawnInterval) {
        spawnAccumulator -= spawnInterval;
        if (coins.length < MAX_COINS) {
          coins.push(createShowerCoin());
        }
      }

      const gravity = 1180;
      const bounceShelfY = height * 0.78;
      const plaqueLeft = width * 0.5 - Math.min(width * 0.36, 220);
      const plaqueRight = width * 0.5 + Math.min(width * 0.36, 220);

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.vy += gravity * dt;
        c.vx *= 1 - 0.18 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.spinPhase += c.spinSpeed * dt;
        c.rollAngle += c.rollSpeed * dt;

        // Real bounce-off feel when falling coins hit the lower treasure deck
        if (
          !c.bounced &&
          c.vy > 140 &&
          c.y >= bounceShelfY &&
          c.y <= bounceShelfY + 36 &&
          c.x >= plaqueLeft &&
          c.x <= plaqueRight
        ) {
          c.bounced = true;
          c.y = bounceShelfY;
          c.vy = -c.vy * (0.42 + Math.random() * 0.16);
          c.vx += (c.x < width * 0.5 ? -1 : 1) * (85 + Math.random() * 115);
          c.spinSpeed *= 1.25;
        }

        if (c.y - c.radius > height + 60 || c.x < -80 || c.x > width + 80) {
          coins.splice(i, 1);
          continue;
        }

        drawDoubloon(c);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      spawnBurstRef.current = null;
    };
  }, [shouldReduceMotion]);

  const cfg = TIER_CONFIGS[currentTier];
  const formattedAmount = formatMoney(displayedWin, currency);

  return (
    <div
      onClick={handleClickOrSpace}
      role="dialog"
      aria-modal="true"
      aria-label={`${cfg.title} ${formattedAmount}`}
      className="win-celebration fixed inset-0 z-[85] flex flex-col items-center justify-center overflow-hidden p-3 sm:p-6 select-none"
      style={
        {
          '--tier-accent': cfg.accentHex,
          '--tier-trim': cfg.trimHex,
          '--tier-ribbon': cfg.ribbonBg,
        } as React.CSSProperties
      }
    >
      {/* Warm nautical abyssal vignette */}
      <div className="win-celebration__backdrop absolute inset-0" />
      <div className="win-celebration__rays pointer-events-none absolute inset-[-25%]" />
      <div className="win-celebration__horizon pointer-events-none absolute inset-x-0 bottom-0 h-[32%]" />

      {/* Physics Coin Shower Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
      />

      {/* Hand-crafted Carved Wood & Wrought-Brass Win Monument */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.86 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="win-monument relative z-20 flex w-[min(470px,calc(100vw-24px))] flex-col items-center sm:w-[min(560px,calc(100vw-48px))]"
      >
        {/* Dust & Gold Sparkle Radial Burst on Slam / Tier-Up */}
        {!shouldReduceMotion && (
          <div key={`burst-${currentTier}-${tierShake}`} className="win-plaque__burst" aria-hidden="true">
            <span className="win-plaque__shockwave" />
            {BURST_PARTICLES.map((p) => (
              <span
                key={p.id}
                className={`win-plaque__mote ${p.isStar ? 'win-plaque__mote--star' : ''}`}
                style={
                  {
                    '--mote-angle': `${p.angleDeg}deg`,
                    '--mote-dist': `${p.dist}px`,
                    '--mote-size': `${p.size}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* Top Emblem Medallion & Trophy Art */}
        <motion.div
          key={`emblem-${currentTier}-${tierShake}`}
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { scale: 0.65, y: 24, rotate: -6 }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  scale: [1.28, 0.9, 1.06, 1],
                  y: [0, -6, 0],
                  rotate: [4, -3, 1, 0],
                }
          }
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          className="win-monument__crest relative z-20 flex items-center justify-center"
        >
          <span className="win-monument__crest-ring" aria-hidden="true" />
          <div className="win-monument__badge relative h-[98px] w-[118px] sm:h-[136px] sm:w-[158px]">
            <Image
              src={cfg.badgeAsset}
              alt=""
              fill
              sizes="160px"
              className="object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
            />
          </div>
        </motion.div>

        {/* Carved Brass & Mahogany Title Plaque — Slams in with Squash & Stretch on Tier Escalation */}
        <motion.div
          key={`plaque-${currentTier}-${tierShake}`}
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  scale: 1.58,
                  scaleX: 0.84,
                  scaleY: 1.24,
                  y: -28,
                }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  scale: [1.52, 0.92, 1.07, 0.985, 1],
                  scaleX: [0.84, 1.18, 0.94, 1.03, 1],
                  scaleY: [1.22, 0.82, 1.08, 0.98, 1],
                  x: tierShake > 0 ? [0, -9, 8, -5, 3, 0] : 0,
                  y: [-22, 5, -3, 0],
                }
          }
          transition={{
            duration: 0.54,
            times: [0, 0.34, 0.62, 0.84, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
          className="win-plaque relative z-30 -mt-3 flex w-full flex-col items-center px-5 py-3 text-center sm:-mt-4 sm:px-8 sm:py-4"
        >
          <span className="win-plaque__rivet win-plaque__rivet--tl" aria-hidden="true" />
          <span className="win-plaque__rivet win-plaque__rivet--tr" aria-hidden="true" />
          <span className="win-plaque__rivet win-plaque__rivet--bl" aria-hidden="true" />
          <span className="win-plaque__rivet win-plaque__rivet--br" aria-hidden="true" />

          <span className="win-plaque__kicker">
            {isTotalWin ? 'SEA RAIDER · BONUS SUMMARY' : 'SEA RAIDER · CAPTAIN’S BOUNTY'}
          </span>
          <h2 className="win-plaque__title">{cfg.title}</h2>
          <div className="win-plaque__sub-bar">
            <span className="win-plaque__sub-rule" aria-hidden="true" />
            <span className="win-plaque__sub">{cfg.sub}</span>
            <span className="win-plaque__sub-rule" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Carved Timber & Brass Count-Up Chest Plaque */}
        <motion.div
          key={`counter-pulse-${tierShake}-${isCountupFinished ? 'done' : 'counting'}`}
          animate={
            shouldReduceMotion
              ? {}
              : isCountupFinished
              ? { scale: [1, 1.11, 0.97, 1.02, 1] }
              : tierShake > 0
              ? { scale: [1, 1.13, 0.95, 1.03, 1] }
              : {}
          }
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className={`win-counter relative z-20 mt-2.5 flex w-full flex-col items-center px-4 py-3.5 sm:mt-3.5 sm:px-7 sm:py-5 ${
            isCountupFinished ? 'win-counter--settled' : 'win-counter--rolling'
          }`}
        >
          <span className="win-counter__corner win-counter__corner--tl" aria-hidden="true" />
          <span className="win-counter__corner win-counter__corner--tr" aria-hidden="true" />
          <span className="win-counter__corner win-counter__corner--bl" aria-hidden="true" />
          <span className="win-counter__corner win-counter__corner--br" aria-hidden="true" />
          {isCountupFinished && <span className="win-counter__sheen" aria-hidden="true" />}

          <div className="win-counter__digits tabular-nums" aria-live="polite">
            {formattedAmount.split('').map((ch, idx) => {
              const isDigit = ch >= '0' && ch <= '9';
              return (
                <span
                  key={idx}
                  className={`win-counter__char ${isDigit ? 'win-counter__char--digit' : 'win-counter__char--punct'}`}
                >
                  {ch}
                </span>
              );
            })}
          </div>

          {!isTotalWin && (
            <div className="win-counter__mult tabular-nums">
              <span>{multiplier.toFixed(1)}×</span> {toSocialText('TOTAL BET', isSocial)}
            </div>
          )}
        </motion.div>

        {/* Bottom Brass Tap-to-Skip / Collect Plate */}
        <div className="win-celebration__footer relative z-20 mt-3 flex flex-col items-center pointer-events-none sm:mt-4">
          <span className="win-celebration__prompt">
            {isCountupFinished ? 'TAP OR PRESS SPACE TO COLLECT' : 'TAP OR PRESS SPACE TO SKIP'}
          </span>
          <span className="win-celebration__disclaimer mt-1.5">
            {toSocialText('The displayed total is the amount won.', isSocial)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
