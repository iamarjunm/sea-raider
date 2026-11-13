import fs from 'node:fs';
import path from 'node:path';

const root = new URL('./publish_files/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const projectRoot = new URL('../', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));

if (!Array.isArray(index.modes) || index.modes.length < 1 || index.modes.length > 20) {
  throw new Error('index.json must contain between 1 and 20 modes');
}

const names = new Set();
for (const mode of index.modes) {
  if (!mode.name || !/^[A-Za-z0-9_-]{1,32}$/.test(mode.name)) {
    throw new Error(`Invalid mode name: ${mode.name}`);
  }
  if (names.has(mode.name.toLowerCase())) {
    throw new Error(`Duplicate mode name: ${mode.name}`);
  }
  names.add(mode.name.toLowerCase());
  if (!Number.isFinite(mode.cost) || mode.cost < 1) {
    throw new Error(`Invalid cost for ${mode.name}`);
  }

  const eventsPath = path.join(root, mode.events);
  if (!fs.existsSync(eventsPath)) {
    throw new Error(`${mode.name}: missing events file ${mode.events}`);
  }
  const eventsFile = mode.events.endsWith('.zst')
    ? mode.events.slice(0, -4)
    : mode.events;
  const packagedEventsPath = path.join(root, eventsFile);
  const uncompressedEventsPath = fs.existsSync(packagedEventsPath)
    ? packagedEventsPath
    : path.join(projectRoot, eventsFile);
  const events = fs.existsSync(uncompressedEventsPath)
    ? fs
        .readFileSync(uncompressedEventsPath, 'utf8')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map(JSON.parse)
    : null;
  const rows = fs
    .readFileSync(path.join(root, mode.weights), 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(','));

  if (events && events.length !== rows.length) {
    throw new Error(`${mode.name}: event and lookup row counts differ`);
  }

  let totalWeight = 0;
  let weightedPayout = 0;
  let fiveScatterWeight = 0;
  let sixScatterWeight = 0;
  let noBonusWeight = 0;
  let fourScatterWeight = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const [id, weight, payout] = rows[i];
    if (!/^\d+$/.test(id) || !/^\d+$/.test(weight) || !/^\d+$/.test(payout)) {
      throw new Error(`${mode.name}: CSV values must be unsigned integers`);
    }
    if (events && (!Number.isInteger(events[i].id) || !Array.isArray(events[i].events))) {
      throw new Error(`${mode.name}: invalid game-logic row ${i + 1}`);
    }
    if (events && events[i].payoutMultiplier !== Number(payout)) {
      throw new Error(`${mode.name}: payout mismatch at row ${i + 1}`);
    }
    weightedPayout += Number(weight) * Number(payout);
    if (events) {
      const event = events[i].events[0];
      const scatterCount = event.scatterCount ?? 0;
      const payoutX = Number(payout) / 100;
      if (scatterCount === 5) {
        fiveScatterWeight += Number(weight);
        if (payoutX < 1_500 || payoutX > 25_000) {
          throw new Error(`${mode.name}: 5-scatter payout ${payoutX}x is outside 1,500x–25,000x`);
        }
      }
      if (scatterCount === 4) fourScatterWeight += Number(weight);
      if (scatterCount === 6) {
        sixScatterWeight += Number(weight);
        if (payoutX < 8_000 || payoutX > 50_000) {
          throw new Error(`${mode.name}: 6-scatter payout ${payoutX}x is outside 8,000x–50,000x`);
        }
      }
      if (mode.name === 'feature_spin' && !event.board.some((reel) => reel.includes('WILD'))) {
        throw new Error(`feature_spin: outcome ${i + 1} does not contain its guaranteed Wild`);
      }
      if (mode.name === 'unknown_extreme' && !event.bonusTriggered) noBonusWeight += Number(weight);
    }
    totalWeight += Number(weight);
  }
  if (totalWeight <= 0) {
    throw new Error(`${mode.name}: lookup-table weight sum must be positive`);
  }
  const maxMultiplier = ['unknown_bonus', 'unknown_extreme'].includes(mode.name) ? 5_000_000 : 2_500_000;
  if (rows.some((row) => Number(row[2]) > maxMultiplier)) {
    throw new Error(`${mode.name}: a payout exceeds its configured max-win cap`);
  }
  const rtp = weightedPayout / totalWeight / 100 / mode.cost;
  if (rtp > 0.967 + 0.00001 || rtp < 0.95) {
    throw new Error(`${mode.name}: published RTP ${(rtp * 100).toFixed(4)}% is outside the 95%–96.7% target range`);
  }
  if (events && mode.name === 'unknown_bonus') {
    if (events.some((event) => !event.events[0].bonusTriggered || ![3, 4, 5, 6].includes(event.events[0].scatterCount))) {
      throw new Error('unknown_bonus: every outcome must award its guaranteed scatter feature');
    }
    if (fiveScatterWeight !== 110_000_000_000 || sixScatterWeight !== 1_000_000_000) {
      throw new Error('unknown_bonus: scatter outcome shares differ from the advertised 11% / 0.1%');
    }
    const hasFiveScatterTop = rows.some((row, index) =>
      Number(row[1]) > 0 && [2_498_800, 2_500_000].includes(Number(row[2])) && events[index].events[0].scatterCount === 5
    );
    const hasSixScatterTop = rows.some((row, index) =>
      Number(row[1]) > 0 && Number(row[2]) === 5_000_000 && events[index].events[0].scatterCount === 6
    );
    if (!hasFiveScatterTop || !hasSixScatterTop) {
      throw new Error('unknown_bonus: missing the 24,988x–25,000x five-scatter or 50,000x six-scatter top payout');
    }
  }
  const expectedTierWeights = {
    bonus_chance: [900_000_000_000, 96_000_000_000, 3_500_000_000, 500_000_000],
    super_bonus: [945_000_000_000, 30_250_000_000, 22_000_000_000, 2_750_000_000],
    pirates_chance: [987_500_000_000, 1_875_000_000, 3_125_000_000, 7_500_000_000],
  };
  if (events && expectedTierWeights[mode.name]) {
    const [none, three, four, five] = expectedTierWeights[mode.name];
    const actualNone = totalWeight - fiveScatterWeight - fourScatterWeight -
      events.reduce((sum, event, index) => sum + (event.events[0].scatterCount === 3 ? Number(rows[index][1]) : 0), 0);
    const threeWeight = events.reduce((sum, event, index) => sum + (event.events[0].scatterCount === 3 ? Number(rows[index][1]) : 0), 0);
    if (actualNone !== none || threeWeight !== three || fourScatterWeight !== four || fiveScatterWeight !== five) {
      throw new Error(`${mode.name}: published bonus trigger shares do not match the advertised odds`);
    }
  }
  if (events && mode.name === 'unknown_extreme') {
    if (fiveScatterWeight !== 130_000_000_000 || sixScatterWeight !== 20_000_000_000 || noBonusWeight !== 850_000_000_000) {
      throw new Error('unknown_extreme: scatter outcome shares differ from the advertised 85% / 13% / 2%');
    }
  }
}

console.log(`Valid math publish files: ${index.modes.length} modes`);
