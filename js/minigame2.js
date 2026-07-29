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
    this.selectedIdx = null;
    window.activeMg2 = this;
  }

  init() {
    this.currentIndex = 0;
    this.score = 0;
    this.timer = 60;
    this.selectedIdx = null;
    window.activeMg2 = this;
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
    this.stopTimer();

    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel align-center" style="padding: 24px;">
        <h3 class="modal-title error-text" style="font-size: 24px; color: #f87171;">⏰ 제한시간 초과!</h3>
        <p class="result-highlight" style="font-size: 16px; margin: 16px 0; color: #f8fafc;">제한시간 내에 응급상황 판단 문제를 모두 완료하지 못했습니다.</p>
        <p class="section-desc" style="color: #cbd5e1; margin-bottom: 24px;">다시 한번 도전하여 올바른 판단을 내리는 훈련을 해보세요!</p>
        <div class="btn-group align-center" style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-primary" onclick="window.activeMg2.init()">🔄 다시 도전하기</button>
          <button class="btn btn-secondary" onclick="if(window.activeMg2.onComplete) window.activeMg2.onComplete()">🏠 메인 화면으로</button>
        </div>
      </div>
    `;
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  render() {
    window.activeMg2 = this;
    const quizzes = window.JUDGMENT_QUIZZES || [];
    const quiz = quizzes[this.currentIndex] || {
      situation: "운동장에서 친구가 갑자기 쓰러졌습니다! 주변에 차나 운동기구가 있습니다.",
      question: "쓰러진 친구를 발견했을 때 가장 먼저 해야 할 행동은 무엇일까요?",
      options: [
        { text: "주변에 위험한 것이 없는지 먼저 안전을 확인한다.", correct: true, reason: "구조자의 안전이 확보되어야 2차 사고 없이 친구를 안전하게 도울 수 있습니다!" },
        { text: "친구를 일으켜 세우려고 억지로 끌어당긴다.", correct: false, reason: "의식이 없는 사람을 무리하게 일으키면 척추나 뼈가 다칠 수 있습니다." }
      ]
    };

    this.selectedIdx = null;

    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel" style="padding: 20px;">
        <div class="minigame-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div class="game-badge" style="display: inline-block; background: #38bdf8; color: #0f172a; font-weight: 800; padding: 4px 12px; border-radius: 12px; font-size: 13px;">미니게임 2</div>
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

        <div class="options-container" id="mg2-options-box" style="display: flex; flex-direction: column; gap: 14px;">
          ${quiz.options.map((opt, idx) => `
            <button class="option-btn card-panel" data-idx="${idx}" style="display: flex; align-items: center; text-align: left; padding: 18px 20px; background: rgba(15,23,42,0.85); border: 2px solid rgba(255,255,255,0.2); border-radius: 14px; cursor: pointer; transition: all 0.2s; width: 100%;">
              <span class="opt-num" style="background: ${idx === 0 ? '#38bdf8' : '#f43f5e'}; color: white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; margin-right: 16px; flex-shrink: 0;">${idx === 0 ? 'A' : 'B'}</span>
              <span class="opt-text" style="font-size: 16px; color: #f8fafc; font-weight: 600; line-height: 1.4;">${opt.text}</span>
            </button>
          `).join('')}
        </div>

        <div id="mg2-inline-feedback" style="margin-top: 20px; display: none;"></div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btns = this.container.querySelectorAll('.option-btn');
    btns.forEach(btn => {
      btn.onclick = (e) => {
        if (e) e.preventDefault();
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (!isNaN(idx)) {
          this.checkAnswer(idx);
        }
      };
    });
  }

  checkAnswer(selectedIdx) {
    if (selectedIdx === null || selectedIdx === undefined || isNaN(selectedIdx)) return;
    if (this.selectedIdx !== null) return; // 이미 답변 선택함
    this.selectedIdx = selectedIdx;

    const quizzes = window.JUDGMENT_QUIZZES || [];
    const quiz = quizzes[this.currentIndex];
    if (!quiz) return;

    const selectedOption = quiz.options[selectedIdx];
    const feedbackBox = this.container.querySelector('#mg2-inline-feedback');
    const optionsBox = this.container.querySelector('#mg2-options-box');

    if (selectedOption.correct) {
      this.score++;
      try { window.audioManager.playCorrect(); } catch(e){}
    } else {
      try { window.audioManager.playWrong(); } catch(e){}
    }

    // 선택 버튼 비활성화 및 색상 하이라이트
    if (optionsBox) {
      const btns = optionsBox.querySelectorAll('.option-btn');
      btns.forEach((btn, idx) => {
        btn.disabled = true;
        btn.onclick = null; // 중복 클릭 차단
        if (idx === selectedIdx) {
          btn.style.border = selectedOption.correct ? '3px solid #22c55e' : '3px solid #ef4444';
          btn.style.background = selectedOption.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
        } else {
          btn.style.opacity = '0.5';
        }
      });
    }

    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.innerHTML = `
        <div class="feedback-card" style="background: ${selectedOption.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}; border: 2px solid ${selectedOption.correct ? '#22c55e' : '#ef4444'}; padding: 18px; border-radius: 14px; margin-bottom: 20px;">
          <h3 style="color: ${selectedOption.correct ? '#4ade80' : '#f87171'}; font-size: 20px; font-weight: 800; margin-bottom: 8px;">
            ${selectedOption.correct ? '⭕ 정답입니다! 훌륭한 판단이에요!' : '❌ 잘못된 판단입니다!'}
          </h3>
          <p style="color: #f8fafc; font-size: 16px; line-height: 1.5; font-weight: 600;">
            ${selectedOption.reason}
          </p>
        </div>

        <button id="mg2-next-btn" class="btn btn-primary btn-large" style="width: 100%; padding: 16px; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
          다음 문제로 이동하기 ➡️
        </button>
      `;

      const nextBtn = feedbackBox.querySelector('#mg2-next-btn');
      if (nextBtn) {
        nextBtn.onclick = (e) => {
          if (e) e.preventDefault();
          this.nextQuestion();
        };
      }

      try {
        feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch(e){}
    }

    // 1.5초 후 자동 다음 문제 이동
    if (this.autoNextTimeout) clearTimeout(this.autoNextTimeout);
    this.autoNextTimeout = setTimeout(() => {
      this.nextQuestion();
    }, 1500);
  }

  nextQuestion() {
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }

    this.selectedIdx = null; // 초기화
    const quizzes = window.JUDGMENT_QUIZZES || [];
    this.currentIndex++;

    if (this.currentIndex < quizzes.length) {
      this.render();
    } else {
      this.finishGame();
    }
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
