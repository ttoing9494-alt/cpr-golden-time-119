/**
 * minigame2.js
 * 미니게임 2: 응급상황 판단 게임 (상황 카드 및 선택 행동)
 */

class Minigame2 {
  constructor(containerEl, onCompleteCallback) {
    this.container = containerEl;
    this.onComplete = onCompleteCallback;
    this.currentIndex = 0;
    this.score = 0;
    this.timer = 60;
    this.timerInterval = null;
  }

  init() {
    this.currentIndex = 0;
    this.score = 0;
    this.timer = 60;
    this.render();
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerDisplay = document.getElementById('mg2-timer');

    this.timerInterval = setInterval(() => {
      this.timer--;
      if (timerDisplay) {
        timerDisplay.textContent = `${this.timer}초`;
        if (this.timer <= 10) timerDisplay.classList.add('timer-warning');
      }

      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeOut();
      }
    }, 1000);
  }

  handleTimeOut() {
    try { window.audioManager.playWrong(); } catch(e){}
    const modalOverlay = this.container.querySelector('#mg2-feedback-modal');
    const modalTitle = this.container.querySelector('#mg2-modal-title');
    const modalBody = this.container.querySelector('#mg2-modal-body');
    const modalCloseGroup = this.container.querySelector('#mg2-feedback-modal .btn-group');

    if (modalTitle) {
      modalTitle.innerHTML = `⏰ 제한시간 초과!`;
      modalTitle.className = 'modal-title error-text';
    }
    if (modalBody) {
      modalBody.innerHTML = `
        <p class="result-highlight">제한시간 내에 응급상황 판단 문제를 모두 완료하지 못했습니다.</p>
        <p class="section-desc">다시 한번 도전하여 올바른 판단을 내리는 훈련을 해보세요!</p>
      `;
    }

    if (modalCloseGroup) {
      modalCloseGroup.innerHTML = `
        <button id="mg2-retry-btn" class="btn btn-primary">🔄 다시 도전하기</button>
        <button id="mg2-home-btn" class="btn btn-secondary">🏠 메인 화면으로</button>
      `;

      const retryBtn = this.container.querySelector('#mg2-retry-btn');
      if (retryBtn) retryBtn.onclick = () => {
        if (modalOverlay) modalOverlay.classList.add('hidden');
        this.init();
      };

      const homeBtn = this.container.querySelector('#mg2-home-btn');
      if (homeBtn) homeBtn.onclick = () => {
        if (modalOverlay) modalOverlay.classList.add('hidden');
        if (this.onComplete) this.onComplete();
      };
    }

    if (modalOverlay) modalOverlay.classList.remove('hidden');
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  render() {
    const quizzes = window.JUDGMENT_QUIZZES || [];
    const quiz = quizzes[this.currentIndex] || {
      situation: "응급 상황이 발생했습니다.",
      question: "올바른 행동을 선택하세요.",
      options: [
        { text: "안전을 확인하고 119에 신고한다.", correct: true, reason: "올바른 선택입니다." },
        { text: "당황하여 아무것도 하지 않는다.", correct: false, reason: "신속한 조치가 필요합니다." }
      ]
    };

    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel" style="padding: 20px;">
        <div class="minigame-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div class="game-badge" style="display: inline-block; background: #38bdf8; color: #0f172a; font-weight: 800; padding: 2px 10px; border-radius: 12px; font-size: 13px;">미니게임 2</div>
            <h2 class="game-title" style="margin-top: 6px; font-size: 22px; color: white;">🚨 응급상황 올바른 판단 게임</h2>
          </div>
          <div class="timer-box" style="background: rgba(0,0,0,0.4); padding: 8px 16px; border-radius: 20px; font-weight: 700;">남은 시간: <span id="mg2-timer" class="timer-val" style="color: #f43f5e;">${this.timer}초</span></div>
        </div>

        <div class="quiz-progress-bar" style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 12px;">
          <div class="progress-fill" style="width: ${((this.currentIndex + 1) / quizzes.length) * 100}%; background: #38bdf8; height: 100%;"></div>
        </div>
        <div class="quiz-step-count" style="font-weight: 700; color: #94a3b8; margin-bottom: 16px;">문제 ${this.currentIndex + 1} / ${quizzes.length}</div>

        <div class="situation-card" style="background: rgba(30,41,59,0.9); border: 2px solid #38bdf8; border-radius: 14px; padding: 18px; margin-bottom: 18px;">
          <div class="situation-icon" style="font-size: 32px; margin-bottom: 8px;">🚨</div>
          <div class="situation-text">
            <h4 style="color: #38bdf8; font-size: 15px; margin-bottom: 4px;">[응급 상황 발생!]</h4>
            <p style="font-size: 17px; color: #f8fafc; line-height: 1.5; font-weight: 600;">${quiz.situation}</p>
          </div>
        </div>

        <div class="question-title-box" style="margin-bottom: 20px;">
          <h3 class="question-text" style="font-size: 19px; color: #facc15; font-weight: 700;">❓ ${quiz.question}</h3>
        </div>

        <div class="options-container" style="display: flex; flex-direction: column; gap: 14px;">
          ${quiz.options.map((opt, idx) => `
            <button class="option-btn card-panel" data-idx="${idx}" style="display: flex; align-items: center; text-align: left; padding: 16px 20px; background: rgba(15,23,42,0.8); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
              <span class="opt-num" style="background: ${idx === 0 ? '#38bdf8' : '#f43f5e'}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; margin-right: 16px; flex-shrink: 0;">${idx === 0 ? 'A' : 'B'}</span>
              <span class="opt-text" style="font-size: 16px; color: #f8fafc; font-weight: 600; line-height: 1.4;">${opt.text}</span>
            </button>
          `).join('')}
        </div>

        <div id="mg2-feedback-modal" class="modal-overlay hidden">
          <div class="modal-content card-panel" style="max-width: 500px; padding: 24px;">
            <h3 id="mg2-modal-title" class="modal-title" style="font-size: 22px; margin-bottom: 12px;"></h3>
            <div id="mg2-modal-body" class="modal-body" style="margin-bottom: 20px;"></div>
            <div class="btn-group align-center">
              <button id="mg2-modal-next" class="btn btn-primary" style="padding: 12px 24px; font-weight: 800;">다음 문제로 ➡️</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const optionBtns = this.container.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.getAttribute('data-idx'));
        this.checkAnswer(selectedIdx);
      });
    });
  }

  checkAnswer(selectedIdx) {
    const quizzes = window.JUDGMENT_QUIZZES || [];
    const quiz = quizzes[this.currentIndex];
    if (!quiz) return;
    const selectedOption = quiz.options[selectedIdx];

    const modalOverlay = this.container.querySelector('#mg2-feedback-modal');
    const modalTitle = this.container.querySelector('#mg2-modal-title');
    const modalBody = this.container.querySelector('#mg2-modal-body');
    const modalNext = this.container.querySelector('#mg2-modal-next');

    if (selectedOption.correct) {
      this.score++;
      try { window.audioManager.playCorrect(); } catch(e){}
      if (modalTitle) {
        modalTitle.innerHTML = `⭕ 정답입니다! 훌륭해요!`;
        modalTitle.className = 'modal-title success-text';
      }
      if (modalBody) {
        modalBody.innerHTML = `
          <div class="explanation-box success-box" style="background: rgba(34,197,94,0.15); border: 1px solid #22c55e; padding: 14px; border-radius: 10px; color: #f8fafc;">
            <h4 style="color: #4ade80; margin-bottom: 6px;">💡 생명을 구하는 쉬운 해설:</h4>
            <p style="line-height: 1.5; font-size: 15px;">${selectedOption.reason}</p>
          </div>
        `;
      }
    } else {
      try { window.audioManager.playWrong(); } catch(e){}
      if (modalTitle) {
        modalTitle.innerHTML = `❌ 잘못된 판단입니다!`;
        modalTitle.className = 'modal-title error-text';
      }
      if (modalBody) {
        modalBody.innerHTML = `
          <div class="explanation-box warning-box" style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; padding: 14px; border-radius: 10px; color: #f8fafc;">
            <h4 style="color: #f87171; margin-bottom: 6px;">⚠️ 왜 잘못되었을까요?</h4>
            <p style="line-height: 1.5; font-size: 15px;">${selectedOption.reason}</p>
          </div>
        `;
      }
    }

    if (modalNext) {
      modalNext.onclick = () => {
        if (modalOverlay) modalOverlay.classList.add('hidden');
        this.currentIndex++;

        if (this.currentIndex < quizzes.length) {
          this.render();
        } else {
          this.finishGame();
        }
      };
    }

    if (modalOverlay) modalOverlay.classList.remove('hidden');
  }

  finishGame() {
    this.stopTimer();

    const quizzes = window.JUDGMENT_QUIZZES || [];
    const isPerfect = this.score === quizzes.length;
    const isPassed = this.score >= 3;

    if (isPassed) {
      try {
        window.audioManager.playVictory();
        window.audioManager.playGold();
      } catch(e){}

      if (window.storage) {
        const curProgress = window.storage.getProgress();
        if (!curProgress.minigame2Cleared) {
          curProgress.minigame2Cleared = true;
          curProgress.gold += 30;
          window.storage.saveProgress(curProgress);
        }
      }

      if (window.achievementsManager) {
        window.achievementsManager.checkAndUnlock('first_cpr');
        if (isPerfect) {
          window.achievementsManager.checkAndUnlock('perfect_judge');
        }
      }

      this.container.innerHTML = `
        <div class="minigame-wrapper card-panel align-center" style="padding: 24px;">
          <div class="game-badge" style="display: inline-block; background: #22c55e; color: white; font-weight: 800; padding: 4px 12px; border-radius: 14px;">미니게임 2 완료</div>
          <h2 class="game-title" style="margin: 16px 0; font-size: 26px; color: #4ade80;">🎉 응급 상황 판단 테스트 통과!</h2>
          <p class="result-highlight" style="font-size: 18px; margin-bottom: 20px; color: #f8fafc;">총 ${quizzes.length}문제 중 <strong>${this.score}문제</strong>를 올바르게 판단했습니다!</p>
          
          <div class="gold-reward-animation" style="background: rgba(250,204,21,0.2); border: 2px solid #facc15; padding: 16px 28px; border-radius: 20px; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px;">
            <span class="gold-icon" style="font-size: 28px;">💰</span>
            <span class="gold-amount" style="font-size: 22px; font-weight: 800; color: #facc15;">+30 Gold 획득!</span>
          </div>

          <p class="section-desc" style="color: #cbd5e1; margin-bottom: 24px;">올바른 응급 상황 판단 능력이 크게 상승했습니다!</p>
          
          <button id="mg2-finish-btn" class="btn btn-primary btn-large">🏠 메인 화면으로 돌아가기</button>
        </div>
      `;

      const finishBtn = this.container.querySelector('#mg2-finish-btn');
      if (finishBtn) finishBtn.addEventListener('click', () => {
        if (this.onComplete) this.onComplete();
      });
    } else {
      try { window.audioManager.playWrong(); } catch(e){}
      this.container.innerHTML = `
        <div class="minigame-wrapper card-panel align-center" style="padding: 24px;">
          <div class="game-badge" style="display: inline-block; background: #ef4444; color: white; font-weight: 800; padding: 4px 12px; border-radius: 14px;">미니게임 2 미완료</div>
          <h2 class="game-title error-text" style="margin: 16px 0; font-size: 24px; color: #f87171;">❌ 훈련 미달 (3문제 이상 필요)</h2>
          <p class="result-highlight" style="font-size: 16px; margin-bottom: 20px; color: #f8fafc;">총 ${quizzes.length}문제 중 <strong>${this.score}문제</strong>를 맞췄습니다. (3문제 이상 통과 필요)</p>
          
          <p class="section-desc" style="color: #cbd5e1; margin-bottom: 24px;">올바른 응급 판단 해설을 기억하고 다시 한번 도전해 보세요!</p>
          
          <div class="btn-group align-center" style="display: flex; gap: 12px; justify-content: center;">
            <button id="mg2-retry-btn" class="btn btn-primary">🔄 다시 도전하기</button>
            <button id="mg2-home-btn" class="btn btn-secondary">🏠 메인 화면으로</button>
          </div>
        </div>
      `;

      const retryBtn = this.container.querySelector('#mg2-retry-btn');
      if (retryBtn) retryBtn.addEventListener('click', () => {
        this.init();
      });
      this.container.querySelector('#mg2-home-btn').addEventListener('click', () => {
        if (this.onComplete) this.onComplete();
      });
    }
  }
}

window.Minigame2 = Minigame2;
