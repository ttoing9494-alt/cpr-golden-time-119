/**
 * firestore.js
 * Firebase Firestore 데이터베이스 매니저
 * 명예의 전당 온라인 클라우드 연동 및 실시간 랭킹 수집
 */

import { db, collection, addDoc, getDocs, query, orderBy, limit, onSnapshot } from './firebaseConfig.js';
import { storage } from './storage.js';

export const firestoreManager = {
  // 1. 명예의 전당 기록 Firestore 저장
  async saveHallOfFameRecord(record) {
    // 1-1. LocalStorage 우선 저장
    storage.addHallOfFameRecord(record);

    // 1-2. Firestore DB 저장
    if (!db) {
      console.log("Firestore unavailable. LocalStorage fallback used.");
      return;
    }

    try {
      await addDoc(collection(db, "hallOfFame"), {
        name: record.name,
        score: record.score,
        accuracy: record.accuracy,
        bossTime: record.playTime,
        date: record.date,
        createdAt: new Date().toISOString()
      });
      console.log("Record saved to Firestore successfully!");
    } catch (error) {
      console.warn("Firestore save failed, saved in local storage:", error);
    }
  },

  // 2. 명예의 전당 온라인 DB 불러오기
  async getOnlineHallOfFame() {
    if (!db) {
      return storage.getHallOfFame();
    }

    try {
      const q = query(collection(db, "hallOfFame"), orderBy("score", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const records = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          name: data.name,
          score: data.score,
          accuracy: data.accuracy,
          playTime: data.bossTime || data.playTime || 0,
          date: data.date
        });
      });

      if (records.length > 0) {
        return records;
      } else {
        return storage.getHallOfFame();
      }
    } catch (e) {
      console.warn("Firestore fetch error, fallback to local:", e);
      return storage.getHallOfFame();
    }
  },

  // 3. 실시간 리더보드 스냅샷 구독
  listenToHallOfFame(callback) {
    if (!db) return;
    try {
      const q = query(collection(db, "hallOfFame"), orderBy("score", "desc"), limit(10));
      return onSnapshot(q, (snapshot) => {
        const records = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            name: data.name,
            score: data.score,
            accuracy: data.accuracy,
            playTime: data.bossTime || data.playTime || 0,
            date: data.date
          });
        });
        if (callback && records.length > 0) {
          callback(records);
        }
      });
    } catch (e) {
      console.warn("Snapshot listener failed:", e);
    }
  }
};
