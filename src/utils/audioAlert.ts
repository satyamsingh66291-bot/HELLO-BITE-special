/**
 * High-fidelity Web Audio API synthesizer for continuous loud chime & alarm alert.
 * Works natively in all modern browsers without external asset dependencies or CORS issues.
 */

class AudioAlertManager {
  private audioCtx: AudioContext | null = null;
  private isAlerting: boolean = false;
  private loopInterval: number | null = null;
  private volume: number = 0.85;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Plays a single high-pitched emergency order chime sequence (880Hz -> 1320Hz -> 1760Hz)
   */
  public playChimeOnce(customVol?: number) {
    try {
      const ctx = this.getContext();
      const currentVol = customVol !== undefined ? customVol : this.volume;
      const now = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(currentVol, now);
      masterGain.connect(ctx.destination);

      // Chime note 1: High Bell (880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Chime note 2: Higher Bell (1174.66Hz - D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      gain2.gain.setValueAtTime(0.8, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);

      // Chime note 3: Crisp Bell (1760Hz - A6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1760, now + 0.3);
      gain3.gain.setValueAtTime(0.9, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.3);
      osc3.stop(now + 0.9);

    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  /**
   * Starts continuous loud chime alert every 1.5 seconds until stopped.
   */
  public startContinuousAlert() {
    if (this.isAlerting) return;
    this.isAlerting = true;

    // Play immediately
    this.playChimeOnce();

    // Repeat every 1.4 seconds
    this.loopInterval = window.setInterval(() => {
      if (!this.isAlerting) {
        this.stopContinuousAlert();
        return;
      }
      this.playChimeOnce();
    }, 1400);
  }

  /**
   * Stops the continuous alert immediately
   */
  public stopContinuousAlert() {
    this.isAlerting = false;
    if (this.loopInterval !== null) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  public isCurrentlyAlerting(): boolean {
    return this.isAlerting;
  }
}

export const audioAlert = new AudioAlertManager();
