/**
 * bossGame.js
 * 최종 평가(보스전): "생명을 살리는 사랑의 깍지"
 * 보스: 영혼을 노리는 저승사자/염라대왕
 * 10문제 퀴즈, 보스 HP, 플레이어 HP, 환자 생명 게이지, 경고 쉐이크 연출 및 명예의 전당 등록
 */

import { BOSS_QUIZZES } from './cprData.js';
import { audioManager } from './audio.js';
import { storage export class BossGame {
  constructor(containerEl, onCompleteCallback, adminMode = false) {
    this.container = containerEl;
    this.onComplete = onCompleteCallback;
    this.adminMode = adminMode; // 관리자 모드 플래그
    this.bossHP = 100;
    this.playerHP = 100;
    this.patientVital = 30;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.startTime = 0;

    // 아케이드 슈팅 플레이어 상태 (Hero Position: 0 ~ 100%)
    this.heroPosPercent = 50; 
    this.selectedTargetIdx = 0;
    this.keyListener = null;
  }

  init() {
    this.bossHP = 100;
    this.playerHP = 100;
    this.patientVital = 30;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.heroPosPercent = 50;
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    this.startBossTimer();
    this.bindKeyboardControls();
    this.render();
  }

  bindKeyboardControls() {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
    }

    this.keyListener = (e) => {
      // 보스전 화면이 아닐 때는 키 작동 중단
      const bossView = document.getElementById('boss-view');
      if (!bossView || bossView.classList.contains('hidden')) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveHero(-15);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveHero(15);
      } else if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        e.preventDefault();
        this.fireAEDShock();
      }
    };

    window.addEventListener('keydown', this.keyListener);
  }

  unbindKeyboardControls() {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }

  moveHero(deltaPercent) {
    this.heroPosPercent = Math.max(10, Math.min(90, this.heroPosPercent + deltaPercent));
    const heroEl = this.container.querySelector('#arcade-hero-ship');
    if (heroEl) {
      heroEl.style.left = `${this.heroPosPercent}%`;
    }

    // 위치에 맞춰 가장 가까운 선택지 타겟 자동 조준
    const quiz = BOSS_QUIZZES[this.currentIndex];
    if (!quiz) return;
    const optionCount = quiz.options.length;
    const stepPercent = 80 / Math.max(1, optionCount - 1);
    
    let closestIdx = 0;
    let minDiff = 999;
    for (let i = 0; i < optionCount; i++) {
      const targetPos = optionCount === 1 ? 50 : 10 + i * stepPercent;
      const diff = Math.abs(this.heroPosPercent - targetPos);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    this.selectedTargetIdx = closestIdx;
    this.updateTargetHighlight();
  }

  updateTargetHighlight() {
    const targets = this.container.querySelectorAll('.action-option-target');
    targets.forEach((target, idx) => {
      if (idx === this.selectedTargetIdx) {
        target.classList.add('aimed-target');
      } else {
        target.classList.remove('aimed-target');
      }
    });
  }

  fireAEDShock() {
    // 발사 애니메이션 연출
    const heroEl = this.container.querySelector('#arcade-hero-ship');
    if (heroEl) {
      heroEl.classList.add('hero-shooting');
      setTimeout(() => heroEl.classList.remove('hero-shooting'), 300);
    }

    audioManager.playBeat(true);

    // 조준된 선택지로 AED 전기 충격파 처리
    this.handleAnswer(this.selectedTargetIdx);
  }

  startBossTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      const timerEl = this.container.querySelector('#boss-timer-display');
      if (timerEl) {
        timerEl.textContent = `${this.elapsedSeconds}초`;
      }
    }, 1000);
  }

  stopBossTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.unbindKeyboardControls();
  }

  render() {
    const quiz = BOSS_QUIZZES[this.currentIndex];
    const heroLevel = this.correctCount + 1;
    const bossStatus = this.bossHP > 70 ? '👻 저승사자의 기운' : this.bossHP > 30 ? '💢 충격받은 저승사자' : '💀 퇴치 직전!';

    // 선택지 개수에 맞춘 타겟 가로 위치 계산
    const optionCount = quiz.options.length;
    const stepPercent = optionCount === 1 ? 0 : 80 / (optionCount - 1);

    this.container.innerHTML = `
      <div class="boss-game-wrapper card-panel battleground-hud arcade-boss-wrapper">
        <!-- 보스전 상단 HUD -->
        <div class="boss-header">
          <div class="boss-title-tag">⚔️ 3D 아케이드 보스전 : 생명을 살리는 사랑의 깍지</div>
          <div class="boss-timer-box">⏱️ BATTLE TIME: <span id="boss-timer-display">${this.elapsedSeconds}초</span></div>
          <div class="boss-stage-count">ROUND ${this.currentIndex + 1} / ${BOSS_QUIZZES.length}</div>
        </div>

        <!-- 3D 보스전 아케이드 아레나 -->
        <div class="battle-arena battleground-3d-arena arcade-arena-box">
          <!-- 1. 친근한 저승사자 (보스) 영역 -->
          <div class="boss-avatar-box reaper-boss-box">
            <div class="avatar-frame GrimReaper-boss 3d-boss-frame">
              <div class="char-3d-wrapper">
                <img src="./assets/3d_devil_boss.jpg" alt="친근한 3D 저승사자" class="char-3d-img boss-3d-render ${this.bossHP < 40 ? 'boss-damaged-effect' : ''}">
                <div class="boss-flame-aura"></div>
              </div>
              <div class="boss-name">👻 친근한 저승사자 <span class="boss-status-tag">${bossStatus}</span></div>
            </div>
            <div class="hp-bar-outer hud-hp-outer">
              <div id="boss-hp-fill" class="hp-bar-fill boss-hp" style="width: ${this.bossHP}%"></div>
            </div>
            <div class="hp-text">저승사자 해마 게이지: <span id="boss-hp-val">${this.bossHP}</span> / 100</div>
          </div>

          <!-- 2. 중앙 아케이드 슈팅 타겟존 (문제 & 발사 타겟) -->
          <div class="arcade-quiz-zone">
            <div class="quiz-question-banner">
              <span class="quiz-type-badge">${quiz.type === 'ox' ? 'OX 퀴즈' : '응급 판단'}</span>
              <h3 class="arcade-question-text">Q${this.currentIndex + 1}. ${quiz.question}</h3>
            </div>

            <!-- floating quiz options target arena -->
            <div class="action-targets-arena">
              ${quiz.options.map((opt, idx) => {
                const targetLeft = optionCount === 1 ? 50 : 10 + idx * stepPercent;
                const isAdminCorrect = this.adminMode && idx === quiz.answer;
                return `
                  <div class="action-option-target ${idx === this.selectedTargetIdx ? 'aimed-target' : ''} ${isAdminCorrect ? 'admin-target' : ''}" 
                       style="left: ${targetLeft}%;" data-idx="${idx}">
                    <div class="target-node-icon">⚡ ${idx + 1}번</div>
                    <div class="target-node-text">${opt}</div>
                    ${isAdminCorrect ? '<span class="admin-target-badge">✅ 정답</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>

            <!-- 닥터 히어로 AED 파동 이동 필드 -->
            <div class="hero-shooting-field">
              <div id="arcade-hero-ship" class="hero-ship-box" style="left: ${this.heroPosPercent}%;">
                <img src="./assets/3d_doctor_hero.jpg" alt="3D 흰가운 닥터 히어로" class="hero-ship-img glow-lvl-${Math.min(this.correctCount, 5)}">
                <div class="hero-ship-label">🩺 닥터 히어로 (Lv.${heroLevel})</div>
                <div class="aed-cannon-glow">⚡ AED 발사대</div>
              </div>
            </div>

            <!-- 조작 가이드 & 터치 컨트롤 버튼 (모바일/마우스 겸용) -->
            <div class="arcade-controls-bar">
              <div class="keyboard-guide">
                🎮 키보드 조작: <strong>[←] [→] 방향키 이동</strong> &nbsp;|&nbsp; <strong>[Spacebar] AED 전기충격 발사!</strong>
              </div>
              <div class="touch-controls-group">
                <button id="btn-move-left" class="btn btn-secondary btn-small">⬅️ 왼쪽 이동</button>
                <button id="btn-fire-aed" class="btn btn-primary btn-large fire-btn">⚡ AED 전기충격 발사! [Space]</button>
                <button id="btn-move-right" class="btn btn-secondary btn-small">오른쪽 이동 ➡️</button>
              </div>
            </div>
          </div>

          <!-- 3. 닥터 히어로 스탯 게이지 -->
          <div class="player-vital-box hero-box">
            <div class="vital-gauges hud-gauges">
              <div class="gauge-row">
                <span class="gauge-label">구조사 집중력(HP):</span>
                <div class="hp-bar-outer hud-hp-outer">
                  <div id="player-hp-fill" class="hp-bar-fill player-hp" style="width: ${this.playerHP}%"></div>
                </div>
              </div>

              <div class="gauge-row">
                <span class="gauge-label">환자 생명력(Vital):</span>
                <div class="hp-bar-outer hud-hp-outer">
                  <div id="patient-vital-fill" class="hp-bar-fill patient-vital" style="width: ${this.patientVital}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${this.adminMode ? `
        <div class="admin-hint-box">
          🔐 <strong>[ADMIN 모드]</strong> 정답: <strong>${quiz.answer + 1}번 타겟</strong> &nbsp;|&nbsp; 해설: ${quiz.explanation}
        </div>` : ''}

        <!-- 피드백 팝업 -->
        <div id="boss-feedback-modal" class="modal-overlay hidden">
          <div class="modal-content card-panel hud-modal">
            <h3 id="boss-modal-title" class="modal-title"></h3>
            <div id="boss-modal-body" class="modal-body"></div>
            <div class="btn-group align-center">
              <button id="boss-modal-next" class="btn btn-primary btn-large">다음 라운드 진행 ⚔️</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateTargetHighlight();
  }

  bindEvents() {
    // 터치/마우스 컨트롤 버튼
    const leftBtn = this.container.querySelector('#btn-move-left');
    const rightBtn = this.container.querySelector('#btn-move-right');
    const fireBtn = this.container.querySelector('#btn-move-fire') || this.container.querySelector('#btn-fire-aed');

    if (leftBtn) leftBtn.addEventListener('click', () => this.moveHero(-15));
    if (rightBtn) rightBtn.addEventListener('click', () => this.moveHero(15));
    if (fireBtn) fireBtn.addEventListener('click', () => this.fireAEDShock());

    // 타겟 직접 터치/클릭 조준 발사 지원
    const targets = this.container.querySelectorAll('.action-option-target');
    targets.forEach((target) => {
      target.addEventListener('click', () => {
        const idx = parseInt(target.getAttribute('data-idx'));
        this.selectedTargetIdx = idx;
        const quiz = BOSS_QUIZZES[this.currentIndex];
        const stepPercent = quiz.options.length === 1 ? 0 : 80 / (quiz.options.length - 1);
        this.heroPosPercent = 10 + idx * stepPercent;
        const heroEl = this.container.querySelector('#arcade-hero-ship');
        if (heroEl) heroEl.style.left = `${this.heroPosPercent}%`;
        this.updateTargetHighlight();
        this.fireAEDShock();
      });
    });
  }el hud-modal">
            <h3 id="boss-modal-title" class="modal-title"></h3>
            <div id="boss-modal-body" class="modal-body"></div>
            <div class="btn-group align-center">
              <button id="boss-modal-next" class="btn btn-primary btn-large">다음 라운드 진행 ⚔️</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btns = this.container.querySelectorAll('.boss-opt-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.handleAnswer(idx);
      });
    });
  }

  handleAnswer(selectedIdx) {
    const quiz = BOSS_QUIZZES[this.currentIndex];
    const isCorrect = selectedIdx === quiz.answer;

    const modalOverlay = this.container.querySelector('#boss-feedback-modal');
    const modalTitle = this.container.querySelector('#boss-modal-title');
    const modalBody = this.container.querySelector('#boss-modal-body');
    const modalNext = this.container.querySelector('#boss-modal-next');

    if (isCorrect) {
      this.correctCount++;
      this.bossHP = Math.max(0, this.bossHP - 10);
      this.patientVital = Math.min(100, this.patientVital + 7);
      
      audioManager.playBossHit();
      audioManager.playCorrect();

      // 보스 타격 쉐이크 애니메이션
      const bossBox = this.container.querySelector('.GrimReaper-boss');
      if (bossBox) {
        bossBox.classList.add('hit-shake');
        setTimeout(() => bossBox.classList.remove('hit-shake'), 400);
      }

      modalTitle.innerHTML = `💥 '사랑의 깍지' 기술 작렬! 정답입니다!`;
      modalTitle.className = 'modal-title success-text';
      modalBody.innerHTML = `
        <div class="attack-banner">저승사자의 어둠을 물리치고 환자의 심장 소리가 강해집니다! (+7% 생명 회복)</div>
        <div class="explanation-box success-box">
          <h4>💡 정답 해설:</h4>
          <p>${quiz.explanation}</p>
        </div>
      `;
    } else {
      this.playerHP = Math.max(0, this.playerHP - 15);
      this.patientVital = Math.max(10, this.patientVital - 5);

      audioManager.playWrong();

      // 오답 경고 화면 흔들림 Red Flash
      document.body.classList.add('warning-red-flash');
      setTimeout(() => document.body.classList.remove('warning-red-flash'), 500);

      modalTitle.innerHTML = `⚠️ 저승사자의 공격! 잘못된 응급처치입니다!`;
      modalTitle.className = 'modal-title error-text';
      modalBody.innerHTML = `
        <div class="warning-banner">환자의 상태가 잠시 악화되었습니다! 집중력을 올려 올바른 순서를 기억하세요!</div>
        <div class="explanation-box warning-box">
          <h4>📌 올바른 지식 해설:</h4>
          <p>${quiz.explanation}</p>
        </div>
      `;
    }

    // HP 게이지 즉시 반영
    this.updateGauges();

    modalNext.onclick = () => {
      modalOverlay.classList.add('hidden');
      this.currentIndex++;

      if (this.bossHP <= 0 || this.currentIndex >= BOSS_QUIZZES.length) {
        this.finishBossBattle();
      } else if (this.playerHP <= 0) {
        this.failBossBattle();
      } else {
        this.render();
      }
    };

    modalOverlay.classList.remove('hidden');
  }

  updateGauges() {
    const bossHpFill = this.container.querySelector('#boss-hp-fill');
    const bossHpVal = this.container.querySelector('#boss-hp-val');
    const playerHpFill = this.container.querySelector('#player-hp-fill');
    const patientVitalFill = this.container.querySelector('#patient-vital-fill');

    if (bossHpFill) bossHpFill.style.width = `${this.bossHP}%`;
    if (bossHpVal) bossHpVal.textContent = this.bossHP;
    if (playerHpFill) playerHpFill.style.width = `${this.playerHP}%`;
    if (patientVitalFill) patientVitalFill.style.width = `${this.patientVital}%`;
  }

  finishBossBattle() {
    this.stopBossTimer();
    const bossTimeSec = Math.max(1, this.elapsedSeconds);
    const accuracy = Math.round((this.correctCount / BOSS_QUIZZES.length) * 100);
    const score = (this.correctCount * 100) + Math.max(0, 300 - bossTimeSec * 2);

    audioManager.playVictory();

    achievementsManager.checkAndUnlock('first_rescue');
    achievementsManager.checkAndUnlock('hero_savior');

    this.container.innerHTML = `
      <div class="boss-victory-wrapper card-panel align-center animate-fade-in">
        <div class="victory-header">
          <span class="victory-crown">👑</span>
          <h2 class="victory-title">생명을 구했습니다! 구조 성공!</h2>
          <p class="victory-sub">어둠의 저승사자를 물리치고 사랑의 깍지로 소중한 생명을 지켜냈습니다!</p>
        </div>

        <div class="result-stats-card card-panel">
          <h3>📊 최종 구조 성과 리포트</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-lbl">최종 점수</span>
              <span class="stat-val highlight-val">${score}점</span>
            </div>
            <div class="stat-item">
              <span class="stat-lbl">정답률</span>
              <span class="stat-val">${accuracy}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-lbl">⏱️ 보스 도전 시간</span>
              <span class="stat-val success-text">${bossTimeSec}초</span>
            </div>
            <div class="stat-item">
              <span class="stat-lbl">환자 최종 생명력</span>
              <span class="stat-val success-text">100% 회복</span>
            </div>
          </div>
        </div>

        <!-- 명예의 전당 입력 폼 -->
        <div class="hall-input-card card-panel">
          <h4>🏆 명예의 전당에 이름을 새기세요</h4>
          <div class="name-input-group">
            <input type="text" id="hero-name-input" class="text-input" placeholder="구조사 이름을 입력하세요 (예: 5학년 홍길동)" maxlength="10">
            <button id="save-hall-btn" class="btn btn-primary">기록 등록하기</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#save-hall-btn').addEventListener('click', () => {
      const nameInput = this.container.querySelector('#hero-name-input');
      const heroName = nameInput.value.trim() || '무명 구조사';

      const today = new Date().toISOString().split('T')[0];
      firestoreManager.saveHallOfFameRecord({
        name: heroName,
        score: score,
        playTime: bossTimeSec, // 보스 도전 시간
        accuracy: accuracy,
        date: today
      });

      audioManager.playGold();
      alert(`🏆 보스 도전 시간 ${bossTimeSec}초 기록이 명예의 전당에 등록되었습니다!`);
      if (this.onComplete) this.onComplete();
    });
  }

  failBossBattle() {
    this.stopBossTimer();
    audioManager.playWrong();
    this.container.innerHTML = `
      <div class="boss-fail-wrapper card-panel align-center">
        <h2 class="error-text">❌ 구조 실패... 집중력이 다했습니다</h2>
        <p class="section-desc">저승사자의 기운에 눌렸습니다. CPR 순서와 지식을 다시 복습하고 도전해보세요!</p>
        
        <button id="boss-retry-btn" class="btn btn-primary btn-large">🔄 보스전 다시 도전하기</button>
      </div>
    `;

    this.container.querySelector('#boss-retry-btn').addEventListener('click', () => {
      this.init();
    });
  }
}
