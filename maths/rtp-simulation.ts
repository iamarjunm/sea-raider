import {
  MAX_RTP_PERCENT,
  MODE_CONFIGS,
  MODE_BONUS_PAYOUT_SCALES,
  createMaxWinResult,
  PlayMode,
  playBonusFreeSpin,
  playSpin,
} from './slot-engine';

const DEFAULT_SPINS = 1_000_000;
const MODES = Object.keys(MODE_CONFIGS) as PlayMode[];

interface ModeStats {
  mode: PlayMode;
  spins: number;
  wagered: number;
  returned: number;
  wins: number;
  bonusRounds: number;
  bonusHits: number;
  maxWin: number;
  maxMultiplier: number;
  capMultiplier: number;
  capHits: number;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const spinsIndex = args.indexOf('--spins');
  const requestedSpins = spinsIndex >= 0 ? Number(args[spinsIndex + 1]) : DEFAULT_SPINS;
  const modeIndex = args.indexOf('--mode');
  const requestedMode = modeIndex >= 0 ? args[modeIndex + 1] : 'all';
  const seedIndex = args.indexOf('--seed');
  const requestedSeed = seedIndex >= 0 ? Number(args[seedIndex + 1]) : undefined;

  if (!Number.isInteger(requestedSpins) || requestedSpins < 1) {
    throw new Error('--spins must be a positive integer');
  }
  if (requestedMode !== 'all' && !MODES.includes(requestedMode as PlayMode)) {
    throw new Error(`Unknown mode "${requestedMode}". Use one of: ${MODES.join(', ')}`);
  }
  if (requestedSeed !== undefined && !Number.isInteger(requestedSeed)) {
    throw new Error('--seed must be an integer');
  }

  return {
    spins: requestedSpins,
    modes: requestedMode === 'all' ? MODES : [requestedMode as PlayMode],
    seed: requestedSeed,
  };
}

function installSeed(seed: number | undefined) {
  if (seed === undefined) return;

  let state = seed >>> 0;
  Math.random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function simulateBonusRound(
  bonusType: 'curse' | 'ghost' | 'legend' | 'ethereal',
  spinsAwarded: number,
  baseBet: number,
  payoutScale: number
) {
  let remaining = spinsAwarded;
  let multiplier = bonusType === 'ethereal' ? 10 : 2;
  let returned = 0;

  while (remaining > 0) {
    const result = playBonusFreeSpin(bonusType, baseBet, multiplier, payoutScale);
    returned += result.spinWin;
    multiplier = result.multiplier;
    remaining -= 1;
    remaining += result.retriggerSpins;
  }

  return returned;
}

function simulateMode(mode: PlayMode, spins: number): ModeStats {
  const config = MODE_CONFIGS[mode];
  const baseBet = 1;
  const wagered = spins * config.costMultiplier;
  let returned = 0;
  let wins = 0;
  let bonusRounds = 0;
  let bonusHits = 0;
  let maxWin = 0;
  let maxMultiplier = 0;
  let capHits = 0;

  for (let spin = 0; spin < spins; spin += 1) {
    const result = playSpin(mode, baseBet);
    let spinReturn = result.totalWin;

    if (result.bonusTriggered && result.bonusType) {
      bonusHits += 1;
      bonusRounds += 1;
      spinReturn += simulateBonusRound(
        result.bonusType,
        result.bonusSpinsAwarded,
        baseBet,
        MODE_BONUS_PAYOUT_SCALES[mode]
      );
    }

    spinReturn = Math.min(spinReturn, createMaxWinResult(mode, baseBet).totalWin);
    returned += spinReturn;
    if (spinReturn > 0) wins += 1;
    if (spinReturn > maxWin) maxWin = spinReturn;
    if (result.isMaxWin) capHits += 1;
    const multiplier = spinReturn;
    if (multiplier > maxMultiplier) maxMultiplier = multiplier;
  }

  return {
    mode,
    spins,
    wagered,
    returned,
    wins,
    bonusRounds,
    bonusHits,
    maxWin,
    maxMultiplier,
    capMultiplier: createMaxWinResult(mode, baseBet).totalWin / baseBet,
    capHits,
  };
}

function formatPercent(value: number) {
  return `${value.toFixed(4)}%`;
}

function printStats(stats: ModeStats) {
  const rtp = (stats.returned / stats.wagered) * 100;
  const hitRate = (stats.wins / stats.spins) * 100;
  const bonusHitRate = (stats.bonusHits / stats.spins) * 100;
  const status = rtp <= MAX_RTP_PERCENT ? 'PASS' : 'FAIL';

  console.log(
    `${status.padEnd(4)} ${stats.mode.padEnd(16)} ` +
      `RTP ${formatPercent(rtp).padStart(10)} ` +
      `BonusHit ${formatPercent(bonusHitRate).padStart(10)} ` +
      `WinHit ${formatPercent(hitRate).padStart(10)} ` +
      `Bonus ${String(stats.bonusRounds).padStart(8)} ` +
      `Max ${stats.maxMultiplier.toFixed(2)}x ` +
      `Caps ${String(stats.capHits).padStart(4)} ` +
      `Cap ${stats.capMultiplier.toFixed(0)}x`
  );

  return rtp;
}

function main() {
  const { spins, modes, seed } = parseArgs();
  installSeed(seed);

  console.log(`RTP simulation: ${spins.toLocaleString()} spins per mode`);
  console.log(`RTP ceiling: ${MAX_RTP_PERCENT.toFixed(2)}%`);
  if (seed !== undefined) console.log(`Seed: ${seed}`);
  console.log('');
  console.log('Mode             RTP        Bonus Hit  Win Hit    Bonus Rounds  Max Win');
  console.log('-------------------------------------------------------------');

  const results = modes.map((mode) => simulateMode(mode, spins));
  const rtps = results.map(printStats);
  const wagered = results.reduce((sum, result) => sum + result.wagered, 0);
  const returned = results.reduce((sum, result) => sum + result.returned, 0);
  const overallRtp = (returned / wagered) * 100;

  console.log('');
  console.log(`OVERALL (equal mode sample) RTP ${formatPercent(overallRtp)}`);
  console.log(`OVERALL STATUS: ${overallRtp <= MAX_RTP_PERCENT ? 'PASS' : 'FAIL'}`);

  if (rtps.some((rtp) => rtp > MAX_RTP_PERCENT) || overallRtp > MAX_RTP_PERCENT) {
    process.exitCode = 1;
  }
}

main();
