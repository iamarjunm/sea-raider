import { SymbolId } from '../maths/slot-engine';

/** Stable across playback and replay; about 30% of distinct bonus boards get the reveal. */
export function shouldShowCaptainReveal(board: SymbolId[][]): boolean {
  const signature = board.map((reel) => reel.join(',')).join('|');
  let hash = 0x811c9dc5;
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 100 < 30;
}
