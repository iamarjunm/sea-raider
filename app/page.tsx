'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import ReelGrid from '../components/ReelGrid';
import ControlPanel from '../components/common/ControlPanel';
import EnhancersModal from '../components/EnhancersModal';
import AutoplayModal, { SpinSpeed } from '../components/common/AutoplayModal';
import SimulationRunPanel, { SimulationRun } from '../components/common/SimulationRunPanel';
import PaytableModal from '../components/PaytableModal';
import WinCelebration from '../components/common/WinCelebration';
import MultiplierBanner from '../components/MultiplierBanner';
import BonusIntroModal from '../components/BonusIntroModal';
import BonusMultiplierRoller from '../components/BonusMultiplierRoller';
import GameMenuModal from '../components/GameMenuModal';
import StudioLoadingScreen from '../components/common/StudioLoadingScreen';
import OpeningModal from '../components/OpeningModal';
import ReplayScreen from '../components/ReplayScreen';
import { ExplosionItem } from '../components/common/ExplosionEffect';
import SeaBackdrop from '../components/scene/SeaBackdrop';
import FeatureBuyButton from '../components/scene/FeatureBuyButton';
import CaptainCameo, { CaptainCameoState } from '../components/scene/CaptainCameo';
import {
  SymbolId,
  PlayMode,
  MODE_CONFIGS,
  playBonusFreeSpin,
  evaluateBonusSpinFrame,
  sampleBookSpin,
  rgsRoundToSpinResult,
  SpinResult,
  PaylineHit,
  BonusType,
  BonusSpinFrame,
  WildSurgeResult,
} from '../lib/slot-engine';
import { formatMoney, toSocialText, microToStandard } from '../lib/currency';
import { fetchRgsReplay, normalizeRgsUrl, rgsBetConfigToLevels, RgsReplay, rgsPlay, rgsEndRound } from '../lib/rgs-client';
import { soundManager } from '../lib/audio';
import { preloadGameAssets } from '../lib/preload-assets';
import { shouldShowCaptainReveal } from '../lib/captain-reveal';
import { advanceBonusPayoutProgress, createBonusPayoutProgress, sumLinePayouts } from '../lib/bonus-line-payout';
import WildSurgeMeter from '../components/common/WildSurgeMeter';
import WildSurgeAnnouncement from '../components/common/WildSurgeAnnouncement';
import bonusStartRanges from '../maths/bonus-multiplier-ranges.json';

