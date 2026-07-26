/**
 * hallOfFame.js
 * 명예의 전당 순위표 및 기록 렌더링 모듈
 */

import { storage } from './storage.js';
import { firestoreManager } from './firestore.js';

export const hallOfFameManager = {
  async renderHallOfFamePage(containerEl) {
    const records = await firestoreManager.getOnlineHallOfFame();
    this.renderTable(containerEl, records);

    // 온라인 실시간 스냅샷 구독
    firestoreManager.listenToHallOfFame((updatedRecords) => {
      if (document.getElementById('hall-table-body')) {
        this.renderTable(containerEl, updatedRecords);
      }
    });
  },

  renderTable(containerEl, records) {
    let html = `
      <div class="hall-of-fame-wrapper card-panel">
        <div class="hall-header">
          <span class="crown-hero-icon">🏆</span>
          <h2 class="section-title">구조 명예의 전당 (온라인 클라우드 DB)</h2>
          <p class="section-desc">생명을 살리는 사랑의 깍지로 기적을 만든 최고의 5학년 응급구조사들입니다!</p>
        </div>

        ${records.length === 0 ? `
          <div class="empty-hall-box align-center">
            <p>아직 등록된 영웅이 없습니다. 최종 평가(보스전)를 완료하고 첫 명예의 주인공이 되어보세요!</p>
          </div>
        ` : `
          <div class="ranking-table-container">
            <table class="hall-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>구조사 이름</th>
                  <th>최종 점수</th>
                  <th>정답률</th>
                  <th>⏱️ 보스 도전 시간</th>
                  <th>클리어 날짜</th>
                </tr>
              </thead>
              <tbody id="hall-table-body">
                ${records.map((rec, idx) => {
                  let rankBadge = `${idx + 1}위`;
                  let rankClass = '';
                  if (idx === 0) { rankBadge = '🥇 1위'; rankClass = 'rank-1st'; }
                  else if (idx === 1) { rankBadge = '🥈 2위'; rankClass = 'rank-2nd'; }
                  else if (idx === 2) { rankBadge = '🥉 3위'; rankClass = 'rank-3rd'; }

                  const bossTime = rec.playTime || rec.bossTime || 0;

                  return `
                    <tr class="${rankClass}">
                      <td class="rank-col">${rankBadge}</td>
                      <td class="name-col"><strong>${this.escapeHTML(rec.name)}</strong></td>
                      <td class="score-col">${rec.score}점</td>
                      <td class="accuracy-col">${rec.accuracy}%</td>
                      <td class="time-col">⏱️ <strong>${bossTime}초</strong></td>
                      <td class="date-col">${rec.date}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    containerEl.innerHTML = html;
  },

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
};
