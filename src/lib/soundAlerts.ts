// Audio Chime, Repeating Siren Alarm & Speech Synthesis Voice Alert Utility for SK Pizza Point
// Uses Web Audio API & SpeechSynthesis for 100% offline-ready, instantaneous sound & vibration

export interface ActiveAlarmOrder {
  id: string;
  customerName: string;
  amount: number;
}

type AlarmListener = (isRinging: boolean, order: ActiveAlarmOrder | null) => void;

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private alarmIntervalId: any = null;
  private isAlarmActive: boolean = false;
  private currentAlarmOrder: ActiveAlarmOrder | null = null;
  private listeners: Set<AlarmListener> = new Set();

  constructor() {
    // Unlock AudioContext on first user interaction if possible
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.getAudioContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  public subscribeAlarm(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    listener(this.isAlarmActive, this.currentAlarmOrder);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this.isAlarmActive, this.currentAlarmOrder);
      } catch (err) {
        console.warn('Alarm listener error:', err);
      }
    });
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Play a loud high-pitch restaurant buzzer/bell
  public playOrderChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // High-energy attention chime notes
      const notes = [
        { freq: 659.25, start: 0, dur: 0.28, gain: 0.8 },    // E5
        { freq: 880.0, start: 0.15, dur: 0.35, gain: 0.95 },  // A5
        { freq: 1318.51, start: 0.3, dur: 0.5, gain: 1.0 },   // E6
        { freq: 1760.0, start: 0.45, dur: 0.7, gain: 0.9 },   // A6
      ];

      notes.forEach(({ freq, start, dur, gain: noteGain }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(noteGain, now + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }

  // Loud repeating siren burst for active alarm loop
  private playSirenBurst(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Siren sweep up and down
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.85, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Siren burst failed:', e);
    }
  }

  // Soft ping for broadcasts & messages
  public playNotificationPing(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, start: 0, dur: 0.22, gain: 0.5 },
        { freq: 1046.5, start: 0.12, dur: 0.45, gain: 0.7 },
      ];

      notes.forEach(({ freq, start, dur, gain: noteGain }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(noteGain, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (e) {
      console.warn('Notification ping playback failed:', e);
    }
  }

  // Trigger continuous device vibration for mobile screens / APK wrappers
  private triggerVibration(): void {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([1000, 300, 1000, 300, 1000]);
      } catch {
        // Ignore vibration errors if blocked
      }
    }
  }

  // Stop device vibration
  private stopVibration(): void {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }
  }

  // Speak voice speech announcement in Hindi / Indian English
  public speakOrderAlert(orderId: string, customerName: string, amount: number): void {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const hindiText = `नया ऑर्डर आ गया है! ग्राहक ${customerName}, कुल राशि ₹${Math.round(amount)} रुपए। ऑर्डर चेक करें।`;
      const utterance = new SpeechSynthesisUtterance(hindiText);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) => v.lang.includes('hi') || v.lang.includes('hi-IN') || v.name.toLowerCase().includes('hindi')
      );
      const indianVoice = voices.find((v) => v.lang.includes('en-IN'));

      if (hindiVoice) {
        utterance.voice = hindiVoice;
      } else if (indianVoice) {
        utterance.voice = indianVoice;
        utterance.text = `Attention! New order from ${customerName}. Amount: ${Math.round(amount)} rupees. Please accept order.`;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis alert failed:', err);
    }
  }

  // Continuous Repeating Alarm: KEEPS RINGING and buzzing until stopped!
  public startContinuousOrderAlarm(order: ActiveAlarmOrder): void {
    this.stopContinuousAlarm(); // Stop any previous alarm

    this.isAlarmActive = true;
    this.currentAlarmOrder = order;
    this.notifyListeners();

    // Trigger initial chime, vibration & voice
    this.playOrderChime();
    this.triggerVibration();
    setTimeout(() => {
      if (this.isAlarmActive) {
        this.speakOrderAlert(order.id, order.customerName, order.amount);
      }
    }, 600);

    let tick = 0;
    // Repeating interval every 3.5 seconds
    this.alarmIntervalId = setInterval(() => {
      if (!this.isAlarmActive) {
        this.stopContinuousAlarm();
        return;
      }

      tick++;
      // Vibrate mobile device continually
      this.triggerVibration();

      // Alternate siren and voice reminder
      if (tick % 2 === 1) {
        this.playSirenBurst();
        setTimeout(() => {
          if (this.isAlarmActive) this.playOrderChime();
        }, 600);
      } else {
        this.speakOrderAlert(order.id, order.customerName, order.amount);
      }
    }, 3600);
  }

  // Stop continuous alarm immediately
  public stopContinuousAlarm(): void {
    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }
    this.isAlarmActive = false;
    this.currentAlarmOrder = null;
    this.stopVibration();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }

    this.notifyListeners();
  }

  public isAlarmRinging(): boolean {
    return this.isAlarmActive;
  }

  public getActiveAlarmOrder(): ActiveAlarmOrder | null {
    return this.currentAlarmOrder;
  }

  public speakCustomAnnouncement(text: string): void {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopContinuousAlarm();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundAlerts = new SoundAlertManager();
