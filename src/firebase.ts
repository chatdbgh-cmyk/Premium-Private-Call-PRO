import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Auto Sign-in anonymously so Firestore requests are authenticated
let currentFirebaseUser: User | null = null;
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    currentFirebaseUser = user;
    if (!user) {
      signInAnonymously(auth).catch((err) => {
        console.warn('Firebase anonymous auth notice:', err);
      });
    }
  });
}

export const getFirebaseUser = () => currentFirebaseUser;

// Collections constants
export const COLLECTIONS = {
  USERS: 'users',
  DEVELOPERS: 'developers',
  CHAT_MESSAGES: 'chat_messages',
  PAYMENT_REQUESTS: 'payment_requests',
  ORDERS: 'service_orders',
  WITHDRAW_REQUESTS: 'seller_withdraw_requests',
  SYSTEM_CONFIG: 'system_config',
  BOT_REPLIES: 'bot_replies',
  RECHARGE_PACKAGES: 'recharge_packages',
  CALL_SIGNALS: 'call_signals',
  DATABASE_BACKUPS: 'database_backups',
  ACCESS_REQUESTS: 'firebase_access_requests',
};

// Document ID for system configs
export const CONFIG_DOCS = {
  SITE_CONFIG: 'site_config',
  PAYMENT_SETTINGS: 'payment_settings',
};

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
};
