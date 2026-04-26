// Firebase configuration + graceful demo-mode fallback.
//
// Production: Create a Firebase project, enable Authentication (Email/Password),
// Firestore Database, and Storage. Copy your web app config values into a `.env`
// file in the project root with the following keys (each prefixed with VITE_):
//
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_AUTH_DOMAIN=...
//   VITE_FIREBASE_PROJECT_ID=...
//   VITE_FIREBASE_STORAGE_BUCKET=...
//   VITE_FIREBASE_MESSAGING_SENDER_ID=...
//   VITE_FIREBASE_APP_ID=...
//
// If any key is missing the app runs in DEMO MODE using in-memory mock data
// so you can preview the UI without a real Firebase project.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const DEMO_MODE = !cfg.apiKey || !cfg.projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (!DEMO_MODE) {
  app = getApps().length ? getApps()[0] : initializeApp(cfg);
  auth = getAuth(app);
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  storage = getStorage(app);
}

export { app, auth, db, storage };
