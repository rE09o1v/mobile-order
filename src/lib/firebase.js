import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase設定を環境変数から読み込み（本番環境では.env.localを使用）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDGJogWTTBYu-iyLegKEpc23TsRWO3k_oc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mobee-886de.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mobee-886de",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mobee-886de.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "866025671192",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:866025671192:web:ebc1b25fc7cbfcbcf7116d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RQ5TYTML4V",
};

// Firebaseアプリの初期化
let app;
let db;
let storage;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { db, storage, auth }; 