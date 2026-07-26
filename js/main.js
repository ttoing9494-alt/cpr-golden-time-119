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
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.classList.add('hidden');
      } else if (!user) {
        // 미로그인 시 로그인 선택 모달 띄우기
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.classList.remove('hidden');
      }
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

    // 내비게이션 버튼 이벤트
    document.querySelectorAll('[data-target-view]').forEach(btn => {
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

    // 관리자 모드이면 항상 보스전 해금
    if (bossBtn) {
      const unlocked = isAdminMode()
        || progress.gold >= 100
        || (progress.minigame1Cleared && progress.minigame2Cleared && progress.minigame3Cleared);

      if (unlocked) {
        bossBtn.disabled = false;
        bossBtn.classList.remove('locked-btn');
        bossBtn.innerHTML = isAdminMode()
          ? `⚡ [ADMIN] 최종 평가 바로 입장`
          : `⚔️ 최종 평가 : 생명을 살리는 사랑의 깍지 (입장 가능)`;
      } else {
        bossBtn.disabled = true;
        bossBtn.classList.add('locked-btn');
        bossBtn.innerHTML = `🔒 최종 평가 (100 Gold 필요 - 현재 ${progress.gold} Gold)`;
      }
    }
  }

  navigateTo(viewId) {
    const gameViews = ['minigame1-view', 'minigame2-view', 'minigame3-view', 'boss-view'];

    // 🔒 로그인(Google/익명) 체크: 게임 진입 시 미로그인 차단 (단, 관리자 모드인 경우 우회)
    if (gameViews.includes(viewId) && !authManager.currentUser && !isAdminMode()) {
      audioManager.playWrong();
      alert('🔒 게임을 시작하려면 먼저 로그인(Google 또는 게스트 익명)을 해주세요!');
      const authModal = document.getElementById('auth-modal');
      if (authModal) authModal.classList.remove('hidden');
      return;
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
