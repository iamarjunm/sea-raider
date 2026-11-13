/**
 * Samples Sea Raider outcomes from the same weighted books published to Stake Engine.
 * Keeps local/demo play aligned with maths/publish_files.
 */
import bookTables from './book-tables.json';
import {
  MODE_CONFIGS,
  PlayMode,
  SpinResult,
  SymbolId,
  BonusType,
  BonusSpinFrame,
  WildSurgeResult,
  evaluateGrid,
  generateRandomGrid,
} from './slot-engine';

interface BookEvent {
  type: string;
  mode: string;
  result: string;
  board: SymbolId[][];
  scatterCount: number;
  bonusTriggered: boolean;
  bonusType: BonusType | null;
  bonusSpinsAwarded: number;
  wildMultiplier: number;
  mysteryOutcomeText: string | null;
  payoutX: number;
  bonusSpinFrames?: BonusSpinFrame[];
  wildSurge?: WildSurgeResult;
}

interface BookEntry {
  id: number;
  weight: number;
  payoutMultiplier: number;
  event: BookEvent;
}

interface ModeTable {
  cost: number;
  maxWin: number;
  entries: BookEntry[];
}

const TABLES = bookTables as {
  targetRtp: number;
  modes: Record<string, ModeTable>;
};

function pickWeighted(entries: BookEntry[]): BookEntry {
  let total = 0;
  for (const entry of entries) total += entry.weight;
  let cursor = Math.random() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/**
 * Convert a published book row into a SpinResult the UI already understands.
 * Published math-book payoutMultiplier is hundredths of the base bet
 * (100 = 1x). This is the serialized file format, not the RGS API format.
 */
export function bookEntryToSpinResult(
  entry: BookEntry,
  mode: PlayMode,
  baseBet: number
): SpinResult {
  const event = entry.event;
  const board = event.board.map((col) => [...col]) as SymbolId[][];
  const totalWin = (entry.payoutMultiplier / 100) * baseBet;
  // Engine's payoutMultiplier is expressed against the base bet. Mode cost is
  // applied to the line stake, so source it from the published mode table.
  const wager = baseBet * getPublishedModeCost(mode);
  const effectiveLineMultiplier = event.wildMultiplier || 1;
  const evalRes = evaluateGrid(board, wager, effectiveLineMultiplier);
  // Show the actual paytable connections on ordinary spins. Feature rounds
  // book their full return at the RGS round level, so their scatter board is
  // not presented as a set of line wins.
  // The published round payout is authoritative. Ordinary outcomes are built
  // so their payline total matches it; never rescale individual line awards to
  // hide a mismatch, since that invents payouts that are not in the paytable.
  const lineHits = event.bonusTriggered || totalWin <= 0 || evalRes.totalLineWin <= 0
    ? []
    : evalRes.lineHits;
  const maxCap =
    (event.bonusType === 'ethereal' ? 50_000 : 25_000) * baseBet;

  return {
    grid: board,
    totalLineWin: lineHits.reduce((sum, hit) => sum + hit.winAmount, 0),
    lineHits,
    scatterCount: event.scatterCount || evalRes.scatterCount,
    scatterPositions: evalRes.scatterPositions,
    wildMultiplier: effectiveLineMultiplier,
    bonusTriggered: Boolean(event.bonusTriggered),
    bonusType: (event.bonusType as BonusType | null) || null,
    bonusSpinsAwarded: event.bonusSpinsAwarded || 0,
    totalWin: Math.min(totalWin, maxCap),
    payoutMultiplier: Math.min(totalWin, maxCap) / wager,
    isMaxWin: totalWin >= maxCap * 0.999,
    mysteryOutcomeText: event.mysteryOutcomeText || undefined,
    bonusSpinFrames: event.bonusSpinFrames,
    wildSurge: event.wildSurge,
  };
}

/** Randomize visible stops without changing the booked line payout or feature. */
function randomizePresentationBoard(result: SpinResult, mode: PlayMode, baseBet: number): SpinResult {
  if (result.bonusTriggered) return result;

  const wager = baseBet * getPublishedModeCost(mode);
  const wantsScatterNearMiss = mode === 'bonus_chance' || mode === 'unknown_extreme';
  const targetWin = result.totalLineWin;

  // The weighted book has a small set of canonical boards. Randomize the
  // visible reel stops while keeping ordinary line wins exactly paytable-valid.
  // For zero-win Chance / Unknown Extreme outcomes, add one or two scatters as
  // a near-miss tease; fewer than three can never award the feature.
  for (let attempt = 0; attempt < 1400; attempt += 1) {
    const board: SymbolId[][] = generateRandomGrid().map((reel) => reel.map((symbol) => symbol === 'SCATTER' ? 'L1' : symbol));
    const targetScatters = wantsScatterNearMiss && targetWin === 0 ? (Math.random() < 0.68 ? 2 : 1) : 0;
    if (targetScatters > 0) {
      // Keep tease scatters on early reels so at least one reel is still
      // spinning when the anticipation animation starts.
      const cells = Array.from({ length: 9 }, (_, index) => index + 3);
      for (let index = cells.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [cells[index], cells[swap]] = [cells[swap], cells[index]];
      }
      const usedReels = new Set<number>();
      for (const cell of cells) {
        const reel = Math.floor(cell / 3);
        if (usedReels.has(reel)) continue;
        usedReels.add(reel);
        board[reel][cell % 3] = 'SCATTER';
        if (usedReels.size === targetScatters) break;
      }
    }

    const evaluated = evaluateGrid(board, wager, result.wildMultiplier);
    if (evaluated.scatterCount >= 3 || Math.abs(evaluated.totalLineWin - targetWin) > Math.max(0.000001, baseBet * 0.000001)) continue;
    return {
      ...result,
      grid: board,
      lineHits: evaluated.lineHits,
      totalLineWin: evaluated.totalLineWin,
      scatterCount: evaluated.scatterCount,
      scatterPositions: evaluated.scatterPositions,
    };
  }

  return result;
}

/** Sample a spin from published math books (local / demo). */
export function sampleBookSpin(mode: PlayMode, baseBet: number = 1): SpinResult {
  const table = TABLES.modes[mode];
  if (!table) {
    throw new Error(`No published book table for mode "${mode}"`);
  }
  const entry = pickWeighted(table.entries);
  return randomizePresentationBoard(bookEntryToSpinResult(entry, mode, baseBet), mode, baseBet);
}

/** Lightweight sampler for the no-wager autoplay simulator. */
export function sampleBookPayout(mode: PlayMode): { payoutMultiplier: number; bonusType: BonusType | null } {
  const table = TABLES.modes[mode];
  if (!table) throw new Error(`No published book table for mode "${mode}"`);
  const entry = pickWeighted(table.entries);
  return { payoutMultiplier: entry.payoutMultiplier, bonusType: entry.event.bonusType };
}

/** Parse an RGS /wallet/play round payload into a SpinResult. */
export function rgsRoundToSpinResult(
  round: {
    payoutMultiplier?: number;
    state?: unknown;
    events?: unknown;
    mode?: string;
  },
  mode: PlayMode,
  baseBet: number,
  randomizePresentation = false,
): SpinResult {
  const rawState = round.state || round.events || [];
  const stateObject = rawState && typeof rawState === 'object' ? rawState as {
    events?: unknown[];
    state?: unknown[];
    event?: unknown;
    board?: unknown;
  } : null;
  const events = (Array.isArray(rawState) ? rawState
    : Array.isArray(stateObject?.events) ? stateObject.events
    : Array.isArray(stateObject?.state) ? stateObject.state
    : stateObject?.event ? [stateObject.event]
    : stateObject?.board ? [rawState]
    : []) as BookEvent[];
  const reveal = events.find((event) =>
    event &&
    Array.isArray(event.board) &&
    event.board.length === 5 &&
    event.board.every((reel) => Array.isArray(reel) && reel.length >= 3)
  );
  // RGS play and replay APIs return payoutMultiplier as a normal x multiplier
  // (for example, 25.0 means 25x). Published book files instead store 2500.
  const payoutMultiplierX = Number(round.payoutMultiplier ?? 0);
  const payoutMultiplier = Math.round(payoutMultiplierX * 100);
  const entry: BookEntry = {
    id: 0,
    weight: 1,
    payoutMultiplier,
    event: (reveal as BookEvent) || {
      type: 'reveal',
      mode,
      result: payoutMultiplier > 0 ? 'win' : 'no_win',
      board: [
        ['L5', 'L4', 'L3'],
        ['L2', 'L1', 'H4'],
        ['H3', 'H2', 'H1'],
        ['L5', 'L4', 'L3'],
        ['L2', 'L1', 'H4'],
      ],
      scatterCount: 0,
      bonusTriggered: false,
      bonusType: null,
      bonusSpinsAwarded: 0,
      wildMultiplier: 1,
      mysteryOutcomeText: null,
      payoutX: payoutMultiplierX,
    },
  };
  const result = bookEntryToSpinResult(entry, mode, baseBet);
  return randomizePresentation ? randomizePresentationBoard(result, mode, baseBet) : result;
}

export function getPublishedModeCost(mode: PlayMode): number {
  return TABLES.modes[mode]?.cost ?? MODE_CONFIGS[mode].costMultiplier;
}
