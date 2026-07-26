/**
 * bossGame.js
 * 최종 평가(보스전): "생명을 살리는 사랑의 깍지"
 * 보스: 영혼을 노리는 저승사자/염라대왕
 * 10문제 퀴즈, 보스 HP, 플레이어 HP, 환자 생명 게이지, 경고 쉐이크 연출 및 명예의 전당 등록
 */

import { BOSS_QUIZZES } from './cprData.js';
import { audioManager } from './audio.js';
import { storage } from './storage.js';
import { achievementsManager } from './achievements.js';
import { firestoreManager } from './firestore.js';

export class BossGame {
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
  }

  init() {
    this.bossHP = 100;
    this.playerHP = 100;
    this.patientVital = 30;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    this.startBossTimer();
    this.render();
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
  }

  render() {
    const quiz = BOSS_QUIZZES[this.currentIndex];

    // ⚔️ 3D 거리 전진/후퇴 연출 (얼굴이 잘리지 않는 입체 전진 거리감 적용)
    // 정답을 맞힐수록 닥터 히어로는 전면으로 3D 전진(Forward Advance)하고, 악마 보스는 후방으로 후퇴 및 수척해짐
    const heroAdvanceZ = (this.correctCount * 8);       // 전면 3D 전진 (px)
    const heroLiftY = -(this.correctCount * 3);          // 상단 공중 도약 (px)
    const bossRetreatZ = -(this.correctCount * 8);       // 후방 3D 후퇴 (px)
    const bossOpacity = Math.max(0.4, (1.0 - (this.correctCount * 0.06))).toFixed(2);

    const heroLevel = this.correctCount + 1;
    const bossStatus = this.bossHP > 70 ? '😈 전력 악마' : this.bossHP > 30 ? '💢 타격받은 악마' : '💀 궤멸 직전!';

    this.container.innerHTML = `
      <div class="boss-game-wrapper card-panel battleground-hud">
        <div class="boss-header">
          <div class="boss-title-tag">⚔️ 3D BATTLE ROYALE : 생명을 살리는 사랑의 깍지</div>
          <div class="boss-timer-box">⏱️ BATTLE TIME: <span id="boss-timer-display">${this.elapsedSeconds}초</span></div>
          <div class="boss-stage-count">ROUND ${this.currentIndex + 1} / ${BOSS_QUIZZES.length}</div>
        </div>

        <div class="battle-arena battleground-3d-arena">
          <!-- 1. 어둠의 저승사자 (악마 보스) - 이길수록 후방 후퇴 및 찌그러짐 (얼굴 잘림 없음) -->
          <div class="boss-avatar-box reaper-boss-box" style="transform: translateZ(${bossRetreatZ}px); opacity: ${bossOpacity}; transition: all 0.5s ease;">
            <div class="avatar-frame GrimReaper-boss 3d-boss-frame">
              <div class="char-3d-wrapper">
                <img src="./assets/3d_devil_boss.jpg" alt="어둠의 악마 보스" class="char-3d-img boss-3d-render ${this.bossHP < 40 ? 'boss-damaged-effect' : ''}">
                <div class="boss-flame-aura"></div>
              </div>
              <div class="boss-name">👿 어둠의 저승사자 <span class="boss-status-tag">${bossStatus}</span></div>
            </div>
            <div class="hp-bar-outer hud-hp-outer">
              <div id="boss-hp-fill" class="hp-bar-fill boss-hp" style="width: ${this.bossHP}%"></div>
            </div>
            <div class="hp-text">악마 보스 위력: <span id="boss-hp-val">${this.bossHP}</span> / 100</div>
          </div>

          <div class="vs-divider-3d">
            <span class="vs-flash">VS</span>
            <div class="round-indicator">ROUND ${this.currentIndex + 1}</div>
          </div>

          <!-- 2. 응급구조사 닥터 히어로 - 정답 맞출수록 3D 전진 도약! (얼굴 100% 선명 보장) -->
          <div class="player-vital-box hero-box" style="transform: translateZ(${heroAdvanceZ}px) translateY(${heroLiftY}px); transition: all 0.5s ease;">
            <div class="avatar-frame player-hero 3d-hero-frame">
              <div class="char-3d-wrapper hero-power-wrapper">
                <img src="./assets/3d_doctor_hero.jpg" alt="3D 닥터 히어로" class="char-3d-img hero-3d-render glow-lvl-${Math.min(this.correctCount, 5)}">
                <div class="hero-golden-aura"></div>
              </div>
              <div class="player-name">💖 닥터 히어로 <span class="hero-level-badge">Lv.${heroLevel} ATTACK!</span></div>
            </div>

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

        <!-- 퀴즈 구역 (배틀그라운드 HUD 카키/네온 3D 스타일) -->
        <div class="boss-quiz-card card-panel hud-quiz-card">
          <div class="quiz-badge hud-badge">${quiz.type === 'ox' ? 'OX 퀴즈' : '응급 판단 지식'}</div>
          <h3 class="boss-question-text">${quiz.question}</h3>

          <div class="boss-options-grid">
            ${quiz.options.map((opt, idx) => `
              <button class="boss-opt-btn btn-choice ${this.adminMode && idx === quiz.answer ? 'admin-answer' : ''}" data-idx="${idx}">
                <span class="opt-bullet">${idx + 1}</span>
                <span class="opt-label">${opt}</span>
                ${this.adminMode && idx === quiz.answer ? '<span class="admin-badge">✅ 정답</span>' : ''}
              </button>
            `).join('')}
          </div>

          ${this.adminMode ? `
          <div class="admin-hint-box">
            🔐 <strong>[ADMIN 모드]</strong> 정답: <strong>${quiz.answer + 1}번</strong> &nbsp;|&nbsp; 해설: ${quiz.explanation}
          </div>` : ''}
        </div>

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
