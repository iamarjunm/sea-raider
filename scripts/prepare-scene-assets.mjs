// Builds the animated-scene layers from the painted source art.
//   node scripts/prepare-scene-assets.mjs
//
// Outputs (public/assets/sea-raider/scene/):
//   helm-wheel.png      full 8-spoke helm rebuilt from the frame's painted half-wheel
//                       (drawn un-squashed; the page re-applies the 0.88 perspective)
//   frame-no-wheel.png  reel frame with the helm cut out so the rebuilt wheel can turn
//                       behind the frame's bar and diamond ornament
//   sea-mask.png        greyscale mask of open water in the backdrop for the wave shader
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const outDir = path.join(root, 'public/assets/sea-raider/scene');
mkdirSync(outDir, { recursive: true });

// Helm geometry measured on frame_e548f7c1.png (1672x941).
const HUB_X = 836;
const HUB_Y = 116;
const SQUASH = 0.88; // painted helm is seen slightly from below
const RIM_R = 86; // outer rim radius (un-squashed)
const TIP_R = 136; // handle knob tip radius (un-squashed)
const HANDLE_HALF_WIDTH = 13;

async function loadRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function sample(img, x, y) {
  // Bilinear RGBA sample with premultiplied alpha to avoid dark/colored fringes.
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const acc = [0, 0, 0, 0];
  const taps = [
    [x0, y0, (1 - fx) * (1 - fy)],
    [x0 + 1, y0, fx * (1 - fy)],
    [x0, y0 + 1, (1 - fx) * fy],
    [x0 + 1, y0 + 1, fx * fy],
  ];
  for (const [tx, ty, w] of taps) {
    if (tx < 0 || ty < 0 || tx >= img.width || ty >= img.height) continue;
    const i = (ty * img.width + tx) * 4;
    const a = img.data[i + 3] / 255;
    acc[0] += img.data[i] * a * w;
    acc[1] += img.data[i + 1] * a * w;
    acc[2] += img.data[i + 2] * a * w;
    acc[3] += a * w;
  }
  if (acc[3] <= 0.0001) return [0, 0, 0, 0];
  return [acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3], acc[3] * 255];
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

async function buildHelmWheel(frame) {
  const pad = 4;
  const size = (TIP_R + pad) * 2;
  const c = size / 2;
  const out = Buffer.alloc(size * size * 4);
  for (let v = 0; v < size; v++) {
    for (let u = 0; u < size; u++) {
      const dx = u + 0.5 - c;
      const dy = v + 0.5 - c;
      const r = Math.hypot(dx, dy);
      let px = [0, 0, 0, 0];
      if (r <= RIM_R + 1) {
        // Inside the rim: the painted upper half, rotated 180deg for the lower half.
        const sx = dy <= 0 ? dx : -dx;
        const sy = dy <= 0 ? dy : -dy;
        px = sample(frame, HUB_X + sx, HUB_Y + sy * SQUASH);
        px[3] = 255 * (1 - smoothstep(RIM_R - 0.6, RIM_R + 1, r));
        // Interior is fully opaque (spokes over the wheel's dark backing plate).
        if (r < RIM_R - 1) px[3] = 255;
      } else if (r <= TIP_R) {
        // Handles: every one of the 8 knobs is copied from the clean top handle.
        const theta = Math.atan2(-dy, dx);
        const k = Math.round(theta / (Math.PI / 4));
        const local = theta - k * (Math.PI / 4);
        const along = r * Math.cos(local);
        const perp = r * Math.sin(local);
        if (Math.abs(perp) <= HANDLE_HALF_WIDTH + 1) {
          px = sample(frame, HUB_X + perp, HUB_Y - along * SQUASH);
        }
      }
      const i = (v * size + u) * 4;
      out[i] = px[0];
      out[i + 1] = px[1];
      out[i + 2] = px[2];
      out[i + 3] = px[3];
    }
  }
  await sharp(out, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'helm-wheel.png'));
  return size;
}

