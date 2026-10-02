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
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private alarmIntervalId: any = null;
  private activeTimeouts: Set<any> = new Set();
  private activeOscillators: Set<OscillatorNode> = new Set();
  private isAlarmActive: boolean = false;
  private currentAlarmOrder: ActiveAlarmOrder | null = null;
  private listeners: Set<AlarmListener> = new Set();

  constructor() {
    // Check saved mute preference
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('sk_pizza_sound_muted');
        if (savedMute === 'true') {
          this.isMuted = true;
        }
      } catch {}

      // Unlock AudioContext on first user interaction
      const unlockAudio = () => {
        this.getAudioContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  public subscribeAlarm(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    // Call immediately with current state
    try {
      listener(this.isAlarmActive, this.currentAlarmOrder);
    } catch {}
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
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private addTrackedTimeout(fn: () => void, delayMs: number): any {
    const id = setTimeout(() => {
      this.activeTimeouts.delete(id);
      if (this.isAlarmActive && !this.isMuted) {
        fn();
      }
    }, delayMs);
    this.activeTimeouts.add(id);
    return id;
  }

  private clearAllTrackedTimeouts(): void {
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts.clear();
  }

  // Play a loud high-pitch restaurant buzzer/bell
  public playOrderChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx || !this.masterGain) return;

      const now = ctx.currentTime;
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
        gain.connect(this.masterGain!);

        this.activeOscillators.add(osc);
        osc.onended = () => this.activeOscillators.delete(osc);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }

  // Loud repeating siren burst for active alarm loop
  private playSirenBurst(): void {
    if (this.isMuted || !this.isAlarmActive) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx || !this.masterGain) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Siren sweep up and down
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(1450, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.85, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      this.activeOscillators.add(osc);
      osc.onended = () => this.activeOscillators.delete(osc);

      osc.start(now);
      osc.stop(now + 0.58);
    } catch (e) {
      console.warn('Siren burst failed:', e);
    }
  }

  // Soft ping for broadcasts & messages
  public playNotificationPing(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx || !this.masterGain) return;

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
        gain.connect(this.masterGain!);

        this.activeOscillators.add(osc);
        osc.onended = () => this.activeOscillators.delete(osc);

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

  // Stop device vibration immediately
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
    if (this.isMuted || !this.isAlarmActive) return;
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
    // First, stop any prior alarm cleanly
    this.stopContinuousAlarm();

    if (this.isMuted) return;

    this.isAlarmActive = true;
    this.currentAlarmOrder = order;

    // Ensure audio context and master gain are open
    const ctx = this.getAudioContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(1, ctx.currentTime);
    }

    this.notifyListeners();

    // Trigger initial chime, vibration & voice
    this.playOrderChime();
    this.triggerVibration();

    // Trigger OS-level notification & phone vibration for locked screens or background
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 NEW PIZZA ORDER #${order.id}!`, {
          body: `Customer: ${order.customerName} | Bill: ₹${order.amount}\nTap to open Kitchen Console!`,
          icon: 'https://i.imgur.com/KRI3jtw.jpeg',
          badge: 'https://i.imgur.com/KRI3jtw.jpeg',
          tag: `order-${order.id}`,
          requireInteraction: true,
        });
      } catch {}
    }

    this.addTrackedTimeout(() => {
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
        this.addTrackedTimeout(() => {
          if (this.isAlarmActive) this.playOrderChime();
        }, 600);
      } else {
        this.speakOrderAlert(order.id, order.customerName, order.amount);
      }
    }, 3600);
  }

  // 100% Guaranteed STOP: stops all sounds, voice, intervals, timeouts, vibration instantly
  public stopContinuousAlarm(): void {
    // 1. Clear interval
    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }

    // 2. Clear all scheduled timeouts
    this.clearAllTrackedTimeouts();

    // 3. Mark inactive
    this.isAlarmActive = false;
    this.currentAlarmOrder = null;

    // 4. Silence master gain immediately and stop all oscillators
    try {
      if (this.audioCtx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
      this.activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.activeOscillators.clear();
    } catch {}

    // 5. Cancel speech synthesis (call twice with delay to purge mobile queue)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          try { window.speechSynthesis.cancel(); } catch {}
        }, 50);
        setTimeout(() => {
          try { window.speechSynthesis.cancel(); } catch {}
        }, 150);
      } catch {}
    }

    // 6. Stop vibration
    this.stopVibration();

    // 7. Re-enable master gain for future sounds after small silence window
    setTimeout(() => {
      if (this.audioCtx && this.masterGain && !this.isMuted) {
        this.masterGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
      }
    }, 200);

    // 8. Notify all listeners
    this.notifyListeners();
  }

  public isAlarmRinging(): boolean {
    return this.isAlarmActive;
  }

  // One-click Test Siren for Owner to verify sound & audio permissions
  public testAlarm(): void {
    this.isMuted = false;
    try {
      localStorage.removeItem('sk_pizza_sound_muted');
    } catch {}

    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {}
    }

    this.startContinuousOrderAlarm({
      id: 'TEST-ALERT',
      customerName: 'Test Order (सायरन टेस्ट)',
      amount: 549,
    });
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
    try {
      localStorage.setItem('sk_pizza_sound_muted', String(this.isMuted));
    } catch {}

    if (this.isMuted) {
      this.stopContinuousAlarm();
      if (this.audioCtx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
    } else {
      if (this.audioCtx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }
}

export const soundAlerts = new SoundAlertManager();
