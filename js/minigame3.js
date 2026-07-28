/**
 * minigame3.js
 * 미니게임 3: CPR 리듬 게임 (가슴압박 100~120BPM 속도 유지)
 */

class Minigame3 {
  constructor(containerEl, onCompleteCallback) {
    this.container = containerEl;
    this.onComplete = onCompleteCallback;
    this.timer = 30; // 30초 압박 리듬 훈련
    this.timerInterval = null;
    this.lastTapTime = 0;
    this.pressCount = 0;
    this.perfectHits = 0;
    this.goodHits = 0;
    this.bpmHistory = [];
    this.animFrame = null;
    this.pulsePhase = 0;
    this.currentBPM = 0;
  }

  init() {
    this.timer = 30;
    this.lastTapTime = 0;
    this.pressCount = 0;
    this.perfectHits = 0;
    this.goodHits = 0;
    this.bpmHistory = [];
    this.currentBPM = 0;
    this.render();
    this.startLoop();
  }

  startLoop() {
    this.timerInterval = setInterval(() => {
      this.timer--;
      const timerDisplay = document.getElementById('mg3-timer');
      if (timerDisplay) {
        timerDisplay.textContent = `${this.timer}초`;
        if (this.timer <= 10) timerDisplay.classList.add('timer-warning');
      }

      if (this.timer <= 0) {
        this.finishGame();
      }
    }, 1000);

    const canvas = this.container.querySelector('#rhythm-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const draw = () => {
        this.drawRhythmMonitor(ctx, canvas);
        this.animFrame = requestAnimationFrame(draw);
      };
      draw();
    }
  }

  stopLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel">
        <div class="minigame-header">
          <div class="game-badge">미니게임 3</div>
          <h2 class="game-title">CPR 압박 리듬 게임</h2>
          <div class="timer-box">남은 시간: <span id="mg3-timer" class="timer-val">30초</span></div>
        </div>

        <p class="game-instruction">
          💓 가슴압박의 적절한 속도는 <strong>1분당 100~120회</strong>입니다! (아기상어 템포)<br>
          스페이스바를 누르거나 아래의 <strong>[압박하기]</strong> 버튼을 터치하여 안정적인 초록색 적정 리듬을 유지하세요!
        </p>

        <div class="rhythm-monitor-container card-panel">
          <div class="bpm-display-box">
            <span class="bpm-label">현재 압박 속도:</span>
            <span id="bpm-value" class="bpm-num">0</span>
            <span class="bpm-unit">BPM</span>
            <span id="rhythm-feedback" class="rhythm-tag">준비하세요!</span>
          </div>

          <div class="gauge-container">
            <div class="gauge-bar">
              <div class="target-zone" title="적정 리듬 (100~120 BPM)"></div>
              <div id="gauge-pointer" class="gauge-pointer"></div>
            </div>
            <div class="gauge-labels">
              <span>0 (너무 느림)</span>
              <span class="perfect-label">100~120 BPM (목표)</span>
              <span>180+ (너무 빠름)</span>
            </div>
          </div>

          <canvas id="rhythm-canvas" width="600" height="120"></canvas>
        </div>

        <div class="press-action-area">
          <button id="press-trigger-btn" class="press-heart-btn">
            <span class="heart-pulse-icon">🫀</span>
            <span class="press-text">가슴 압박! (Spacebar / Touch)</span>
          </button>
        </div>

        <div class="live-stats">
          <div>총 압박 횟수: <strong id="total-presses">0</strong>회</div>
          <div>적정 템포 달성: <strong id="perfect-count" class="success-text">0</strong>회</div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const triggerBtn = this.container.querySelector('#press-trigger-btn');

    const handlePress = (e) => {
      if (e) e.preventDefault();
      this.registerTap();
    };

    triggerBtn.addEventListener('mousedown', handlePress);
    triggerBtn.addEventListener('touchstart', handlePress);

    this.keyHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.registerTap();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  registerTap() {
    const now = performance.now();
    this.pressCount++;

    if (this.lastTapTime > 0) {
      const intervalMs = now - this.lastTapTime;
      const bpm = Math.round(60000 / intervalMs);
      this.currentBPM = bpm;
      this.bpmHistory.push(bpm);

      this.evaluateBPM(bpm);
    } else {
      audioManager.playBeat(true);
    }

    this.lastTapTime = now;

    // Heart scale animation trigger
    const btn = this.container.querySelector('#press-trigger-btn');
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 100);
    }

    // Update counts
    const totalEl = this.container.querySelector('#total-presses');
    if (totalEl) totalEl.textContent = this.pressCount;
  }

  evaluateBPM(bpm) {
    const bpmVal = this.container.querySelector('#bpm-value');
    const feedbackEl = this.container.querySelector('#rhythm-feedback');
    const pointer = this.container.querySelector('#gauge-pointer');
    const perfectEl = this.container.querySelector('#perfect-count');

    if (bpmVal) bpmVal.textContent = bpm;

    // Gauge pointer position calculation (0 to 180 BPM mapping)
    const clamped = Math.min(Math.max(bpm, 0), 180);
    const percent = (clamped / 180) * 100;
    if (pointer) pointer.style.left = `${percent}%`;

    if (bpm >= 100 && bpm <= 120) {
      // PERFECT
      this.perfectHits++;
      audioManager.playBeat(true);
      if (feedbackEl) {
        feedbackEl.textContent = 'PERFECT! (완벽한 속도)';
        feedbackEl.className = 'rhythm-tag tag-perfect';
      }
    } else if ((bpm >= 90 && bpm < 100) || (bpm > 120 && bpm <= 135)) {
      // GOOD
      this.goodHits++;
      audioManager.playBeat(true);
      if (feedbackEl) {
        feedbackEl.textContent = 'GOOD (조금 더 집중!)';
        feedbackEl.className = 'rhythm-tag tag-good';
      }
    } else if (bpm < 90) {
      // TOO SLOW
      audioManager.playBeat(false);
      if (feedbackEl) {
        feedbackEl.textContent = 'TOO SLOW (더 빠르게!)';
        feedbackEl.className = 'rhythm-tag tag-slow';
      }
    } else {
      // TOO FAST
      audioManager.playBeat(false);
      if (feedbackEl) {
        feedbackEl.textContent = 'TOO FAST (너무 빨라요!)';
        feedbackEl.className = 'rhythm-tag tag-fast';
      }
    }

    if (perfectEl) perfectEl.textContent = this.perfectHits;
  }

  drawRhythmMonitor(ctx, canvas) {
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // ECG pulse wave
    this.pulsePhase += 0.05;
    ctx.strokeStyle = this.currentBPM >= 100 && this.currentBPM <= 120 ? '#22c55e' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const midY = height / 2;
    for (let x = 0; x < width; x++) {
      let y = midY + Math.sin((x * 0.03) + this.pulsePhase) * 10;
      if ((x + Math.floor(this.pulsePhase * 20)) % 120 < 15) {
        y -= 35; // ECG spike
      }
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  finishGame() {
    this.stopLoop();
    window.removeEventListener('keydown', this.keyHandler);

    const totalValid = this.bpmHistory.length;
    let accuracy = 0;
    if (totalValid > 0) {
      accuracy = Math.round(((this.perfectHits + (this.goodHits * 0.5)) / totalValid) * 100);
    }

    if (totalValid === 0 || accuracy < 60) {
      audioManager.playWrong();
      this.container.innerHTML = `
        <div class="minigame-wrapper card-panel align-center">
          <div class="game-badge">미니게임 3 미완료</div>
          <h2 class="game-title error-text">❌ 훈련 미달 (60% 이상 필요)</h2>
          <p class="result-highlight">제한시간 동안 분당 100~120회 리듬 가슴압박을 채우지 못했습니다.</p>
          <p class="section-desc">스페이스바 또는 화면을 100~120BPM 속도로 가볍게 두드려 재도전해보세요!</p>
          
          <div class="btn-group align-center" style="margin-top: 24px;">
            <button id="mg3-retry-btn" class="btn btn-primary">🔄 다시 도전하기</button>
            <button id="mg3-home-btn" class="btn btn-secondary">🏠 메인 화면으로</button>
          </div>
        </div>
      `;

      this.container.querySelector('#mg3-retry-btn').addEventListener('click', () => {
        this.init();
      });
      this.container.querySelector('#mg3-home-btn').addEventListener('click', () => {
        if (this.onComplete) this.onComplete();
      });
      return;
    }

    audioManager.playVictory();
    audioManager.playGold();

    const curProgress = storage.getProgress();
    if (!curProgress.minigame3Cleared) {
      curProgress.minigame3Cleared = true;
      curProgress.gold += 40;
      storage.saveProgress(curProgress);
    }

    achievementsManager.checkAndUnlock('first_rescue');
    if (accuracy >= 85) {
      achievementsManager.checkAndUnlock('rhythm_master');
    }

    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel align-center">
        <div class="game-badge">미니게임 3 완료</div>
        <h2 class="game-title">🎉 CPR 리듬 훈련 완료!</h2>
        
        <div class="accuracy-score-display">
          <span class="score-label">압박 템포 정확도</span>
          <span class="score-val">${accuracy}%</span>
        </div>

        <div class="gold-reward-animation">
          <span class="gold-icon">💰</span>
          <span class="gold-amount">+40 Gold 획득!</span>
        </div>

        <div class="explanation-box success-box">
          <h4>💡 가슴압박 핵심 정리:</h4>
          <p>분당 100~120회의 리듬은 뇌에 산소 공급을 유지하는 가장 골든 리듬입니다!</p>
        </div>

        <button id="mg3-finish-btn" class="btn btn-primary btn-large">
          ⚔️ 보스전 (사랑의 깍지) 도전하기
        </button>
      </div>
    `;

    this.container.querySelector('#mg3-finish-btn').addEventListener('click', () => {
      if (this.onComplete) this.onComplete();
    });
  }
}

window.Minigame3 = Minigame3;
