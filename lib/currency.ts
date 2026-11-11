export interface CurrencyFormatOptions {
  currency?: string;
  isSocial?: boolean;
}

export function formatMoney(amount: number, currency: string = 'USD'): string {
  const code = (currency || 'USD').toUpperCase();
  const metadata: Record<string, { symbol: string; decimals: number; after?: boolean }> = {
    USD: { symbol: '$', decimals: 2 }, CAD: { symbol: 'CA$', decimals: 2 }, JPY: { symbol: '¥', decimals: 0 },
    EUR: { symbol: '€', decimals: 2 }, RUB: { symbol: '₽', decimals: 2 }, CNY: { symbol: 'CN¥', decimals: 2 },
    PHP: { symbol: '₱', decimals: 2 }, INR: { symbol: '₹', decimals: 2 }, IDR: { symbol: 'Rp', decimals: 0 },
    KRW: { symbol: '₩', decimals: 0 }, BRL: { symbol: 'R$', decimals: 2 }, MXN: { symbol: 'MX$', decimals: 2 },
    DKK: { symbol: 'kr', decimals: 2, after: true }, PLN: { symbol: 'zł', decimals: 2, after: true },
    VND: { symbol: '₫', decimals: 0, after: true }, TRY: { symbol: '₺', decimals: 2 }, CLP: { symbol: 'CLP', decimals: 0, after: true },
    ARS: { symbol: 'ARS', decimals: 2, after: true }, PEN: { symbol: 'S/', decimals: 2 }, NGN: { symbol: '₦', decimals: 2 },
    SAR: { symbol: 'SAR', decimals: 2, after: true }, ILS: { symbol: '₪', decimals: 2 }, AED: { symbol: 'AED', decimals: 2, after: true },
    TWD: { symbol: 'NT$', decimals: 2 }, NOK: { symbol: 'kr', decimals: 2, after: true }, KWD: { symbol: 'KD', decimals: 3 },
    JOD: { symbol: 'JD', decimals: 3 }, CRC: { symbol: '₡', decimals: 2 }, TND: { symbol: 'TND', decimals: 3, after: true },
    SGD: { symbol: 'SG$', decimals: 2 }, MYR: { symbol: 'RM', decimals: 2 }, OMR: { symbol: 'OMR', decimals: 3, after: true },
    QAR: { symbol: 'QAR', decimals: 2, after: true }, BHD: { symbol: 'BD', decimals: 3 }, PKR: { symbol: '₨', decimals: 2 },
    EGP: { symbol: 'EGP', decimals: 2, after: true }, NZD: { symbol: 'NZ$', decimals: 2 }, BOB: { symbol: 'Bs', decimals: 2 },
    GHS: { symbol: 'GH₵', decimals: 2 }, KES: { symbol: 'KSh', decimals: 2 }, MAD: { symbol: 'MAD', decimals: 2, after: true },
    BAM: { symbol: 'KM', decimals: 2 }, ISK: { symbol: 'kr', decimals: 0, after: true }, TZS: { symbol: 'TSh', decimals: 2 },
    UGX: { symbol: 'USh', decimals: 0 }, XOF: { symbol: 'CFA', decimals: 0, after: true },
    XGC: { symbol: 'GC', decimals: 2, after: true }, XSC: { symbol: 'SC', decimals: 2, after: true }, XEC: { symbol: 'SC', decimals: 2, after: true },
    USDT: { symbol: 'USDT', decimals: 2, after: true }, BTC: { symbol: 'BTC', decimals: 6, after: true },
  };
  const meta = metadata[code] || { symbol: code, decimals: 2, after: true };
  const extraPrecision = amount > 0 && amount < 0.01;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: extraPrecision ? 6 : meta.decimals,
  });
  return meta.after ? `${formatted} ${meta.symbol}` : `${meta.symbol}${formatted}`;
}

export function microToStandard(micro: number): number {
  return micro / 1000000;
}

export function standardToMicro(standard: number): number {
  return Math.round(standard * 1000000);
}

/**
 * Replace restricted words for Stake.US social mode
 */
const SOCIAL_WORD_MAP: Record<string, string> = {
  'BE AWARDED TO PLAYER\'S ACCOUNTS': 'APPEAR IN PLAYER\'S ACCOUNTS',
  'PLACE YOUR BETS': 'COME AND PLAY',
  'BONUS BUY': 'FEATURE',
  'BUY BONUS': 'GET BONUS',
  'PAID OUT': 'WIN',
  'PAYS OUT': 'WON',
  'PAY OUT': 'WIN',
  'WIN FEATURE': 'PLAY FEATURE',
  'AT THE COST OF': 'FOR',
  'TOTAL BET': 'TOTAL PLAY',
  'BET/S': 'PLAY/S',
  'AUTO BET': 'AUTO PLAY',
  'COST OF': 'CAN BE PLAYED FOR',
  'TOTAL WAGER': 'TOTAL PLAY',
  'PURCHASE COST': 'PLAY AMOUNT',
  'BETTING': 'PLAYING',
  'BETS': 'PLAYS',
  'BET': 'PLAY',
  'BUY': 'PLAY',
  'BOUGHT': 'INSTANTLY TRIGGERED',
  'PURCHASE': 'PLAY',
  'PURCHASING': 'PLAYING',
  'PURCHASED': 'PLAYED',
  'PAYTABLE': 'WIN TABLE',
  'PAY TABLE': 'WIN TABLE',
  'PAYS': 'WINS',
  'PAY': 'WIN',
  'PAID': 'WON',
  'CASH': 'COINS',
  'MONEY': 'COINS',
  'CREDIT': 'COINS',
  'CURRENCY': 'TOKEN',
  'GAMBLE': 'PLAY',
  'DEPOSIT': 'GET COINS',
  'WITHDRAW': 'REDEEM',
  'PAYER': 'WINNER',
  'STAKE': 'PLAY AMOUNT',
  'FUND': 'BALANCE',
  'FUNDS': 'BALANCE',
  'REBET': 'RESPIN',
  'WAGER': 'PLAY',
};

// Sort keys by descending length so phrases like 'BUY BONUS' are replaced before 'BUY'
const SORTED_SOCIAL_KEYS = Object.keys(SOCIAL_WORD_MAP).sort((a, b) => b.length - a.length);

export function toSocialText(text: string, isSocial: boolean = false): string {
  if (!isSocial) return text;
  let result = text;
  for (const restricted of SORTED_SOCIAL_KEYS) {
    const replacement = SOCIAL_WORD_MAP[restricted];
    const regex = new RegExp(`\\b${restricted}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve case
      if (match === match.toUpperCase()) return replacement.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        return replacement.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return replacement.toLowerCase();
    });
  }
  return result;
}
