# 🎓 SekolahSeru — LMS Interaktif Kelas 6 SD

Platform pembelajaran daring interaktif untuk siswa SD Kelas 6, dibangun dengan **React + Tailwind CSS** dan backend **Firebase (Auth, Firestore, Storage)**. Mencakup Matematika, Bahasa Indonesia, dan IPAS dengan fitur kuis seru, badge, leaderboard, dan forum diskusi.

> **Status:** Siap pakai dalam mode demo (tanpa Firebase). Cukup aktifkan Firebase untuk produksi.

---

## ✨ Fitur Utama

### Untuk Siswa
- 🏠 **Dasbor** — ringkasan poin, badge, peringkat, dan aktivitas terakhir
- 📚 **Materi** berstruktur Bab → Topik → Subtopik dengan video YouTube & ringkasan
- 🎮 **Quiz Game** bertimer, dengan umpan balik instan, animasi poin, dan confetti di skor sempurna
- 🏆 **Gamifikasi** — poin otomatis, 8 badge (Langkah Pertama, Nilai Sempurna, Jagoan Matematika, dll)
- 💬 **Forum Diskusi** per mata pelajaran, lengkap dengan komentar
- 🥇 **Leaderboard** dengan podium top-3 dan ranking lengkap

### Untuk Guru
- 📊 **Dasbor Guru** — total materi, kuis, siswa aktif, dan rata-rata nilai
- ✏️ **Input Materi** dengan cascading select (mapel → bab → topik → subtopik) dan auto-embed YouTube
- 📝 **Buat Kuis** dinamis — jumlah soal fleksibel, 4 opsi per soal, tentukan jawaban benar
- 👀 **Pantau Progres** per siswa per mata pelajaran dengan progress bar dan badge yang diraih
- 🛡️ **Moderasi Forum** — tombol hapus post muncul khusus untuk guru

### Desain
- 🎨 **Kid-friendly palette** — oranye ceria, hijau rumput, ungu, krem hangat
- 🔤 **Typography** — Fredoka (display) + Nunito (body) + Baloo 2 — ramah anak dan mudah dibaca
- 📱 **Responsive** — mulus di desktop, tablet, dan mobile
- 🎬 **Animasi** — bounce-in, confetti, floating points, shine — tanpa berlebihan

---

## 🗂️ Struktur Folder

```
lms-kids/
├── client/                          # Frontend React + Vite
│   ├── index.html                   # Entry HTML (Google Fonts, SEO meta)
│   ├── public/favicon.svg           # Logo custom SVG
│   └── src/
│       ├── App.tsx                  # Router + shell (login gate)
│       ├── main.tsx                 # React root
│       ├── index.css                # Tailwind + design tokens + animasi
│       ├── components/
│       │   ├── Navbar.tsx           # Nav responsif + role-based links
│       │   ├── Confetti.tsx         # Animasi confetti skor sempurna
│       │   └── ui/                  # shadcn/ui components
│       ├── context/
│       │   └── AuthContext.tsx      # Provider auth (signIn / signUp / demo)
│       ├── services/
│       │   └── dataStore.ts         # Data layer unified (demo ↔ Firestore)
│       ├── lib/
│       │   ├── firebase.ts          # Init Firebase + flag DEMO_MODE
│       │   ├── mockData.ts          # Tipe & seed data dummy
│       │   └── queryClient.ts       # React Query client
│       └── pages/
│           ├── Login.tsx            # Login / Register / demo accounts
│           ├── StudentDashboard.tsx # Dasbor siswa
│           ├── SubjectsList.tsx     # Daftar mata pelajaran
│           ├── SubjectDetail.tsx    # Bab / topik / subtopik
│           ├── MaterialDetail.tsx   # Video + ringkasan + CTA kuis
│           ├── QuizGame.tsx         # Intro → Playing → Result
│           ├── Forum.tsx            # ForumPage + ForumPostPage
│           ├── Leaderboard.tsx      # Podium + ranking
│           ├── TeacherDashboard.tsx # Dasbor guru
│           ├── TeacherMaterials.tsx # Kelola materi
│           ├── TeacherQuizzes.tsx   # Kelola kuis
│           └── TeacherStudents.tsx  # Pantau progres siswa
├── server/                          # Express backend (opsional untuk SSR/API)
│   ├── index.ts                     # Express entry
│   ├── routes.ts                    # API routes (placeholder)
│   └── storage.ts                   # SQLite storage (tidak terpakai di demo)
├── shared/
│   └── schema.ts                    # Drizzle schema (tidak terpakai di demo)
├── scripts/
│   └── seed-firestore.ts            # Script seed Firestore (lihat di bawah)
├── package.json
├── tailwind.config.ts               # Config Tailwind + theme kustom
├── vite.config.ts
└── README.md
```

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js ≥ 18
- npm (atau pnpm / yarn)

### Install & Run

```bash
npm install
npm run dev
```

