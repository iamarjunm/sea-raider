'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const BACKGROUND_SRC = '/assets/sea-raider/night-watch-background.png';
const SEA_MASK_SRC = '/assets/sea-raider/scene/sea-mask.png';
const IMAGE_ASPECT = 1672 / 941;

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// One pass: cover-fit the painting, sway it like a deck at sea, roll the open water
// with perspective-scaled waves, glint the moon and sunset paths, and flicker the
// two deck lanterns painted into the backdrop.
const FRAGMENT = `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uMask;
uniform vec2 uRes;
uniform float uTime;
uniform float uImgAspect;
uniform float uWin;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
float flicker(float t, float seed) {
  return 0.72 + 0.18 * noise(vec2(t * 7.0, seed)) + 0.1 * noise(vec2(t * 23.0, seed + 4.0));
}

void main() {
  float A = uRes.x / uRes.y;
  vec2 s = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);

  // Ship sway: slow roll around the deck plus a gentle heave.
  float roll = 0.0045 * sin(uTime * 0.52) + 0.0018 * sin(uTime * 1.13 + 1.3);
  float heave = 0.0045 * sin(uTime * 0.71 + 0.4);
  vec2 p = s - vec2(0.5, 0.62);
  p.x *= A;
  p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
  p.x /= A;
  p /= 1.055;
  p.y += heave;
  s = p + vec2(0.5, 0.62);

  vec2 uv = s;
  if (A > uImgAspect) uv.y = 0.5 + (s.y - 0.5) * (uImgAspect / A);
  else uv.x = 0.5 + (s.x - 0.5) * (A / uImgAspect);

  // Ship's helm in the right corner: the painting is seen in perspective, so rock it
  // inside its own (elliptical) wheel plane. The twist fades out past the handle tips
  // and is clipped above the lantern and below the rope/crate that sit in front of it.
  vec2 P = uv * vec2(1672.0, 941.0);
  vec2 helmC = vec2(1690.0, 568.0);
  vec2 helmR = vec2(187.0, 145.0);
  vec2 hq = (P - helmC) / helmR;
  float hr = length(hq);
  float hw = (1.0 - smoothstep(1.18, 1.46, hr)) * smoothstep(412.0, 428.0, P.y) * (1.0 - smoothstep(684.0, 700.0, P.y));
  if (hw > 0.0) {
    float helmAngle = (0.17 * sin(uTime * 0.62) + 0.06 * sin(uTime * 1.43 + 0.8)) * hw;
    float cs = cos(helmAngle); float sn = sin(helmAngle);
    vec2 rq = vec2(cs * hq.x - sn * hq.y, sn * hq.x + cs * hq.y);
    uv = (helmC + rq * helmR) / vec2(1672.0, 941.0);
  }

  float m = texture2D(uMask, uv).r;
  vec3 col;
  if (m > 0.004) {
    float depth = smoothstep(0.355, 0.8, uv.y);
    float z = 1.0 / max(uv.y - 0.335, 0.012);
    vec2 wc = vec2((uv.x - 0.5) * z * 2.2, z * 0.9);
    float t = uTime;
    // Rough, wind-driven sea: two noise fields plus a big rolling swell and a cross-chop.
    float n1 = fbm(wc * 1.5 + vec2(t * 0.2, -t * 0.7));
    float n2 = fbm(wc * 2.6 + vec2(-t * 0.28, -t * 0.9) + 7.0);
    float swell = sin(wc.y * 2.4 - t * 1.9 + n1 * 3.6);
    float chop = sin(wc.x * 3.1 + wc.y * 1.7 - t * 2.6 + n2 * 4.0);
    float roll = sin(uv.x * 11.0 - t * 0.9 + depth * 3.0) * depth;
    vec2 off = vec2((n2 - 0.5) * 1.1 + chop * 0.25, (n1 - 0.5) * 1.2 + swell * 0.55 + roll * 0.6) * (0.003 + depth * 0.0155);
    off *= m * m;
    col = texture2D(uTex, uv + off).rgb;

    // Swell faces darken, crests catch light.
    float crest = n1 * 0.55 + n2 * 0.45 + swell * 0.16 + chop * 0.08;
    col *= mix(1.0, 0.84 + 0.32 * smoothstep(0.3, 0.75, crest), m);
    float ridge = smoothstep(0.6, 0.86, crest);
    float moonPath = exp(-pow((uv.x - 0.31) / (0.035 + depth * 0.09), 2.0));
    float sunPath = exp(-pow((uv.x - 0.84) / (0.04 + depth * 0.1), 2.0));
    vec3 glint = vec3(0.62, 0.86, 1.0) * (0.1 + moonPath * 0.65) + vec3(1.0, 0.62, 0.3) * sunPath * 0.7;
    col += glint * ridge * m * (0.4 + depth * 0.8);
    // Whitecaps breaking on the crests, strongest close to the hull.
    float caps = smoothstep(0.72, 0.9, crest) * smoothstep(0.45, 0.9, noise(wc * 6.0 + vec2(0.0, -t * 1.6)));
    col += vec3(0.82, 0.92, 0.95) * caps * m * (0.18 + depth * 0.55);
    // Surf crashing against the ship: the painted foam surges in sets.
    float foam = smoothstep(0.55, 0.92, (col.r + col.g + col.b) / 3.0) * depth;
    float surge = pow(0.5 + 0.5 * sin(t * 1.3 + uv.x * 18.0 + n1 * 5.0), 3.0);
    col += foam * (0.12 + 0.32 * surge) * m;
  } else {
    col = texture2D(uTex, uv).rgb;
  }

  // Deck lanterns painted into the backdrop.
  vec2 aspect = vec2(uImgAspect, 1.0);
  vec2 L1 = vec2(0.1076, 0.307);
  vec2 L2 = vec2(0.9437, 0.372);
  float f1 = flicker(uTime, 1.0);
  float f2 = flicker(uTime + 3.1, 5.0);
  float d1 = length((uv - L1) * aspect);
  float d2 = length((uv - L2) * aspect);
  float boost = 1.0 + uWin * 0.9;
  float core1 = exp(-d1 * d1 / 0.0011);
  float core2 = exp(-d2 * d2 / 0.0011);
  float halo1 = exp(-d1 * d1 / 0.02);
  float halo2 = exp(-d2 * d2 / 0.02);
  vec3 warm = vec3(1.0, 0.62, 0.24);
  col *= 1.0 + (core1 * (f1 - 0.8) + core2 * (f2 - 0.8)) * 1.6 * boost;
  col += warm * (halo1 * (0.06 + 0.12 * f1) + halo2 * (0.06 + 0.12 * f2)) * boost;
  col += warm * (core1 * f1 + core2 * f2) * uWin * 0.35;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('SeaBackdrop shader error', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function uploadTexture(gl: WebGLRenderingContext, unit: number, img: HTMLImageElement) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  return tex;
}

interface SeaBackdropProps {
  /** 0..1 — how hard the lanterns blaze (wins). */
  glow?: number;
}

export default function SeaBackdrop({ glow = 0 }: SeaBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef(glow);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    glowRef.current = glow;
  }, [glow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    let disposed = false;
    let frame = 0;
    let smoothedGlow = 0;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uWin = gl.getUniformLocation(program, 'uWin');
    gl.uniform1f(gl.getUniformLocation(program, 'uImgAspect'), IMAGE_ASPECT);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };

    Promise.all([loadImage(BACKGROUND_SRC), loadImage(SEA_MASK_SRC)])
      .then(([bg, mask]) => {
        if (disposed) return;
        uploadTexture(gl, 0, bg);
        uploadTexture(gl, 1, mask);
        gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
        gl.uniform1i(gl.getUniformLocation(program, 'uMask'), 1);
        const start = performance.now();
        const draw = (now: number) => {
          if (disposed) return;
          resize();
          smoothedGlow += (glowRef.current - smoothedGlow) * 0.08;
          gl.uniform1f(uTime, (now - start) / 1000);
          gl.uniform1f(uWin, smoothedGlow);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame((now) => {
          draw(now);
          setIsLive(true);
        });
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="sea-backdrop absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Image
        src={BACKGROUND_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`sea-backdrop__still object-cover object-center transition-opacity duration-700 ${isLive ? 'opacity-0' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${isLive ? 'opacity-100' : 'opacity-0'}`} />
      <div className="sea-backdrop__mist pointer-events-none absolute inset-0" />
      <div className="sea-atmosphere pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />
    </div>
  );
}
