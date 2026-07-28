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
    audioManager.playWrong();
    const modalOverlay = this.container.querySelector('#mg2-feedback-modal');
    const modalTitle = this.container.querySelector('#mg2-modal-title');
    const modalBody = this.container.querySelector('#mg2-modal-body');
    const modalCloseGroup = this.container.querySelector('#mg2-feedback-modal .btn-group');

    modalTitle.innerHTML = `⏰ 제한시간 초과!`;
    modalTitle.className = 'modal-title error-text';
    modalBody.innerHTML = `
      <p class="result-highlight">제한시간 내에 응급상황 판단 문제를 모두 완료하지 못했습니다.</p>
      <p class="section-desc">다시 한번 도전하여 올바른 판단을 내리는 훈련을 해보세요!</p>
    `;

    modalCloseGroup.innerHTML = `
      <button id="mg2-retry-btn" class="btn btn-primary">🔄 다시 도전하기</button>
      <button id="mg2-home-btn" class="btn btn-secondary">🏠 메인 화면으로</button>
    `;

    this.container.querySelector('#mg2-retry-btn').onclick = () => {
      modalOverlay.classList.add('hidden');
      this.init();
    };

    this.container.querySelector('#mg2-home-btn').onclick = () => {
      modalOverlay.classList.add('hidden');
      if (this.onComplete) this.onComplete();
    };

    modalOverlay.classList.remove('hidden');
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  render() {
    const quiz = JUDGMENT_QUIZZES[this.currentIndex];

    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel">
        <div class="minigame-header">
          <div class="game-badge">미니게임 2</div>
          <h2 class="game-title">응급상황 판단 게임</h2>
          <div class="timer-box">남은 시간: <span id="mg2-timer" class="timer-val">${this.timer}초</span></div>
        </div>

        <div class="quiz-progress-bar">
          <div class="progress-fill" style="width: ${((this.currentIndex + 1) / JUDGMENT_QUIZZES.length) * 100}%"></div>
        </div>
        <div class="quiz-step-count">문제 ${this.currentIndex + 1} / ${JUDGMENT_QUIZZES.length}</div>

        <div class="situation-card">
          <div class="situation-icon">🚨</div>
          <div class="situation-text">
            <h4>[상황 제시]</h4>
            <p>${quiz.situation}</p>
          </div>
        </div>

        <div class="question-title-box">
          <h3 class="question-text">${quiz.question}</h3>
        </div>

        <div class="options-container">
          ${quiz.options.map((opt, idx) => `
            <button class="option-btn card-panel" data-idx="${idx}">
              <span class="opt-num">${idx === 0 ? 'A' : 'B'}</span>
              <span class="opt-text">${opt.text}</span>
            </button>
          `).join('')}
        </div>

        <div id="mg2-feedback-modal" class="modal-overlay hidden">
          <div class="modal-content card-panel">
            <h3 id="mg2-modal-title" class="modal-title"></h3>
            <div id="mg2-modal-body" class="modal-body"></div>
            <div class="btn-group align-center">
              <button id="mg2-modal-next" class="btn btn-primary">다음 문제로 ➡️</button>
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
    const quiz = JUDGMENT_QUIZZES[this.currentIndex];
    const selectedOption = quiz.options[selectedIdx];

    const modalOverlay = this.container.querySelector('#mg2-feedback-modal');
    const modalTitle = this.container.querySelector('#mg2-modal-title');
    const modalBody = this.container.querySelector('#mg2-modal-body');
    const modalNext = this.container.querySelector('#mg2-modal-next');

    if (selectedOption.correct) {
      this.score++;
      audioManager.playCorrect();
      modalTitle.innerHTML = `⭕ 정답입니다! 훌륭해요!`;
      modalTitle.className = 'modal-title success-text';
      modalBody.innerHTML = `
        <div class="explanation-box success-box">
          <h4>💡 생명을 구하는 쉬운 해설:</h4>
          <p>${selectedOption.reason}</p>
        </div>
      `;
    } else {
      audioManager.playWrong();
      modalTitle.innerHTML = `❌ 잘못된 판단입니다!`;
      modalTitle.className = 'modal-title error-text';
      modalBody.innerHTML = `
        <div class="explanation-box warning-box">
          <h4>⚠️ 왜 잘못되었을까요?</h4>
          <p>${selectedOption.reason}</p>
        </div>
      `;
    }

    modalNext.onclick = () => {
      modalOverlay.classList.add('hidden');
      this.currentIndex++;

      if (this.currentIndex < JUDGMENT_QUIZZES.length) {
        this.render();
      } else {
        this.finishGame();
      }
    };

    modalOverlay.classList.remove('hidden');
  }

  finishGame() {
    this.stopTimer();

    const isPerfect = this.score === JUDGMENT_QUIZZES.length;
    const isPassed = this.score >= 3; // 5문제 중 3문제 이상 맞혀야 통과

    if (isPassed) {
      audioManager.playVictory();
      audioManager.playGold();

      const curProgress = storage.getProgress();
      if (!curProgress.minigame2Cleared) {
        curProgress.minigame2Cleared = true;
        curProgress.gold += 30;
        storage.saveProgress(curProgress);
      }

      achievementsManager.checkAndUnlock('first_rescue');
      if (isPerfect) {
        achievementsManager.checkAndUnlock('perfect_judge');
      }

      this.container.innerHTML = `
        <div class="minigame-wrapper card-panel align-center">
          <div class="game-badge">미니게임 2 완료</div>
          <h2 class="game-title">🎉 판단 테스트 통과!</h2>
          <p class="result-highlight">총 ${JUDGMENT_QUIZZES.length}문제 중 <strong>${this.score}문제</strong>를 맞췄습니다!</p>
          
          <div class="gold-reward-animation">
            <span class="gold-icon">💰</span>
            <span class="gold-amount">+30 Gold 획득!</span>
          </div>

          <p class="section-desc">올바른 응급 상황 판단력이 더욱 키워졌습니다!</p>
          
          <button id="mg2-finish-btn" class="btn btn-primary">🏠 메인 화면으로 돌아가기</button>
        </div>
      `;

      this.container.querySelector('#mg2-finish-btn').addEventListener('click', () => {
        if (this.onComplete) this.onComplete();
      });
    } else {
      audioManager.playWrong();
      this.container.innerHTML = `
        <div class="minigame-wrapper card-panel align-center">
          <div class="game-badge">미니게임 2 미완료</div>
          <h2 class="game-title error-text">❌ 훈련 미달 (3문제 이상 필요)</h2>
          <p class="result-highlight">총 ${JUDGMENT_QUIZZES.length}문제 중 <strong>${this.score}문제</strong>를 맞췄습니다. (3문제 이상 통과 필요)</p>
          
          <p class="section-desc">올바른 응급 판단 해설을 기억하고 다시 한번 도전해 보세요!</p>
          
          <div class="btn-group align-center" style="margin-top: 24px;">
            <button id="mg2-retry-btn" class="btn btn-primary">🔄 다시 도전하기</button>
            <button id="mg2-home-btn" class="btn btn-secondary">🏠 메인 화면으로</button>
          </div>
        </div>
      `;

      this.container.querySelector('#mg2-retry-btn').addEventListener('click', () => {
        this.init();
      });
      this.container.querySelector('#mg2-home-btn').addEventListener('click', () => {
        if (this.onComplete) this.onComplete();
      });
    }
  }
}

window.Minigame2 = Minigame2;
