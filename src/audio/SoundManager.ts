import { AudioSettings } from '../types/game';

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private isEngineRunning = false;
  private currentRPM = 0.15; // 0 (idle) to 1.0 (redline)
  private targetRPM = 0.15;

  private musicInterval: number | null = null;
  private musicStep = 0;
  private isMusicPlaying = false;

  private settings: AudioSettings = {
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 0.8,
    engineVolume: 0.7,
    sfxVolume: 0.9,
    musicVolume: 0.5,
  };

  constructor() {
    // Lazy initialize on first interaction
  }

  public init(settings?: AudioSettings) {
    if (settings) {
      this.settings = { ...settings };
    }
  }

  private ensureContext(): boolean {
    if (!this.settings.soundEnabled) return false;
    
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.settings.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngineSynth();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // Main cylinder sound (sawtooth for motor harmonics)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      // Sub cylinder (triangle for chest thud)
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Audio autoplay limitation fallback
    }
  }

  public updateEngine(throttle: boolean, brake: boolean, speedNorm: number, inAir: boolean) {
    if (!this.ensureContext() || !this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter) return;

    // Calculate target RPM based on player input & speed
    if (throttle) {
      if (inAir) {
        this.targetRPM = 0.92; // Screaming redline in air
      } else {
        this.targetRPM = Math.max(0.45, Math.min(1.0, 0.4 + speedNorm * 0.6));
      }
    } else if (brake) {
      this.targetRPM = 0.08;
    } else {
      this.targetRPM = Math.max(0.15, Math.min(0.65, speedNorm * 0.5));
    }

    // Smooth RPM interpolation
    this.currentRPM += (this.targetRPM - this.currentRPM) * 0.15;

    const baseFreq = 42 + this.currentRPM * 185; // 42Hz to 227Hz
    const cutoff = 200 + this.currentRPM * 1400; // 200Hz to 1600Hz
    const volume = this.settings.soundEnabled ? (0.04 + this.currentRPM * 0.09) * this.settings.engineVolume : 0;

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.04);
    if (this.engineSubOsc) {
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    }
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.05);
    this.engineGain.gain.setTargetAtTime(volume, now, 0.05);
  }

  public muteEngine() {
    if (this.ctx && this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playCoin() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.09); // E6

      gain.gain.setValueAtTime(0.3 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playJump() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.18);

      gain.gain.setValueAtTime(0.25 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  public playLanding(hardness: number = 0.5) {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const intensity = Math.min(1.0, Math.max(0.2, hardness));
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);

      gain.gain.setValueAtTime(0.35 * intensity * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  public playStunt() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.18 * this.settings.sfxVolume, now + idx * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    } catch {}
  }

  public playCheckpoint() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.25 * this.settings.sfxVolume, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } catch {}
  }

  public playCrash() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      
      // Noise crash burst
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.45);

      // Low impact crunch
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(80, now);
      bass.frequency.exponentialRampToValueAtTime(20, now + 0.3);
      bassGain.gain.setValueAtTime(0.4 * this.settings.sfxVolume, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      bass.connect(bassGain);
      bassGain.connect(this.sfxGain);
      bass.start(now);
      bass.stop(now + 0.35);
    } catch {}
  }

  public playBooyah() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Grand Free Fire Booyah victory fanfare: Powerful brass chord progression
      const fanfareChords = [
        { freq: 440, time: 0.0, dur: 0.2 },    // A4
        { freq: 554.37, time: 0.0, dur: 0.2 }, // C#5
        { freq: 659.25, time: 0.18, dur: 0.2 },// E5
        { freq: 880, time: 0.35, dur: 0.45 },  // A5
        { freq: 1108.73, time: 0.35, dur: 0.45 }, // C#6
        { freq: 1318.51, time: 0.5, dur: 0.8 },  // E6 triumphant finish
      ];

      fanfareChords.forEach(({ freq, time, dur }) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.32 * this.settings.sfxVolume, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {}
  }

  public playAirdrop() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Free Fire Airdrop plane horn / siren beacon
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(480, now + 0.25);
      osc.frequency.linearRampToValueAtTime(360, now + 0.5);

      gain.gain.setValueAtTime(0.28 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {}
  }

  public playHeadshot() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Free Fire crisp high-pitch critical ding
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1760, now); // A6
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);

      gain.gain.setValueAtTime(0.35 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  public playNitroBoost() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.3);

      gain.gain.setValueAtTime(0.22 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  public playLevelComplete() {
    this.playBooyah();
  }

  public playClick() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.12 * this.settings.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  public startMusic() {
    if (!this.settings.musicEnabled || this.isMusicPlaying) return;
    if (!this.ensureContext() || !this.ctx || !this.musicGain) return;

    this.isMusicPlaying = true;
    const bassScale = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83]; // A2, C3, D3, E3...

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.settings.musicEnabled) return;
      
      const now = this.ctx.currentTime;
      const freq = bassScale[this.musicStep % bassScale.length];

      // Bass punch
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      gain.gain.setValueAtTime(0.12 * this.settings.musicVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.18);

      // Hi-hat pulse on off-beats
      if (this.musicStep % 2 === 1) {
        const hhOsc = this.ctx.createOscillator();
        const hhGain = this.ctx.createGain();
        hhOsc.type = 'triangle';
        hhOsc.frequency.setValueAtTime(8000, now);
        hhGain.gain.setValueAtTime(0.02 * this.settings.musicVolume, now);
        hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        hhOsc.connect(hhGain);
        hhGain.connect(this.musicGain);
        hhOsc.start(now);
        hhOsc.stop(now + 0.05);
      }

      this.musicStep++;
    }, 150);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }

  public updateSettings(settings: AudioSettings) {
    this.settings = { ...settings };
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(settings.soundEnabled ? settings.masterVolume : 0, now, 0.05);
      }
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(settings.sfxVolume, now, 0.05);
      }
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(settings.musicEnabled ? settings.musicVolume : 0, now, 0.05);
      }
    }

    if (!settings.musicEnabled) {
      this.stopMusic();
    } else if (!this.isMusicPlaying && settings.soundEnabled) {
      this.startMusic();
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }
}

export const soundManager = new SoundManager();
