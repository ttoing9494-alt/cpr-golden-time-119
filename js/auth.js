/**
 * auth.js
 * Firebase Auth (Google 로그인 및 익명 로그인) 관리 모듈
 */

import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from './firebaseConfig.js';
import { audioManager } from './audio.js';

export const authManager = {
  currentUser: null,

  init(onUserChangeCallback) {
    if (!auth) {
      this.ensureGuestUser();
      if (onUserChangeCallback) onUserChangeCallback(this.currentUser);
      return;
    }

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
        // 미로그인 시 오프라인 게스트 유저 자동 할당 (게임 즉시 시작 보장)
        this.ensureGuestUser();
      }

      this.updateAuthUI();
      if (onUserChangeCallback) onUserChangeCallback(this.currentUser);
    });
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
    audioManager.playBeat(true);
    if (auth) {
      try {
        const result = await signInAnonymously(auth);
        audioManager.playGold();
        alert("👤 익명 게스트로 로그인되었습니다. 즐거운 게임 되세요!");
        return result.user;
      } catch (error) {
        console.warn("Firebase Anonymous Auth unavailable, using local guest fallback:", error);
      }
    }

    // Firebase 연동 불가능 시 로컬 게스트 세션 생성 (절대 오류나지 않음)
    this.currentUser = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      displayName: '게스트 구조사',
      email: '',
      photoURL: '',
      isAnonymous: true
    };
    audioManager.playGold();
    this.updateAuthUI();
    alert("👤 게스트 익명으로 로그인되었습니다!");
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.classList.add('hidden');
    return this.currentUser;
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
