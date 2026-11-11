import { soundManager } from './audio';

// Images used by the game shell, reels, rules, bonus dialogs and controls.
// Keep this list local so the loader never depends on an external asset host.
const GAME_IMAGES = [
  '/assets/sea-raider/night-watch-background.png',
  '/assets/common/ethereal-gold/controls/spin-button.png',
  '/assets/sea-raider/opening/opening-background.png',
  '/assets/sea-raider/opening/card-bonus.png',
  '/assets/sea-raider/opening/card-max-win.png',
  '/assets/sea-raider/opening/card-paylines.png',
  '/assets/sea-raider/opening/bonus-intro-background.png',
  '/assets/sea-raider/bonus-multiplier-roller.png',
  '/assets/sea-raider/get-bonus-wordmark.svg',
  '/assets/sea-raider/play-feature-wordmark.svg',
  '/assets/aistudio/logo_37cf1416.webp',
  '/assets/aistudio/provider_logo_ee1a8c04.webp',
  '/assets/aistudio/spin_speed_on_1eeebfcd.webp',
  '/assets/aistudio/spin_speed_off_12664d81.webp',
  '/assets/aistudio/frame_e548f7c1.webp',
  '/assets/aistudio/sea-raider-captain-original-v1.webp',
  '/assets/aistudio/image_5a86e7dd.webp',
  '/assets/aistudio/image_235abfa3.webp',
  '/assets/aistudio/image_80ad2505.webp',
  '/assets/aistudio/image_f0356976.webp',
  '/assets/aistudio/image_3fe8284b.webp',
  '/assets/aistudio/image_b5e5b74e.webp',
  '/assets/aistudio/egs-gold-card-frame.webp',
  '/assets/aistudio/x_f55ae377.webp',
  '/assets/sea-raider/captain.png',
  '/assets/sea-raider/flintlocks.png',
  '/assets/sea-raider/treasure-chest.png',
  '/assets/sea-raider/compass.png',
  '/assets/sea-raider/ace.png',
  '/assets/sea-raider/king.png',
  '/assets/sea-raider/queen.png',
  '/assets/sea-raider/jack.png',
  '/assets/sea-raider/ten.png',
  '/assets/sea-raider/wild.png',
  '/assets/sea-raider/scatter.png',
  '/assets/sea-raider/captain-alt.png',
  '/assets/sea-raider/sword-captain.png',
  '/assets/aistudio/bonus_chance_1_68723c50.webp',
  '/assets/aistudio/super_bonus_chance_5533c1d2.webp',
  '/assets/aistudio/pirates_chance_1b0482b5.webp',
  '/assets/aistudio/feature_spin_b99e4066.webp',
  '/assets/aistudio/unknown_bonus_b8ab82bc.webp',
  '/assets/aistudio/unknown_extreme_bonus_3340dd16.webp',
] as const;
let preloadPromise: Promise<void> | undefined;

function preloadImage(source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // A successful load means the browser has already decoded the image enough
    // to paint it. Waiting on decode() here can hang the entire first-load gate
    // on otherwise valid large PNG artwork in some browsers.
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load game image: ${source}`));
    image.src = source;
    if (image.complete && image.naturalWidth > 0) resolve();
  });
}

export function preloadGameAssets(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = Promise.all([
      ...GAME_IMAGES.map(preloadImage),
      soundManager.preloadMusic(),
    ]).then(() => undefined).catch((error) => {
      preloadPromise = undefined;
      throw error;
    });
  }
  return preloadPromise;
}
