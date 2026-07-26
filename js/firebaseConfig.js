/**
 * firebaseConfig.js
 * Firebase SDK (v10 Modular ES Module) 선택적 연동 모듈
 * 네트워크 차단/CORS/오프라인 환경에서도 메인 애플리케이션 실행을 100% 보장합니다.
 */

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

let signInWithPopup = async () => { throw new Error("Offline mode"); };
let signInAnonymously = async () => { return { user: { uid: 'guest-' + Math.random().toString(36).substring(2, 9), displayName: '게스트 구조사', isAnonymous: true } }; };
let signOut = async () => {};
let onAuthStateChanged = (authObj, callback) => {
  if (callback) callback(null);
  return () => {};
};
let collection = () => {};
let addDoc = async () => {};
let getDocs = async () => ({ docs: [] });
let query = () => {};
let orderBy = () => {};
let limit = () => {};
let onSnapshot = () => () => {};

// 비동기 안전 로드 (네트워크 문제 시 메인 앱 실행 절대 차단 불가)
(async () => {
  try {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const firestoreMod = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    const firebaseConfig = {
      apiKey: "AIzaSyDemoKeyForCPRRescueGameVercelHost",
      authDomain: "cpr-golden-time.firebaseapp.com",
      projectId: "cpr-golden-time",
      storageBucket: "cpr-golden-time.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:demo1234567890"
    };

    app = appMod.initializeApp(firebaseConfig);
    auth = authMod.getAuth(app);
    db = firestoreMod.getFirestore(app);
    googleProvider = new authMod.GoogleAuthProvider();

    signInWithPopup = authMod.signInWithPopup;
    signInAnonymously = authMod.signInAnonymously;
    signOut = authMod.signOut;
    onAuthStateChanged = authMod.onAuthStateChanged;
    collection = firestoreMod.collection;
    addDoc = firestoreMod.addDoc;
    getDocs = firestoreMod.getDocs;
    query = firestoreMod.query;
    orderBy = firestoreMod.orderBy;
    limit = firestoreMod.limit;
    onSnapshot = firestoreMod.onSnapshot;
  } catch (e) {
    console.warn("Firebase network load skipped, running in pure offline guest mode:", e);
  }
})();

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
