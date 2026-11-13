import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAYLINES,
  SYMBOL_METAS,
  evaluateGrid,
  playSpin,
  sampleBookSpin,
  MODE_CONFIGS,
  MAX_RTP_PERCENT,
  BONUS_OUTCOME_ODDS,
  BONUS_TRIGGER_ODDS,
  EXTREME_MAX_WIN_MULTIPLIER,
  UNKNOWN_BONUS_MAX_WIN_MULTIPLIER,
  STANDARD_MAX_WIN_MULTIPLIER,
  createMaxWinResult,
  SymbolId,
  PlayMode,
  bookEntryToSpinResult,
  rgsRoundToSpinResult,
  evaluateBonusSpinFrame,
  BonusSpinFrame,
} from './slot-engine';
import { formatMoney, toSocialText } from './currency';
import { normalizeRgsUrl, rgsBetConfigToLevels } from './rgs-client';
import { shouldShowCaptainReveal } from './captain-reveal';
import { advanceBonusPayoutProgress, createBonusPayoutProgress, sumLinePayouts } from './bonus-line-payout';
import mathSummary from '../maths/math-summary.json';
import bookTables from '../maths/book-tables.json';

test('Paylines are exactly 20 lines on a 5x3 grid', () => {
  assert.equal(PAYLINES.length, 20);
  for (const line of PAYLINES) {
    assert.equal(line.length, 5);
    for (const [col, row] of line) {
      assert.ok(col >= 0 && col < 5, `col ${col} out of bounds`);
      assert.ok(row >= 0 && row < 3, `row ${row} out of bounds`);
    }
  }
});

test('Evaluate 3-of-a-kind line with WILD substitution', () => {
  // Line 1 is top row: (0,0), (1,0), (2,0), (3,0), (4,0)
  const grid: SymbolId[][] = [
    ['H1', 'L5', 'L5'],
    ['WILD', 'L5', 'L5'],
    ['H1', 'L5', 'L5'],
    ['L2', 'L5', 'L5'],
    ['L3', 'L5', 'L5'],
  ];

  const evalRes = evaluateGrid(grid, 1.0);
  // Line 1 has H1, WILD, H1 -> 3 of H1!
  const hit = evalRes.lineHits.find((h) => h.lineIndex === 1);
  assert.ok(hit, 'Line 1 should hit');
  assert.equal(hit.symbol, 'H1');
  assert.equal(hit.count, 3);
  assert.equal(hit.multiplier, SYMBOL_METAS.H1.payouts[3]);
  assert.ok(Math.abs(hit.winAmount - SYMBOL_METAS.H1.payouts[3] / PAYLINES.length) < 1e-12);
});

test('Line wins divide the total play amount across 20 fixed paylines', () => {
  const grid: SymbolId[][] = Array.from({ length: 5 }, () => ['H1', 'H1', 'H1']);
  const result = evaluateGrid(grid, 1);
  assert.equal(result.lineHits.length, PAYLINES.length);
  assert.ok(result.lineHits.every((hit) => hit.winAmount === SYMBOL_METAS.H1.payouts[5] / PAYLINES.length));
  assert.equal(result.totalLineWin, SYMBOL_METAS.H1.payouts[5]);
  assert.equal(result.lineHits.reduce((sum, hit) => sum + hit.winAmount, 0), result.totalLineWin);
});

test('Enhancer costs match specifications', () => {
  assert.equal(MODE_CONFIGS.bonus_chance.costMultiplier, 5.0);
  assert.equal(MODE_CONFIGS.super_bonus.costMultiplier, 7.0);
  assert.equal(MODE_CONFIGS.pirates_chance.costMultiplier, 25.0);
  assert.equal(MODE_CONFIGS.feature_spin.costMultiplier, 10.0);
  assert.equal(MODE_CONFIGS.unknown_bonus.costMultiplier, 250.0);
  assert.equal(MODE_CONFIGS.unknown_extreme.costMultiplier, 500.0);
});

