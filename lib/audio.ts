// Web Audio API procedural sound & background music engine for Sea Raider
// Complies with Stake Engine [107]: Master sound control and granular volume/mute sliders

export interface AudioState {
  masterMuted: boolean;
  musicVolume: number;
  musicMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private bgMusic: HTMLAudioElement | null = null;

  private isMasterMuted: boolean = false;
  private musicVolume: number = 0.55;
  private isMusicMuted: boolean = false;
  private sfxVolume: number = 0.75;
  private isSfxMuted: boolean = false;

  private isMusicPlaying: boolean = false;

  private listeners: Set<(state: AudioState) => void> = new Set();

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMasterMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch {
      // AudioContext not supported or autoplay blocked
    }
  }

  public subscribe(cb: (state: AudioState) => void) {
    this.listeners.add(cb);
    cb(this.getAudioState());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const st = this.getAudioState();
    this.listeners.forEach((cb) => cb(st));
  }

  public getAudioState(): AudioState {
    return {
      masterMuted: this.isMasterMuted,
      musicVolume: this.musicVolume,
      musicMuted: this.isMusicMuted,
      sfxVolume: this.sfxVolume,
      sfxMuted: this.isSfxMuted,
    };
  }

  public setMasterMuted(muted: boolean) {
    this.isMasterMuted = muted;
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
    if (this.bgMusic) this.bgMusic.muted = muted || this.isMusicMuted;
    this.notify();
  }

  public toggleMute(): boolean {
    this.setMasterMuted(!this.isMasterMuted);
    return this.isMasterMuted;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    this.init();
    if (this.musicGain && this.ctx && !this.isMusicMuted) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    if (this.bgMusic) this.bgMusic.volume = this.musicVolume;
    this.notify();
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    this.init();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(muted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
    if (this.bgMusic) this.bgMusic.muted = muted || this.isMasterMuted;
    this.notify();
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.init();
    if (this.sfxGain && this.ctx && !this.isSfxMuted) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    this.init();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  // ----------------------------------------------------
  // Bundled studio background music track
  // ----------------------------------------------------
  private ensureMusicElement() {
    if (typeof window === 'undefined') return null;
    if (!this.bgMusic) {
      this.bgMusic = new Audio(new URL('assets/ebunny-pirate-jolly-roger-loop-369969.mp3', document.baseURI).toString());
      this.bgMusic.loop = true;
      this.bgMusic.preload = 'auto';
      this.bgMusic.volume = this.musicVolume;
    }
    return this.bgMusic;
  }

  public preloadMusic(): Promise<void> {
    const audio = this.ensureMusicElement();
    if (!audio || audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        audio.removeEventListener('loadeddata', finish);
        audio.removeEventListener('canplaythrough', finish);
        audio.removeEventListener('error', finish);
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(finish, 10_000);
      audio.addEventListener('loadeddata', finish, { once: true });
      audio.addEventListener('canplaythrough', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      audio.load();
    });
  }

  public startMusic() {
    if (typeof window === 'undefined') return;
    const audio = this.ensureMusicElement();
    if (!audio) return;
    audio.muted = this.isMasterMuted || this.isMusicMuted;
    this.isMusicPlaying = true;
    if (audio.paused) {
      audio.play().catch(() => {
        // Autoplay may be blocked until the first user gesture.
      });
    }
  }
  public stopMusic() {
    this.isMusicPlaying = false;
    this.bgMusic?.pause();
  }

  // ----------------------------------------------------
  // Sound Effects (Routed to sfxGain)
  // ----------------------------------------------------
  public playSpinClick(pitchFactor: number = 1.0) {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 * pitchFactor, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  public playReelStop(reelIndex: number = 0) {
    if (this.reelsSpinning > 0) {
      this.reelsSpinning -= 1;
      if (this.reelsSpinning <= 0 || reelIndex >= 4) this.stopReelLoop();
    }
    if (!this.canPlaySfx()) return;
    const now = this.ctx!.currentTime;
    try {
      // Heavy reel brake: low body thump, wooden clack and a ratchet catch.
      this.tone(now, 120 + reelIndex * 12, { gain: 0.42, decay: 0.16, slideTo: 38 });
      this.noiseHit(now, { freq: 1400 + reelIndex * 90, q: 2.2, gain: 0.3, decay: 0.07 });
      this.noiseHit(now + 0.035, { freq: 3600, q: 6, gain: 0.08, decay: 0.03 });
    } catch {}
  }

  public playScatterLand(scatterNumber: number = 1) {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const freqs = [330, 440, 587, 784, 988, 1174];
      const freq = freqs[Math.min(scatterNumber - 1, freqs.length - 1)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  public playTeaseHeartbeat() {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playWin(isBig: boolean = false) {
    if (!this.canPlaySfx()) return;
    const now = this.ctx!.currentTime;
    try {
      // Bright arpeggio in a sea-shanty major key...
      const notes = isBig ? [392, 494, 587, 784, 988, 1175] : [392, 494, 587, 784];
      notes.forEach((freq, idx) => {
        this.tone(now + idx * 0.07, freq, { type: 'triangle', gain: 0.2, decay: 0.42 });
        this.tone(now + idx * 0.07, freq * 2, { gain: 0.05, decay: 0.25 });
      });
      // ...over a shower of coins spilling into the tray.
      const coins = isBig ? 22 : 9;
      for (let i = 0; i < coins; i++) {
        const at = now + 0.05 + Math.random() * (isBig ? 1.1 : 0.5);
        const f = 2200 + Math.random() * 1800;
        this.tone(at, f, { gain: 0.05 + Math.random() * 0.04, decay: 0.12 + Math.random() * 0.1 });
        this.tone(at, f * 1.51, { gain: 0.025, decay: 0.08 });
        this.noiseHit(at, { freq: 6000, q: 2, gain: 0.04, decay: 0.03 });
      }
      if (isBig) this.tone(now, 98, { type: 'triangle', gain: 0.3, decay: 0.9, attack: 0.02 });
    } catch {}
  }

  public playTeaseRiser(durationSec: number = 2.0) {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      [220, 330, 440].forEach((baseFreq) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + durationSec);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.25, now + durationSec * 0.85);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + durationSec);
      });
    } catch {}
  }

  public playGrandScatterBell(scatterCount: number = 3) {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const pitches = [523.25, 659.25, 783.99, 1046.5];
      pitches.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * (1 + (scatterCount - 3) * 0.15), now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.8);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.8);
      });
    } catch {}
  }

  public playCoin() {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 1200 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  // ----------------------------------------------------
  // Mechanical slot machine layer: lever pull, ratcheting reels, heavy stops
  // ----------------------------------------------------
  private noiseBuffer: AudioBuffer | null = null;
  private reelLoopTimer: ReturnType<typeof setInterval> | null = null;
  private reelsSpinning = 0;
  private reelRumble: { osc: OscillatorNode; gain: GainNode } | null = null;

  private getNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 1.5);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  private canPlaySfx() {
    if (this.isMasterMuted || this.isSfxMuted) return false;
    this.init();
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
    return Boolean(this.ctx && this.sfxGain);
  }

  /** Short band-passed noise burst: the building block for clicks, clacks and splashes. */
  private noiseHit(at: number, opts: { freq: number; q?: number; gain: number; decay: number; type?: BiquadFilterType; sweepTo?: number }) {
    const ctx = this.ctx!;
    const noise = this.getNoise();
    if (!noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? 'bandpass';
    filter.frequency.setValueAtTime(opts.freq, at);
    if (opts.sweepTo) filter.frequency.exponentialRampToValueAtTime(opts.sweepTo, at + opts.decay);
    filter.Q.value = opts.q ?? 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(opts.gain, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + opts.decay);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    src.start(at, Math.random() * 1.2);
    src.stop(at + opts.decay + 0.02);
  }

  private tone(at: number, freq: number, opts: { type?: OscillatorType; gain: number; decay: number; attack?: number; slideTo?: number }) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, at);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, at + opts.decay);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(opts.gain, at + (opts.attack ?? 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + opts.decay);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(at);
    osc.stop(at + opts.decay + 0.02);
  }

  /** Lever pull + reel release, then a ratcheting loop until every reel has stopped. */
  public startReelSpin(isTurbo = false) {
    this.stopReelLoop();
    if (!this.canPlaySfx()) return;
    const now = this.ctx!.currentTime;
    try {
      // Lever: a wooden creak down, a metal latch, then the reels kick free.
      this.noiseHit(now, { freq: 900, q: 6, gain: 0.18, decay: 0.12, sweepTo: 320 });
      this.tone(now + 0.02, 180, { type: 'triangle', gain: 0.22, decay: 0.16, slideTo: 70 });
      this.noiseHit(now + 0.07, { freq: 3200, q: 3, gain: 0.32, decay: 0.05 });
      this.tone(now + 0.07, 1240, { type: 'square', gain: 0.05, decay: 0.05 });
      this.noiseHit(now + 0.1, { freq: 500, q: 0.7, gain: 0.25, decay: 0.42, type: 'lowpass', sweepTo: 2400 });

      // Low mechanical hum under the ratchet.
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isTurbo ? 62 : 48, now);
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 220;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.18);
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      this.reelRumble = { osc, gain };
    } catch {}

    this.reelsSpinning = 5;
    let tick = 0;
    const interval = isTurbo ? 38 : 52;
    this.reelLoopTimer = setInterval(() => {
      if (!this.ctx || !this.sfxGain || this.isMasterMuted || this.isSfxMuted) return;
      const at = this.ctx.currentTime + 0.005;
      const density = this.reelsSpinning / 5;
      tick++;
      try {
        // Pawl clicking over the reel teeth; quieter as reels drop out.
        this.noiseHit(at, { freq: 2300 + (tick % 3) * 420 + Math.random() * 300, q: 4, gain: 0.05 + density * 0.07, decay: 0.028 });
        if (tick % 2 === 0) this.noiseHit(at + interval / 2000, { freq: 1500 + Math.random() * 400, q: 5, gain: 0.03 + density * 0.04, decay: 0.022 });
      } catch {}
    }, interval);
  }

  public stopReelLoop() {
    if (this.reelLoopTimer) clearInterval(this.reelLoopTimer);
    this.reelLoopTimer = null;
    this.reelsSpinning = 0;
    if (this.reelRumble && this.ctx) {
      const { osc, gain } = this.reelRumble;
      const now = this.ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.stop(now + 0.15);
      } catch {}
    }
    this.reelRumble = null;
  }

  /** Water rushing along a winning line, with a coin chime that climbs per line. */
  public playLineWin(lineIndex = 0) {
    if (!this.canPlaySfx()) return;
    const now = this.ctx!.currentTime;
    try {
      this.noiseHit(now, { freq: 600, q: 0.8, gain: 0.2, decay: 0.38, type: 'lowpass', sweepTo: 3800 });
      this.noiseHit(now + 0.05, { freq: 1800, q: 1.5, gain: 0.1, decay: 0.3, sweepTo: 700 });
      // Bubbles.
      for (let i = 0; i < 4; i++) {
        const f = 500 + Math.random() * 500;
        this.tone(now + 0.04 + i * 0.05, f, { gain: 0.05, decay: 0.06, slideTo: f * 1.9 });
      }
      const step = Math.min(lineIndex, 8);
      const base = 1318.5 * Math.pow(2, step / 12);
      this.tone(now + 0.08, base, { type: 'triangle', gain: 0.16, decay: 0.32 });
      this.tone(now + 0.08, base * 2.76, { gain: 0.05, decay: 0.18 });
      this.tone(now + 0.16, base * 1.5, { type: 'triangle', gain: 0.1, decay: 0.38 });
    } catch {}
  }

  /** Cutlass cut: a sharp whoosh through the air and a ringing steel "shing". */
  public playSwordSlash() {
    if (!this.canPlaySfx()) return;
    const now = this.ctx!.currentTime;
    try {
      this.noiseHit(now, { freq: 4200, q: 1.4, gain: 0.34, decay: 0.24, sweepTo: 520 });
      this.noiseHit(now + 0.02, { freq: 1200, q: 0.8, gain: 0.18, decay: 0.2, type: 'lowpass', sweepTo: 300 });
      this.tone(now + 0.05, 2637, { type: 'triangle', gain: 0.09, decay: 0.55 });
      this.tone(now + 0.05, 3951, { gain: 0.05, decay: 0.4 });
      this.tone(now + 0.05, 5274, { gain: 0.025, decay: 0.3 });
    } catch {}
  }

  public playExplosion() {
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(120, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.6);
      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + 0.6);
    } catch {}
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : ({} as SoundManager);
