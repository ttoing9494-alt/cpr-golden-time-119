/**
 * main.js
 * 메인 엔트리 포인트 및 SPA 화면 전환 컨트롤러
 */



// ✨ 관리자 모드: URL에 ?admin=true 붙이면 미니게임 링 없이 보스전 입장 + 정답 표시
// 예시: https://cpr-golden-time-119.vercel.app/?admin=true
const isAdminMode = () => {
  return new URLSearchParams(window.location.search).get('admin') === 'true'
    || window.location.hash === '#admin';
};

class AppController {
  constructor() {
    this.currentView = 'home';
    this.currentGame = null;
    this.init();
  }

  init() {
    // 1. 오디오 설정 및 Firebase 인증 초기화
    const settings = storage.getSettings();
    audioManager.setSFXEnabled(settings.sfx);
    audioManager.setBGMEnabled(settings.bgm);

    authManager.init((user) => {
      console.log("Auth user state changed:", user);
      if (isAdminMode()) {
        authManager.currentUser = {
          uid: 'admin-master',
          displayName: '⚡ 관리자 (ADMIN)',
          isAnonymous: true
        };
        authManager.updateAuthUI();
      }
      const authModal = document.getElementById('auth-modal');
      if (authModal) authModal.classList.add('hidden');
    });

    // 2. DOM 요소 바인딩
    this.bindGlobalEvents();
    this.updateGoldDisplay();

    // 3. 해시 변경 라우팅 100% 보장
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(hash)) {
        this.navigateTo(hash, false);
      }
    });

    const initHash = window.location.hash.replace('#', '');
    if (initHash && document.getElementById(initHash)) {
      this.navigateTo(initHash, false);
    } else {
      this.showView('home-view');
    }

    // 첫 인터랙션 시 AudioContext 준비
    document.addEventListener('click', () => {
      audioManager.init();
    }, { once: true });
  }

  bindGlobalEvents() {
    // Firebase 로그인 모달 버튼 이벤트
    const googleBtn = document.getElementById('google-login-btn');
    const anonBtn = document.getElementById('anon-login-btn');
    const authModal = document.getElementById('auth-modal');

    const closeAuthModal = () => {
      sessionStorage.setItem('auth_prompt_shown', 'true');
      if (authModal) authModal.classList.add('hidden');
    };

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await authManager.loginWithGoogle();
        closeAuthModal();
      });
    }

    if (anonBtn) {
      anonBtn.addEventListener('click', async () => {
        await authManager.loginAnonymously();
        closeAuthModal();
      });
    }

    // capture-phase(true) 이벤트 위임: 클릭된 모든 요소 및 조상 중 data-target-view를 최우선 가로채어 100% 화면 진입
    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-target-view]');
      if (!targetBtn) return;

      const viewId = targetBtn.getAttribute('data-target-view');
      if (!viewId) return;

      // 보스전 잠금 상태 체크
      if (targetBtn.id === 'start-boss-btn') {
        const prog = storage.getProgress();
        const isAllCleared = prog.minigame1Cleared && prog.minigame2Cleared && prog.minigame3Cleared;
        if (!isAdminMode() && !isAllCleared) {
          e.preventDefault();
          e.stopPropagation();
          alert('🔒 3가지 미니게임을 모두 완료해야 보스전이 해금됩니다!');
          return;
        }
      }

      e.preventDefault();
      e.stopPropagation();
      try { audioManager.playBeat(true); } catch(err) {}
      this.navigateTo(viewId);
    }, true);

    // 설정 모달 폼 컨트롤
    const sfxToggle = document.getElementById('setting-sfx');
    const bgmToggle = document.getElementById('setting-bgm');
    const settings = storage.getSettings();

    if (sfxToggle) {
      sfxToggle.checked = settings.sfx;
      sfxToggle.addEventListener('change', (e) => {
        settings.sfx = e.target.checked;
        audioManager.setSFXEnabled(settings.sfx);
        storage.saveSettings(settings);
      });
    }

    if (bgmToggle) {
      bgmToggle.checked = settings.bgm;
      bgmToggle.addEventListener('change', (e) => {
        settings.bgm = e.target.checked;
        audioManager.setBGMEnabled(settings.bgm);
        storage.saveSettings(settings);
      });
    }

    // 게임 진행 초기화 버튼 (설정 모달 및 상단 헤더)
    const handleReset = () => {
      if (confirm('게임 진행 상황과 골드를 처음부터 다시 시작하시겠습니까?')) {
        storage.resetProgress();
        this.updateGoldDisplay();
        this.renderHomeProgress();
        alert('진행 상황이 초기화되었습니다.');
        this.navigateTo('home-view');
      }
    };

    const resetProgressBtn = document.getElementById('reset-progress-btn');
    if (resetProgressBtn) resetProgressBtn.addEventListener('click', handleReset);

    const headerResetBtn = document.getElementById('header-reset-progress-btn');
    if (headerResetBtn) headerResetBtn.addEventListener('click', handleReset);

    const heroResetBtn = document.getElementById('hero-reset-progress-btn');
    if (heroResetBtn) heroResetBtn.addEventListener('click', handleReset);

    // 모달 닫기 공통
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.add('hidden');
      });
    });
  }

  updateGoldDisplay() {
    const progress = storage.getProgress();
    const goldValEl = document.getElementById('user-gold-val');
    const bossBtn = document.getElementById('start-boss-btn');

    if (goldValEl) {
      goldValEl.textContent = progress.gold;
    }

    if (bossBtn) {
      const allCleared = progress.minigame1Cleared && progress.minigame2Cleared && progress.minigame3Cleared;
      const unlocked = isAdminMode() || allCleared;

      const clearedCount = (progress.minigame1Cleared ? 1 : 0) + (progress.minigame2Cleared ? 1 : 0) + (progress.minigame3Cleared ? 1 : 0);

      if (unlocked) {
        bossBtn.removeAttribute('disabled');
        bossBtn.classList.remove('locked-btn');
        bossBtn.classList.add('btn-primary');
        bossBtn.style.cursor = 'pointer';
        bossBtn.style.pointerEvents = 'auto';
        bossBtn.style.background = '';
        bossBtn.style.color = '';
        bossBtn.style.border = '';
        bossBtn.style.filter = '';
        bossBtn.innerHTML = isAdminMode()
          ? `⚡ [ADMIN] 보스전 바로 입장`
          : `⚔️ 보스전 : 생명을 살리는 사랑의 깍지 (입장 가능)`;
      } else {
        bossBtn.setAttribute('disabled', 'true');
        bossBtn.classList.remove('btn-primary');
        bossBtn.classList.add('locked-btn'); // 미완료 시 회색 비활성화 버튼
        bossBtn.style.cursor = 'not-allowed';
        bossBtn.style.pointerEvents = 'none';
        bossBtn.style.background = '#334155';
        bossBtn.style.color = '#94a3b8';
        bossBtn.style.border = '2px solid #475569';
        bossBtn.style.filter = 'grayscale(1)';
        bossBtn.innerHTML = `🔒 보스전 (미니게임 3개 완료 필요 - 현재 ${clearedCount}/3 완료)`;
      }
    }
  }

  navigateTo(viewId) {
    // ✨ 무조건 1순위로 시각적 화면 전환 먼저 보장!
    this.showView(viewId);

    try {
      if (typeof authManager !== 'undefined' && authManager && typeof authManager.ensureGuestUser === 'function') {
        if (!authManager.currentUser) {
          authManager.ensureGuestUser();
        }
      }
    } catch (e) {}

    this.currentView = viewId;

    // 미니게임 타이머나 캔버스 정리
    try {
      if (this.currentGame && typeof this.currentGame.stopTimer === 'function') {
        this.currentGame.stopTimer();
      }
      if (this.currentGame && typeof this.currentGame.stopLoop === 'function') {
        this.currentGame.stopLoop();
      }
    } catch (e) {
      console.warn("Clean game state warning:", e);
    }
    this.currentGame = null;

    try {
      this.updateGoldDisplay();
    } catch (e) {}

    // 뷰별 초기화 렌더링
    try {
      if (viewId === 'home-view') {
        this.renderHomeProgress();
      } else if (viewId === 'minigame1-view') {
        const container = document.getElementById('mg1-container');
        if (container && window.Minigame1) {
          this.currentGame = new window.Minigame1(container, () => {
            this.navigateTo('home-view');
          });
          this.currentGame.init();
        }
      } else if (viewId === 'minigame2-view') {
        const container = document.getElementById('mg2-container');
        if (container && window.Minigame2) {
          this.currentGame = new window.Minigame2(container, () => {
            this.navigateTo('home-view');
          });
          this.currentGame.init();
        }
      } else if (viewId === 'minigame3-view') {
        const container = document.getElementById('mg3-container');
        if (container && window.Minigame3) {
          this.currentGame = new window.Minigame3(container, () => {
            this.navigateTo('home-view');
          });
          this.currentGame.init();
        }
      } else if (viewId === 'boss-view') {
        const container = document.getElementById('boss-container');
        if (container && window.BossGame) {
          this.currentGame = new window.BossGame(container, () => {
            this.navigateTo('hall-view');
          }, isAdminMode());
          this.currentGame.init();
        }
      } else if (viewId === 'hall-view') {
        const container = document.getElementById('hall-container');
        if (container && window.hallOfFameManager) {
          window.hallOfFameManager.renderHallOfFamePage(container);
        }
      } else if (viewId === 'achievements-view') {
        const container = document.getElementById('achievements-container');
        if (container && window.achievementsManager) {
          window.achievementsManager.renderAchievementsPage(container);
        }
      } else if (viewId === 'guide-view') {
        this.renderGuidePage();
      }
    } catch (err) {
      console.error("Game render error:", err);
    }
  }

  showView(viewId) {
    console.log("Showing view:", viewId);
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
      sec.style.display = 'none';
    });
    document.querySelectorAll('.modal-overlay:not(#auth-modal)').forEach(modal => {
      modal.classList.add('hidden');
    });
    const targetEl = document.getElementById(viewId);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      targetEl.style.display = 'flex';
      window.scrollTo(0, 0);
    } else {
      console.error("Target view element not found:", viewId);
    }
  }

  renderHomeProgress() {
    const progress = window.storage ? window.storage.getProgress() : { minigame1Cleared: false, minigame2Cleared: false, minigame3Cleared: false };
    const mg1Card = document.getElementById('mg1-status-card');
    const mg2Card = document.getElementById('mg2-status-card');
    const mg3Card = document.getElementById('mg3-status-card');

    if (mg1Card) {
      mg1Card.className = `game-select-card card-panel ${progress.minigame1Cleared ? 'cleared' : ''}`;
      const badge = mg1Card.querySelector('.card-badge');
      if (badge) badge.textContent = progress.minigame1Cleared ? '완료됨 (30 Gold 획득)' : '미완료 (+30 Gold)';
    }

    if (mg2Card) {
      mg2Card.className = `game-select-card card-panel ${progress.minigame2Cleared ? 'cleared' : ''}`;
      const badge = mg2Card.querySelector('.card-badge');
      if (badge) badge.textContent = progress.minigame2Cleared ? '완료됨 (30 Gold 획득)' : '미완료 (+30 Gold)';
    }

    if (mg3Card) {
      mg3Card.className = `game-select-card card-panel ${progress.minigame3Cleared ? 'cleared' : ''}`;
      const badge = mg3Card.querySelector('.card-badge');
      if (badge) badge.textContent = progress.minigame3Cleared ? '완료됨 (40 Gold 획득)' : '미완료 (+40 Gold)';
    }
  }

  renderGuidePage() {
    const container = document.getElementById('guide-container');
    if (!container) return;

    const steps = window.CPR_STEPS || [];
    container.innerHTML = `
      <div class="guide-wrapper card-panel" style="padding: 20px;">
        <h2 class="section-title" style="font-size: 24px; color: #38bdf8; margin-bottom: 8px;"><span class="icon">📖</span> 심폐소생술(CPR) 완벽 게임 가이드</h2>
        <p class="section-desc" style="color: #cbd5e1; margin-bottom: 24px;">초등학교 5학년이 알아야 할 대한심폐소생협회 최신 지침 7단계를 익혀보세요!</p>

        <div class="guide-steps-grid">
          ${steps.map(step => `
            <div class="guide-step-card card-panel" style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 14px; margin-bottom: 16px;">
              <div class="step-num-badge" style="display: inline-block; background: var(--color-red-primary, #dc2626); color: white; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 14px;">${step.id}단계</div>
              <h3 class="step-title" style="margin: 12px 0 8px 0; color: #f8fafc; font-size: 20px; font-weight: 700;">${step.title}</h3>
              <p class="step-desc" style="color: #e2e8f0; font-size: 15px; line-height: 1.6;">${step.desc}</p>
              <div class="step-detail-box" style="margin-top: 12px; background: rgba(30,41,59,0.8); padding: 12px; border-radius: 8px; font-size: 14px; color: #94a3b8; border-left: 4px solid #38bdf8;">
                <strong style="color: #38bdf8;">📌 핵심 교육 포인트:</strong>
                <p style="margin-top: 4px; color: #cbd5e1;">${step.detail}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// 앱 실행 (ES 모듈 호환: 이미 DOM이 로드된 경우 즉시 실행, 로딩 중이면 DOMContentLoaded 이벤트 등록)
const initApp = () => {
  if (!window.cprApp) {
    window.cprApp = new AppController();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 전역 화면 전환 단축 함수 등록 (인라인 onclick 100% 보장)
window.navigateTo = (viewId) => {
  window.location.hash = '#' + viewId;
  initApp();
  if (window.cprApp) {
    window.cprApp.navigateTo(viewId, false);
  }
};
