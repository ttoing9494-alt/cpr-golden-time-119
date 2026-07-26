# 🫀 구조골든타임 119 - 초등 5학년 심폐소생술(CPR) 교육용 웹게임

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Vercel](https://img.shields.io/badge/Vercel-Deploy Ready-black.svg) ![Firebase](https://img.shields.io/badge/Firebase-v10-FFCA28.svg)

초등학교 5학년 학생들이 심폐소생술(CPR) 교육을 받은 후 올바른 7단계 순서, 응급상황 판단 능력, 100~120BPM 압박 리듬을 재미있게 복습할 수 있도록 제작된 **반응형 웹 게임 시뮬레이션**입니다.

---

## 🌟 주요 특징

- **저작권 & 적십자 표장 100% 준수**: 대한적십자사 및 국제적십자사의 빨간 십자가(Red Cross)와 Star of Life 표장을 완전히 배제하고, 독창적인 의료 모니터 스타일과 SVG 심장/청진기 아이콘만 사용했습니다.
- **Firebase Auth (Google 로그인 & 게스트 익명 로그인)**: 별도 빌드 없이 팝업으로 구글 로그인 및 익명 로그인을 지원합니다.
- **Firebase Firestore 데이터베이스 연동**: 사용자의 보스전 점수, 정답률, **⏱️ 보스 도전 시간(초)**을 실시간 클라우드 DB와 동기화하여 온라인 명예의 전당 랭킹에 등록합니다. (오프라인 시 LocalStorage 자동 Fallback)
- **Web Audio API 오디오 엔진**: 외부 오디오 파일 다운로드 없이 100% 브라우저 자체 합성음으로 정답, 오답, 심장 박동, 보스 타격음 및 BGM을 재생합니다.
- **3가지 미니게임 + 100 Gold 보스전**:
  1. CPR 7단계 순서 맞추기 (30 Gold)
  2. 응급상황 판단 게임 (30 Gold)
  3. CPR 리듬 게임 (40 Gold)
  4. 최종 평가: 생명을 살리는 사랑의 깍지 (어둠의 저승사자 보스전)

---

## 🚀 GitHub 업로드 및 Vercel 배포 방법

### 1단계: GitHub 저장소 생성 및 코드 Push

터미널(PowerShell 또는 Git Bash)에서 다음 명령어를 실행하여 GitHub에 코드를 업로드합니다.

```bash
git init
git add .
git commit -m "feat: Initial commit for CPR Golden Time 119 with Firebase & Vercel support"
git branch -M main
git remote add origin https://github.com/사용자이름/cpr-golden-time-119.git
git push -u origin main
```

---

### 2단계: Firebase 프로젝트 설정 (선택 사항)

1. [Firebase Console](https://console.firebase.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. **Authentication** ➔ 로그인 방법 설정에서 **Google**과 **익명 로그인(Anonymous)**을 사용 설정(Enabled)합니다.
3. **Firestore Database** ➔ 데이터베이스 만들기를 클릭하고 규칙(Rules)을 쓰기 가능으로 설정합니다.
4. 프로젝트 설정에서 발급받은 `firebaseConfig` 객체 키를 `js/firebaseConfig.js` 파일에 복사해 넣으시면 본인의 Firebase DB와 동기화됩니다.

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

### 3단계: Vercel 1-Click 배포

1. [Vercel](https://vercel.com/)에 로그인 후 **Add New... ➔ Project**를 클릭합니다.
2. 1단계에서 push한 GitHub 저장소(`cpr-golden-time-119`)를 선택합니다.
3. Build & Output Settings는 기본값(Static Engine)으로 두고 **Deploy** 버튼을 누릅니다.
4. 약 10초 내에 배포가 완료되며 라이브 URL(`https://cpr-golden-time-119.vercel.app`)이 생성됩니다!

---

## 🛠️ 기술 스택

- **Frontend**: HTML5, Vanilla CSS3 (Medical Monitor Theme), JavaScript (ES Modules)
- **Database & Auth**: Firebase Auth (Google, Anonymous), Firebase Firestore DB
- **Audio Engine**: Web Audio API (Synthesizer Engine)
- **Deployment**: Vercel Static Hosting
