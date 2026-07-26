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
  constructor(containerEl, onCompleteCallback) {
    this.container = containerEl;
    this.onComplete = onCompleteCallback;
    this.bossHP = 100;
    this.playerHP = 100;
    this.patientVital = 30; // 30%에서 시작하여 100%로 회복
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

    this.container.innerHTML = `
      <div class="boss-game-wrapper card-panel">
        <div class="boss-header">
          <div class="boss-title-tag">⚔️ 최종 평가 : 생명을 살리는 사랑의 깍지</div>
          <div class="boss-timer-box">⏱️ 보스 도전 시간: <span id="boss-timer-display">${this.elapsedSeconds}초</span></div>
          <div class="boss-stage-count">스테이지 ${this.currentIndex + 1} / ${BOSS_QUIZZES.length}</div>
        </div>

        <div class="battle-arena">
          <!-- 보스 아바타 및 HP -->
          <div class="boss-avatar-box">
            <div class="avatar-frame GrimReaper-boss">
              <div class="grim-reaper-svg">
                <svg viewBox="0 0 100 100" class="reaper-icon">
                  <path d="M50 10 C 25 10, 15 35, 15 65 C 15 85, 30 90, 50 90 C 70 90, 85 85, 85 65 C 85 35, 75 10, 50 10 Z" fill="#0f172a" stroke="#7c3aed" stroke-width="3"/>
                  <circle cx="38" cy="45" r="5" fill="#ef4444" />
                  <circle cx="62" cy="45" r="5" fill="#ef4444" />
                  <path d="M 30 70 Q 50 85 70 70" fill="transparent" stroke="#a855f7" stroke-width="3"/>
                  <!-- 저승사자 갓 / 대낫 아이콘 -->
                  <path d="M 10 30 Q 50 5 90 30" fill="none" stroke="#6b21a8" stroke-width="6"/>
                </svg>
              </div>
              <div class="boss-name">어둠의 저승사자</div>
            </div>
            <div class="hp-bar-outer">
              <div id="boss-hp-fill" class="hp-bar-fill boss-hp" style="width: ${this.bossHP}%"></div>
            </div>
            <div class="hp-text">저승사자 위력: <span id="boss-hp-val">${this.bossHP}</span> / 100</div>
          </div>

          <div class="vs-divider">VS</div>

          <!-- 플레이어 & 환자 상태 -->
          <div class="player-vital-box">
            <div class="avatar-frame player-hero">
              <div class="hero-icon">💖</div>
              <div class="player-name">응급구조사 (사랑의 깍지)</div>
            </div>

            <div class="vital-gauges">
              <div class="gauge-row">
                <span class="gauge-label">구조사 집중력(HP):</span>
                <div class="hp-bar-outer">
                  <div id="player-hp-fill" class="hp-bar-fill player-hp" style="width: ${this.playerHP}%"></div>
                </div>
              </div>

              <div class="gauge-row">
                <span class="gauge-label">환자 생명력(Vital):</span>
                <div class="hp-bar-outer">
                  <div id="patient-vital-fill" class="hp-bar-fill patient-vital" style="width: ${this.patientVital}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 퀴즈 구역 -->
        <div class="boss-quiz-card card-panel">
          <div class="quiz-badge">${quiz.type === 'ox' ? 'OX 퀴즈' : '응급 판단 지식'}</div>
          <h3 class="boss-question-text">${quiz.question}</h3>

          <div class="boss-options-grid">
            ${quiz.options.map((opt, idx) => `
              <button class="boss-opt-btn btn-choice" data-idx="${idx}">
                <span class="opt-bullet">${idx + 1}</span>
                <span class="opt-label">${opt}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 피드백 팝업 -->
        <div id="boss-feedback-modal" class="modal-overlay hidden">
          <div class="modal-content card-panel">
            <h3 id="boss-modal-title" class="modal-title"></h3>
            <div id="boss-modal-body" class="modal-body"></div>
            <div class="btn-group align-center">
              <button id="boss-modal-next" class="btn btn-primary">다음 문제 진행 ⚔️</button>
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