test('Overall and every mode RTP stay at or below the 96.7% ceiling', () => {
  assert.equal(MAX_RTP_PERCENT, 96.7);
  for (const config of Object.values(MODE_CONFIGS)) {
    assert.ok(
      config.rtp <= MAX_RTP_PERCENT,
      `${config.id} RTP ${config.rtp}% exceeds ${MAX_RTP_PERCENT}%`
    );
    assert.ok(
      Math.abs(config.rtp - mathSummary.modes[config.id].rtp * 100) < 0.0001,
      `${config.id} displayed RTP must match its generated book summary`
    );
  }
});

test('Configured max wins and conditional bonus odds match the bonus cards', () => {
  assert.equal(STANDARD_MAX_WIN_MULTIPLIER, 25_000);
  assert.equal(EXTREME_MAX_WIN_MULTIPLIER, 50_000);
  assert.equal(MODE_CONFIGS.base.maxWin, '25,000x');
  assert.equal(MODE_CONFIGS.bonus_chance.maxWin, '25,000x');
  assert.equal(MODE_CONFIGS.super_bonus.maxWin, '25,000x');
  assert.equal(MODE_CONFIGS.pirates_chance.maxWin, '25,000x');
  assert.equal(MODE_CONFIGS.feature_spin.maxWin, '25,000x');
  assert.equal(MODE_CONFIGS.unknown_bonus.maxWin, '50,000x (Ethereal only)');
  assert.equal(MODE_CONFIGS.unknown_extreme.maxWin, '50,000x (Ethereal only)');
  assert.equal(createMaxWinResult('base').totalWin, 25_000);
  assert.equal(createMaxWinResult('bonus_chance').totalWin, 25_000);
  assert.equal(createMaxWinResult('unknown_extreme').totalWin, 50_000);
  assert.equal(UNKNOWN_BONUS_MAX_WIN_MULTIPLIER, 50_000);
  assert.deepEqual(BONUS_OUTCOME_ODDS.bonus_chance, { three: 0.96, four: 0.035, five: 0.005 });
  assert.deepEqual(BONUS_OUTCOME_ODDS.super_bonus, { three: 0.55, four: 0.40, five: 0.05 });
  assert.deepEqual(BONUS_OUTCOME_ODDS.pirates_chance, { three: 0.15, four: 0.25, five: 0.6 });
  assert.deepEqual(BONUS_OUTCOME_ODDS.unknown_bonus, {
    three: 0.52,
    four: 0.369,
    five: 0.11,
    ethereal: 0.001,
  });
  assert.deepEqual(BONUS_OUTCOME_ODDS.unknown_extreme, {
    noBonus: 0.85,
    hidden: 0.13,
    ethereal: 0.02,
  });
  assert.equal(BONUS_TRIGGER_ODDS.bonus_chance, 0.10);
  assert.equal(BONUS_TRIGGER_ODDS.super_bonus, 0.055);
  assert.equal(BONUS_TRIGGER_ODDS.pirates_chance, 0.0125);
  assert.equal(BONUS_TRIGGER_ODDS.unknown_bonus, 1);
  assert.equal(BONUS_TRIGGER_ODDS.unknown_extreme, 0.15);
});

test('Unknown Extreme triggers correct outcomes within limits', () => {
  let noBonusCount = 0;
  let hiddenCount = 0;
  let etherealCount = 0;
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    const res = playSpin('unknown_extreme', 1.0);
    if (!res.bonusTriggered) {
      noBonusCount++;
    } else if (res.bonusType === 'legend') {
      hiddenCount++;
    } else if (res.bonusType === 'ethereal') {
      etherealCount++;
    }
  }

  // Around ~85% no bonus, ~13% hidden, ~2% ethereal
  assert.ok(noBonusCount > 700, `Expected ~850 no-bonus out of 1000, got ${noBonusCount}`);
  assert.ok(hiddenCount > 50, `Expected ~130 hidden out of 1000, got ${hiddenCount}`);
});

