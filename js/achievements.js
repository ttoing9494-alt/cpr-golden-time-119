/**
 * achievements.js
 * 업적 달성 검사 및 배지 토스트 알림 모듈
 */

const achievementsManager = {
  checkAndUnlock(achievementId) {
    const isNew = window.storage ? window.storage.unlockAchievement(achievementId) : false;
    if (isNew) {
      const list = window.ACHIEVEMENTS_LIST || [];
      const achievement = list.find(a => a.id === achievementId);
      if (achievement) {
        this.showAchievementToast(achievement);
        try { window.audioManager.playGold(); } catch(e){}
      }
    }
  },

  showAchievementToast(achievement) {
    const container = document.getElementById('achievement-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast animate-slide-in';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-icon">🏅</div>
      <div class="toast-content">
        <div class="toast-subtitle">업적 달성!</div>
        <div class="toast-title">${achievement.title}</div>
        <div class="toast-desc">${achievement.desc}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('animate-slide-in');
      toast.classList.add('animate-slide-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 500);
    }, 4000);
  },

  renderAchievementsPage(containerEl) {
    const unlockedIds = storage.getUnlockedAchievements();
    
    let html = `
      <div class="achievements-container card-panel">
        <h2 class="section-title"><span class="icon">🏆</span> 수집한 업적 배지</h2>
        <p class="section-desc">CPR 교육과 미니게임, 최종 평가를 완수하여 모든 배지를 모아보세요!</p>
        <div class="achievements-grid">
    `;

    ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = unlockedIds.includes(ach.id);
      html += `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon">${isUnlocked ? ach.icon : '🔒'}</div>
          <div class="badge-info">
            <h3 class="badge-title">${ach.title}</h3>
            <p class="badge-desc">${ach.desc}</p>
            <span class="badge-status">${isUnlocked ? '달성 완료 ✨' : '미달성'}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    containerEl.innerHTML = html;
  }
};

window.achievementsManager = achievementsManager;
