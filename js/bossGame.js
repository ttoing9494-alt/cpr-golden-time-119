/**
 * bossGame.js
 * 최종 평가(보스전): "생명을 살리는 사랑의 깍지"
 * 보스: 영혼을 노리는 저승사자/염라대왕
 * 10문제 퀴즈, 보스 HP, 플레이어 HP, 환자 생명 게이지, 경고 쉐이크 연출 및 명예의 전당 등록
 */

class BossGame {
  constructor(containerEl, onCompleteCallback, adminMode = false) {
    this.container = containerEl;
    this.onComplete = onCompleteCallback;
    this.adminMode = adminMode;
    this.bossHP = 100;
    this.playerHP = 100;
    this.patientVital = 30;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.startTime = 0;

    // 아케이드 슈팅 플레이어 & 방해물/미사일 상태
    this.heroPosPercent = 50; 
    this.selectedTargetIdx = 0;
    this.keyListener = null;
    this.obstacles = [];
    this.projectiles = [];
    this.physicsInterval = null;
    this.spawnInterval = null;
  }

  init() {
    this.bossHP = 100;
    this.playerHP = 100;
    this.patientVital = 30;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.heroPosPercent = 50;
    this.obstacles = [];
    this.projectiles = [];
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    this.startBossTimer();
    this.startArcadePhysics();
    this.bindKeyboardControls();
    this.render();
  }

  bindKeyboardControls() {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
    }

    this.keyListener = (e) => {
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

    const quizzes = window.BOSS_QUIZZES || [];
    const quiz = quizzes[this.currentIndex];
    if (!quiz) return;
    const optionCount = quiz.options.length;
    const stepPercent = optionCount === 1 ? 0 : 80 / Math.max(1, optionCount - 1);
    
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

    try { window.audioManager.playBeat(true); } catch(e){}

    const quizzes = window.BOSS_QUIZZES || [];
    const quiz = quizzes[this.currentIndex];
    if (!quiz) return;
    const optionCount = quiz.options.length;
    const stepPercent = optionCount === 1 ? 0 : 80 / Math.max(1, optionCount - 1);
    const targetLeft = optionCount === 1 ? 50 : 10 + this.selectedTargetIdx * stepPercent;

    // AED 미사일 생성 (Hero 위치에서 조준 타겟으로 날아감)
    this.projectiles.push({
      id: Date.now() + Math.random(),
      startX: this.heroPosPercent,
      startY: 75,
      currentX: this.heroPosPercent,
      currentY: 75,
      targetX: targetLeft,
      targetY: 20,
      progress: 0,
      targetIdx: this.selectedTargetIdx
    });
  }

  startArcadePhysics() {
    if (this.physicsInterval) clearInterval(this.physicsInterval);
    if (this.spawnInterval) clearInterval(this.spawnInterval);

    // 1.5초마다 저승사자 방해물 생성
    this.spawnInterval = setInterval(() => {
      const bossView = document.getElementById('boss-view');
      if (!bossView || bossView.classList.contains('hidden')) return;

      const types = ['👻', '💀', '⚡', '💣'];
      this.obstacles.push({
        id: Date.now() + Math.random(),
        x: Math.random() * 80 + 10,
        y: 15,
        speed: Math.random() * 1.5 + 1.2,
        icon: types[Math.floor(Math.random() * types.length)]
      });
    }, 1500);

    // 물리 및 이동 루프 (60FPS 모사)
    this.physicsInterval = setInterval(() => {
      const bossView = document.getElementById('boss-view');
      if (!bossView || bossView.classList.contains('hidden')) return;

      this.updateArcadePhysics();
    }, 40);
  }

  updateArcadePhysics() {
    const arenaEl = this.container.querySelector('.arcade-quiz-zone');
    if (!arenaEl) return;

    let overlayContainer = arenaEl.querySelector('#arcade-bullets-overlay');
    if (!overlayContainer) {
      overlayContainer = document.createElement('div');
      overlayContainer.id = 'arcade-bullets-overlay';
      overlayContainer.style.position = 'absolute';
      overlayContainer.style.top = '0';
      overlayContainer.style.left = '0';
      overlayContainer.style.width = '100%';
      overlayContainer.style.height = '100%';
      overlayContainer.style.pointerEvents = 'none';
      overlayContainer.style.zIndex = '20';
      arenaEl.appendChild(overlayContainer);
    }

    // 1. 방해물 이동 및 충돌 체크
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += obs.speed;

      // 영웅 히어로와 충돌 체크 (y: 65~85%, x: ±10%)
      if (obs.y >= 65 && obs.y <= 85 && Math.abs(obs.x - this.heroPosPercent) < 12) {
        // 방해물 충돌! 구조사 집중력 HP & 환자 생명력 차감!
        this.obstacles.splice(i, 1);
        this.playerHP = Math.max(0, this.playerHP - 10);
        this.patientVital = Math.max(0, this.patientVital - 5);
        this.updateGauges();

        try { window.audioManager.playWrong(); } catch(e){}
        document.body.classList.add('warning-red-flash');
        setTimeout(() => document.body.classList.remove('warning-red-flash'), 300);

        if (this.playerHP <= 0) {
          this.failBossBattle();
          return;
        }
        continue;
      }

      // 화면 하단 이탈
      if (obs.y > 90) {
        this.obstacles.splice(i, 1);
      }
    }