test('Currency formatting handles supported currencies and preserves sub-cent payouts', () => {
  assert.equal(formatMoney(10, 'USD'), '$10.00');
  assert.equal(formatMoney(10, 'JPY'), '¥10');
  assert.equal(formatMoney(10, 'EUR'), '€10.00');
  assert.equal(formatMoney(10, 'XSC'), '10.00 SC');
  assert.equal(formatMoney(1000, 'XGC'), '1,000.00 GC');
  assert.equal(formatMoney(0.005, 'USD'), '$0.005');
  assert.equal(formatMoney(0.005, 'XGC'), '0.005 GC');
  assert.equal(formatMoney(0.005, 'JPY'), '¥0.005');
  assert.equal(formatMoney(10, 'XEC'), '10.00 SC');
  assert.equal(formatMoney(10, 'INR'), '₹10.00');
  assert.equal(formatMoney(10, 'DKK'), '10.00 kr');
  assert.equal(formatMoney(10, 'KWD'), 'KD10.000');
  assert.equal(formatMoney(10, 'ZZZ'), '10.00 ZZZ');
});

test('Social mode replaces restricted words properly', () => {
  assert.equal(toSocialText('Total Bet $10.00', true), 'Total Play $10.00');
  assert.equal(toSocialText('Buy Bonus', true), 'Get Bonus');
  assert.equal(toSocialText('Paytable', true), 'Win Table');
  assert.equal(toSocialText('Cash Out', true), 'Coins Out');
});

test('RGS host, bet bounds, steps, defaults, and active-round amounts are applied', () => {
  assert.equal(normalizeRgsUrl('rgs.example.com'), 'https://rgs.example.com');
  const configured = rgsBetConfigToLevels({
    minBet: 100_000, maxBet: 300_000, stepBet: 50_000,
    defaultBetLevel: 200_000, betLevels: [50_000, 100_000, 150_000, 200_000, 300_000, 350_000],
  });
  assert.deepEqual(configured.levels, [0.1, 0.15, 0.2, 0.3]);
  assert.equal(configured.defaultIndex, 2);
  const resumed = rgsBetConfigToLevels({
    minBet: 100_000, maxBet: 300_000, stepBet: 50_000,
    defaultBetLevel: 200_000, betLevels: [100_000, 200_000, 300_000],
  }, 150_000);
  assert.deepEqual(resumed.levels, [0.1, 0.15, 0.2, 0.3]);
  assert.equal(resumed.defaultIndex, 1);
  assert.throws(() => rgsBetConfigToLevels({ betLevels: [100_000] }));
});

test('Published book sampler matches Stake math hit-rate and cost link', () => {
  assert.equal(MODE_CONFIGS.base.costMultiplier, mathSummary.modes.base.cost);
  assert.equal(MODE_CONFIGS.unknown_bonus.costMultiplier, mathSummary.modes.unknown_bonus.cost);
  assert.equal(MODE_CONFIGS.unknown_extreme.costMultiplier, mathSummary.modes.unknown_extreme.cost);

  let wins = 0;
  const spins = 4000;
  for (let i = 0; i < spins; i++) {
    if (sampleBookSpin('base', 1).totalWin > 0) wins += 1;
  }
  const hitRate = wins / spins;
  // Published base target is ~30% — allow sampling noise
  assert.ok(hitRate > 0.22 && hitRate < 0.4, `Expected ~30% base hit rate, got ${(hitRate * 100).toFixed(1)}%`);
});

test('Every published non-bonus line connection sums to its booked RGS payout', () => {
  for (const [modeName, modeTable] of Object.entries(bookTables.modes)) {
    const mode = modeName as PlayMode;
    for (const entry of modeTable.entries) {
      if (entry.payoutMultiplier <= 0 || entry.event.bonusTriggered) continue;
      const result = bookEntryToSpinResult(
        entry as Parameters<typeof bookEntryToSpinResult>[0],
        mode,
        1
      );
      assert.ok(result.lineHits.length > 0, `${mode} row ${entry.id} must show at least one payline`);
      assert.ok(
        Math.abs(result.totalLineWin - result.totalWin) < 1e-7,
        `${mode} row ${entry.id}: line sum ${result.totalLineWin} must equal booked payout ${result.totalWin}`
      );
    }
  }
});