Buka <http://localhost:5000>. Aplikasi otomatis jalan di **Demo Mode** (tanpa Firebase). Klik tombol akun demo di halaman login untuk langsung masuk.

---

## 👤 Akun Demo (Demo Mode)

Klik kartu akun di halaman login — langsung masuk tanpa password.

| Peran | Nama            | Kelas | Poin |
| ----- | --------------- | ----- | ---- |
| Siswa | Aisyah Putri    | 6A    | 1240 |
| Siswa | Budi Santoso    | 6A    | 980  |
| Siswa | Citra Wijaya    | 6B    | 1560 |
| Siswa | Dito Pratama    | 6A    | 720  |
| Siswa | Eka Lestari     | 6B    | 1120 |
| Guru  | Bu Rina Hartati | —     | —    |

---

## 🔥 Mengaktifkan Firebase (Mode Produksi)

### 1. Buat Project Firebase

1. Buka <https://console.firebase.google.com>, **Add project**.
2. Aktifkan layanan:
   - **Authentication** → Sign-in method → Enable **Email/Password**.
   - **Firestore Database** → Create database (Production mode, pilih region terdekat, mis. `asia-southeast2`).
   - **Storage** → Get started (pakai default rules dulu).

### 2. Daftarkan Web App

Project settings → **General** → scroll ke **Your apps** → klik ikon web `</>` → daftarkan app → salin config.

### 3. Buat File `.env`

Buat `.env` di root project:

```dotenv
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Restart `npm run dev`. Aplikasi otomatis switch ke Firebase (tombol "Demo Mode" di navbar akan hilang).

### 4. Firestore Security Rules

Di Console → Firestore Database → Rules, tempel aturan berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }
    function isTeacher() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'guru';
    }
    function isSelf(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Semua user login bisa baca user lain (untuk leaderboard).
    // Hanya pemilik bisa ubah profilnya, guru bisa lihat semua.
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSelf(userId);
      allow update: if isSelf(userId) || isTeacher();
      allow delete: if isTeacher();
    }

    // Mata pelajaran: semua baca, hanya guru tulis.
    match /subjects/{doc} {
      allow read: if isSignedIn();
      allow write: if isTeacher();
    }

    // Materi & Kuis: baca untuk semua, tulis hanya guru.
    match /materials/{doc} {
      allow read: if isSignedIn();
      allow write: if isTeacher();
    }
    match /quizzes/{doc} {
      allow read: if isSignedIn();
      allow write: if isTeacher();
    }

    // Skor: siswa bisa buat skor sendiri, hanya bisa baca skornya atau guru baca semua.
    match /scores/{doc} {
      allow read: if isSignedIn() &&
        (resource.data.userId == request.auth.uid || isTeacher());
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isTeacher();
    }

    // Badges: baca untuk semua, tulis oleh siswa (auto-award) atau guru.
    match /badges/{doc} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isTeacher();
    }

    // Forum: semua baca, semua user login bisa post, hanya pemilik atau guru hapus.
    match /discussions/{doc} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.authorId == request.auth.uid;
      allow update: if isSignedIn() &&
        (resource.data.authorId == request.auth.uid || isTeacher());
      allow delete: if isSignedIn() &&
        (resource.data.authorId == request.auth.uid || isTeacher());

      match /comments/{commentId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn() && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if isSignedIn() &&
          (resource.data.authorId == request.auth.uid || isTeacher());
      }
    }
  }
}
```

### 5. Seed Data Awal ke Firestore

Jalankan script seed setelah Firebase terkonfigurasi (lihat `scripts/seed-firestore.ts`). Atau dari UI guru, input materi & kuis langsung via dasbor.

```bash
npx tsx scripts/seed-firestore.ts
```

---

## 🗃️ Skema Firestore

```
users/{userId}
  ├── email: string
  ├── name: string
  ├── role: 'siswa' | 'guru'
  ├── kelas?: string       # '6A', '6B'
  ├── avatar: string       # emoji
  ├── points: number
  └── badges: string[]     # array of badge IDs

subjects/{subjectId}
  ├── name: string
  ├── emoji: string
  ├── color: 'math' | 'bahasa' | 'ipas'
  └── description: string

materials/{materialId}
  ├── subjectId: string
  ├── chapter: string
  ├── topic: string
  ├── subtopic: string
  ├── title: string
  ├── description: string
  ├── videoUrl: string    # YouTube embed URL
  ├── summary: string
  └── createdAt: Timestamp

quizzes/{quizId}
  ├── subjectId: string
  ├── materialId: string
  ├── title: string
  ├── timeLimit: number   # detik per soal
  └── questions: [{
        id: string,
        question: string,
        options: string[],   # 4 pilihan
        correctAnswer: number, # 0-3
        explanation: string
      }]

scores/{scoreId}
  ├── userId: string
  ├── quizId: string
  ├── subjectId: string
  ├── score: number       # persentase
  ├── correct: number
  ├── total: number
  ├── points: number      # poin yang didapat
  └── completedAt: Timestamp

badges/{userBadgeId}
  ├── userId: string
  ├── badgeId: string
  └── earnedAt: Timestamp

discussions/{postId}
  ├── subjectId: string
  ├── authorId: string
  ├── authorName: string
  ├── authorAvatar: string
  ├── title: string
  ├── body: string
  ├── createdAt: Timestamp
  └── comments/{commentId}   # subcollection
        ├── authorId: string
        ├── authorName: string
        ├── authorAvatar: string
        ├── body: string
        └── createdAt: Timestamp
```

