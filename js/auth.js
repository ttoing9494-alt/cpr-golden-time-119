/**
 * auth.js
 * Firebase Auth (Google 로그인 및 익명 로그인) 관리 모듈
 */

import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from './firebaseConfig.js';
import { audioManager } from './audio.js';

export const authManager = {
  currentUser: null,

  init(onUserChangeCallback) {
    if (!auth) return;

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          displayName: user.displayName || (user.isAnonymous ? '익명 구조사' : '구조사'),
          email: user.email || '',
          photoURL: user.photoURL || '',
          isAnonymous: user.isAnonymous
        };
      } else {
        this.currentUser = null;
      }

      this.updateAuthUI();
      if (onUserChangeCallback) onUserChangeCallback(this.currentUser);
    });
  },

  // 1. Google 로그인
  async loginWithGoogle() {
    if (!auth) {
      alert("Firebase가 설정되지 않은 환경입니다. 오프라인 모드로 플레이합니다.");
      return;
    }
    try {
      audioManager.playBeat(true);
      const result = await signInWithPopup(auth, googleProvider);
      audioManager.playGold();
      alert(`🎉 반가워요, ${result.user.displayName}님! Google 계정으로 로그인되었습니다.`);
      return result.user;
    } catch (error) {
      console.error("Google Login Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        alert(`로그인 오류: ${error.message}`);
      }
    }
  },

  // 2. 익명 게스트 로그인
  async loginAnonymously() {
    if (!auth) {
      alert("오프라인 모드로 플레이합니다.");
      return;
    }
    try {
      audioManager.playBeat(true);
      const result = await signInAnonymously(auth);
      audioManager.playGold();
      alert("👤 익명 게스트로 로그인되었습니다. 명예의 전당 등록이 가능합니다!");
      return result.user;
    } catch (error) {
      console.error("Anonymous Login Error:", error);
      alert(`익명 로그인 오류: ${error.message}`);
    }
  },

  // 3. 로그아웃
  async logout() {
    if (!auth) return;
    try {
      await signOut(auth);
      audioManager.playBeat(false);
      alert("로그아웃 되었습니다.");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  },

  // 상단 헤더 프로필 UI 업데이트
  updateAuthUI() {
    const authStatusBox = document.getElementById('header-auth-box');
    if (!authStatusBox) return;

    if (this.currentUser) {
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
        <button id="open-auth-modal-btn" class="btn btn-primary btn-small">
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
