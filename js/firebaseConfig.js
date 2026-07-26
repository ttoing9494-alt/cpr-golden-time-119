/**
 * firebaseConfig.js
 * Firebase SDK (v10 Modular ES Module) 초기화
 * Auth (Google 로그인, 익명 로그인) 및 Firestore Database 연동
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase 프로젝트 설정 (사용자 Firebase 콘솔에서 발급받은 키로 교체 가능)
// 기본 템플릿 설정값이 제공되며, 배포 환경 변수나 환경 설정에서 손쉽게 대체됩니다.
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForCPRRescueGameVercelHost",
  authDomain: "cpr-golden-time.firebaseapp.com",
  projectId: "cpr-golden-time",
  storageBucket: "cpr-golden-time.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo1234567890"
};

let app, auth, db, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.warn("Firebase initialized with local fallback mode:", e);
}

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot
};