---

## 🧪 Contoh Query Firestore

```ts
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

// 1) Leaderboard — 10 siswa dengan poin tertinggi
const q = query(
  collection(db, 'users'),
  where('role', '==', 'siswa'),
  orderBy('points', 'desc'),
  limit(10),
);
const snap = await getDocs(q);
const leaderboard = snap.docs.map(d => ({ id: d.id, ...d.data() }));

// 2) Subscribe real-time — forum per mapel
const unsub = onSnapshot(
  query(
    collection(db, 'discussions'),
    where('subjectId', '==', 'matematika'),
    orderBy('createdAt', 'desc'),
  ),
  (snap) => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setPosts(posts);
  },
);
// unsub() saat unmount

// 3) Progres siswa per mapel
const scoresQ = query(
  collection(db, 'scores'),
  where('userId', '==', currentUserId),
  where('subjectId', '==', subjectId),
);
```

Semua query tersebut sudah diimplementasikan di `client/src/services/dataStore.ts` — cukup panggil `getLeaderboard()`, `subscribePosts(subjectId, cb)`, `getUserProgress(userId, subjectId)`.

---

## 🚢 Deployment

### Opsi A — Firebase Hosting (direkomendasikan)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # pilih public: dist/public, SPA: yes
npm run build
firebase deploy --only hosting
```

### Opsi B — Vercel

1. Push ke GitHub.
2. Import project di Vercel.
3. **Build command:** `npm run build`
4. **Output directory:** `dist/public`
5. Tambahkan semua `VITE_FIREBASE_*` di Environment Variables.

### Opsi C — Netlify

- **Build command:** `npm run build`
- **Publish directory:** `dist/public`
- Tambahkan env vars `VITE_FIREBASE_*`.

### Opsi D — Static Hosting Lainnya

Output `npm run build` di folder `dist/public/` adalah static HTML/JS/CSS — bisa diupload ke S3, Cloudflare Pages, GitHub Pages, dsb.

---

## 🔮 Ide Pengembangan Selanjutnya

- 🎥 **Live Quiz** — kuis real-time bergaya Kahoot (Firestore subscriptions + countdown server)
- 💬 **Chat Private Guru-Siswa** dengan notifikasi push (FCM)
- 📈 **Analytics Guru** — grafik tren nilai, heatmap waktu belajar, identifikasi siswa butuh bantuan
- 📱 **Mobile App** — bungkus dengan Capacitor / React Native
- 👨‍👩‍👧 **Dashboard Orang Tua** — pantau progres & badge anak, laporan mingguan via email
- 🌐 **Mode Offline** — PWA + IndexedDB cache agar bisa baca materi tanpa internet
- 🗣️ **Text-to-Speech** — bacakan soal untuk siswa yang masih belajar membaca
- 🧩 **Mini-game lain** — memory match, drag-and-drop, fill-in-the-blank
- 🏫 **Multi-kelas / Multi-sekolah** — isolasi data per sekolah dengan tenant ID
- 🎨 **Kustomisasi avatar** — unlock avatar baru sebagai reward poin
- 📚 **Library Materi Komunal** — marketplace materi/kuis antar guru
- 🧑‍🏫 **Raport Otomatis** — generate PDF raport per siswa dari data skor

---

## 💡 Tips

- **Debug Demo Mode:** Buka console browser — Anda akan melihat log `[Demo Mode]`. Data tersimpan di memori, hilang saat refresh.
- **Ganti seed data:** Edit `client/src/lib/mockData.ts`. Semua tipe & konten awal ada di sana.
- **Ganti palette warna:** Edit `client/src/index.css` — semua warna pakai variabel HSL (`--primary`, `--secondary`, dll).
- **Tambah badge baru:** Tambahkan entri di `mockData.ts` (`BADGES`), lalu cek di `QuizGame.tsx` `awardBadges()` untuk logic award otomatis.
- **YouTube embed:** Paste URL biasa (`https://youtube.com/watch?v=XXXX`) — akan otomatis dikonversi ke `embed/XXXX` di form materi.

---

## 📝 Lisensi

MIT — bebas digunakan & dimodifikasi untuk pendidikan.

Dibuat dengan ❤️ untuk mendukung pembelajaran siswa Indonesia.