// Default Bet Levels by Currency
const DEFAULT_BET_LEVELS: Record<string, number[]> = {
  USD: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  EUR: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  CAD: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  MXN: [2.0, 4.0, 8.0, 12.0, 16.0, 20.0, 30.0, 40.0, 60.0, 100.0, 200.0, 500.0, 1000.0],
  JPY: [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  XSC: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  XEC: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  XGC: [1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 1000000],
};

function getBonusStartMultiplier(scatterCount: number, frames?: BonusSpinFrame[]) {
  const savedStart = frames?.[0]?.multiplier;
  if (typeof savedStart === 'number' && Number.isFinite(savedStart)) return savedStart;
  const range = bonusStartRanges[String(scatterCount) as keyof typeof bonusStartRanges];
  return range?.min ?? bonusStartRanges['3'].min;
}
const BONUS_MULTIPLIER_ROLL_MS = 700;

export default function SlotGamePage() {
  // 1. Session & Stake Engine Configuration
  const [sessionParams, setSessionParams] = useState({
    sessionId: 'demo-session-001',
    rgsUrl: '',
    currency: 'USD',
    lang: 'en',
    device: 'desktop',
    isSocial: false,
    isDemo: true,
    isReplay: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningOpen, setIsOpeningOpen] = useState(true);
  const [isRgsAuthenticated, setIsRgsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<{ replay: RgsReplay; mode: PlayMode; amount: number } | null>(null);

  // 2. Wallet & Bet State
  const [balance, setBalance] = useState<number>(1000.0);
  const [betLevels, setBetLevels] = useState<number[]>(DEFAULT_BET_LEVELS.USD);
  const [currentBetIndex, setCurrentBetIndex] = useState<number>(5); // defaults to $1.00
  const [lastWin, setLastWin] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // 3. Game & Reel Grid State
  const [activeMode, setActiveMode] = useState<PlayMode>('base');
  const [grid, setGrid] = useState<SymbolId[][]>([
    ['H1', 'L1', 'L4'],
    ['H3', 'WILD', 'L2'],
    ['H2', 'SCATTER', 'L3'],
    ['L2', 'H4', 'L5'],
    ['L5', 'H1', 'L1'],
  ]);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [teaseReels, setTeaseReels] = useState<boolean[]>([false, false, false, false, false]);
  const [landedScatterCount, setLandedScatterCount] = useState<number>(0);
  const [captainReveal, setCaptainReveal] = useState<{
    count: number;
    reel: number;
    row: number;
    phase: 'cut' | 'scatter';
  } | null>(null);
  const [winningHits, setWinningHits] = useState<PaylineHit[]>([]);
  const [activeHitIndex, setActiveHitIndex] = useState<number | null>(null);
  const [wildMultiplier, setWildMultiplier] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isSuperTurbo, setIsSuperTurbo] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mysteryText, setMysteryText] = useState<string | null>(null);

  // Captain swings in on decent (non big-win) wins.
  const [captainCameo, setCaptainCameo] = useState<CaptainCameoState | null>(null);
  const showCaptainCameo = useCallback((amount: number, multiple: number) => {
    setCaptainCameo((prev) => ({ id: (prev?.id ?? 0) + 1, amount, multiple }));
  }, []);
  useEffect(() => {
    if (!captainCameo) return;
    const t = setTimeout(() => setCaptainCameo(null), 2900);
    return () => clearTimeout(t);
  }, [captainCameo]);

  // 4. Particle Explosions
  const [explosions, setExplosions] = useState<ExplosionItem[]>([]);

  // 5. Autoplay State
  const [isAutoActive, setIsAutoActive] = useState<boolean>(false);
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);
  const [autoStopOnWin, setAutoStopOnWin] = useState<boolean>(false);
  const [autoStopOnFeature, setAutoStopOnFeature] = useState<boolean>(false);
  const [simulationRun, setSimulationRun] = useState<SimulationRun | null>(null);
  const [isSimulationBonusPreview, setIsSimulationBonusPreview] = useState(false);
  const [isSimulationSettlementPending, setIsSimulationSettlementPending] = useState(false);

  // 6. Free Spins Bonus State
  const [isBonusActive, setIsBonusActive] = useState<boolean>(false);
  const [bonusType, setBonusType] = useState<BonusType>('curse');
  const [bonusSpinsRemaining, setBonusSpinsRemaining] = useState<number>(0);
  const [bonusTotalSpins, setBonusTotalSpins] = useState<number>(0);
  const [bonusMultiplier, setBonusMultiplier] = useState<number>(1);
  const [bonusMultiplierRollId, setBonusMultiplierRollId] = useState(0);
  const [bonusMultiplierRollCue, setBonusMultiplierRollCue] = useState<'start' | 'rise' | 'hold' | null>(null);
  const [retriggerSpins, setRetriggerSpins] = useState<number>(0);
  const [bonusWildCount, setBonusWildCount] = useState(0);
  const [wildSurgeAnnouncement, setWildSurgeAnnouncement] = useState<{ wildCount: number; linesAwarded: number } | null>(null);
  const [wildSurgeFinaleActive, setWildSurgeFinaleActive] = useState(false);

  // Bonus Intro Popover State
  const [isBonusIntroOpen, setIsBonusIntroOpen] = useState<boolean>(false);
  const [isBonusMultiplierRollOpen, setIsBonusMultiplierRollOpen] = useState(false);
  const [pendingBonus, setPendingBonus] = useState<{
    bonusType: BonusType;
    scatterCount: number;
    spinsAwarded: number;
    startMultiplier: number;
  } | null>(null);

  // 7. Modals
  const [isEnhancersOpen, setIsEnhancersOpen] = useState<boolean>(false);
  const [isAutoOpen, setIsAutoOpen] = useState<boolean>(false);
  const [isPaytableOpen, setIsPaytableOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [celebrationAmount, setCelebrationAmount] = useState<number>(0);
  const [isCelebrationTotal, setIsCelebrationTotal] = useState<boolean>(false);
  const [isSkipBonusConfirmOpen, setIsSkipBonusConfirmOpen] = useState<boolean>(false);
  const [skipBonusHasBigWin, setSkipBonusHasBigWin] = useState<boolean>(false);

  const isExecutingRef = useRef<boolean>(false);
  const executeSpinRef = useRef<(mode?: PlayMode, previewOutcome?: SpinResult) => void>(() => {});
  const isBonusSpinExecutingRef = useRef<boolean>(false);
  const bonusSpinsRemainingRef = useRef<number>(0);
  const bonusAccumulatedWinRef = useRef<number>(0);
  const bonusMultiplierRef = useRef<number>(1);
  const bonusTotalSpinsRef = useRef<number>(0);
  const bonusSpinFramesRef = useRef<BonusSpinFrame[]>([]);
  const wildSurgeRef = useRef<WildSurgeResult | undefined>(undefined);
  const wildSurgePhaseRef = useRef<'pending' | 'announcement' | 'spin' | 'done'>('done');
  const bonusWildCountRef = useRef(0);
  const bonusTypeRef = useRef<BonusType>('curse');
  const bonusPayoutPrepaidRef = useRef<number>(0);
  const bonusLinePayoutTotalRef = useRef<number>(0);
  const bonusPayoutProgressRef = useRef(createBonusPayoutProgress(0, 0));
  const bonusPayoutBigWinRef = useRef<boolean>(false);
  const bonusAnimationSpeedRef = useRef<SpinSpeed>(1);
  const skipBonusNowRef = useRef<boolean>(false);
  const usingRgsRef = useRef<boolean>(false);
  const runNextFreeSpinRef = useRef<() => void>(() => {});

  // Robust Autoplay Refs to prevent stale closure loops
  const isAutoActiveRef = useRef<boolean>(false);
  const autoSpinsRemainingRef = useRef<number>(0);
  const autoStopOnWinRef = useRef<boolean>(false);
  const autoStopOnFeatureRef = useRef<boolean>(false);
  const autoResumeAfterCelebrationRef = useRef<boolean>(false);
  const celebrationPendingRef = useRef<boolean>(false);
  const isSimulationRunRef = useRef<boolean>(false);
  const isSimulationBonusPreviewRef = useRef<boolean>(false);
  const simulationRunRef = useRef<SimulationRun | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationTickRef = useRef<() => void>(() => {});
  const simulationModeRef = useRef<PlayMode>('base');
  const simulationStopBonusesRef = useRef<BonusType[]>([]);
  const autoSpeedFactorRef = useRef<SpinSpeed>(1);

  useEffect(() => {
    if (isAutoActiveRef.current && !isSimulationRunRef.current) {
      autoSpeedFactorRef.current = isSuperTurbo ? 2 : 1;
    }
  }, [isTurbo, isSuperTurbo]);

  const stopAutoplay = useCallback((reason = 'Stopped by player.') => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    simulationTimerRef.current = null;
    isAutoActiveRef.current = false;
    autoSpinsRemainingRef.current = 0;
    setIsAutoActive(false);
    setAutoSpinsRemaining(0);
    if (isSimulationRunRef.current) {
      isSimulationRunRef.current = false;
      setSimulationRun((current) => {
        if (!current) return current;
        const finished = { ...current, isRunning: false, isPaused: false, stopReason: reason };
        simulationRunRef.current = finished;
        return finished;
      });
    }
  }, []);

  const settlePausedSimulation = useCallback((reason: string) => {
    const current = simulationRunRef.current;
    if (!current?.isPaused || current.foundBonus) return;
    const hasMoreSpins = autoSpinsRemainingRef.current > 0;
    const settled: SimulationRun = {
      ...current,
      isRunning: false,
      isPaused: hasMoreSpins,
      stopReason: hasMoreSpins ? reason : 'Voyage complete.',
    };
    simulationRunRef.current = settled;
    setSimulationRun(settled);
    isSimulationRunRef.current = false;
  }, []);

  // Current Bet Value
  const currentBet = betLevels[currentBetIndex] || 1.0;
  const currentModeConfig = MODE_CONFIGS[activeMode];
  const totalSpinCost = currentBet * currentModeConfig.costMultiplier;
  // Lanterns blaze while a win is on the board, and hardest during celebrations.
  const isWinShowing = winningHits.length > 0 && lastWin > 0;
  const sceneGlow = isCelebrationOpen ? 1 : isWinShowing ? (lastWin >= totalSpinCost * 10 ? 0.9 : 0.6) : 0;

  // Add Particle Explosion
  const triggerExplosion = useCallback(
    (xPercent: number, yPercent: number, type: 'wild' | 'bigwin', label?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setExplosions((prev) => [...prev, { id, xPercent, yPercent, type, label }]);
    },
    []
  );

  const handleExplosionComplete = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ----------------------------------------------------
  // Initialize Session & Authenticate (Stake Engine [181])
  // ----------------------------------------------------
  useEffect(() => {
    soundManager.startMusic();

    const unlockAudio = () => {
      soundManager.startMusic();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      const finishLoading = () => {
        void preloadGameAssets()
          .then(() => setIsLoading(false))
          .catch((error) => {
            setConnectionError(error instanceof Error ? error.message : 'Game assets could not be loaded.');
            setIsLoading(false);
          });
      };
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('sessionID') || 'demo-session-001';
      const rgsUrlParam = params.get('rgs_url') || '';
      const currencyParam = params.get('currency')?.toUpperCase() || 'USD';
      const langParam = params.get('lang') || 'en';
      const deviceParam = params.get('device') || 'desktop';
      const socialParam = params.get('social') === 'true' || ['XSC', 'XGC', 'XEC'].includes(currencyParam);
      const demoParam = params.get('demo') !== 'false';
      const replayParam = params.get('replay') === 'true';

      setSessionParams({
        sessionId,
        rgsUrl: rgsUrlParam,
        currency: currencyParam,
        lang: langParam,
        device: deviceParam,
        isSocial: socialParam,
        isDemo: demoParam,
        isReplay: replayParam,
      });

      const levels = DEFAULT_BET_LEVELS[currencyParam] || DEFAULT_BET_LEVELS.USD;
      setBetLevels(levels);
      setCurrentBetIndex(Math.min(5, levels.length - 1));

      if (currencyParam === 'XGC') {
        setBalance(5000000);
      } else if (currencyParam === 'JPY') {
        setBalance(100000);
      } else {
        setBalance(1000.0);
      }

      if (replayParam) {
        const requestedMode = params.get('mode') as PlayMode | null;
        const supportedMode = requestedMode && Object.prototype.hasOwnProperty.call(MODE_CONFIGS, requestedMode) ? requestedMode : null;
        const amount = Number(params.get('amount'));
        const replayAmount = Number.isSafeInteger(amount) && amount > 0 ? amount : 1_000_000;
        if (!supportedMode || !params.get('game') || !params.get('version') || !params.get('event') || !rgsUrlParam) {
            setConnectionError(toSocialText('This replay link is incomplete or invalid.', socialParam));
          finishLoading();
          return;
        }
        fetchRgsReplay({ rgsUrl: rgsUrlParam, game: params.get('game')!, version: params.get('version')!, mode: supportedMode, event: params.get('event')! })
          .then((replay) => {
            setReplayData({ replay, mode: supportedMode, amount: replayAmount });
            finishLoading();
          })
          .catch((err) => {
            setConnectionError(toSocialText(err instanceof Error ? err.message : 'Replay could not be loaded.', socialParam));
            finishLoading();
          });
        return;
      }

      if (rgsUrlParam) {
        let normalizedUrl: string;
        let authErrorIsSocial = socialParam;
        try {
          normalizedUrl = normalizeRgsUrl(rgsUrlParam);
        } catch (error) {
          setConnectionError(toSocialText(error instanceof Error ? error.message : 'Invalid RGS URL.', socialParam));
          finishLoading();
          return;
        }
        fetch(`${normalizedUrl}/wallet/authenticate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionID: sessionId }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then((data) => {
            const config = data.config || {};
            const socialFromRgs = Boolean(config.jurisdiction?.socialCasino);
            authErrorIsSocial = socialParam || socialFromRgs;
            setSessionParams((current) => ({ ...current, isSocial: current.isSocial || socialFromRgs }));
            const openRound = data.round?.active ? data.round : undefined;
            const activeAmountMicro = openRound?.amount != null ? Number(openRound.amount) : undefined;
            if (openRound && (!Number.isSafeInteger(activeAmountMicro) || activeAmountMicro! <= 0)) {
              throw new Error('The active RGS round did not include its bet amount, so it cannot be resumed safely.');
            }
            const configured = rgsBetConfigToLevels(config, activeAmountMicro);
            setIsRgsAuthenticated(true);
            const authCurrency = String(data.balance?.currency || currencyParam).toUpperCase();
            setSessionParams((current) => ({ ...current, currency: authCurrency, isSocial: current.isSocial || socialFromRgs }));
            const authenticatedBalance = typeof data.balance === 'number'
              ? data.balance
              : typeof data.balance?.amount === 'number'
              ? data.balance.amount
              : undefined;
            if (authenticatedBalance !== undefined) {
              setBalance(microToStandard(authenticatedBalance));
            }
            setBetLevels(configured.levels);
            setCurrentBetIndex(configured.defaultIndex);
            if (openRound) {
              const rawRoundState = openRound.state || openRound.events || [];
              const roundEvents = (Array.isArray(rawRoundState) ? rawRoundState
                : rawRoundState && typeof rawRoundState === 'object' && Array.isArray((rawRoundState as { events?: unknown[] }).events)
                  ? (rawRoundState as { events: unknown[] }).events
                  : []) as Array<{ mode?: string }>;
              const responseMode = openRound.mode || roundEvents.find((event) => event?.mode)?.mode;
              const activeMode = (responseMode && Object.prototype.hasOwnProperty.call(MODE_CONFIGS, responseMode) ? responseMode : 'base') as PlayMode;
              const resumed = rgsRoundToSpinResult(openRound, activeMode, microToStandard(activeAmountMicro!));
              bonusSpinFramesRef.current = resumed.bonusSpinFrames ? [...resumed.bonusSpinFrames] : [];
              wildSurgeRef.current = resumed.wildSurge;
              wildSurgePhaseRef.current = resumed.wildSurge ? 'pending' : 'done';
              bonusWildCountRef.current = 0;
              setBonusWildCount(0);
              bonusLinePayoutTotalRef.current = (resumed.bonusSpinFrames || []).reduce(
                (sum, frame) => {
                  const evaluated = evaluateBonusSpinFrame(frame, microToStandard(activeAmountMicro!));
                  return sum + evaluated.spinWin;
                },
                0
              );
              if (resumed.wildSurge?.linesAwarded) {
                const evaluatedSurge = evaluateBonusSpinFrame(
                  resumed.wildSurge.frame,
                  microToStandard(activeAmountMicro!),
                );
                bonusLinePayoutTotalRef.current += evaluatedSurge.spinWin;
              }
              bonusPayoutProgressRef.current = createBonusPayoutProgress(bonusLinePayoutTotalRef.current, resumed.totalWin);
              setActiveMode(activeMode);
              setGrid(resumed.grid);
              setWinningHits(resumed.lineHits);
              setLastWin(resumed.bonusTriggered ? 0 : resumed.totalWin);
              usingRgsRef.current = true;
              if (resumed.bonusTriggered && resumed.bonusType) {
                if (authenticatedBalance !== undefined) {
                  setBalance(Math.max(0, microToStandard(authenticatedBalance) - resumed.totalWin));
                }
                bonusPayoutPrepaidRef.current = resumed.totalWin;
                bonusPayoutBigWinRef.current = resumed.totalWin >= microToStandard(activeAmountMicro!) * MODE_CONFIGS[activeMode].costMultiplier * 5;
                setPendingBonus({
                  bonusType: resumed.bonusType,
                  scatterCount: resumed.scatterCount,
                  spinsAwarded: resumed.bonusSpinsAwarded,
                  startMultiplier: getBonusStartMultiplier(resumed.scatterCount, resumed.bonusSpinFrames),
                });
                setIsBonusIntroOpen(true);
              } else if (resumed.totalWin > 0) {
                setCelebrationAmount(resumed.totalWin);
                setIsCelebrationTotal(true);
                setIsCelebrationOpen(true);
                rgsEndRound({ rgsUrl: normalizedUrl, sessionID: sessionId })
                  .then((ended) => { if (ended.balance !== undefined) setBalance(ended.balance); })
                  .catch(() => {});
              }
            }
            finishLoading();
          })
          .catch((err) => {
            setIsRgsAuthenticated(false);
            setConnectionError(toSocialText(
              `Unable to authenticate with the Remote Game Server: ${err instanceof Error ? err.message : 'connection failed'}. Check the session or try again.`,
              authErrorIsSocial
            ));
            finishLoading();
          });
      } else {
        setTimeout(finishLoading, 500);
      }
    }, 0);

    return () => clearTimeout(initTimer);
  }, []);

  // ----------------------------------------------------
  // Cycle active payline highlights
  useEffect(() => {
    // During a spin, the spin/bonus sequence controls the active line and its
    // readable hold time. Do not let the idle-cycle timer override that pace.
    if (isSpinning) return;
    if (winningHits.length === 0) {
      const t = setTimeout(() => setActiveHitIndex(null), 0);
      return () => clearTimeout(t);
    }
    if (winningHits.length === 1) {
      const t = setTimeout(() => setActiveHitIndex(0), 0);
      return () => clearTimeout(t);
    }

    let currentIndex = 0;
    const initialT = setTimeout(() => setActiveHitIndex(0), 0);
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % winningHits.length;
      setActiveHitIndex(currentIndex);
    }, 1200);

    return () => {
      clearTimeout(initialT);
      clearInterval(interval);
    };
  }, [winningHits, isSpinning]);

  const handleIncreaseBet = () => {
    if (currentBetIndex < betLevels.length - 1) {
      setCurrentBetIndex(currentBetIndex + 1);
      soundManager.playSpinClick(1.2);
    }
  };

  const handleDecreaseBet = () => {
    if (currentBetIndex > 0) {
      setCurrentBetIndex(currentBetIndex - 1);
      soundManager.playSpinClick(0.9);
    }
  };

  // ----------------------------------------------------
  // Execute a Regular or Enhancer Spin with Proper Buildup
  // ----------------------------------------------------
  const executeSpin = useCallback(
    async (overrideMode?: PlayMode, previewOutcome?: SpinResult) => {
      const modeToUse = overrideMode || activeMode;
      const config = MODE_CONFIGS[modeToUse];
      const spinCost = currentBet * config.costMultiplier;
      const animationSpeed = isSimulationRunRef.current || isAutoActiveRef.current
        ? autoSpeedFactorRef.current
        : isSuperTurbo ? 2 : 1;
      const pace = (milliseconds: number) => Math.max(45, Math.round(milliseconds / animationSpeed));

      // Stake Engine Rule [222]: Insufficient balance check
      const isBonusPreview = Boolean(previewOutcome);
      if (!isBonusPreview && balance < spinCost) {
        setWarningMessage(
          toSocialText(
            `Insufficient balance for ${config.name} (${formatMoney(spinCost, sessionParams.currency)}). Please lower bet.`,
            sessionParams.isSocial
          )
        );
        setTimeout(() => setWarningMessage(null), 3500);
        stopAutoplay();
        return;
      }

      if (isExecutingRef.current) return;
      if (isBonusIntroOpen || pendingBonus || isBonusActive || isCelebrationOpen || isMenuOpen || isPaytableOpen || isEnhancersOpen || isAutoOpen || isSkipBonusConfirmOpen) return;
      isExecutingRef.current = true;
      setIsSpinning(true);
      setWinningHits([]);
      setActiveHitIndex(null);
      setWildMultiplier(1);
      setLastWin(0);
      setMysteryText(null);
      setLandedScatterCount(0);
      bonusPayoutPrepaidRef.current = 0;
      bonusPayoutBigWinRef.current = false;

      const useRgs = Boolean(sessionParams.rgsUrl) && (!isBonusPreview || isSimulationBonusPreviewRef.current);
      usingRgsRef.current = useRgs;

      let outcome: SpinResult;
      try {
        if (previewOutcome) {
          outcome = previewOutcome;
        } else if (useRgs) {
          // Stake RGS is source of truth for debit + published math outcome
          const play = await rgsPlay({
            rgsUrl: sessionParams.rgsUrl,
            sessionID: sessionParams.sessionId,
            baseBet: currentBet,
            mode: modeToUse,
          });
          outcome = rgsRoundToSpinResult(play.round, modeToUse, currentBet, true);
          // Keep the feature return out of the visible wallet until the bonus
          // has completed and /end-round settles the booked total.
          if (outcome.bonusTriggered) setBalance((prev) => Math.max(0, prev - spinCost));
          else if (play.balance !== undefined) setBalance(play.balance);
          else setBalance((prev) => Math.max(0, prev - spinCost));
        } else {
          // Local/demo: sample the same weighted books uploaded to Stake
          if (!isBonusPreview) setBalance((prev) => Math.max(0, prev - spinCost));
          outcome = sampleBookSpin(modeToUse, currentBet);
        }
      } catch (err) {
        isExecutingRef.current = false;
        setIsSpinning(false);
        setWarningMessage(
          toSocialText(err instanceof Error ? err.message : 'Spin failed. Please try again.', sessionParams.isSocial)
        );
        setTimeout(() => setWarningMessage(null), 3500);
        stopAutoplay();
        return;
      }

      // Set all 5 reels spinning
      setSpinningReels([true, true, true, true, true]);
      setTeaseReels([false, false, false, false, false]);
      soundManager.startReelSpin(isTurbo);

      // Stage one scatter that is already part of the booked result. The reel
      // briefly lands without it, then the captain reveals it with a sword slash.
      const bookedScatterCells = outcome.grid.flatMap((column, reel) =>
        column.flatMap((symbol, row) => symbol === 'SCATTER' ? [{ reel, row }] : [])
      );
      const stagedScatter = outcome.bonusTriggered && shouldShowCaptainReveal(outcome.grid) && bookedScatterCells.length >= 3
        ? bookedScatterCells[Math.min(4, bookedScatterCells.length - 1)]
        : null;
      let captainRevealShown = false;

      let currentScatters = 0;
      let teaseActive = false;

      // Sequential Dynamic Reel Stop Loop
      for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
        let reelDelay: number;
        if (reelIdx === 0) {
          reelDelay = pace(isTurbo ? 300 : 1000);
        } else if (!teaseActive) {
          reelDelay = pace(isTurbo ? 160 : 420);
        } else {
          // PROPER BUILDUP: Extended suspense anticipation spin!
          reelDelay = pace(isTurbo ? 900 : 2000);
          soundManager.playTeaseRiser(reelDelay / 1000);
          soundManager.playTeaseHeartbeat();
        }

        await new Promise((res) => setTimeout(res, reelDelay));

        // Stop this reel
        setSpinningReels((prev) => {
          const next = [...prev];
          next[reelIdx] = false;
          return next;
        });
        setTeaseReels((prev) => {
          const next = [...prev];
          next[reelIdx] = false;
          return next;
        });

        // Snap symbols into place. For one booked scatter only, briefly show
        // the underlying reel symbol so the reveal animation has a clear target.
        const isStagedScatterReel = stagedScatter?.reel === reelIdx;
        const landedColumn = [...outcome.grid[reelIdx]];
        if (isStagedScatterReel && stagedScatter) landedColumn[stagedScatter.row] = 'L2';
        setGrid((prev) => {
          const next = [...prev];
          next[reelIdx] = landedColumn;
          return next;
        });

        // Check Scatters landed on this column
        const colScatters = landedColumn.filter((s) => s === 'SCATTER').length;
        soundManager.playReelStop(reelIdx);
        if (colScatters > 0) {
          currentScatters += colScatters;
          setLandedScatterCount(currentScatters);

          if (currentScatters >= 3) {
            // High tier scatter gong!
            soundManager.playGrandScatterBell(currentScatters);
          } else {
            soundManager.playScatterLand(currentScatters);
          }
        }

        // Normal spins tease after two scatters; the high-frequency and
        // Unknown Extreme modes also build anticipation from a single scatter.
        const nearMissMode = modeToUse === 'bonus_chance' || modeToUse === 'unknown_extreme';
        if ((currentScatters >= 2 || (nearMissMode && currentScatters >= 1)) && reelIdx < 4) {
          teaseActive = true;
          setTeaseReels((prev) => {
            const next = [...prev];
            for (let r = reelIdx + 1; r < 5; r++) next[r] = true;
            return next;
          });
        }
      }

      // Let all five reels land first. Then the captain reveals the held-back
      // scatter with a sword slash, matching the booked board exactly.
      if (stagedScatter) {
        captainRevealShown = true;
        await new Promise((res) => setTimeout(res, pace(1700)));
        setCaptainReveal({ count: outcome.scatterCount, reel: stagedScatter.reel, row: stagedScatter.row, phase: 'cut' });
        soundManager.playTeaseRiser(0.45);
        await new Promise((res) => setTimeout(res, pace(1400)));
        setCaptainReveal({ count: outcome.scatterCount, reel: stagedScatter.reel, row: stagedScatter.row, phase: 'scatter' });
        setGrid((prev) => {
          const next = [...prev];
          next[stagedScatter.reel] = outcome.grid[stagedScatter.reel];
          return next;
        });
        currentScatters += 1;
        setLandedScatterCount(currentScatters);
        soundManager.playGrandScatterBell(currentScatters);
        await new Promise((res) => setTimeout(res, 500));
        setCaptainReveal(null);
      }

      // All 5 reels have stopped! Complete spin evaluation
      setTeaseReels([false, false, false, false, false]);
      if (!captainRevealShown) setCaptainReveal(null);
      setIsSpinning(false);
      // Hold the input lock until the awarded bonus is entered.
      isExecutingRef.current = Boolean(outcome.bonusTriggered);

      const isBigWinOutcome =
        outcome.totalWin >= currentBet * 100 ||
        outcome.totalWin / spinCost >= 30 ||
        outcome.isMaxWin;
      if (outcome.bonusTriggered) {
        bonusAnimationSpeedRef.current = isSimulationRunRef.current || isAutoActiveRef.current
          ? autoSpeedFactorRef.current
          : 1;
      }
      // Handle win — published books already include full feature value when a bonus triggers.
      if (outcome.totalWin > 0) {
        // Bonus totals are revealed connection by connection below; standard
        // outcomes continue to show their complete booked win immediately.
        setLastWin(outcome.bonusTriggered ? 0 : outcome.totalWin);
        setWinningHits(outcome.lineHits);
        setWildMultiplier(outcome.wildMultiplier);
        if (!outcome.bonusTriggered && !isBigWinOutcome && outcome.totalWin >= spinCost * 3) {
          showCaptainCameo(outcome.totalWin, outcome.totalWin / spinCost);
        }
        if (outcome.bonusTriggered) {
          let bonusLineWins = (outcome.bonusSpinFrames || []).reduce((sum, frame) => {
            const evaluated = evaluateBonusSpinFrame(frame, currentBet);
            return sum + sumLinePayouts(evaluated.lineHits);
          }, 0);
          if (outcome.wildSurge?.linesAwarded) {
            const evaluatedSurge = evaluateBonusSpinFrame(outcome.wildSurge.frame, currentBet);
            bonusLineWins += sumLinePayouts(evaluatedSurge.lineHits);
          }
          bonusLinePayoutTotalRef.current = bonusLineWins;
          bonusPayoutProgressRef.current = createBonusPayoutProgress(bonusLineWins, outcome.totalWin);
        } else {
          bonusLinePayoutTotalRef.current = 0;
        }

        for (let idx = 0; idx < outcome.lineHits.length; idx++) {
          setActiveHitIndex(idx);
          soundManager.playLineWin(idx);
          const stepTime = pace(isTurbo ? 280 : 650);
          await new Promise((res) => setTimeout(res, stepTime));
        }

        if (outcome.bonusTriggered) {
          // Prepaid: free-spin sequence is cosmetic; do not credit again at bonus end.
          bonusPayoutPrepaidRef.current = outcome.totalWin;
          bonusSpinFramesRef.current = outcome.bonusSpinFrames ? [...outcome.bonusSpinFrames] : [];
          wildSurgeRef.current = outcome.wildSurge;
          wildSurgePhaseRef.current = outcome.wildSurge ? 'pending' : 'done';
          bonusWildCountRef.current = 0;
          setBonusWildCount(0);
          // Treat a booked return of at least 5x the feature cost as a big win
          // for the skip confirmation, including the guaranteed 5-scatter floor.
          bonusPayoutBigWinRef.current = outcome.totalWin >= spinCost * 5;
        } else if (!useRgs && !isBonusPreview) {
          setBalance((prev) => prev + outcome.totalWin);
        }
        if (isBigWinOutcome && !outcome.bonusTriggered) {
          await new Promise((res) => setTimeout(res, pace(2000)));
          setIsCelebrationTotal(false);
          setCelebrationAmount(outcome.totalWin);
          celebrationPendingRef.current = true;
          setIsCelebrationOpen(true);
          soundManager.playWin(true);
        } else if (!outcome.bonusTriggered) {
          soundManager.playWin(false);
        }

        // Rule [221]: finalize winning round on Stake (skip if bonus intro will play — end after feature)
        if (useRgs && !outcome.bonusTriggered) {
          try {
            const ended = await rgsEndRound({
              rgsUrl: sessionParams.rgsUrl,
              sessionID: sessionParams.sessionId,
            });
            if (ended.balance !== undefined) setBalance(ended.balance);
          } catch {
            /* non-fatal for UX; wallet may still settle */
          }
        }
      } else {
        setWinningHits([]);
        setLastWin(0);
      }

      // Mystery text if Unknown Bonus or Extreme (only if bonus not triggered)
      if (outcome.mysteryOutcomeText && !outcome.bonusTriggered) {
        setMysteryText(outcome.mysteryOutcomeText);
      } else if (outcome.bonusTriggered) {
        setMysteryText(null);
      }

      // Trigger Bonus Free Spins Intro Screen if awarded!
      if (outcome.bonusTriggered && outcome.bonusType) {
        setTimeout(() => {
          const finalScatters =
            currentScatters >= 3
              ? currentScatters
              : outcome.bonusType === 'ethereal'
              ? 6
              : outcome.bonusType === 'legend'
              ? 5
              : outcome.bonusType === 'ghost'
              ? 4
              : 3;
          setPendingBonus({
            bonusType: outcome.bonusType!,
            scatterCount: finalScatters,
            spinsAwarded: Math.max(10, outcome.bonusSpinsAwarded || 10),
            startMultiplier: getBonusStartMultiplier(finalScatters, outcome.bonusSpinFrames),
          });
          setIsBonusIntroOpen(true);
        }, pace(1600));
      }

      // Autoplay loop continuation using robust refs
      if (isAutoActiveRef.current) {
        if (autoStopOnWinRef.current && outcome.totalWin > 0) {
          stopAutoplay();
        } else if (autoStopOnFeatureRef.current && outcome.bonusTriggered) {
          stopAutoplay();
        } else if (
          isSimulationRunRef.current &&
          outcome.bonusTriggered &&
          outcome.bonusType &&
          simulationStopBonusesRef.current.includes(outcome.bonusType)
        ) {
          // Keep the session alive but paused so the player can choose to play
          // this bonus before continuing the remaining real spins.
          autoSpinsRemainingRef.current -= 1;
          setAutoSpinsRemaining(autoSpinsRemainingRef.current);
          isAutoActiveRef.current = false;
          setIsAutoActive(false);
          setSimulationRun((current) => {
            if (!current) return current;
            const remaining = autoSpinsRemainingRef.current;
            const paused = {
              ...current,
              isRunning: false,
              isPaused: remaining > 0,
              stopReason: `${outcome.scatterCount} scatter bonus reached.`,
            };
            simulationRunRef.current = paused;
            return paused;
          });
          if (autoSpinsRemainingRef.current <= 0) isSimulationRunRef.current = false;
        } else if (outcome.bonusTriggered) {
          // Count the trigger wager now, then resume remaining auto spins
          // after the bonus total screen is dismissed.
          autoSpinsRemainingRef.current -= 1;
          setAutoSpinsRemaining(autoSpinsRemainingRef.current);
          if (autoSpinsRemainingRef.current <= 0) stopAutoplay('Voyage complete.');
        } else if (autoSpinsRemainingRef.current > 1) {
          autoSpinsRemainingRef.current -= 1;
          setAutoSpinsRemaining(autoSpinsRemainingRef.current);
          if (isBigWinOutcome && !outcome.bonusTriggered && celebrationPendingRef.current) {
            // The celebration owns the pause. Resume only after the player closes it.
            autoResumeAfterCelebrationRef.current = true;
          } else {
          const pauseTime = pace(outcome.totalWin > 0 ? (isTurbo ? 900 : 2000) : (isTurbo ? 350 : 800));
            setTimeout(() => {
              if (isAutoActiveRef.current && !isBonusActive) executeSpinRef.current();
            }, pauseTime);
          }
        } else {
          stopAutoplay('Voyage complete.');
        }
      }
    },
    [
      activeMode,
      balance,
      currentBet,
      isTurbo,
      isSuperTurbo,
      isMenuOpen,
      isPaytableOpen,
      isEnhancersOpen,
      isAutoOpen,
      isSkipBonusConfirmOpen,
      sessionParams,
      isBonusActive,
      isBonusIntroOpen,
      pendingBonus,
      isCelebrationOpen,
      stopAutoplay,
      showCaptainCameo,
    ]
  );

  // Sync ref with latest executeSpin callback
  useEffect(() => {
    executeSpinRef.current = executeSpin;
  }, [executeSpin]);

  // ----------------------------------------------------
  // Spacebar Keydown Listener (Stake Engine [228])
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat || (e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)))) return;
        if (
          !isOpeningOpen &&
          !isSpinning &&
          !isAutoActive &&
          !isBonusActive &&
          !isBonusIntroOpen &&
          !pendingBonus &&
          !isMenuOpen &&
          !isSkipBonusConfirmOpen &&
          !isEnhancersOpen &&
          !isAutoOpen &&
          !isPaytableOpen &&
          !isCelebrationOpen
        ) {
          executeSpin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpeningOpen,
    isSpinning,
    isAutoActive,
    isBonusActive,
    isBonusIntroOpen,
    pendingBonus,
    isMenuOpen,
    isSkipBonusConfirmOpen,
    isEnhancersOpen,
    isAutoOpen,
    isPaytableOpen,
    isCelebrationOpen,
    executeSpin,
  ]);
  // ----------------------------------------------------
  // Controlled Sequential Free Spins Executor
  // ----------------------------------------------------
  const runNextFreeSpin = useCallback(async () => {
    if (skipBonusNowRef.current) return;
    if (isBonusSpinExecutingRef.current) return;
    const animationSpeed = bonusAnimationSpeedRef.current;
    const pace = (milliseconds: number) => Math.max(45, Math.round(milliseconds / animationSpeed));
    if (bonusSpinsRemainingRef.current <= 0) {
      const surge = wildSurgeRef.current;
      if (surge && surge.linesAwarded > 0 && wildSurgePhaseRef.current === 'pending') {
        isBonusSpinExecutingRef.current = true;
        setIsSpinning(true);
        wildSurgePhaseRef.current = 'announcement';
        setWildSurgeAnnouncement({ wildCount: surge.wildCount, linesAwarded: surge.linesAwarded });
        await new Promise((res) => setTimeout(res, pace(1800)));
        if (skipBonusNowRef.current) return;

        setWildSurgeAnnouncement(null);
        wildSurgePhaseRef.current = 'spin';
        setWildSurgeFinaleActive(true);
        setBonusWildCount(surge.wildCount);
        setIsSpinning(true);
        setSpinningReels([true, true, true, true, true]);
        soundManager.startReelSpin(isTurbo);
        const surgeResult = evaluateBonusSpinFrame(surge.frame, currentBet);
        for (let reel = 0; reel < 5; reel++) {
          await new Promise((res) => setTimeout(res, pace(isTurbo ? 200 : 480)));
          if (skipBonusNowRef.current) return;
          setSpinningReels((previous) => previous.map((value, index) => index === reel ? false : value));
          setGrid((previous) => previous.map((column, index) => index === reel ? surgeResult.grid[reel] : column));
          soundManager.playReelStop(reel);
        }
        const previousMultiplier = bonusMultiplierRef.current;
        setBonusMultiplierRollCue(surgeResult.multiplier > previousMultiplier ? 'rise' : 'hold');
        setBonusMultiplierRollId((rollId) => rollId + 1);
        bonusMultiplierRef.current = surgeResult.multiplier;
        setBonusMultiplier(surgeResult.multiplier);
        setWildMultiplier(surgeResult.multiplier);
        await new Promise((res) => setTimeout(res, BONUS_MULTIPLIER_ROLL_MS));
        if (skipBonusNowRef.current) return;
        const surgeHits = surgeResult.lineHits;
        setWinningHits(surgeHits);
        const spinWinBeforeConnections = bonusAccumulatedWinRef.current;
        let finalWinShown = false;
        for (let index = 0; index < surgeHits.length; index++) {
          setActiveHitIndex(index);
          soundManager.playLineWin(index);
          setLastWin(advanceBonusPayoutProgress(
            surgeHits[index].winAmount,
            bonusPayoutProgressRef.current,
            index === surgeHits.length - 1,
          ));
          await new Promise((res) => setTimeout(res, pace(isTurbo ? 250 : 550) + 1000));
          if (skipBonusNowRef.current) return;
          finalWinShown = true;
        }
        const surgeLineWin = sumLinePayouts(surgeHits);
        bonusAccumulatedWinRef.current = spinWinBeforeConnections + surgeLineWin;
        if (!finalWinShown) setLastWin(advanceBonusPayoutProgress(0, bonusPayoutProgressRef.current, true));
        setActiveHitIndex(null);
        setWildSurgeFinaleActive(false);
        setIsSpinning(false);
        isBonusSpinExecutingRef.current = false;
        wildSurgePhaseRef.current = 'done';
        setTimeout(() => runNextFreeSpinRef.current(), pace(600));
        return;
      }

      // Completed bonus round!
      const prepaid = bonusPayoutPrepaidRef.current;
      const finalBonusTotal = prepaid > 0 ? prepaid : bonusAccumulatedWinRef.current;
      setLastWin(finalBonusTotal);
      // Books/RGS already paid the feature value on the trigger spin.
      if (!usingRgsRef.current && !isSimulationBonusPreviewRef.current) {
        setBalance((prev) => prev + finalBonusTotal);
      }
      if (finalBonusTotal > 0 && usingRgsRef.current && sessionParams.rgsUrl) {
        rgsEndRound({
          rgsUrl: sessionParams.rgsUrl,
          sessionID: sessionParams.sessionId,
        })
          .then((ended) => {
            if (ended.balance !== undefined) setBalance(ended.balance);
          })
          .catch(() => {});
      }
      bonusPayoutPrepaidRef.current = 0;
      isSimulationBonusPreviewRef.current = false;
      setIsSimulationBonusPreview(false);
      isSimulationRunRef.current = false;
      setIsBonusActive(false);
      setWildSurgeFinaleActive(false);
      wildSurgeRef.current = undefined;
      wildSurgePhaseRef.current = 'done';
      setIsSpinning(false);
      isBonusSpinExecutingRef.current = false;
      setTimeout(() => {
        setIsCelebrationTotal(true);
        setCelebrationAmount(finalBonusTotal);
        setIsCelebrationOpen(true);
        settlePausedSimulation('Bonus round complete. Resume the remaining simulation spins.');
      }, 1000);
      return;
    }

    isBonusSpinExecutingRef.current = true;
    setIsSpinning(true);

    // Initial spin pause - comfortable slot pacing
    await new Promise((res) => setTimeout(res, pace(isTurbo ? 220 : 550)));
    if (skipBonusNowRef.current) return;

    setSpinningReels([true, true, true, true, true]);
    soundManager.startReelSpin(isTurbo);

    // Compute free spin result
    const recordedFrame = bonusSpinFramesRef.current.shift();
    const freeRes = recordedFrame
      ? evaluateBonusSpinFrame(recordedFrame, currentBet)
      : playBonusFreeSpin(
          bonusTypeRef.current,
          currentBet,
          bonusMultiplierRef.current
        );

    // Sequential stops across the 5 reels with visible rolling & deceleration
    for (let r = 0; r < 5; r++) {
      const delay = pace(isTurbo ? 200 : 480);
      await new Promise((res) => setTimeout(res, delay));
      if (skipBonusNowRef.current) return;

      setSpinningReels((prev) => {
        const next = [...prev];
        next[r] = false;
        return next;
      });

      setGrid((prev) => {
        const next = [...prev];
        next[r] = freeRes.grid[r];
        return next;
      });

      soundManager.playReelStop(r);
    }

    const previousMultiplier = bonusMultiplierRef.current;
    setBonusMultiplierRollCue(freeRes.multiplier > previousMultiplier ? 'rise' : 'hold');
    setBonusMultiplierRollId((rollId) => rollId + 1);
    bonusMultiplierRef.current = freeRes.multiplier;
    // Keep the published frame multiplier and paytable line values intact.
    setBonusMultiplier(freeRes.multiplier);
    await new Promise((res) => setTimeout(res, BONUS_MULTIPLIER_ROLL_MS));
    if (skipBonusNowRef.current) return;
    const wildsOnBoard = freeRes.grid.reduce((count, reel) => count + reel.filter((symbol) => symbol === 'WILD').length, 0);
    bonusWildCountRef.current += wildsOnBoard;
    setBonusWildCount(bonusWildCountRef.current);

    // Deduct 1 spin from remaining
    bonusSpinsRemainingRef.current -= 1;

    // Handle retriggers
    if (freeRes.retriggerSpins > 0) {
      bonusSpinsRemainingRef.current += freeRes.retriggerSpins;
      bonusTotalSpinsRef.current += freeRes.retriggerSpins;
      setBonusTotalSpins(bonusTotalSpinsRef.current);
      setRetriggerSpins(freeRes.retriggerSpins);
      soundManager.playScatterLand(3);
      await new Promise((res) => setTimeout(res, pace(1400)));
      if (skipBonusNowRef.current) return;
      setRetriggerSpins(0);
    }

    setBonusSpinsRemaining(bonusSpinsRemainingRef.current);


    // Show each exact paytable connection and add that same amount to the
    // running round total.
    const lineHitsToShow = freeRes.lineHits;
    const hasAnotherFrame = bonusSpinFramesRef.current.length > 0;
    const hasSurge = Boolean(wildSurgeRef.current?.linesAwarded);
    const isFinalBonusFrame = !hasAnotherFrame && !hasSurge;
    setWinningHits(lineHitsToShow);
    for (let idx = 0; idx < lineHitsToShow.length; idx++) {
      setActiveHitIndex(idx);
      soundManager.playLineWin(idx);
      setLastWin(advanceBonusPayoutProgress(
        lineHitsToShow[idx].winAmount,
        bonusPayoutProgressRef.current,
        isFinalBonusFrame && idx === lineHitsToShow.length - 1,
      ));
      await new Promise((res) => setTimeout(res, pace(isTurbo ? 250 : 550) + 1000));
      if (skipBonusNowRef.current) return;
    }

    if (lineHitsToShow.length === 0 && isFinalBonusFrame) {
      setLastWin(advanceBonusPayoutProgress(0, bonusPayoutProgressRef.current, true));
    }

    bonusAccumulatedWinRef.current += freeRes.spinWin;
    const spinWin = freeRes.spinWin;
    const isBig = spinWin >= currentBet * 30;
    soundManager.playWin(isBig);
    if (!isBig && spinWin >= currentBet * 5) showCaptainCameo(spinWin, spinWin / currentBet);
    if (isBig) {
      await new Promise((res) => setTimeout(res, pace(2000)));
      if (skipBonusNowRef.current) return;
      setActiveHitIndex(null);
      setIsCelebrationTotal(false);
      setCelebrationAmount(spinWin);
      setIsCelebrationOpen(true);
      isBonusSpinExecutingRef.current = false;
      setIsSpinning(false);
      return;
    }

    await new Promise((res) => setTimeout(res, pace(lineHitsToShow.length ? (isTurbo ? 600 : 1200) : (isTurbo ? 350 : 800))));
    if (skipBonusNowRef.current) return;

    setActiveHitIndex(null);
    setIsSpinning(false);
    isBonusSpinExecutingRef.current = false;

    // Check if more spins remain or if finished
    if (bonusSpinsRemainingRef.current > 0) {
      setTimeout(() => {
        runNextFreeSpinRef.current();
      }, pace(isTurbo ? 350 : 850));
    } else {
      setTimeout(() => runNextFreeSpinRef.current(), 500);
    }
  }, [currentBet, isTurbo, sessionParams.rgsUrl, sessionParams.sessionId, settlePausedSimulation, showCaptainCameo]);

  // Keep runNextFreeSpinRef synced
  useEffect(() => {
    runNextFreeSpinRef.current = runNextFreeSpin;
  }, [runNextFreeSpin]);

  const handleStartBonus = () => {
    if (!pendingBonus || isBonusMultiplierRollOpen) return;
    setIsBonusIntroOpen(false);
    setIsBonusMultiplierRollOpen(true);
  };

  const handleMultiplierRollComplete = () => {
    if (!pendingBonus) return;
    setIsBonusMultiplierRollOpen(false);
    isExecutingRef.current = false;
    setMysteryText(null);
    setIsBonusActive(true);
    setBonusType(pendingBonus.bonusType);
    bonusTypeRef.current = pendingBonus.bonusType;
    setBonusSpinsRemaining(pendingBonus.spinsAwarded);
    bonusSpinsRemainingRef.current = pendingBonus.spinsAwarded;
    setBonusTotalSpins(pendingBonus.spinsAwarded);
    bonusTotalSpinsRef.current = pendingBonus.spinsAwarded;
    bonusWildCountRef.current = 0;
    setBonusWildCount(0);
    const startMultiplier = pendingBonus.startMultiplier;
    setBonusMultiplier(startMultiplier);
    bonusMultiplierRef.current = startMultiplier;
    setBonusMultiplierRollCue('start');
    setBonusMultiplierRollId((rollId) => rollId + 1);
    bonusAccumulatedWinRef.current = 0;
    setLastWin(0);
    skipBonusNowRef.current = false;
    setPendingBonus(null);

    // Start the feature only after the saved opening multiplier has settled.
    setTimeout(() => {
      runNextFreeSpinRef.current();
    }, 300);
  };

  const handleConfirmSkipBonus = () => {
    setIsSkipBonusConfirmOpen(false);
    skipBonusNowRef.current = true;
    wildSurgePhaseRef.current = 'done';
    wildSurgeRef.current = undefined;
    setWildSurgeAnnouncement(null);
    setWildSurgeFinaleActive(false);
    bonusSpinsRemainingRef.current = 0;
    setBonusSpinsRemaining(0);
    isBonusSpinExecutingRef.current = false;
    soundManager.stopReelLoop();
    setIsSpinning(false);
    setSpinningReels([false, false, false, false, false]);
    setTeaseReels([false, false, false, false, false]);
    const isSimulationRgsBonus = isSimulationBonusPreviewRef.current && usingRgsRef.current;
    const prepaid = bonusPayoutPrepaidRef.current;
    const finalBonusTotal = prepaid > 0 ? prepaid : bonusAccumulatedWinRef.current;
    setLastWin(finalBonusTotal);
    if (!usingRgsRef.current && !isSimulationBonusPreviewRef.current) setBalance((prev) => prev + finalBonusTotal);
    if (finalBonusTotal > 0 && usingRgsRef.current && sessionParams.rgsUrl) {
      if (isSimulationRgsBonus) setIsSimulationSettlementPending(true);
      rgsEndRound({ rgsUrl: sessionParams.rgsUrl, sessionID: sessionParams.sessionId })
        .then((ended) => { if (ended.balance !== undefined) setBalance(ended.balance); })
        .catch((error) => {
          if (isSimulationRgsBonus) {
            setWarningMessage(toSocialText(error instanceof Error ? error.message : 'Could not settle the bonus round.', sessionParams.isSocial));
            setTimeout(() => setWarningMessage(null), 3500);
          }
        })
        .finally(() => { if (isSimulationRgsBonus) setIsSimulationSettlementPending(false); });
    }
    bonusPayoutPrepaidRef.current = 0;
    isSimulationBonusPreviewRef.current = false;
    setIsSimulationBonusPreview(false);
    isSimulationRunRef.current = false;
    setIsBonusActive(false);
    setIsCelebrationTotal(true);
    setCelebrationAmount(finalBonusTotal);
    setIsCelebrationOpen(true);
    settlePausedSimulation('Bonus skipped. Resume the remaining simulation spins.');
  };

  const handleCelebrationDismiss = () => {
    celebrationPendingRef.current = false;
    setIsCelebrationOpen(false);

    if (!isCelebrationTotal && autoResumeAfterCelebrationRef.current) {
      autoResumeAfterCelebrationRef.current = false;
      if (isAutoActiveRef.current && autoSpinsRemainingRef.current > 0) {
        setTimeout(() => {
          if (isAutoActiveRef.current && autoSpinsRemainingRef.current > 0) executeSpinRef.current();
        }, isTurbo ? 350 : 850);
      }
    }

    if (isCelebrationTotal) {
      // Total win celebration dismissed: clean up bonus state completely
      setIsCelebrationTotal(false);
      setIsBonusActive(false);
      setBonusSpinsRemaining(0);
      bonusSpinsRemainingRef.current = 0;
      bonusTotalSpinsRef.current = 0;
      isBonusSpinExecutingRef.current = false;
      skipBonusNowRef.current = false;
      bonusPayoutBigWinRef.current = false;
      if (isAutoActiveRef.current && autoSpinsRemainingRef.current > 0) {
        setTimeout(() => {
          if (isAutoActiveRef.current && autoSpinsRemainingRef.current > 0) {
            executeSpinRef.current();
          }
        }, isTurbo ? 350 : 850);
      }
      return;
    }

    // If inside active free spins
    if (isBonusActive) {
      if (bonusSpinsRemainingRef.current > 0) {
        setTimeout(() => {
          runNextFreeSpinRef.current();
        }, 400);
      } else {
        setTimeout(() => runNextFreeSpinRef.current(), 300);
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleStartAuto = (opts: { spins: number; stopOnWin: boolean; stopOnFeature: boolean }) => {
    isSimulationRunRef.current = false;
    simulationRunRef.current = null;
    setSimulationRun(null);
    autoSpeedFactorRef.current = isSuperTurbo ? 2 : 1;
    isAutoActiveRef.current = true;
    autoSpinsRemainingRef.current = opts.spins;
    autoStopOnWinRef.current = opts.stopOnWin;
    autoStopOnFeatureRef.current = opts.stopOnFeature;
    setIsAutoActive(true);
    setAutoSpinsRemaining(opts.spins);
    setAutoStopOnWin(opts.stopOnWin);
    setAutoStopOnFeature(opts.stopOnFeature);
    setIsAutoOpen(false);
    setTimeout(() => {
      executeSpinRef.current();
    }, 200);
  };

  const cycleTurbo = () => {
    if (!isTurbo) {
      setIsTurbo(true);
      setIsSuperTurbo(false);
    } else if (!isSuperTurbo) {
      setIsSuperTurbo(true);
    } else {
      setIsTurbo(false);
      setIsSuperTurbo(false);
    }
  };

  const handleStartSimulation = (opts: { spins: number; stopOnBonuses: BonusType[]; speed: SpinSpeed }) => {
    const mode = activeMode;
    const costPerSpin = currentBet * MODE_CONFIGS[mode].costMultiplier;
    if (!isRgsAuthenticated || !sessionParams.rgsUrl) {
      setWarningMessage(toSocialText('Voyage Simulator needs a successfully authenticated RGS session. Launch through Engine Play Game with a session ID and RGS URL. Demo and live sessions are supported.', sessionParams.isSocial));
      setTimeout(() => setWarningMessage(null), 3500);
      return;
    }
    if (balance < costPerSpin) {
      setWarningMessage(toSocialText('Insufficient balance for one spin in the current mode.', sessionParams.isSocial));
      setTimeout(() => setWarningMessage(null), 3500);
      return;
    }
    const initial: SimulationRun = {
      mode,
      total: opts.spins,
      completed: 0,
      wins: 0,
      bonuses: 0,
      wagered: 0,
      payout: 0,
      best: 0,
      netHistory: [0],
      speed: opts.speed,
      isRunning: true,
      isPaused: false,
      stopReason: null,
      foundBonus: null,
    };
    simulationModeRef.current = mode;
    simulationStopBonusesRef.current = opts.stopOnBonuses;
    autoSpeedFactorRef.current = opts.speed;
    isSimulationRunRef.current = true;
    simulationRunRef.current = initial;
    setSimulationRun(initial);
    setIsSimulationSettlementPending(false);
    autoSpinsRemainingRef.current = opts.spins;
    setAutoSpinsRemaining(0);
    autoStopOnWinRef.current = false;
    autoStopOnFeatureRef.current = false;
    isAutoActiveRef.current = false;
    setIsAutoActive(false);
    setIsAutoOpen(false);
    setTimeout(() => simulationTickRef.current(), 120);
  };

  const handleResumeSimulation = () => {
    const current = simulationRunRef.current;
    if (!current?.isPaused || current.foundBonus || autoSpinsRemainingRef.current <= 0 || isBonusActive || isBonusIntroOpen || isCelebrationOpen) return;
    const resumed = { ...current, isRunning: true, isPaused: false, stopReason: null };
    simulationRunRef.current = resumed;
    setSimulationRun(resumed);
    isSimulationRunRef.current = true;
    simulationTimerRef.current = setTimeout(() => simulationTickRef.current(), 120);
  };

  const handlePlayFoundBonus = () => {
    const current = simulationRunRef.current;
    const outcome = current?.foundBonus;
    if (!current?.isPaused || !outcome || isBonusActive || isSpinning) return;
    const updated = { ...current, foundBonus: null, stopReason: 'Bonus preview in progress.' };
    simulationRunRef.current = updated;
    setSimulationRun(updated);
    isSimulationRunRef.current = true;
    isSimulationBonusPreviewRef.current = true;
    setIsSimulationBonusPreview(true);
    autoSpeedFactorRef.current = current.speed;
    bonusAnimationSpeedRef.current = current.speed;
    executeSpinRef.current(current.mode, outcome);
  };

  const handleSkipFoundBonus = () => {
    const current = simulationRunRef.current;
    if (!current?.foundBonus || isSimulationSettlementPending) return;
    const updated = { ...current, foundBonus: null, stopReason: 'Bonus skipped. Resume to continue.' };
    simulationRunRef.current = updated;
    setSimulationRun(updated);
    setIsSimulationSettlementPending(true);
    if (current.foundBonus.totalWin > 0) {
      rgsEndRound({ rgsUrl: sessionParams.rgsUrl, sessionID: sessionParams.sessionId })
        .then((ended) => {
          if (ended.balance !== undefined) setBalance(ended.balance);
          setIsSimulationSettlementPending(false);
          settlePausedSimulation('Bonus skipped. Resume the remaining simulation spins.');
        })
        .catch((error) => {
          setWarningMessage(toSocialText(error instanceof Error ? error.message : 'Could not settle the bonus round.', sessionParams.isSocial));
          setTimeout(() => setWarningMessage(null), 3500);
          const failed = { ...updated, isRunning: false, isPaused: true, stopReason: 'Could not settle the bonus round.' };
          simulationRunRef.current = failed;
          setSimulationRun(failed);
          setIsSimulationSettlementPending(false);
        });
    } else {
      setIsSimulationSettlementPending(false);
      settlePausedSimulation('Bonus skipped. Resume the remaining simulation spins.');
    }
  };

  useEffect(() => {
    simulationTickRef.current = async () => {
      const current = simulationRunRef.current;
      if (!current?.isRunning || current.foundBonus) return;
      const wager = currentBet * MODE_CONFIGS[current.mode].costMultiplier;
      if (balance < wager) {
        setWarningMessage(toSocialText('Insufficient balance for the next simulated spin.', sessionParams.isSocial));
        setTimeout(() => setWarningMessage(null), 3500);
        stopAutoplay('Stopped: balance is too low for the next spin.');
        return;
      }

      let outcome: SpinResult;
      let playBalanceForSimulation: number | undefined;
      try {
        const play = await rgsPlay({ rgsUrl: sessionParams.rgsUrl, sessionID: sessionParams.sessionId, baseBet: currentBet, mode: current.mode });
        playBalanceForSimulation = play.balance;
        outcome = rgsRoundToSpinResult(play.round, current.mode, currentBet);
      } catch (error) {
        setWarningMessage(toSocialText(error instanceof Error ? error.message : 'Voyage spin failed.', sessionParams.isSocial));
        setTimeout(() => setWarningMessage(null), 3500);
        stopAutoplay('Stopped: RGS play failed.');
        return;
      }

      const latest = simulationRunRef.current ?? current;
      const completed = latest.completed + 1;
      const nextPayout = latest.payout + outcome.totalWin;
      const net = nextPayout - latest.wagered - wager;
      const hitSelectedBonus = Boolean(outcome.bonusTriggered && outcome.bonusType && simulationStopBonusesRef.current.includes(outcome.bonusType));
      if (hitSelectedBonus) setBalance((previous) => Math.max(0, previous - wager));
      else if (playBalanceForSimulation !== undefined) setBalance(playBalanceForSimulation);
      else setBalance((previous) => Math.max(0, previous - wager));
      const isFinished = completed >= latest.total;
      const updated: SimulationRun = {
        ...latest,
        completed,
        wins: latest.wins + Number(outcome.totalWin > 0),
        bonuses: latest.bonuses + Number(outcome.bonusTriggered),
        wagered: latest.wagered + wager,
        payout: nextPayout,
        best: Math.max(latest.best, outcome.totalWin),
        netHistory: [...latest.netHistory, net].slice(-160),
        isRunning: latest.isRunning && !hitSelectedBonus && !isFinished,
        isPaused: hitSelectedBonus,
        stopReason: hitSelectedBonus ? `${outcome.scatterCount} scatter bonus found.` : isFinished ? 'Voyage complete.' : null,
        foundBonus: hitSelectedBonus ? outcome : null,
      };
      simulationRunRef.current = updated;
      setSimulationRun(updated);
      autoSpinsRemainingRef.current = current.total - completed;
      isSimulationRunRef.current = updated.isRunning;
      if (hitSelectedBonus) return;

      if (outcome.totalWin > 0) {
        try {
          const ended = await rgsEndRound({ rgsUrl: sessionParams.rgsUrl, sessionID: sessionParams.sessionId });
          if (ended.balance !== undefined) setBalance(ended.balance);
        } catch (error) {
          setWarningMessage(toSocialText(error instanceof Error ? error.message : 'Could not settle this voyage round.', sessionParams.isSocial));
          setTimeout(() => setWarningMessage(null), 3500);
          stopAutoplay('Stopped: RGS round could not be settled.');
          return;
        }
      }

      if (simulationRunRef.current?.isRunning) {
        simulationTimerRef.current = setTimeout(() => simulationTickRef.current(), Math.max(35, Math.round(650 / latest.speed)));
      }
    };
  }, [balance, currentBet, sessionParams, stopAutoplay]);

  const handleSimulationSpeedChange = (speed: SpinSpeed) => {
    autoSpeedFactorRef.current = speed;
    setSimulationRun((current) => {
      if (!current) return current;
      const updated = { ...current, speed };
      simulationRunRef.current = updated;
      return updated;
    });
  };

  const handleDismissSimulation = () => {
    if (isSimulationRunRef.current) return;
    simulationRunRef.current = null;
    setSimulationRun(null);
  };

  const handleStopAuto = () => {
    stopAutoplay('Stopped by player.');
  };

  // Loader Screen (Stake Engine [275])
  if (isLoading) {
    return <StudioLoadingScreen gameName="Loading Sea Raider…" />;
  }

  if (connectionError) {
    return (
      <main id="game-surface" className="flex h-screen w-screen items-center justify-center bg-[#05070d] p-5 text-white">
        <section role="alert" className="max-w-md rounded-2xl border border-amber-500/40 bg-slate-950 p-6 text-center shadow-2xl">
          <h1 className="text-xl font-black text-amber-300">Connection unavailable</h1>
          <p className="mt-3 text-sm text-slate-300">{connectionError}</p>
        </section>
      </main>
    );
  }

  if (sessionParams.isReplay && replayData) {
    return <ReplayScreen replay={replayData.replay} mode={replayData.mode} amountMicro={replayData.amount} currency={sessionParams.currency} isSocial={sessionParams.isSocial} />;
  }

  return (
    <main
      id="game-surface"
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none bg-black"
    >
      {/* Living backdrop: rolling ocean, ship sway and flickering deck lanterns */}
      <SeaBackdrop glow={sceneGlow} />

      {/* Feature mode selector */}
      {isEnhancersOpen ? (
        <EnhancersModal
          isOpen={isEnhancersOpen}
          onClose={() => setIsEnhancersOpen(false)}
          activeMode={activeMode}
          onSelectMode={(mode) => setActiveMode(mode)}
          betLevel={currentBet}
          currency={sessionParams.currency}
          isSocial={sessionParams.isSocial}
        />
      ) : (
        <>
          {/* Top Header Bar with Scalable Logos */}
          <header className="game-header relative z-20 flex items-center justify-between px-2 sm:px-6 py-1 sm:py-2 w-full shrink-0">
            {/* Left: Sea Raider Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-28 sm:w-48 md:w-64 h-8 sm:h-14 md:h-20 hover:scale-105 transition-transform">
                <Image
                  src="/assets/aistudio/logo_37cf1416.webp"
                  alt="Sea Raider"
                  fill
                  priority
                  sizes="(max-width: 640px) 112px, 256px"
                  className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
                />
              </div>
              <span className="hidden xl:inline-block text-[10px] sm:text-xs text-amber-300 font-extrabold tracking-widest drop-shadow-md">
                25,000x MAX · 50,000x ETHEREAL
              </span>
            </div>

            {/* Center: Alerts or Mystery Outcome text */}
            {warningMessage ? (
              <div className="px-3 py-1 bg-red-600/90 border border-red-300 text-white font-black text-[10px] sm:text-xs rounded-full shadow-lg animate-bounce">
                {warningMessage}
              </div>
            ) : (!isBonusActive && mysteryText) ? (
              <div className="px-3 py-1 bg-purple-900/90 border border-purple-400 text-purple-200 font-extrabold text-[10px] sm:text-xs rounded-full shadow-lg animate-pulse">
                {mysteryText}
              </div>
            ) : null}

            {/* Right: Provider Logo & Social Casino Badge */}
            <div className="flex items-center gap-2 sm:gap-4">
              {sessionParams.isSocial && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black rounded-full uppercase tracking-wider">
                  SOCIAL
                </span>
              )}

              <div className="relative w-20 sm:w-36 md:w-48 h-6 sm:h-10 md:h-14 opacity-95 hover:opacity-100 transition-opacity">
                <Image
                  src="/assets/aistudio/provider_logo_ee1a8c04.webp"
                  alt="Ethereal Gold Studios"
                  fill
                  priority
                  sizes="(max-width: 640px) 80px, 192px"
                  className="object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
          </header>

          {/* Mobile-Only Top Action Bar for feature modes and Turbo */}
          <div className="game-mobile-actions sm:hidden relative z-20 flex items-center justify-between px-3 w-full max-w-[440px] mx-auto -my-1 shrink-0">
            <FeatureBuyButton
              compact
              onClick={() => setIsEnhancersOpen(true)}
              isSocial={sessionParams.isSocial}
              activeModeName={activeMode !== 'base' ? MODE_CONFIGS[activeMode].name.split(' ')[0] : null}
            />

            <button
              onClick={cycleTurbo}
              aria-label={isSuperTurbo ? 'Switch turbo off' : isTurbo ? 'Enable ultra turbo' : 'Enable turbo'}
              title={isSuperTurbo ? 'Ultra Turbo · click to turn off' : isTurbo ? 'Turbo · click for Ultra Turbo' : 'Turbo off · click for Turbo'}
              className="relative flex h-9 min-w-9 flex-col items-center justify-center active:scale-95 transition-transform"
            >
              <Image
                src={
                  isTurbo
                    ? '/assets/aistudio/spin_speed_on_1eeebfcd.webp'
                    : '/assets/aistudio/spin_speed_off_12664d81.webp'
                }
                alt="Turbo Spin"
                fill
                sizes="32px"
                className="object-contain"
              />
              <span className="absolute -bottom-1 rounded bg-black/85 px-1 text-[6px] font-black leading-tight text-amber-200">
                {isSuperTurbo ? 'ULTRA' : isTurbo ? 'TURBO' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Center Stage: feature controls, reels, and bonus meter */}
          <section className={`game-stage relative z-10 flex-1 flex items-center justify-center px-1 sm:px-4 md:px-6 w-full max-h-[74vh] min-h-0 gap-2 sm:gap-4 md:gap-6 ${isBonusActive ? 'game-stage--wild-surge' : ''}`}>
            {/* Desktop left feature-mode button */}
            <div className="hidden sm:flex flex-col items-center justify-center shrink-0">
              <FeatureBuyButton
                onClick={() => setIsEnhancersOpen(true)}
                isSocial={sessionParams.isSocial}
                activeModeName={activeMode !== 'base' ? MODE_CONFIGS[activeMode].name : null}
              />
              <button
                onClick={cycleTurbo}
                title={isSuperTurbo ? 'Ultra Turbo · click to turn off' : isTurbo ? 'Turbo · click for Ultra Turbo' : 'Turbo off · click for Turbo'}
                aria-label={isSuperTurbo ? 'Switch turbo off' : isTurbo ? 'Enable ultra turbo' : 'Enable turbo'}
                className={`turbo-toggle mt-4 ${isTurbo ? 'turbo-toggle--on' : ''} ${isSuperTurbo ? 'turbo-toggle--ultra' : ''}`}
              >
                <span className="turbo-toggle__icon relative h-9 w-9 sm:h-10 sm:w-10">
                  <Image src={isTurbo ? '/assets/aistudio/spin_speed_on_1eeebfcd.webp' : '/assets/aistudio/spin_speed_off_12664d81.webp'} alt="" fill sizes="40px" className="object-contain" />
                </span>
                <span className="turbo-toggle__label">{isSuperTurbo ? 'ULTRA TURBO' : isTurbo ? 'TURBO' : 'TURBO OFF'}</span>
              </button>
            </div>

            {/* Central 5x3 Reel Grid Frame */}
            <div className="game-reel-shell relative flex-1 max-w-[1600px] flex items-center justify-center min-h-0">
              {/* Round line multiplier banner pinned above the reel frame */}
              <div className="game-multiplier-anchor absolute left-1/2 z-30 pointer-events-none">
                <MultiplierBanner
                  multiplier={isBonusActive ? bonusMultiplier : wildMultiplier}
                  label={isBonusActive ? 'BONUS MULTIPLIER' : 'GAME MULTIPLIER'}
                  isBonusActive={isBonusActive}
                  rollId={bonusMultiplierRollId}
                  rollCue={bonusMultiplierRollCue}
                />
              </div>

              <ReelGrid
                grid={grid}
                spinningReels={spinningReels}
                teaseReels={teaseReels}
                winningHits={winningHits}
                activeHitIndex={activeHitIndex}
                wildMultiplier={wildMultiplier}
                isBonusActive={isBonusActive}
                explosions={explosions}
                onExplosionComplete={handleExplosionComplete}
                landedScatterCount={landedScatterCount}
            captainRevealCount={captainReveal?.count ?? null}
            captainRevealReel={captainReveal?.reel ?? null}
            captainRevealRow={captainReveal?.row ?? null}
            captainRevealPhase={captainReveal?.phase ?? null}
                isTurbo={isTurbo}
                currency={sessionParams.currency}
                lanternBlaze={isCelebrationOpen}
              />
            </div>

            {/* Give wide screens a side rail and small screens a horizontal meter below the reels. */}
            <div className="game-wild-surge-rail hidden md:flex shrink-0 items-center justify-center">
              {isBonusActive && <WildSurgeMeter bonusType={bonusType} wildCount={bonusWildCount} orientation="vertical" />}
            </div>
            <div className="game-wild-surge-rail-compact">
              {isBonusActive && <WildSurgeMeter bonusType={bonusType} wildCount={bonusWildCount} orientation="horizontal" />}
            </div>
          </section>

          {/* Bottom Control Bar Panel with Integrated Free Spins Dock */}
          <footer className="game-footer relative z-20 pb-2 sm:pb-3 w-full">
            <ControlPanel
              balance={balance}
              betLevel={currentBet}
              onIncreaseBet={handleIncreaseBet}
              onDecreaseBet={handleDecreaseBet}
              lastWin={lastWin}
              isSpinning={isSpinning}
              onSpin={() => executeSpin()}
              isAutoActive={isAutoActive}
              autoSpinsRemaining={autoSpinsRemaining}
              onOpenAuto={() => setIsAutoOpen(true)}
              onStopAuto={handleStopAuto}
              activeMode={activeMode}
              onOpenPaytable={() => setIsPaytableOpen(true)}
              onOpenMenu={() => setIsMenuOpen(true)}
              currency={sessionParams.currency}
              isSocial={sessionParams.isSocial}
              canBet={balance >= totalSpinCost}
              isBonusActive={isBonusActive}
              bonusSpinsRemaining={bonusSpinsRemaining}
              bonusTotalSpins={bonusTotalSpins}
              bonusFinale={isBonusActive && isSpinning && bonusSpinsRemaining === 0 && wildSurgeFinaleActive}
              isSimulationPaused={Boolean(simulationRun?.isPaused || simulationRun?.isRunning)}
              isTurbo={isTurbo}
              onSkipBonus={() => {
                setSkipBonusHasBigWin(bonusPayoutBigWinRef.current);
                setIsSkipBonusConfirmOpen(true);
              }}
            />
          </footer>
        </>
      )}

      {/* Bonus Intro Screen Modal */}
      {isBonusIntroOpen && pendingBonus && (
        <BonusIntroModal
          isOpen={isBonusIntroOpen}
          bonusType={pendingBonus.bonusType}
          scatterCount={pendingBonus.scatterCount}
          spinsAwarded={pendingBonus.spinsAwarded}
          onStart={handleStartBonus}
        />
      )}

      {isBonusMultiplierRollOpen && pendingBonus && (
        <BonusMultiplierRoller
          key={`${pendingBonus.scatterCount}-${pendingBonus.startMultiplier}`}
          isOpen={isBonusMultiplierRollOpen}
          scatterCount={pendingBonus.scatterCount}
          startMultiplier={pendingBonus.startMultiplier}
          onComplete={handleMultiplierRollComplete}
        />
      )}

      {isSkipBonusConfirmOpen && isBonusActive && (
        <div className="ship-overlay fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="skip-bonus-title">
          <div className="ship-dialog ship-dialog-enter w-full max-w-sm p-6 text-center">
            <h2 id="skip-bonus-title" className="ship-heading text-2xl sm:text-3xl">Skip the remaining spins?</h2>
            <p className="ship-body mt-3 text-sm">{skipBonusHasBigWin ? 'A big win is already booked for this bonus and will still be shown.' : 'Skipping now ends the remaining bonus spins and shows the round total.'}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsSkipBonusConfirmOpen(false)} className="ship-button ship-button--ghost flex-1">Keep sailing</button>
              <button onClick={handleConfirmSkipBonus} className="ship-button flex-1">Skip bonus</button>
            </div>
          </div>
        </div>
      )}

      {/* Autoplay Dialog */}
      <AutoplayModal
        isOpen={isAutoOpen}
        onClose={() => setIsAutoOpen(false)}
        onStartAuto={handleStartAuto}
        onStartSimulation={handleStartSimulation}
        isSocial={sessionParams.isSocial}
        activeMode={activeMode}
        baseBet={currentBet}
        balance={balance}
        currency={sessionParams.currency}
        canStartSimulation={isRgsAuthenticated}
        isDemo={sessionParams.isDemo}
      />

      {isSimulationBonusPreview && <div role="status" className="fixed left-1/2 top-2 z-[80] -translate-x-1/2 rounded-full border border-emerald-300/70 bg-emerald-950/95 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-wide text-emerald-100 shadow-lg sm:text-[10px]">Voyage bonus · RGS win · wallet settles at round end</div>}

      <SimulationRunPanel
        run={simulationRun}
        currency={sessionParams.currency}
        onStop={() => stopAutoplay('Stopped by player.')}
        onResume={handleResumeSimulation}
        onPlayFoundBonus={handlePlayFoundBonus}
        onSkipFoundBonus={handleSkipFoundBonus}
        onSpeedChange={handleSimulationSpeedChange}
        onDismiss={handleDismissSimulation}
        canResume={!isSimulationSettlementPending && !isBonusActive && !isBonusIntroOpen && !pendingBonus && !isCelebrationOpen && !isSpinning}
      />

      {/* Paytable & Rules Modal */}
      <PaytableModal
        isOpen={isPaytableOpen}
        onClose={() => setIsPaytableOpen(false)}
        isSocial={sessionParams.isSocial}
      />

      {/* Game Menu Modal (Settings, Stats, Turbo, Fullscreen) */}
      <GameMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenPaytable={() => {
          setIsMenuOpen(false);
          setIsPaytableOpen(true);
        }}
        turboLevel={isSuperTurbo ? 2 : isTurbo ? 1 : 0}
        onToggleTurbo={cycleTurbo}
        onToggleFullscreen={handleToggleFullscreen}
        isSocial={sessionParams.isSocial}
      />

      {/* Big Win Particle Celebration */}
      {isCelebrationOpen && (
        <WinCelebration
          winAmount={celebrationAmount}
          betAmount={totalSpinCost}
          currency={sessionParams.currency}
          isSocial={sessionParams.isSocial}
          onDismiss={handleCelebrationDismiss}
          isTotalWin={isCelebrationTotal}
        />
      )}
      <CaptainCameo cameo={isCelebrationOpen ? null : captainCameo} currency={sessionParams.currency} />
      {wildSurgeAnnouncement && (
        <WildSurgeAnnouncement
          wildCount={wildSurgeAnnouncement.wildCount}
          linesAwarded={wildSurgeAnnouncement.linesAwarded}
        />
      )}

      {isOpeningOpen && !sessionParams.isReplay && (
        <OpeningModal isSocial={sessionParams.isSocial} onContinue={() => setIsOpeningOpen(false)} />
      )}
    </main>
  );
}