test('Published bonus paylines and Wild Surge add exactly to the booked round payout', () => {
  for (const [modeName, modeTable] of Object.entries(bookTables.modes)) {
    for (const entry of modeTable.entries) {
      if (!entry.event.bonusTriggered) continue;
      const frames = (entry.event.bonusSpinFrames || []) as BonusSpinFrame[];
      assert.ok(frames.length > 0, `${modeName} row ${entry.id} must include its precomputed bonus frames`);
      const frameResults = frames.map((frame) => evaluateBonusSpinFrame(frame, 1));
      const surge = entry.event.wildSurge?.linesAwarded
        ? evaluateBonusSpinFrame(entry.event.wildSurge.frame as BonusSpinFrame, 1)
        : null;
      const spinWins = [...frameResults.map((frame) => sumLinePayouts(frame.lineHits))];
      if (surge) spinWins.push(sumLinePayouts(surge.lineHits));
      const roundTotal = spinWins.reduce((sum, win) => sum + win, 0);
      const bookedWin = entry.payoutMultiplier / 100;
      assert.ok(roundTotal > 0, `${modeName} row ${entry.id} must show a non-zero payline return`);
      assert.ok(
        Math.abs(roundTotal - bookedWin) < 1e-6,
        `${modeName} row ${entry.id}: payline sum ${roundTotal} must equal Engine payout ${bookedWin}`
      );

      for (const hit of [...frameResults.flatMap((frame) => frame.lineHits), ...(surge?.lineHits || [])]) {
        assert.ok(
          Math.abs(hit.winAmount - hit.multiplier / 20) < 1e-8,
          `${modeName} row ${entry.id}: line amount must follow displayed multiplier and base line stake`
        );
      }

      const progress = createBonusPayoutProgress(roundTotal, bookedWin);
      spinWins.forEach((spinWin, index) => {
        const advanced = advanceBonusPayoutProgress(spinWin, progress, index === spinWins.length - 1);
        assert.ok(advanced >= 0 && advanced <= bookedWin);
      });
      assert.ok(Math.abs(progress.bookedSoFar - bookedWin) < 1e-7);
    }
  }
});

test('Captain sword reveal appears on 30%–40% of published feature boards', () => {
  const featureBoards = Object.values(bookTables.modes).flatMap((modeTable) =>
    modeTable.entries.filter((entry) => entry.event.bonusTriggered).map((entry) => entry.event.board as SymbolId[][])
  );
  const revealRate = featureBoards.filter(shouldShowCaptainReveal).length / featureBoards.length;
  assert.ok(revealRate >= 0.3 && revealRate <= 0.4, `Expected 30%–40%, got ${(revealRate * 100).toFixed(1)}%`);
});

test('RGS API payout multipliers are interpreted as x values, not book hundredths', () => {
  const result = rgsRoundToSpinResult(
    { payoutMultiplier: 156, state: [] },
    'base',
    1
  );
  assert.equal(result.totalWin, 156);

  const fractional = rgsRoundToSpinResult(
    { payoutMultiplier: 1.56, state: [] },
    'base',
    1
  );
  assert.equal(fractional.totalWin, 1.56);
});

test('Published scatter-feature trigger rates match the advertised math', () => {
  const expectedTriggerRates: Record<PlayMode, number> = {
    base: 0.001852180456,
    bonus_chance: 0.10,
    super_bonus: 0.055,
    pirates_chance: 0.0125,
    feature_spin: 0.000117424242,
    unknown_bonus: 1,
    unknown_extreme: 0.15,
  };

  for (const [modeName, table] of Object.entries(bookTables.modes)) {
    const mode = modeName as PlayMode;
    const totalWeight = table.entries.reduce((sum, entry) => sum + entry.weight, 0);
    const tierWeights = new Map<number, number>();
    for (const entry of table.entries) {
      const scatterCount = entry.event.scatterCount;
      tierWeights.set(scatterCount, (tierWeights.get(scatterCount) ?? 0) + entry.weight);
    }
    const triggerWeight = [...tierWeights]
      .filter(([scatterCount]) => scatterCount >= 3)
      .reduce((sum, [, weight]) => sum + weight, 0);
    const triggerRate = triggerWeight / totalWeight;
    assert.ok(
      Math.abs(triggerRate - expectedTriggerRates[mode]) < 1e-10,
      `${mode} feature-trigger rate ${(triggerRate * 100).toFixed(6)}% does not match expected ${(expectedTriggerRates[mode] * 100).toFixed(6)}%`
    );
  }
});