    // 2. AED 발사 미사일 이동 및 명중 체크
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.progress += 0.2; // 미사일 비행 속도
      p.currentX = p.startX + (p.targetX - p.startX) * p.progress;
      p.currentY = p.startY + (p.targetY - p.startY) * p.progress;

      if (p.progress >= 1.0) {
        // 미사일 타겟 명중! 정답 처리 진행!
        const hitIdx = p.targetIdx;
        this.projectiles.splice(i, 1);
        this.handleAnswer(hitIdx);
      }
    }

    // 3. 시각적 오버레이 렌더링
    let html = '';
    this.obstacles.forEach(obs => {
      html += `<div style="position: absolute; left: ${obs.x}%; top: ${obs.y}%; font-size: 26px; transform: translate(-50%, -50%); filter: drop-shadow(0 0 10px #f43f5e); animation: spin 2s linear infinite;">${obs.icon}</div>`;
    });

    this.projectiles.forEach(p => {
      html += `<div style="position: absolute; left: ${p.currentX}%; top: ${p.currentY}%; font-size: 32px; transform: translate(-50%, -50%); filter: drop-shadow(0 0 15px #facc15); font-weight: 900; color: #facc15;">⚡</div>`;
    });

    overlayContainer.innerHTML = html;
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
    if (this.physicsInterval) {
      clearInterval(this.physicsInterval);
      this.physicsInterval = null;
    }
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
    this.unbindKeyboardControls();
  }

  render() {
    const quizzes = window.BOSS_QUIZZES || [];
    const quiz = quizzes[this.currentIndex] || {
      question: "CPR 1단계 행동은?",
      options: ["의식확인", "119신고", "주변안전확인", "가슴압박"],
      answer: 2,
      explanation: "주변 안전을 확인해야 2차 사고를 방지합니다."
    };
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
          <div class="boss-stage-count">ROUND ${this.currentIndex + 1} / ${quizzes.length}</div>
        </div>

        <!-- 3D 보스전 아케이드 아레나 -->
        <div class="battle-arena battleground-3d-arena arcade-arena-box">
          <!-- 1. 저승사자 보스 영역 -->
          <div class="boss-avatar-box reaper-boss-box">
            <div class="avatar-frame GrimReaper-boss 3d-boss-frame">
              <div class="char-3d-wrapper">
                <img src="./assets/3d_devil_boss.jpg" alt="3D 저승사자 보스" class="char-3d-img boss-3d-render ${this.bossHP < 40 ? 'boss-damaged-effect' : ''}">
                <div class="boss-flame-aura"></div>
              </div>
              <div class="boss-name">👻 저승사자 보스 <span class="boss-status-tag">${bossStatus}</span></div>
            </div>
            <div class="hp-bar-outer hud-hp-outer">
              <div id="boss-hp-fill" class="hp-bar-fill boss-hp" style="width: ${this.bossHP}%"></div>
            </div>
            <div class="hp-text">저승사자 게이지: <span id="boss-hp-val">${this.bossHP}</span> / 100</div>
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
                <img src="./assets/3d_doctor_hero.jpg" alt="응급 히어로" class="hero-ship-img glow-lvl-${Math.min(this.correctCount, 5)}">
                <div class="hero-ship-label">🩺 응급 히어로 (Lv.${heroLevel})</div>
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
        const quizzes = window.BOSS_QUIZZES || [];
        const quiz = quizzes[this.currentIndex];
        const stepPercent = quiz.options.length === 1 ? 0 : 80 / (quiz.options.length - 1);
        this.heroPosPercent = 10 + idx * stepPercent;
        const heroEl = this.container.querySelector('#arcade-hero-ship');
        if (heroEl) heroEl.style.left = `${this.heroPosPercent}%`;
        this.updateTargetHighlight();
        this.fireAEDShock();
      });
    });
  }

  handleAnswer(selectedIdx) {
    const quizzes = window.BOSS_QUIZZES || [];
    const quiz = quizzes[this.currentIndex];
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
      const quizzes = window.BOSS_QUIZZES || [];
      modalOverlay.classList.add('hidden');
      this.currentIndex++;

      if (this.bossHP <= 0 || this.currentIndex >= quizzes.length) {
        if (this.bossHP <= 0 || this.correctCount >= 6) {
          this.winBossBattle();
        } else {
          this.failBossBattle();
        }
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

  winBossBattle() {
    this.finishBossBattle();
  }

  finishBossBattle() {
    this.stopBossTimer();
    const bossTimeSec = Math.max(1, this.elapsedSeconds);
    const quizzes = window.BOSS_QUIZZES || [];
    const accuracy = Math.round((this.correctCount / Math.max(1, quizzes.length)) * 100);
    const score = (this.correctCount * 100) + Math.max(0, 300 - bossTimeSec * 2);

    try { window.audioManager.playVictory(); } catch(e){}

    if (window.achievementsManager) {
      window.achievementsManager.checkAndUnlock('first_cpr');
      window.achievementsManager.checkAndUnlock('hero_savior');
    }

    this.container.innerHTML = `
      <div class="boss-victory-wrapper card-panel align-center animate-fade-in" style="padding: 24px;">
        <div class="victory-header">
          <span class="victory-crown" style="font-size: 48px;">👑</span>
          <h2 class="victory-title" style="color: #4ade80; font-size: 28px; margin: 12px 0;">생명을 구했습니다! 구조 성공!</h2>
          <p class="victory-sub" style="color: #f8fafc; font-size: 16px; margin-bottom: 20px;">어둠의 저승사자를 물리치고 사랑의 깍지로 소중한 생명을 지켜냈습니다!</p>
        </div>

        <div class="result-stats-card card-panel" style="background: rgba(15,23,42,0.9); border: 2px solid #38bdf8; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
          <h3 style="color: #38bdf8; font-size: 18px; margin-bottom: 14px;">📊 최종 구조 성과 리포트</h3>
          <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
              <span class="stat-lbl" style="color: #94a3b8; font-size: 13px; display: block;">최종 점수</span>
              <span class="stat-val highlight-val" style="color: #facc15; font-size: 22px; font-weight: 800;">${score}점</span>
            </div>
            <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
              <span class="stat-lbl" style="color: #94a3b8; font-size: 13px; display: block;">정답률</span>
              <span class="stat-val" style="color: #38bdf8; font-size: 22px; font-weight: 800;">${accuracy}%</span>
            </div>
            <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
              <span class="stat-lbl" style="color: #94a3b8; font-size: 13px; display: block;">⏱️ 보스 도전 시간</span>
              <span class="stat-val success-text" style="color: #4ade80; font-size: 22px; font-weight: 800;">${bossTimeSec}초</span>
            </div>
            <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
              <span class="stat-lbl" style="color: #94a3b8; font-size: 13px; display: block;">환자 최종 생명력</span>
              <span class="stat-val success-text" style="color: #4ade80; font-size: 22px; font-weight: 800;">100% 회복</span>
            </div>
          </div>
        </div>

        <!-- 명예의 전당 입력 폼 -->
        <div class="hall-input-card card-panel" style="background: rgba(30,41,59,0.9); padding: 20px; border-radius: 16px; margin-bottom: 24px;">
          <h4 style="color: #facc15; font-size: 17px; margin-bottom: 12px;">🏆 명예의 전당에 이름을 새기세요</h4>
          <div class="name-input-group" style="display: flex; gap: 10px; justify-content: center;">
            <input type="text" id="hero-name-input" class="text-input" placeholder="구조사 이름을 입력하세요 (예: 5학년 홍길동)" maxlength="10" style="padding: 12px; border-radius: 10px; border: 1px solid #38bdf8; background: #0f172a; color: white; flex: 1; max-width: 280px;">
            <button id="save-hall-btn" class="btn btn-primary" style="padding: 12px 20px; font-weight: 800;">기록 등록하기</button>
          </div>
        </div>
      </div>
    `;

    const saveBtn = this.container.querySelector('#save-hall-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const nameInput = this.container.querySelector('#hero-name-input');
        const heroName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : '무명 구조사';
        const today = new Date().toISOString().split('T')[0];

        if (window.hallOfFameManager && typeof window.hallOfFameManager.addRecord === 'function') {
          window.hallOfFameManager.addRecord({
            name: heroName,
            score: score,
            time: `${bossTimeSec}초`,
            date: today
          });
        }

        try { window.audioManager.playGold(); } catch(e){}
        alert(`🏆 보스 도전 시간 ${bossTimeSec}초 기록이 명예의 전당에 등록되었습니다!`);
        if (this.onComplete) this.onComplete();
      });
    }
  }

  failBossBattle() {
    this.stopBossTimer();
    try { window.audioManager.playWrong(); } catch(e){}
    this.container.innerHTML = `
      <div class="boss-fail-wrapper card-panel align-center" style="padding: 24px;">
        <h2 class="error-text" style="color: #f87171; font-size: 26px; margin-bottom: 12px;">❌ 구조 실패... 집중력이 다했습니다</h2>
        <p class="section-desc" style="color: #cbd5e1; margin-bottom: 24px;">저승사자의 기운에 눌렸습니다. CPR 순서와 지식을 다시 복습하고 도전해보세요!</p>
        
        <button id="boss-retry-btn" class="btn btn-primary btn-large" style="padding: 16px 28px; font-size: 18px; font-weight: 800;">🔄 보스전 다시 도전하기</button>
      </div>
    `;

    const retryBtn = this.container.querySelector('#boss-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.init();
      });
    }
  }
}

window.BossGame = BossGame;
