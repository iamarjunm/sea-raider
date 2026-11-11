'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Application, Assets, Sprite, Container, Texture } from 'pixi.js';

interface PixiSpinButtonProps {
  onSpin: () => void;
  isSpinning: boolean;
  disabled?: boolean;
  isBonusActive?: boolean;
  bonusSpinsRemaining?: number;
  bonusTotalSpins?: number;
  isSocial?: boolean;
  className?: string;
  assetSrc?: string;
}

export default function PixiSpinButton({
  onSpin,
  isSpinning,
  disabled = false,
  isBonusActive = false,
  bonusSpinsRemaining = 0,
  bonusTotalSpins = 0,
  className = '',
  assetSrc = '/assets/aistudio/image_b5e5b74e.webp',
}: PixiSpinButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [isPixiReady, setIsPixiReady] = useState(false);
  const isSpinningRef = useRef(isSpinning);
  const disabledRef = useRef(disabled);
  const isBonusActiveRef = useRef(isBonusActive);
  const onSpinRef = useRef(onSpin);

  // Sync refs
  useEffect(() => {
    isSpinningRef.current = isSpinning;
    disabledRef.current = disabled;
    isBonusActiveRef.current = isBonusActive;
    onSpinRef.current = onSpin;
  }, [isSpinning, disabled, isBonusActive, onSpin]);

  useEffect(() => {
    let isMounted = true;
    const domElement = containerRef.current;
    if (!domElement) return;

    const baseSize = 140; // High resolution virtual canvas size
    const app = new Application();

    async function setupPixi() {
      try {
        await app.init({
          width: baseSize,
          height: baseSize,
          backgroundAlpha: 0,
          resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2, 2.5),
          autoDensity: true,
          antialias: true,
          preference: 'webgl',
        });

        if (!isMounted || !domElement) {
          app.destroy(true);
          return;
        }

        appRef.current = app;
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';
        domElement.appendChild(app.canvas);

        // Load golden circular spinner texture
        let texture: Texture;
        try {
          texture = await Assets.load(assetSrc);
        } catch {
          // If Assets.load fails, create from Image element
          texture = await Texture.from(assetSrc);
        }

        if (!isMounted) return;

        const stage = app.stage;
        const center = baseSize / 2;

        // Container for all spinner elements centered
        const rootContainer = new Container();
        rootContainer.x = center;
        rootContainer.y = center;
        stage.addChild(rootContainer);

        // Use the supplied spinner artwork as the complete button surface.
        const spinnerSprite = new Sprite(texture);
        spinnerSprite.anchor.set(0.5);
        const targetDiameter = baseSize;
        const scale = targetDiameter / Math.max(texture.width, texture.height);
        spinnerSprite.scale.set(scale);
        rootContainer.addChild(spinnerSprite);

        // Interaction state
        let isHovered = false;
        let isPressed = false;
        let currentAngle = 0;
        let spinSpeed = 0;
        let breathTime = 0;

        // Interactive pointer handlers
        rootContainer.eventMode = 'static';
        rootContainer.cursor = 'pointer';

        rootContainer.on('pointerover', () => {
          isHovered = true;
        });

        rootContainer.on('pointerout', () => {
          isHovered = false;
          isPressed = false;
        });

        rootContainer.on('pointerdown', () => {
          if (!disabledRef.current && !isSpinningRef.current && !isBonusActiveRef.current) {
            isPressed = true;
          }
        });

        rootContainer.on('pointerup', () => {
          if (isPressed) {
            isPressed = false;
            if (!disabledRef.current && !isSpinningRef.current && !isBonusActiveRef.current) {
              onSpinRef.current();
            }
          }
        });

        // Animation loop ticker
        app.ticker.add((ticker) => {
          breathTime += ticker.deltaTime * 0.05;

          // Target scale logic
          let targetScale = 1.0;
          if (disabledRef.current) {
            targetScale = 0.95;
            rootContainer.alpha = 0.65;
            rootContainer.cursor = 'not-allowed';
          } else {
            rootContainer.alpha = 1.0;
            rootContainer.cursor = isBonusActiveRef.current ? 'default' : 'pointer';

            if (isPressed) {
              targetScale = 0.92;
            } else if (isHovered && !isSpinningRef.current && !isBonusActiveRef.current) {
              targetScale = 1.06;
            } else if (!isSpinningRef.current) {
              // Subtle breathing when idle
              targetScale = 1.0 + Math.sin(breathTime) * 0.02;
            }
          }

          // Smooth scale interpolation
          rootContainer.scale.x += (targetScale - rootContainer.scale.x) * 0.18;
          rootContainer.scale.y += (targetScale - rootContainer.scale.y) * 0.18;

          // Rotation Physics
          if (isSpinningRef.current) {
            // High speed continuous spin acceleration
            const targetSpeed = 0.32; // ~18 rad/sec
            spinSpeed += (targetSpeed - spinSpeed) * 0.12;
            currentAngle += spinSpeed * ticker.deltaTime;
          } else {
            // Elastic deceleration settling back smoothly
            spinSpeed *= 0.88;
            if (spinSpeed < 0.005) {
              spinSpeed = 0;
            }
            currentAngle += spinSpeed * ticker.deltaTime;
          }

          spinnerSprite.rotation = currentAngle;

        });

        setIsPixiReady(true);
      } catch (err) {
        console.error('PixiJS Spin Button init failed, using fallback:', err);
      }
    }

    setupPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true });
        } catch {}
        appRef.current = null;
      }
    };
  }, [assetSrc]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      onClick={() => {
        if (!disabled && !isSpinning && !isBonusActive) {
          onSpin();
        }
      }}
    >
      {/* PixiJS Canvas Container */}
      <div
        ref={containerRef}
        className="spin-button-canvas aspect-square cursor-pointer drop-shadow-[0_0_20px_rgba(251,191,36,0.7)] hover:drop-shadow-[0_0_35px_rgba(245,158,11,1)] transition-all flex items-center justify-center"
        aria-label="Spin"
      />
      {!isBonusActive && (
        <span className="spin-button-label pointer-events-none absolute -bottom-1 left-1/2 z-20 -translate-x-1/2 rounded-full border border-amber-100/70 bg-[#0b1920]/95 px-3 py-0.5 text-[8px] font-black tracking-[.22em] text-amber-100 shadow-[0_2px_9px_rgba(0,0,0,.75)] sm:-bottom-0.5 sm:text-[9px]">
          SPIN
        </span>
      )}

      {/* Fallback until PixiJS canvas initializes */}
      {!isPixiReady && (
        <button
          onClick={isBonusActive ? undefined : onSpin}
          disabled={disabled || isSpinning}
          className="absolute inset-0 w-full h-full rounded-full overflow-hidden hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
        >
          <div
            className={`relative w-full h-full rounded-full overflow-hidden ${
              isSpinning ? 'animate-spin' : ''
            }`}
          >
            <Image
            src={assetSrc}
              alt="Spin"
              fill
              priority
              sizes="(max-width: 500px) 76px, 112px"
              className="object-contain rounded-full"
            />
          </div>
        </button>
      )}

      {/* If Bonus is active: show Free Spins badge anchored cleanly right above the spinner */}
      {isBonusActive && (
        <div className="absolute -top-4 sm:-top-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 border border-amber-200 text-white font-black text-[10px] sm:text-xs shadow-[0_0_15px_rgba(245,158,11,0.95)] tracking-widest whitespace-nowrap animate-pulse pointer-events-none z-30">
          SPINS: {bonusSpinsRemaining} / {bonusTotalSpins}
        </div>
      )}
    </div>
  );
}
