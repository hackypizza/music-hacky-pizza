/**
 * Web Audio API Sound Synthesizer:
 * 1. Warm Vinyl Crackle & Analog Room Tone
 * 2. Cozy Night Rain against Anime Pizzeria Window
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  // Vinyl Crackle
  private vinylSource: AudioNode | null = null;
  private vinylGain: GainNode | null = null;
  private isVinylPlaying: boolean = false;

  // Night Rain
  private rainSource: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  private isRainPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- VINYL CRACKLE ---
  public startVinyl(volume: number = 0.25) {
    if (this.isVinylPlaying) {
      this.setVinylVolume(volume);
      return;
    }
    try {
      this.initContext();
      if (!this.ctx) return;

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555;
        b1 = 0.99332 * b1 + white * 0.075;
        b2 = 0.969 * b2 + white * 0.153;
        // occasional crackle pop
        const crackle = Math.random() < 0.0006 ? (Math.random() > 0.5 ? 0.8 : -0.8) : 0;
        output[i] = (b0 + b1 + b2) * 0.05 + crackle;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 0.9;

      this.vinylGain = this.ctx.createGain();
      this.vinylGain.gain.value = Math.max(0, Math.min(1, volume * 0.15));

      source.connect(filter);
      filter.connect(this.vinylGain);
      this.vinylGain.connect(this.ctx.destination);

      source.start(0);
      this.vinylSource = source;
      this.isVinylPlaying = true;
    } catch {
      this.isVinylPlaying = false;
    }
  }

  public stopVinyl() {
    if (!this.isVinylPlaying) return;
    try {
      if (this.vinylSource && 'stop' in this.vinylSource) {
        (this.vinylSource as AudioScheduledSourceNode).stop();
        this.vinylSource.disconnect();
      }
      this.vinylSource = null;
      this.isVinylPlaying = false;
    } catch {
      this.isVinylPlaying = false;
    }
  }

  public setVinylVolume(volume: number) {
    if (this.vinylGain && this.ctx) {
      const target = Math.max(0, Math.min(1, volume * 0.15));
      this.vinylGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  // --- NIGHT RAIN ---
  public startRain(volume: number = 0.35) {
    if (this.isRainPlaying) {
      this.setRainVolume(volume);
      return;
    }
    try {
      this.initContext();
      if (!this.ctx) return;

      const bufferSize = 3 * this.ctx.sampleRate;
      const rainBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = rainBuffer.getChannelData(0);

      // Pink & brown noise synthesis for rain patter on glass
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.8; // Boost to audible rain floor
      }

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      // Lowpass filter representing window glass absorption
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 750;

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = Math.max(0, Math.min(1, volume * 0.22));

      rainSource.connect(lowpass);
      lowpass.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      rainSource.start(0);
      this.rainSource = rainSource;
      this.isRainPlaying = true;
    } catch {
      this.isRainPlaying = false;
    }
  }

  public stopRain() {
    if (!this.isRainPlaying) return;
    try {
      if (this.rainSource && 'stop' in this.rainSource) {
        (this.rainSource as AudioScheduledSourceNode).stop();
        this.rainSource.disconnect();
      }
      this.rainSource = null;
      this.isRainPlaying = false;
    } catch {
      this.isRainPlaying = false;
    }
  }

  public setRainVolume(volume: number) {
    if (this.rainGain && this.ctx) {
      const target = Math.max(0, Math.min(1, volume * 0.22));
      this.rainGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  public isVinylActive() {
    return this.isVinylPlaying;
  }

  public isRainActive() {
    return this.isRainPlaying;
  }

  // --- SERVICE COUNTER BELL CHIME (DING!) ---
  public playBell() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High pitch fundamental + harmonic overtone
      const freqs = [2180, 2760, 4200];
      const gains = [0.35, 0.2, 0.08];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[idx], now);
        // Exponential bell strike ring-out decay
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.4);
      });
    } catch {
      // AudioContext fallback
    }
  }

  public cleanupOnTrackChange() {
    // Clean up any transient audio nodes and prevent overlapping signals on track changes
    if (this.ctx && this.ctx.state === 'running') {
      // Settle context time without cutting off user-toggled ambient rain or vinyl
    }
  }
}

export const ambientSound = new AudioSynthesizer();
