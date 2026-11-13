export type SymbolId = 'H1' | 'H2' | 'H3' | 'H4' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'WILD' | 'SCATTER';
export interface SymbolMeta {
    id: SymbolId;
    name: string;
    category: 'high' | 'low' | 'special';
    asset: string;
    payouts: Record<number, number>;
}
export declare const SYMBOL_METAS: Record<SymbolId, SymbolMeta>;
export declare const PAYLINES: [number, number][][];
export declare const BASE_REEL_STRIPS: SymbolId[][];
export type PlayMode = 'base' | 'bonus_chance' | 'super_bonus' | 'pirates_chance' | 'feature_spin' | 'unknown_bonus' | 'unknown_extreme';
export declare const MAX_RTP_PERCENT = 96.7;
export declare const STANDARD_MAX_WIN_MULTIPLIER = 25000;
export declare const EXTREME_MAX_WIN_MULTIPLIER = 50000;
export declare const UNKNOWN_BONUS_MAX_WIN_MULTIPLIER = 50000;
export declare const MAX_WIN_TRIGGER_ODDS: Record<PlayMode, number>;
export declare const BONUS_OUTCOME_ODDS: {
    readonly bonus_chance: {
        readonly three: 0.99;
        readonly four: 0.008;
        readonly five: 0.002;
    };
    readonly super_bonus: {
        readonly three: 0.45;
        readonly four: 0.4;
        readonly five: 0.15;
    };
    readonly pirates_chance: {
        readonly three: 0.15;
        readonly four: 0.25;
        readonly five: 0.6;
    };
    readonly unknown_bonus: {
        readonly three: 0.52;
        readonly four: 0.369;
        readonly five: 0.11;
        readonly ethereal: 0.001;
    };
    readonly unknown_extreme: {
        readonly noBonus: 0.85;
        readonly hidden: 0.13;
        readonly ethereal: 0.02;
    };
};
export declare const BONUS_TRIGGER_ODDS: Partial<Record<PlayMode, number>>;
export declare const MODE_PAYOUT_SCALES: Record<PlayMode, number>;
export interface ModeConfig {
    id: PlayMode;
    name: string;
    costMultiplier: number;
    description: string;
    rtp: number;
    maxWin: string;
    category: 'enhancer' | 'feature';
    badgeAsset?: string;
}
export declare const MODE_CONFIGS: Record<PlayMode, ModeConfig>;
export interface PaylineHit {
    lineIndex: number;
    symbol: SymbolId;
    count: number;
    multiplier: number;
    winAmount: number;
    positions: [number, number][];
}
export type BonusType = 'curse' | 'ghost' | 'legend' | 'ethereal';
export declare const WILD_SURGE_WILDS_PER_LINE: Record<BonusType, number>;
export declare const WILD_SURGE_MAX_LINES = 3;
export interface BonusSpinFrame {
    board: SymbolId[][];
    multiplier: number;
    retriggerSpins: number;
}
export interface WildSurgeResult {
    wildCount: number;
    wildsPerLine: number;
    linesAwarded: number;
    frame: BonusSpinFrame;
}
export declare const BONUS_PAYOUT_SCALE = 1;
export declare const MODE_BONUS_PAYOUT_SCALES: Record<PlayMode, number>;
export interface SpinResult {
    grid: SymbolId[][];
    totalLineWin: number;
    lineHits: PaylineHit[];
    scatterCount: number;
    scatterPositions: [number, number][];
    wildMultiplier: number;
    bonusTriggered: boolean;
    bonusType: BonusType | null;
    bonusSpinsAwarded: number;
    totalWin: number;
    payoutMultiplier: number;
    isMaxWin: boolean;
    mysteryOutcomeText?: string;
    bonusSpinFrames?: BonusSpinFrame[];
    wildSurge?: WildSurgeResult;
}
export declare function createMaxWinResult(mode: PlayMode, baseBet?: number): SpinResult;
/**
 * Evaluates paylines for a 5x3 grid
 */
export declare function evaluateGrid(grid: SymbolId[][], totalPlay: number, payoutScale?: number): {
    totalLineWin: number;
    lineHits: PaylineHit[];
    scatterCount: number;
    scatterPositions: [number, number][];
};
/**
 * Generates a random 5x3 grid from reel strips
 */
export declare function generateRandomGrid(strips?: SymbolId[][]): SymbolId[][];
/**
 * Resolves a spin with specific mode math
 */
export declare function playSpin(mode: PlayMode, baseBet?: number): SpinResult;
/**
 * Executes a single free spin in bonus mode
 */
export declare function playBonusFreeSpin(bonusType: 'curse' | 'ghost' | 'legend' | 'ethereal', baseBet?: number, currentMultiplier?: number, payoutScale?: number): {
    grid: SymbolId[][];
    spinWin: number;
    lineHits: PaylineHit[];
    multiplier: number;
    retriggerSpins: number;
};
/** Evaluate a precomputed feature frame used consistently by live play and replay. */
export declare function evaluateBonusSpinFrame(frame: BonusSpinFrame, baseBet: number): ReturnType<typeof playBonusFreeSpin>;
