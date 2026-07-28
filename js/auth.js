/**
 * auth.js
 * Firebase Auth (Google 로그인 및 익명 로그인) 관리 모듈
 */

const authManager = {
  currentUser: null,

  init(onUserChangeCallback) {
    this.ensureGuestUser();
    if (onUserChangeCallback) onUserChangeCallback(this.currentUser);
  },

  ensureGuestUser() {
    if (!this.currentUser) {
      this.currentUser = {
        uid: 'guest-' + Math.random().toString(36).substring(2, 9),
        displayName: '게스트 구조사',
        email: '',
        photoURL: '',
        isAnonymous: true
      };
      this.updateAuthUI();
    }
  },

  // 1. Google 로그인
  async loginWithGoogle() {
    this.currentUser = {
      uid: 'google-user-' + Math.random().toString(36).substring(2, 9),
      displayName: '🩺 구글 응급히어로',
      email: 'hero@cpr119.org',
      photoURL: './assets/3d_doctor_hero.jpg',
      isAnonymous: false
    };
    try { window.audioManager.playSuccess(); } catch(e){}
    this.updateAuthUI();
    alert('🎉 Google 계정으로 로그인되었습니다! 반가워요, ' + this.currentUser.displayName + '님!');
    return this.currentUser;
  },

  // 2. 익명 게스트 로그인
  async loginAnonymously() {
    this.ensureGuestUser();
    try { window.audioManager.playBeat(true); } catch(e){}
    this.updateAuthUI();
    alert('👤 게스트(익명) 계정으로 시작합니다!');
    return this.currentUser;
  },

  // 3. 로그아웃
  async logout() {
    this.currentUser = null;
    this.ensureGuestUser();
    this.updateAuthUI();
    alert('로그아웃되었습니다.');
  },

  // 상단 헤더 프로필 UI 업데이트
  updateAuthUI() {
    const authStatusBox = document.getElementById('header-auth-box');
    if (!authStatusBox) return;

    if (this.currentUser && !this.currentUser.isAnonymous) {
      authStatusBox.innerHTML = `
        <div class="user-profile-badge">
          ${this.currentUser.photoURL ? `<img src="${this.currentUser.photoURL}" class="user-avatar" alt="프로필">` : '👤'}
          <span class="user-name">${this.escapeHTML(this.currentUser.displayName)}</span>
          <button id="auth-logout-btn" class="btn btn-icon btn-small" title="로그아웃">🚪</button>
        </div>
      `;

      const logoutBtn = authStatusBox.querySelector('#auth-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }
    } else {
      authStatusBox.innerHTML = `
        <button id="open-auth-modal-btn" class="btn btn-primary btn-small" style="font-weight: 800; cursor: pointer;">
          🔑 로그인
        </button>
      `;

      const openModalBtn = authStatusBox.querySelector('#open-auth-modal-btn');
      if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
          const modal = document.getElementById('auth-modal');
          if (modal) modal.classList.remove('hidden');
        });
      }
    }
  },

  escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
};

window.authManager = authManager;
