import type { PaylineHit } from './slot-engine';

export interface BonusPayoutProgress {
  rawTotal: number;
  bookedTotal: number;
  rawSoFar: number;
  bookedSoFar: number;
}

export function createBonusPayoutProgress(rawTotal: number, bookedTotal: number): BonusPayoutProgress {
  return {
    rawTotal: Math.max(0, rawTotal),
    bookedTotal: Math.max(0, bookedTotal),
    rawSoFar: 0,
    bookedSoFar: 0,
  };
}

/**
 * Advance the round's authoritative RGS feature win once per completed spin.
 * PaylineHit values must remain untouched: they are calculated from the
 * published paytable and the frame multiplier, while the booked feature
 * return is a separate round-level amount supplied by Engine.
 */
export function advanceBonusPayoutProgress(
  rawSpinWin: number,
  progress: BonusPayoutProgress,
  isFinalSpin = false,
): number {
  const exactAmount = Math.max(0, rawSpinWin);
  progress.rawSoFar += exactAmount;
  const nextTotal = progress.bookedSoFar + exactAmount;

  // Keep the running counter tied to the same exact amount shown in each
  // line alert. Only reconcile any tiny serialization rounding at
  // the end of the feature, when the authoritative booked total is known.
  progress.bookedSoFar = isFinalSpin
    ? progress.bookedTotal
    : nextTotal;
  return progress.bookedSoFar;
}

export function sumLinePayouts(hits: PaylineHit[]): number {
  return hits.reduce((sum, hit) => sum + hit.winAmount, 0);
}
