import { standardToMicro, microToStandard } from './currency';

/** Engine may provide either a URL or a bare host. Never fall back to another RGS. */
export function normalizeRgsUrl(value: string): string {
  const raw = value.trim();
  if (!raw) throw new Error('Missing RGS URL.');
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/\//, '')}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Invalid RGS URL.');
  return parsed.toString().replace(/\/$/, '');
}

export interface RgsBalance {
  amount: number;
  currency: string;
}

export interface RgsRound {
  betID?: string | number;
  amount?: number;
  payout?: number;
  payoutMultiplier?: number;
  active?: boolean;
  mode?: string;
  state?: unknown[];
  events?: unknown[];
}

export interface RgsReplay {
  payoutMultiplier: number;
  costMultiplier: number;
  state: unknown;
}

export function rgsBetConfigToLevels(config: {
  minBet?: number; maxBet?: number; stepBet?: number; defaultBetLevel?: number; betLevels?: number[];
}, activeAmount?: number): { levels: number[]; defaultIndex: number } {
  const min = Number(config.minBet);
  const max = Number(config.maxBet);
  const step = Number(config.stepBet);
  if (![min, max, step].every(Number.isFinite) || min <= 0 || max < min || step <= 0 || !Array.isArray(config.betLevels)) {
    throw new Error('RGS authentication returned an invalid bet configuration.');
  }
  const levelsMicro = [...new Set(config.betLevels.map(Number))].filter((amount) =>
    Number.isSafeInteger(amount) && amount >= min && amount <= max && (amount - min) % step === 0
  ).sort((a, b) => a - b);
  if (!levelsMicro.length) throw new Error('RGS did not provide any valid bet levels.');
  if (activeAmount != null && Number.isSafeInteger(activeAmount) && activeAmount >= min && activeAmount <= max && (activeAmount - min) % step === 0 && !levelsMicro.includes(activeAmount)) {
    levelsMicro.push(activeAmount);
    levelsMicro.sort((a, b) => a - b);
  }
  const levels = levelsMicro.map(microToStandard);
  const selected = activeAmount ?? Number(config.defaultBetLevel);
  if (activeAmount != null && !Number.isSafeInteger(activeAmount)) throw new Error('The active RGS round did not include a valid bet amount.');
  const defaultIndex = levelsMicro.indexOf(selected);
  if (defaultIndex < 0) throw new Error('RGS default or active-round bet amount is not a supported bet level.');
  return { levels, defaultIndex };
}

export async function fetchRgsReplay(options: {
  rgsUrl: string; game: string; version: string; mode: string; event: string;
}): Promise<RgsReplay> {
  const parts = [options.game, options.version, options.mode, options.event].map((part) => encodeURIComponent(part));
  const res = await fetch(`${normalizeRgsUrl(options.rgsUrl)}/bet/replay/${parts.join('/')}`);
  if (!res.ok) throw new Error(`Replay could not be loaded (HTTP ${res.status}).`);
  const data = await res.json();
  if (!Number.isFinite(Number(data.payoutMultiplier)) || (data.state != null && typeof data.state !== 'object')) {
    throw new Error('Replay response is incomplete.');
  }
  return { payoutMultiplier: Number(data.payoutMultiplier), costMultiplier: Number(data.costMultiplier) || 1, state: data.state ?? [] };
}

export interface RgsPlayResponse {
  balance: RgsBalance | number;
  round: RgsRound;
}

function normalizeBalance(balance: RgsBalance | number | undefined): number | undefined {
  if (balance === undefined || balance === null) return undefined;
  if (typeof balance === 'number') return microToStandard(balance);
  if (typeof balance.amount === 'number') return microToStandard(balance.amount);
  return undefined;
}

export async function rgsPlay(options: {
  rgsUrl: string;
  sessionID: string;
  /** Base bet in standard currency units (RGS applies mode cost). */
  baseBet: number;
  mode: string;
}): Promise<{ balance?: number; round: RgsRound; payoutMultiplier: number }> {
  const url = `${normalizeRgsUrl(options.rgsUrl)}/wallet/play`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionID: options.sessionID,
      amount: standardToMicro(options.baseBet),
      mode: options.mode,
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.error || errBody?.code || detail;
    } catch {
      /* ignore */
    }
    throw new Error(`RGS play failed: ${detail}`);
  }

  const data = (await res.json()) as RgsPlayResponse;
  const round = data.round || ({} as RgsRound);
  const payoutMultiplier = Number(
    round.payoutMultiplier ??
      (round.payout != null && options.baseBet > 0
        ? microToStandard(round.payout) / options.baseBet
        : 0)
  );

  return {
    balance: normalizeBalance(data.balance),
    round: { ...round, payoutMultiplier },
    payoutMultiplier,
  };
}

export async function rgsEndRound(options: {
  rgsUrl: string;
  sessionID: string;
}): Promise<{ balance?: number }> {
  const url = `${normalizeRgsUrl(options.rgsUrl)}/wallet/end-round`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionID: options.sessionID }),
  });
  if (!res.ok) {
    throw new Error(`RGS end-round failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return { balance: normalizeBalance(data.balance) };
}
