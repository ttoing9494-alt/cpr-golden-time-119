/**
 * audio.js
 * Web Audio API Synth Generator
 * 외부 오디오 파일 없이 효과음과 BGM을 100% 브라우저 자체 합성음으로 재생
 */

class AudioController {
  constructor() {
    this.ctx = null;
    this.sfxMuted = false;
    this.bgmMuted = false;
    this.bgmOsc = null;
    this.bgmGain = null;
    this.bgmInterval = null;
    this.isPlayingBGM = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSFXEnabled(enabled) {
    this.sfxMuted = !enabled;
  }

  setBGMEnabled(enabled) {
    this.bgmMuted = !enabled;
    if (this.bgmMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  // 정답 딩동댕 (밝은 2단 멜로디)
  playCorrect() {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.24); // G5

    osc2.frequency.setValueAtTime(1046.50, now + 0.24); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.24);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  // 오답 경고 부저 (낮고 시끄러운 사각파)
  playWrong() {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(130, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // CPR 리듬 탭 및 타격음
  playBeat(isGood = true) {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGood ? 'sine' : 'triangle';
    const startFreq = isGood ? 320 : 150;
    const endFreq = isGood ? 120 : 60;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.1);

    gain.gain.setValueAtTime(isGood ? 0.3 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 심장 박동 소리 (쿵쾅쿵쾅)
  playHeartbeat() {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // 쿵 (Lub)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // 쾅 (Dub)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(70, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(25, now + 0.25);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.28);
  }

  // 골드 획득 효과음 (찰랑~)
  playGold() {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [987.77, 1318.51, 1567.98, 1975.53]; // B5, E6, G6, B6
    freqs.forEach((f, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + index * 0.08);

      gain.gain.setValueAtTime(0.15, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.2);
    });
  }

  // 사랑의 깍지 / 보스 강타 효과음
  playBossHit() {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 승리 세레머니 팡파레
  playVictory() {
    if (this.sfxMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.15, t: 0 },
      { f: 659.25, d: 0.15, t: 0.15 },
      { f: 783.99, d: 0.15, t: 0.30 },
      { f: 1046.50, d: 0.5, t: 0.45 }
    ];

    notes.forEach(note => {
      const now = this.ctx.currentTime + note.t;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + note.d);
    });
  }

  // 잔잔한 응급구조 BGM 루프 (Synth Ambient)
  startBGM() {
    if (this.bgmMuted || this.isPlayingBGM) return;
    this.init();
    if (!this.ctx) return;

    this.isPlayingBGM = true;
    const notes = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
    let noteIdx = 0;

    this.bgmInterval = setInterval(() => {
      if (this.bgmMuted || !this.isPlayingBGM || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[noteIdx], now);
      noteIdx = (noteIdx + 1) % notes.length;

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    }, 800);
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const audioManager = new AudioController();
window.audioManager = audioManager;
