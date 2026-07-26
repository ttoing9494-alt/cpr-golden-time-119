/**
 * storage.js
 * LocalStorage 데이터 관리 모듈
 * 명예의 전당, 진행 상황, 골드, 설정, 업적 저장 및 불러오기
 */

const STORAGE_KEYS = {
  SETTINGS: 'cpr_game_settings',
  HALL_OF_FAME: 'cpr_hall_of_fame',
  GAME_PROGRESS: 'cpr_game_progress',
  ACHIEVEMENTS: 'cpr_achievements'
};

export const storage = {
  // 1. 설정 (SFX, BGM)
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { sfx: true, bgm: true };
    } catch (e) {
      return { sfx: true, bgm: true };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  // 2. 게임 진행도 & 골드
  initSession() {
    try {
      if (!sessionStorage.getItem('cpr_active_session')) {
        sessionStorage.setItem('cpr_active_session', 'true');
        this.resetProgress();
      }
    } catch (e) {
      console.warn('SessionStorage error:', e);
    }
  },

  getProgress() {
    this.initSession();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
      return data ? JSON.parse(data) : {
        minigame1Cleared: false,
        minigame2Cleared: false,
        minigame3Cleared: false,
        gold: 0
      };
    } catch (e) {
      return { minigame1Cleared: false, minigame2Cleared: false, minigame3Cleared: false, gold: 0 };
    }
  },

  saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  },

  resetProgress() {
    const defaultProgress = {
      minigame1Cleared: false,
      minigame2Cleared: false,
      minigame3Cleared: false,
      gold: 0
    };
    this.saveProgress(defaultProgress);
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to reset achievements:', e);
    }
    return defaultProgress;
  },

  // 3. 명예의 전당 (Hall of Fame)
  getHallOfFame() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HALL_OF_FAME);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addHallOfFameRecord(record) {
    // record: { name, score, playTime, accuracy, date }
    const list = this.getHallOfFame();
    list.push(record);
    // 점수 내림차순, 동일 점수 시 시간 오름차순 정렬
    list.sort((a, b) => b.score !== a.score ? b.score - a.score : a.playTime - b.playTime);
    // 상위 10개만 유지
    const topList = list.slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEYS.HALL_OF_FAME, JSON.stringify(topList));
    } catch (e) {
      console.error('Failed to save Hall of Fame:', e);
    }
    return topList;
  },

  // 4. 업적 (Achievements)
  getUnlockedAchievements() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  unlockAchievement(id) {
    const unlocked = this.getUnlockedAchievements();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      try {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));
      } catch (e) {
        console.error('Failed to unlock achievement:', e);
      }
      return true; // 새로 해금됨
    }
    return false; // 이미 해금되어 있음
  }
};
