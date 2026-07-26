/**
 * main.js
 * 메인 엔트리 포인트 및 SPA 화면 전환 컨트롤러
 */

import { storage } from './storage.js';
import { audioManager } from './audio.js';
import { achievementsManager } from './achievements.js';
import { authManager } from './auth.js';
import { Minigame1 } from './minigame1.js';
import { Minigame2 } from './minigame2.js';
import { Minigame3 } from './minigame3.js';
import { BossGame } from './bossGame.js';
import { hallOfFameManager } from './hallOfFame.js';
import { CPR_STEPS } from './cprData.js';

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
    this.showView('home-view');

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

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await authManager.loginWithGoogle();
        if (authModal) authModal.classList.add('hidden');
      });
    }

    if (anonBtn) {
      anonBtn.addEventListener('click', async () => {
        await authManager.loginAnonymously();
        if (authModal) authModal.classList.add('hidden');
      });
    }

    // 내비게이션 버튼 이벤트 (start-boss-btn 제외 - 전용 핸들러로 처리)
    document.querySelectorAll('[data-target-view]').forEach(btn => {
      if (btn.id === 'start-boss-btn') return; // 보스전 버튼은 전용 핸들러로 처리
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target-view');
        audioManager.playBeat(true);
        this.navigateTo(target);
      });
    });

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

    // 보스전 전용 클릭 핸들러는 updateGoldDisplay() 이후 bindBossBtn()에서 처리

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
      // 🔒 보스전 해금 조건: 미니게임 1, 2, 3이 모두 완료되었거나 관리자 모드인 경우!
      const allCleared = progress.minigame1Cleared && progress.minigame2Cleared && progress.minigame3Cleared;
      const unlocked = isAdminMode() || allCleared;

      const clearedCount = (progress.minigame1Cleared ? 1 : 0) + (progress.minigame2Cleared ? 1 : 0) + (progress.minigame3Cleared ? 1 : 0);

      // 기존 리스너 제거 후 재등록 방지용 플래그
      if (!bossBtn._listenerBound) {
        bossBtn._listenerBound = true;
        bossBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const prog = storage.getProgress();
          const isAllCleared = prog.minigame1Cleared && prog.minigame2Cleared && prog.minigame3Cleared;
          if (isAdminMode() || isAllCleared) {
            audioManager.playBeat(true);
            this.navigateTo('boss-view');
          } else {
            alert('🔒 3가지 미니게임을 모두 완료해야 보스전이 해금됩니다!');
          }
        });
      }

      if (unlocked) {
        bossBtn.removeAttribute('disabled');
        bossBtn.classList.remove('locked-btn');
        bossBtn.style.cursor = 'pointer';
        bossBtn.style.pointerEvents = 'auto';
        bossBtn.innerHTML = isAdminMode()
          ? `⚡ [ADMIN] 보스전 바로 입장`
          : `⚔️ 보스전 : 생명을 살리는 사랑의 깍지 (입장 가능)`;
      } else {
        bossBtn.setAttribute('disabled', 'true');
        bossBtn.classList.add('locked-btn'); // 미완료 시 회색 비활성화 버튼
        bossBtn.style.cursor = 'not-allowed';
        bossBtn.style.pointerEvents = 'none';
        bossBtn.innerHTML = `🔒 보스전 (미니게임 3개 완료 필요 - 현재 ${clearedCount}/3 완료)`;
      }
    }
  }

  navigateTo(viewId) {
    const gameViews = ['minigame1-view', 'minigame2-view', 'minigame3-view', 'boss-view'];

    // 유저 상태 검증 및 자동 게스트 보장
    if (!authManager.currentUser) {
      authManager.ensureGuestUser();
    }

    this.currentView = viewId;

    // 미니게임 타이머나 캔버스 정리
    if (this.currentGame && typeof this.currentGame.stopTimer === 'function') {
      this.currentGame.stopTimer();
    }
    if (this.currentGame && typeof this.currentGame.stopLoop === 'function') {
      this.currentGame.stopLoop();
    }
    this.currentGame = null;

    this.showView(viewId);
    this.updateGoldDisplay();

    // 뷰별 초기화 렌더링
    if (viewId === 'home-view') {
      this.renderHomeProgress();
    } else if (viewId === 'minigame1-view') {
      const container = document.getElementById('mg1-container');
      this.currentGame = new Minigame1(container, () => {
        this.navigateTo('home-view');
      });
      this.currentGame.init();
    } else if (viewId === 'minigame2-view') {
      const container = document.getElementById('mg2-container');
      this.currentGame = new Minigame2(container, () => {
        this.navigateTo('home-view');
      });
      this.currentGame.init();
    } else if (viewId === 'minigame3-view') {
      const container = document.getElementById('mg3-container');
      this.currentGame = new Minigame3(container, () => {
        this.navigateTo('home-view');
      });
      this.currentGame.init();
    } else if (viewId === 'boss-view') {
      const container = document.getElementById('boss-container');
      this.currentGame = new BossGame(container, () => {
        this.navigateTo('hall-view');
      }, isAdminMode()); // 관리자 모드 플래그 전달
      this.currentGame.init();
    } else if (viewId === 'hall-view') {
      const container = document.getElementById('hall-container');
      hallOfFameManager.renderHallOfFamePage(container);
    } else if (viewId === 'achievements-view') {
      const container = document.getElementById('achievements-container');
      achievementsManager.renderAchievementsPage(container);
    } else if (viewId === 'guide-view') {
      this.renderGuidePage();
    }
  }

  showView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
    });
    const targetEl = document.getElementById(viewId);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      window.scrollTo(0, 0);
    }
  }

  renderHomeProgress() {
    const progress = storage.getProgress();
    const mg1Card = document.getElementById('mg1-status-card');
    const mg2Card = document.getElementById('mg2-status-card');
    const mg3Card = document.getElementById('mg3-status-card');

    if (mg1Card) {
      mg1Card.className = `game-select-card card-panel ${progress.minigame1Cleared ? 'cleared' : ''}`;
      mg1Card.querySelector('.card-badge').textContent = progress.minigame1Cleared ? '완료됨 (30 Gold 획득)' : '미완료 (+30 Gold)';
    }

    if (mg2Card) {
      mg2Card.className = `game-select-card card-panel ${progress.minigame2Cleared ? 'cleared' : ''}`;
      mg2Card.querySelector('.card-badge').textContent = progress.minigame2Cleared ? '완료됨 (30 Gold 획득)' : '미완료 (+30 Gold)';
    }

    if (mg3Card) {
      mg3Card.className = `game-select-card card-panel ${progress.minigame3Cleared ? 'cleared' : ''}`;
      mg3Card.querySelector('.card-badge').textContent = progress.minigame3Cleared ? '완료됨 (40 Gold 획득)' : '미완료 (+40 Gold)';
    }
  }

  renderGuidePage() {
    const container = document.getElementById('guide-container');
    if (!container) return;

    container.innerHTML = `
      <div class="guide-wrapper card-panel">
        <h2 class="section-title"><span class="icon">📖</span> 심폐소생술(CPR) 완벽 게임 가이드</h2>
        <p class="section-desc">초등학교 5학년이 알아야 할 대한심폐소생협회 최신 지침 7단계를 익혀보세요!</p>

        <div class="guide-steps-grid">
          ${CPR_STEPS.map(step => `
            <div class="guide-step-card card-panel">
              <div class="step-num-badge">${step.id}단계</div>
              <h3 class="step-title">${step.title}</h3>
              <p class="step-desc">${step.desc}</p>
              <div class="step-detail-box">
                <strong>📌 핵심 교육 포인트:</strong>
                <p>${step.detail}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// 앱 실행
document.addEventListener('DOMContentLoaded', () => {
  window.cprApp = new AppController();
});
