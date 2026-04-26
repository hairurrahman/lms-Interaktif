/**
 * Seed script untuk mengisi Firestore dengan data awal.
 *
 * Cara pakai:
 *   1. Pastikan .env berisi VITE_FIREBASE_* lengkap.
 *   2. Jalankan: npx tsx scripts/seed-firestore.ts
 *
 * Script ini menambahkan: 3 subjects, 6 materials, 3 quizzes, 8 badges.
 * User & skor TIDAK di-seed — biarkan muncul alami saat user register & main kuis.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { SUBJECTS, MATERIALS, QUIZZES, BADGES } from '../client/src/lib/mockData';

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey) {
  console.error('❌ Firebase config belum ada. Isi .env terlebih dahulu.');
  process.exit(1);
}

const app = initializeApp(config as any);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Seeding Firestore...');

  // Subjects
  for (const s of SUBJECTS) {
    await setDoc(doc(db, 'subjects', s.id), s);
    console.log(`  ✓ subjects/${s.id}`);
  }

  // Materials
  for (const m of MATERIALS) {
    await setDoc(doc(db, 'materials', m.id), {
      ...m,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ materials/${m.id}`);
  }

  // Quizzes
  for (const q of QUIZZES) {
    await setDoc(doc(db, 'quizzes', q.id), q);
    console.log(`  ✓ quizzes/${q.id}`);
  }

  // Badges (master data — definisi badge-nya, bukan user-badge)
  for (const b of BADGES) {
    await setDoc(doc(db, 'badge_definitions', b.id), b);
    console.log(`  ✓ badge_definitions/${b.id}`);
  }

  console.log('✅ Selesai! Data awal sudah siap di Firestore.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err);
  process.exit(1);
});
