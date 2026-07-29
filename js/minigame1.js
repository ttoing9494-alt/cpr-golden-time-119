/**
 * minigame1.js
 * 미니게임 1: CPR 순서 맞추기 (드래그 앤 드롭 & 모바일 터치 순서 선택)
 */

class Minigame1 {
  constructor(containerEl, onCompleteCallback) {
    this.container = containerEl;
    this.onComplete = onCompleteCallback;
    this.userOrder = []; // 사용자가 배치한 순서
    this.shuffledSteps = [];
    this.timer = 60; // 1분 이내
    this.timerInterval = null;
  }

  init() {
    const steps = window.CPR_STEPS || [];
    this.shuffledSteps = [...steps].sort(() => Math.random() - 0.5);
    this.userOrder = new Array(7).fill(null);
    this.timer = 60;
    this.render();
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerDisplay = document.getElementById('mg1-timer');

    this.timerInterval = setInterval(() => {
      this.timer--;
      if (timerDisplay) {
        timerDisplay.textContent = `${this.timer}초`;
        if (this.timer <= 10) {
          timerDisplay.classList.add('timer-warning');
        }
      }

      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeOut();
      }
    }, 1000);
  }

  handleTimeOut() {
    audioManager.playWrong();
    const modalOverlay = this.container.querySelector('#mg1-result-modal');
    const modalTitle = this.container.querySelector('#mg1-modal-title');
    const modalBody = this.container.querySelector('#mg1-modal-body');
    const modalCloseGroup = this.container.querySelector('#mg1-result-modal .btn-group');

    modalTitle.innerHTML = `⏰ 제한시간 초과!`;
    modalTitle.className = 'modal-title error-text';
    modalBody.innerHTML = `
      <p class="result-highlight">제한시간 내에 CPR 7단계 순서를 배치하지 못했습니다.</p>
      <p class="section-desc">차근차근 다시 도전하여 7단계 올바른 순서를 완성해 보세요!</p>
    `;

    modalCloseGroup.innerHTML = `
      <button id="mg1-retry-btn" class="btn btn-primary">🔄 다시 도전하기</button>
      <button id="mg1-home-btn" class="btn btn-secondary">🏠 메인 화면으로</button>
    `;

    this.container.querySelector('#mg1-retry-btn').onclick = () => {
      modalOverlay.classList.add('hidden');
      this.init();
    };

    this.container.querySelector('#mg1-home-btn').onclick = () => {
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
    this.container.innerHTML = `
      <div class="minigame-wrapper card-panel">
        <div class="minigame-header">
          <div class="game-badge">미니게임 1</div>
          <h2 class="game-title">CPR 7단계 순서 맞추기</h2>
          <div class="timer-box">남은 시간: <span id="mg1-timer" class="timer-val">60초</span></div>
        </div>

        <p class="game-instruction">
          💡 아래의 심폐소생술 7개 단계를 올바른 순서대로 1번부터 7번까지 순서대로 배치해보세요!
          (PC: 드래그 앤 드롭 / 터치: 카드를 누르면 빈 슬롯으로 이동합니다)
        </p>

        <div class="cpr-target-slots" id="target-slots">
          ${[1, 2, 3, 4, 5, 6, 7].map((num, idx) => `
            <div class="slot-item" data-slot="${idx}">
              <div class="slot-num">${num}단계</div>
              <div class="slot-content" data-index="${idx}">
                <span class="slot-placeholder">이곳으로 드래그해주세요</span>
              </div>
            </div>
          `).join('')}
        </div>

        <h3 class="sub-section-title">📦 섞여있는 순서 카드 목록</h3>
        <div class="cpr-source-pool" id="source-pool">
          ${this.shuffledSteps.map(step => {
            // 번호("1. ", "2. " 등) 제거하여 힌트 방지
            const titleNoNum = step.title.replace(/^\d+\.\s*/, '');
            return `
            <div class="cpr-card" draggable="true" data-id="${step.id}">
              <div class="card-title">${titleNoNum}</div>
              <div class="card-desc">${step.desc}</div>
            </div>
          `}).join('')}
        </div>

        <div class="btn-group align-center">
          <button id="mg1-reset-btn" class="btn btn-secondary">🔄 순서 초기화</button>
          <button id="mg1-check-btn" class="btn btn-primary">✅ 순서 검사하기</button>
        </div>

        <div id="mg1-result-modal" class="modal-overlay hidden">
          <div class="modal-content card-panel">
            <h3 id="mg1-modal-title" class="modal-title"></h3>
            <div id="mg1-modal-body" class="modal-body"></div>
            <div class="btn-group align-center">
              <button id="mg1-modal-close" class="btn btn-primary">확인</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const cards = this.container.querySelectorAll('#source-pool .cpr-card');
    const slots = this.container.querySelectorAll('.slot-content');
    const sourcePool = this.container.querySelector('#source-pool');

    let draggedCardId = null;
    let isDragging = false;
    let autoScrollRAF = null;
    let dragClientY = 0;

    // 드래그 중 화면 자동 스크롤 함수
    const startAutoScroll = () => {
      const ZONE = 120;      // 화면 가장자리로부터 스크롤 감지 영역 (px)
      const SPEED = 12;      // 최대 스크롤 속도 (px/frame)

      const step = () => {
        const vh = window.innerHeight;
        const y = dragClientY;

        if (y < ZONE) {
          const intensity = 1 - y / ZONE;
          window.scrollBy(0, -Math.ceil(SPEED * intensity));
        } else if (y > vh - ZONE) {
          const intensity = 1 - (vh - y) / ZONE;
          window.scrollBy(0, Math.ceil(SPEED * intensity));
        }
        autoScrollRAF = requestAnimationFrame(step);
      };

      autoScrollRAF = requestAnimationFrame(step);
    };

    const stopAutoScroll = () => {
      if (autoScrollRAF) {
        cancelAnimationFrame(autoScrollRAF);
        autoScrollRAF = null;
      }
    };

    // Desktop & Mobile Source Pool Cards
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        if (card.classList.contains('used')) {
          e.preventDefault();
          return;
        }
        isDragging = true;
        draggedCardId = parseInt(card.getAttribute('data-id'));
        e.dataTransfer.setData('text/plain', draggedCardId);
        card.classList.add('dragging');
        startAutoScroll();
      });

      card.addEventListener('drag', (e) => {
        if (e.clientY !== 0) dragClientY = e.clientY;
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        stopAutoScroll();
        setTimeout(() => {
          isDragging = false;
        }, 150);
      });

      // Mobile / Click Selection (드래그 직후 후속 클릭 방지)
      card.addEventListener('click', (e) => {
        if (isDragging || card.classList.contains('used')) return;
        const id = parseInt(card.getAttribute('data-id'));
        const emptySlotIdx = this.userOrder.findIndex(item => item === null);
        if (emptySlotIdx !== -1) {
          this.placeCardInSlot(id, emptySlotIdx);
        }
      });
    });

    slots.forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });

      slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
      });

      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const slotIdx = parseInt(slot.getAttribute('data-index'));
        const rawData = e.dataTransfer.getData('text/plain');
        const id = parseInt(rawData || draggedCardId);
        if (id && !isNaN(id)) {
          this.placeCardInSlot(id, slotIdx);
        }
      });

      // 슬롯에 배치된 카드 클릭 시 원복
      slot.addEventListener('click', (e) => {
        if (isDragging) return;
        const slotIdx = parseInt(slot.getAttribute('data-index'));
        if (this.userOrder[slotIdx] !== null) {
          this.removeCardFromSlot(slotIdx);
        }
      });
    });

    // Reset 버튼
    this.container.querySelector('#mg1-reset-btn').addEventListener('click', () => {
      audioManager.playBeat(false);
      this.resetSlots();
    });

    // 검사 버튼
    this.container.querySelector('#mg1-check-btn').addEventListener('click', () => {
      this.checkResult();
    });
  }

  placeCardInSlot(stepId, slotIdx) {
    // 기존에 다른 슬롯에 배치되어 있었다면 제거
    const existingIdx = this.userOrder.indexOf(stepId);
    if (existingIdx !== -1) {
      this.userOrder[existingIdx] = null;
      this.updateSlotUI(existingIdx);
    }

    this.userOrder[slotIdx] = stepId;
    this.updateSlotUI(slotIdx);
    this.updateSourcePoolUI();
    audioManager.playBeat(true);
  }

  removeCardFromSlot(slotIdx) {
    this.userOrder[slotIdx] = null;
    this.updateSlotUI(slotIdx);
    this.updateSourcePoolUI();
    audioManager.playBeat(false);
  }

  resetSlots() {
    this.userOrder = new Array(7).fill(null);
    for (let i = 0; i < 7; i++) {
      this.updateSlotUI(i);
    }
    this.updateSourcePoolUI();
  }

  updateSlotUI(slotIdx) {
    const slotEl = this.container.querySelector(`.slot-content[data-index="${slotIdx}"]`);
    const stepId = this.userOrder[slotIdx];

    if (!slotEl) return;

    if (stepId !== null) {
      const stepObj = CPR_STEPS.find(s => s.id === stepId);
      slotEl.innerHTML = `
        <div class="cpr-card placed">
          <div class="card-title">${stepObj.title}</div>
        </div>
      `;
      slotEl.classList.add('has-card');
    } else {
      slotEl.innerHTML = `<span class="slot-placeholder">이곳으로 드래그해주세요</span>`;
      slotEl.classList.remove('has-card');
    }
  }

  updateSourcePoolUI() {
    const cards = this.container.querySelectorAll('#source-pool .cpr-card');
    cards.forEach(card => {
      const id = parseInt(card.getAttribute('data-id'));
      if (this.userOrder.includes(id)) {
        card.classList.add('used');
        card.setAttribute('draggable', 'false');
      } else {
        card.classList.remove('used');
        card.setAttribute('draggable', 'true');
      }
    });
  }

  checkResult() {
    if (this.userOrder.includes(null)) {
      audioManager.playWrong();
      alert('7개 단계를 모두 슬롯에 채워주셔야 검사가 가능합니다!');
      return;
    }

    let isCorrect = true;
    let wrongIndices = [];

    this.userOrder.forEach((stepId, idx) => {
      if (stepId !== idx + 1) {
        isCorrect = false;
        wrongIndices.push(idx + 1);
      }
    });

    const modalOverlay = this.container.querySelector('#mg1-result-modal');
    const modalTitle = this.container.querySelector('#mg1-modal-title');
    const modalBody = this.container.querySelector('#mg1-modal-body');
    const modalClose = this.container.querySelector('#mg1-modal-close');

    if (isCorrect) {
      this.stopTimer();
      audioManager.playVictory();
      audioManager.playGold();

      modalTitle.innerHTML = `🎉 완벽합니다! CPR 7단계 완성!`;
      modalTitle.className = 'modal-title success-text';
      modalBody.innerHTML = `
        <p class="result-highlight">축하합니다! 올바른 심폐소생술 순서를 완벽하게 기억하고 계시네요!</p>
        <div class="explanation-box">
          <h4>💡 왜 이 순서가 중요할까요?</h4>
          <ol class="step-summary-list">
            ${CPR_STEPS.map(s => `<li><strong>${s.title}</strong>: ${s.detail}</li>`).join('')}
          </ol>
        </div>
        <div class="gold-reward-animation">
          <span class="gold-icon">💰</span>
          <span class="gold-amount">+30 Gold 획득!</span>
        </div>
      `;

      modalClose.onclick = () => {
        modalOverlay.classList.add('hidden');
        // 골드 및 진행 상황 저장
        const curProgress = storage.getProgress();
        if (!curProgress.minigame1Cleared) {
          curProgress.minigame1Cleared = true;
          curProgress.gold += 30;
          storage.saveProgress(curProgress);
        }

        achievementsManager.checkAndUnlock('first_rescue');
        achievementsManager.checkAndUnlock('cpr_expert');

        if (this.onComplete) this.onComplete();
      };
    } else {
      audioManager.playWrong();
      modalTitle.innerHTML = `❌ 잘못된 순서가 있습니다`;
      modalTitle.className = 'modal-title error-text';
      modalBody.innerHTML = `
        <p class="result-highlight">아쉽습니다! <strong>${wrongIndices.join(', ')}단계</strong> 순서가 올바르지 않습니다.</p>
        <div class="explanation-box warning-box">
          <h4>📌 올바른 CPR 7단계 순서 안내:</h4>
          <ol>
            ${(window.CPR_STEPS || []).map(s => `<li>${s.title} (${s.desc})</li>`).join('')}
          </ol>
        </div>
        <p>순서를 잘 확인하고 다시 한번 시도해 보세요!</p>
      `;

      modalClose.onclick = () => {
        modalOverlay.classList.add('hidden');
      };
    }

    modalOverlay.classList.remove('hidden');
  }
}

window.Minigame1 = Minigame1;