function barTop(x) {
  // Top edge of the frame bar, rising into the diamond ornament under the hub.
  const diamond = 127 + Math.abs(x - HUB_X) * (23 / 29);
  return Math.min(140, diamond);
}

async function buildFrameWithoutWheel(frame) {
  const { width, height } = frame;
  const out = Buffer.from(frame.data);
  // Everything the helm covered becomes transparent. The page draws a static dark
  // backing plate behind the turning wheel, so the side-handle gaps never show sky.
  const ERASE_RIM = RIM_R + 3;
  const ERASE_HALF_WIDTH = HANDLE_HALF_WIDTH + 3;
  const handleAngles = [0, 45, 90, 135, 180].map((d) => (d * Math.PI) / 180);
  for (let y = 0; y < 150; y++) {
    for (let x = HUB_X - TIP_R - 4; x <= HUB_X + TIP_R + 4; x++) {
      const dx = x + 0.5 - HUB_X;
      const dyu = (y + 0.5 - HUB_Y) / SQUASH;
      const r = Math.hypot(dx, dyu);
      const i = (y * width + x) * 4;
      const top = barTop(x + 0.5);
      if (y + 0.5 >= top) continue;
      const barFeather = smoothstep(top - 1.5, top, y + 0.5);

      // Above the backing plate, between the two scroll curls, there is only sky and helm.
      if (y < 76 && x >= 748 && x <= 924 && r <= TIP_R + 6) {
        out[i + 3] = 0;
        continue;
      }
      if (r <= ERASE_RIM) {
        const keep = Math.max(smoothstep(ERASE_RIM - 1.2, ERASE_RIM, r), barFeather);
        out[i + 3] = Math.round(out[i + 3] * keep);
        continue;
      }
      let handleKeep = 1;
      for (const a of handleAngles) {
        const along = dx * Math.cos(a) + -dyu * Math.sin(a);
        const perp = -dx * Math.sin(a) + -dyu * Math.cos(a);
        if (along > RIM_R - 2 && along < TIP_R + 5) {
          handleKeep = Math.min(handleKeep, smoothstep(ERASE_HALF_WIDTH - 1.2, ERASE_HALF_WIDTH, Math.abs(perp)));
        }
      }
      out[i + 3] = Math.round(out[i + 3] * Math.max(handleKeep, barFeather));
    }
  }
  await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'frame-no-wheel.png'));
  await sharp(out, { raw: { width, height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(outDir, 'frame-no-wheel.webp'));
}

async function buildSeaMask() {
  const src = path.join(root, 'public/assets/sea-raider/night-watch-background.png');
  const { data, width, height } = await loadRaw(src);
  const mask = Buffer.alloc(width * height);
  const horizon = Math.round(height * 0.356);
  const bottom = Math.round(height * 0.8);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < horizon || y > bottom) continue;
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Open water is teal/blue/white foam; wood, rope and brass are warm (red > blue).
      const cool = (Math.max(g, b) - r) / 255;
      const foam = r > 150 && b > 150 && Math.abs(r - b) < 40 ? 1 : 0;
      let m = Math.max(smoothstep(-0.02, 0.08, cool), foam);
      // Fade in below the horizon line so islands and ships stay put.
      m *= smoothstep(horizon, horizon + 14, y);
      mask[y * width + x] = Math.round(m * 255);
    }
  }
  // Erode then soften: drop thin rigging lines and feather the railing edge.
  await sharp(mask, { raw: { width, height, channels: 1 } })
    .median(5)
    .blur(2.2)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'sea-mask.png'));
}

const frame = await loadRaw(path.join(root, 'public/assets/aistudio/frame_e548f7c1.png'));
const wheelSize = await buildHelmWheel(frame);
await buildFrameWithoutWheel(frame);
await buildSeaMask();
console.log(`scene assets written to ${path.relative(root, outDir)} (helm ${wheelSize}px)`);
