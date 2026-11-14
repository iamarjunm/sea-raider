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

// ---------------------------------------------------------------------------
// Swashbuckler (artwork-source/swashbuckler.webp, 1199x1312): split the sword
// forearm from the body so it can swing from the elbow, and paint the coat back
// in where the forearm used to cover it.
// ---------------------------------------------------------------------------
const ARM_POLY = [
  [405, 540], [470, 512], [552, 528], [556, 600], [532, 652], [516, 700], [530, 742], [518, 795],
  [480, 832], [330, 935], [200, 992], [80, 992], [80, 930], [330, 770], [335, 700], [360, 655],
  [392, 642], [388, 598],
];
const PIRATE_SCALE = 0.62;

function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Behind the forearm sits the coat: its left edge runs from (555, 600) by the belt
// down to (510, 700) and then along the skirt to (360, 905). Left of it is open air
// (including the gap between the cuff and the torso).
function coatBehind(x, y) {
  if (y < 600 || y > 905) return false;
  if (y < 700) return x >= 555 - (y - 600) * (45 / 100);
  return x >= 510 - (y - 700) * (150 / 205);
}

async function buildSwashbuckler() {
  const src = await loadRaw(path.join(root, 'artwork-source/swashbuckler.webp'));
  const { width, height, data } = src;
  const body = Buffer.from(data);
  const arm = Buffer.alloc(data.length);
  const hole = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!inPolygon(x + 0.5, y + 0.5, ARM_POLY)) continue;
      const i = (y * width + x) * 4;
      arm[i] = data[i]; arm[i + 1] = data[i + 1]; arm[i + 2] = data[i + 2]; arm[i + 3] = data[i + 3];
      body[i + 3] = 0;
      if (coatBehind(x, y)) hole[y * width + x] = 1;
    }
  }

  // Push-pull fill: grow the surrounding coat colours inward until the hole is closed.
  const filledOnce = new Uint8Array(width * height);
  let remaining = hole.reduce((a, b) => a + b, 0);
  for (let pass = 0; pass < 400 && remaining > 0; pass++) {
    const filled = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const k = y * width + x;
        if (!hole[k]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nk = k + dy * width + dx;
            if (hole[nk]) continue;
            const ni = nk * 4;
            if (body[ni + 3] < 200) continue;
            // Grow only the dark coat cloth, not the gold trim along its edge.
            if (!filledOnce[nk] && body[ni] * 0.3 + body[ni + 1] * 0.59 + body[ni + 2] * 0.11 > 95) continue;
            r += body[ni]; g += body[ni + 1]; b += body[ni + 2]; n++;
          }
        }
        if (n >= 2) filled.push([k, r / n, g / n, b / n]);
      }
    }
    for (const [k, r, g, b] of filled) {
      const i = k * 4;
      body[i] = r; body[i + 1] = g; body[i + 2] = b; body[i + 3] = 255;
      hole[k] = 0;
      filledOnce[k] = 1;
    }
    remaining -= filled.length;
    if (filled.length === 0) break;
  }

  const outW = Math.round(width * PIRATE_SCALE);
  for (const [name, buf] of [['swashbuckler-body', body], ['swashbuckler-arm', arm]]) {
    await sharp(buf, { raw: { width, height, channels: 4 } })
      .resize(outW)
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(path.join(outDir, `${name}.webp`));
  }
  return { width, height };
}

const pirate = await buildSwashbuckler();
console.log(`swashbuckler layers ${pirate.width}x${pirate.height} -> scale ${PIRATE_SCALE}`);

const frame = await loadRaw(path.join(root, 'public/assets/aistudio/frame_e548f7c1.png'));
const wheelSize = await buildHelmWheel(frame);
await buildFrameWithoutWheel(frame);
await buildSeaMask();
console.log(`scene assets written to ${path.relative(root, outDir)} (helm ${wheelSize}px)`);
