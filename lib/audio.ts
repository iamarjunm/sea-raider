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
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 90 + reelIndex * 15;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
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
    if (this.isMasterMuted || this.isSfxMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const notes = isBig ? [440, 554, 659, 880, 1108] : [330, 415, 494, 660];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.35);
      });
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
