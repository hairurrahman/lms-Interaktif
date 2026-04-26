// Mock data for DEMO MODE — mirrors the Firestore schema so you can see
// every feature working without a real Firebase project.

export type Role = 'siswa' | 'guru';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  kelas?: string;
  points: number;
  badges: string[];
  streakDays: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string; // tailwind gradient class
  description: string;
}

export interface Subtopic {
  id: string;
  title: string;
}

export interface Topic {
  id: string;
  title: string;
  subtopics: Subtopic[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  topics: Topic[];
}

export interface Material {
  id: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  title: string;
  description: string;
  videoUrl: string; // Auto-converted to embed URL. Supports YouTube, Google Drive, Vimeo, direct MP4.
  summary: string; // Can contain HTML, markdown-style images, PDF links, etc.
  summaryFormat: 'text' | 'html'; // Rendering mode
  pdfUrl?: string; // Optional PDF attachment link
  createdAt: number;
  createdBy: string;
}

// ---- 4 QUESTION TYPES ----

export type QuestionType = 'mcq' | 'mcq-multi' | 'true-false' | 'essay';

export interface QuizOption {
  id: string;
  text: string;
}

export interface TrueFalseStatement {
  id: string;
  text: string;
  isTrue: boolean; // correct answer
}

// Base question fields shared by all types
interface QuestionBase {
  id: string;
  type: QuestionType;
  question: string;
  explanation?: string;
  points: number;
}

export interface MCQQuestion extends QuestionBase {
  type: 'mcq';
  options: QuizOption[];
  correctOptionId: string;
}

export interface MCQMultiQuestion extends QuestionBase {
  type: 'mcq-multi';
  options: QuizOption[];
  correctOptionIds: string[]; // multiple correct
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'true-false';
  statements: TrueFalseStatement[]; // multiple statements, mark each true/false
}

export interface EssayQuestion extends QuestionBase {
  type: 'essay';
  maxWords?: number;
  sampleAnswer?: string; // for teacher reference
}

export type QuizQuestion = MCQQuestion | MCQMultiQuestion | TrueFalseQuestion | EssayQuestion;

export interface Quiz {
  id: string;
  materialId: string;
  subjectId: string;
  title: string;
  timeLimitSec: number; // 0 = no limit
  questions: QuizQuestion[];
}

// ---- STUDENT ANSWERS (for essay grading) ----

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  // MCQ: selected optionId. MCQ-multi: array. True-false: Record<statementId, boolean>. Essay: text.
  response: string | string[] | Record<string, boolean>;
  autoScore?: number; // auto-calculated for non-essay
  manualScore?: number | null; // set by teacher for essay (null = not yet graded)
  teacherFeedback?: string;
  gradedAt?: number;
  gradedBy?: string;
}

export interface Score {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  quizId: string;
  quizTitle?: string;
  subjectId: string;
  correct: number;
  total: number;
  points: number;
  autoPoints: number; // points from auto-graded questions
  manualPoints: number; // points from essay after grading
  hasPendingGrading: boolean; // true if any essay not yet graded
  answers: StudentAnswer[];
  completedAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: string;
}

export interface Post {
  id: string;
  subjectId: string;
  userId: string;
  userName: string;
  userRole: Role;
  userAvatar: string;
  title: string;
  body: string;
  createdAt: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userRole: Role;
  userAvatar: string;
  body: string;
  createdAt: number;
}

// ================ SEED DATA ================

export const MOCK_USERS: AppUser[] = [
  { id: 'siswa-1', name: 'Aisyah Putri', email: 'aisyah@siswa.id', role: 'siswa', avatar: '👧', kelas: '6A', points: 1240, badges: ['first-quiz', 'math-master', 'streak-3'], streakDays: 5 },
  { id: 'siswa-2', name: 'Budi Santoso', email: 'budi@siswa.id', role: 'siswa', avatar: '👦', kelas: '6A', points: 980, badges: ['first-quiz', 'reader'], streakDays: 3 },
  { id: 'siswa-3', name: 'Citra Wijaya', email: 'citra@siswa.id', role: 'siswa', avatar: '🧒', kelas: '6B', points: 1560, badges: ['first-quiz', 'math-master', 'reader', 'streak-3', 'scientist'], streakDays: 7 },
  { id: 'siswa-4', name: 'Dito Pratama', email: 'dito@siswa.id', role: 'siswa', avatar: '👦', kelas: '6A', points: 720, badges: ['first-quiz'], streakDays: 1 },
  { id: 'siswa-5', name: 'Eka Lestari', email: 'eka@siswa.id', role: 'siswa', avatar: '👧', kelas: '6B', points: 1120, badges: ['first-quiz', 'reader', 'scientist'], streakDays: 4 },
  { id: 'guru-1', name: 'Bu Rina Hartati', email: 'rina@guru.id', role: 'guru', avatar: '👩‍🏫', points: 0, badges: [], streakDays: 0 },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: 'ppkn',       name: 'Pendidikan Pancasila',  slug: 'pendidikan-pancasila',  emoji: '🇮🇩', color: 'bg-gradient-ocean',   description: 'Nilai-nilai Pancasila, kebhinekaan, dan cinta tanah air.' },
  { id: 'bindo',      name: 'Bahasa Indonesia',      slug: 'bahasa-indonesia',      emoji: '📚', color: 'bg-gradient-candy',   description: 'Membaca, menulis, menyimak, dan berbicara dengan menyenangkan.' },
  { id: 'mtk',        name: 'Matematika',            slug: 'matematika',            emoji: '🔢', color: 'bg-gradient-sunrise', description: 'Bilangan, operasi, pecahan, geometri, dan pengukuran.' },
  { id: 'ipas',       name: 'IPAS',                  slug: 'ipas',                  emoji: '🔬', color: 'bg-gradient-forest',  description: 'Ilmu Pengetahuan Alam & Sosial — sains, bumi, dan masyarakat.' },
  { id: 'senibudaya', name: 'Seni Budaya (Seni Rupa)', slug: 'seni-budaya',         emoji: '🎨', color: 'bg-gradient-candy',   description: 'Ekspresi seni rupa, menggambar, melukis, dan berkarya.' },
  { id: 'bmadura',    name: 'Bahasa Madura',         slug: 'bahasa-madura',         emoji: '🏝️', color: 'bg-gradient-sunrise', description: 'Pelestarian bahasa dan budaya Madura.' },
];

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'mtk-ch1', subjectId: 'mtk', order: 1, title: 'Bab 1 — Bilangan Bulat & Operasinya',
    topics: [
      { id: 'mtk-ch1-t1', title: 'Bilangan Bulat Positif dan Negatif', subtopics: [
        { id: 'mtk-ch1-t1-s1', title: 'Mengenal Bilangan Bulat' },
        { id: 'mtk-ch1-t1-s2', title: 'Garis Bilangan' },
      ]},
      { id: 'mtk-ch1-t2', title: 'Operasi Hitung Bilangan Bulat', subtopics: [
        { id: 'mtk-ch1-t2-s1', title: 'Penjumlahan dan Pengurangan' },
        { id: 'mtk-ch1-t2-s2', title: 'Perkalian dan Pembagian' },
      ]},
    ],
  },
  {
    id: 'mtk-ch2', subjectId: 'mtk', order: 2, title: 'Bab 2 — Pecahan & Desimal',
    topics: [
      { id: 'mtk-ch2-t1', title: 'Konsep Pecahan', subtopics: [
        { id: 'mtk-ch2-t1-s1', title: 'Pecahan Biasa dan Campuran' },
        { id: 'mtk-ch2-t1-s2', title: 'Pecahan Senilai' },
      ]},
    ],
  },
  {
    id: 'bindo-ch1', subjectId: 'bindo', order: 1, title: 'Bab 1 — Teks Cerita & Dongeng',
    topics: [
      { id: 'bindo-ch1-t1', title: 'Unsur Intrinsik Cerita', subtopics: [
        { id: 'bindo-ch1-t1-s1', title: 'Tokoh dan Penokohan' },
        { id: 'bindo-ch1-t1-s2', title: 'Latar dan Alur' },
      ]},
    ],
  },
  {
    id: 'bindo-ch2', subjectId: 'bindo', order: 2, title: 'Bab 2 — Menulis Paragraf',
    topics: [
      { id: 'bindo-ch2-t1', title: 'Kalimat Utama & Penjelas', subtopics: [{ id: 'bindo-ch2-t1-s1', title: 'Jenis-jenis Paragraf' }] },
    ],
  },
  {
    id: 'ipas-ch1', subjectId: 'ipas', order: 1, title: 'Bab 1 — Tubuh Manusia & Kesehatan',
    topics: [
      { id: 'ipas-ch1-t1', title: 'Sistem Peredaran Darah', subtopics: [
        { id: 'ipas-ch1-t1-s1', title: 'Jantung dan Pembuluh Darah' },
        { id: 'ipas-ch1-t1-s2', title: 'Menjaga Kesehatan Jantung' },
      ]},
    ],
  },
  {
    id: 'ppkn-ch1', subjectId: 'ppkn', order: 1, title: 'Bab 1 — Nilai Pancasila dalam Kehidupan',
    topics: [
      { id: 'ppkn-ch1-t1', title: 'Sila-sila Pancasila', subtopics: [
        { id: 'ppkn-ch1-t1-s1', title: 'Arti dan Makna Pancasila' },
      ]},
    ],
  },
  {
    id: 'senibudaya-ch1', subjectId: 'senibudaya', order: 1, title: 'Bab 1 — Menggambar Ekspresi',
    topics: [
      { id: 'senibudaya-ch1-t1', title: 'Teknik Menggambar', subtopics: [
        { id: 'senibudaya-ch1-t1-s1', title: 'Garis, Bentuk, dan Warna' },
      ]},
    ],
  },
  {
    id: 'bmadura-ch1', subjectId: 'bmadura', order: 1, title: 'Bab 1 — Oca\' Sopan e Bhasa Madhura',
    topics: [
      { id: 'bmadura-ch1-t1', title: 'Ondhagghah Bhasa', subtopics: [
        { id: 'bmadura-ch1-t1-s1', title: 'Enggi Bunten dan Enggi Enten' },
      ]},
    ],
  },
];

export const MOCK_MATERIALS: Material[] = [
  {
    id: 'mat-1', subjectId: 'mtk', chapterId: 'mtk-ch1', topicId: 'mtk-ch1-t1', subtopicId: 'mtk-ch1-t1-s1',
    title: 'Mengenal Bilangan Bulat',
    description: 'Yuk kenalan sama bilangan bulat! Kita pelajari positif, negatif, dan nol.',
    videoUrl: 'https://www.youtube.com/embed/ZzZu8NQKGkI',
    summary: 'Bilangan bulat terdiri dari bilangan bulat positif (1, 2, 3, ...), nol (0), dan bilangan bulat negatif (-1, -2, -3, ...). Bilangan bulat dapat digambarkan pada garis bilangan, di mana bilangan positif berada di sebelah kanan nol dan bilangan negatif di sebelah kiri nol.',
    summaryFormat: 'text',
    createdAt: Date.now() - 86400000 * 5, createdBy: 'guru-1',
  },
  {
    id: 'mat-2', subjectId: 'mtk', chapterId: 'mtk-ch1', topicId: 'mtk-ch1-t2', subtopicId: 'mtk-ch1-t2-s1',
    title: 'Penjumlahan dan Pengurangan Bilangan Bulat',
    description: 'Trik seru menjumlah & mengurangi bilangan bulat dengan mudah.',
    videoUrl: 'https://www.youtube.com/embed/C38B33ZywWs',
    summary: '<h3>Aturan Tanda 🎯</h3><ul><li><strong>(+) + (+) = (+)</strong></li><li><strong>(-) + (-) = (-)</strong></li><li><strong>(+) + (-)</strong> = ikuti tanda yang lebih besar</li></ul><p>Contoh: <code>5 + (-3) = 2</code>, karena 5 lebih besar dari 3, hasilnya positif.</p>',
    summaryFormat: 'html',
    createdAt: Date.now() - 86400000 * 3, createdBy: 'guru-1',
  },
  {
    id: 'mat-4', subjectId: 'bindo', chapterId: 'bindo-ch1', topicId: 'bindo-ch1-t1', subtopicId: 'bindo-ch1-t1-s1',
    title: 'Tokoh dan Penokohan dalam Cerita',
    description: 'Kenali siapa saja tokoh dalam cerita dan bagaimana sifat mereka!',
    videoUrl: 'https://www.youtube.com/embed/8Tbq3-PVp8w',
    summary: 'Tokoh adalah pelaku dalam cerita. Penokohan adalah cara pengarang menggambarkan watak tokoh. Tokoh dibagi menjadi protagonis (baik), antagonis (melawan), dan tritagonis (pendukung).',
    summaryFormat: 'text',
    createdAt: Date.now() - 86400000 * 4, createdBy: 'guru-1',
  },
  {
    id: 'mat-5', subjectId: 'ipas', chapterId: 'ipas-ch1', topicId: 'ipas-ch1-t1', subtopicId: 'ipas-ch1-t1-s1',
    title: 'Jantung dan Pembuluh Darah',
    description: 'Bagaimana cara jantung kita memompa darah? Temukan jawabannya!',
    videoUrl: 'https://www.youtube.com/embed/UaYB_ksdWqQ',
    summary: 'Jantung memiliki empat ruang: serambi kanan, serambi kiri, bilik kanan, dan bilik kiri. Darah mengalir melalui arteri, vena, dan kapiler.',
    summaryFormat: 'text',
    createdAt: Date.now() - 86400000 * 1, createdBy: 'guru-1',
  },
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1', materialId: 'mat-1', subjectId: 'mtk',
    title: 'Kuis: Mengenal Bilangan Bulat', timeLimitSec: 180,
    questions: [
      {
        id: 'q1', type: 'mcq',
        question: 'Manakah yang termasuk bilangan bulat negatif?',
        options: [{ id: 'a', text: '5' }, { id: 'b', text: '0' }, { id: 'c', text: '-3' }, { id: 'd', text: '½' }],
        correctOptionId: 'c',
        explanation: 'Bilangan bulat negatif adalah bilangan bulat yang lebih kecil dari 0.',
        points: 10,
      },
      {
        id: 'q2', type: 'mcq-multi',
        question: 'Pilih SEMUA bilangan yang termasuk bilangan bulat!',
        options: [{ id: 'a', text: '-5' }, { id: 'b', text: '2.5' }, { id: 'c', text: '0' }, { id: 'd', text: '7' }, { id: 'e', text: '¾' }],
        correctOptionIds: ['a', 'c', 'd'],
        explanation: 'Bilangan bulat adalah ..., -2, -1, 0, 1, 2, ... — tidak termasuk pecahan/desimal.',
        points: 15,
      },
      {
        id: 'q3', type: 'true-false',
        question: 'Tentukan BENAR atau SALAH pada pernyataan berikut!',
        statements: [
          { id: 's1', text: 'Bilangan -7 lebih kecil dari -2', isTrue: true },
          { id: 's2', text: 'Nol adalah bilangan bulat positif', isTrue: false },
          { id: 's3', text: 'Lawan dari 8 adalah -8', isTrue: true },
          { id: 's4', text: 'Pada garis bilangan, -5 berada di sebelah kanan 0', isTrue: false },
        ],
        points: 20,
      },
      {
        id: 'q4', type: 'essay',
        question: 'Jelaskan dengan kata-katamu sendiri, kenapa -10 lebih kecil dari -3? Berikan satu contoh dari kehidupan sehari-hari!',
        maxWords: 100,
        sampleAnswer: 'Pada garis bilangan, -10 lebih ke kiri daripada -3. Contohnya suhu: -10°C lebih dingin daripada -3°C.',
        points: 25,
      },
    ],
  },
  {
    id: 'quiz-2', materialId: 'mat-4', subjectId: 'bindo',
    title: 'Kuis: Tokoh dan Penokohan', timeLimitSec: 150,
    questions: [
      {
        id: 'q1', type: 'mcq',
        question: 'Tokoh utama yang baik dalam cerita disebut...',
        options: [{ id: 'a', text: 'Antagonis' }, { id: 'b', text: 'Protagonis' }, { id: 'c', text: 'Figuran' }, { id: 'd', text: 'Narator' }],
        correctOptionId: 'b', points: 10,
      },
      {
        id: 'q2', type: 'true-false',
        question: 'Tentukan BENAR atau SALAH!',
        statements: [
          { id: 's1', text: 'Protagonis adalah tokoh yang melawan tokoh utama', isTrue: false },
          { id: 's2', text: 'Watak tokoh bisa digambarkan melalui dialognya', isTrue: true },
          { id: 's3', text: 'Tritagonis adalah tokoh pendukung', isTrue: true },
        ],
        points: 15,
      },
      {
        id: 'q3', type: 'essay',
        question: 'Sebutkan satu karakter dari cerita/film favoritmu, lalu jelaskan wataknya dan bukti dari tindakannya!',
        maxWords: 120,
        points: 25,
      },
    ],
  },
];

export const MOCK_BADGES: Badge[] = [
  { id: 'first-quiz', name: 'Langkah Pertama', emoji: '🎯', description: 'Menyelesaikan kuis pertamamu', condition: 'Selesaikan 1 kuis' },
  { id: 'math-master', name: 'Jagoan Matematika', emoji: '🧮', description: 'Nilai tinggi di kuis matematika', condition: 'Skor ≥ 80 di Matematika' },
  { id: 'reader', name: 'Kutu Buku', emoji: '📖', description: 'Rajin belajar Bahasa Indonesia', condition: 'Selesaikan 2 materi Bindo' },
  { id: 'scientist', name: 'Ilmuwan Cilik', emoji: '🔬', description: 'Penasaran tentang sains', condition: 'Selesaikan materi IPAS' },
  { id: 'streak-3', name: 'Konsisten 3 Hari', emoji: '🔥', description: 'Belajar 3 hari berturut-turut', condition: 'Login 3 hari berturut-turut' },
  { id: 'streak-7', name: 'Super Rajin', emoji: '⚡', description: 'Belajar 1 minggu penuh', condition: 'Login 7 hari berturut-turut' },
  { id: 'perfect', name: 'Nilai Sempurna', emoji: '🏆', description: 'Menjawab semua soal dengan benar', condition: 'Skor 100% di kuis apapun' },
  { id: 'explorer', name: 'Penjelajah', emoji: '🗺️', description: 'Mencoba berbagai mapel', condition: 'Kerjakan kuis di 3 mapel berbeda' },
];

export const MOCK_SCORES: Score[] = [
  { id: 's1', userId: 'siswa-1', userName: 'Aisyah Putri', userAvatar: '👧', quizId: 'quiz-1', quizTitle: 'Kuis: Mengenal Bilangan Bulat', subjectId: 'mtk', correct: 3, total: 4, points: 50, autoPoints: 50, manualPoints: 0, hasPendingGrading: false, answers: [], completedAt: Date.now() - 86400000 * 2 },
  { id: 's2', userId: 'siswa-1', userName: 'Aisyah Putri', userAvatar: '👧', quizId: 'quiz-2', quizTitle: 'Kuis: Tokoh dan Penokohan', subjectId: 'bindo', correct: 2, total: 3, points: 30, autoPoints: 30, manualPoints: 0, hasPendingGrading: false, answers: [], completedAt: Date.now() - 86400000 },
  { id: 's3', userId: 'siswa-3', userName: 'Citra Wijaya', userAvatar: '🧒', quizId: 'quiz-1', quizTitle: 'Kuis: Mengenal Bilangan Bulat', subjectId: 'mtk', correct: 4, total: 4, points: 70, autoPoints: 70, manualPoints: 0, hasPendingGrading: false, answers: [], completedAt: Date.now() - 86400000 * 3 },
];

export const MOCK_POSTS: Post[] = [
  { id: 'post-1', subjectId: 'mtk', userId: 'siswa-1', userName: 'Aisyah Putri', userRole: 'siswa', userAvatar: '👧', title: 'Bingung cara membaca garis bilangan negatif', body: 'Teman-teman, aku masih bingung kenapa -7 lebih kecil dari -2 padahal angkanya lebih besar? Tolong bantu jelaskan dong.', createdAt: Date.now() - 86400000 * 2, commentCount: 2 },
  { id: 'post-2', subjectId: 'ipas', userId: 'siswa-2', userName: 'Budi Santoso', userRole: 'siswa', userAvatar: '👦', title: 'Planet mana yang paling dekat dengan Matahari?', body: 'Apakah Venus atau Merkurius? Aku agak lupa nih.', createdAt: Date.now() - 86400000, commentCount: 1 },
  { id: 'post-3', subjectId: 'bindo', userId: 'siswa-3', userName: 'Citra Wijaya', userRole: 'siswa', userAvatar: '🧒', title: 'Bedanya protagonis dan tritagonis?', body: 'Aku sudah paham antagonis, tapi bingung dengan tritagonis. Siapa yang bisa bantu?', createdAt: Date.now() - 3600000 * 6, commentCount: 0 },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', postId: 'post-1', userId: 'guru-1', userName: 'Bu Rina Hartati', userRole: 'guru', userAvatar: '👩‍🏫', body: 'Pertanyaan bagus, Aisyah! Bayangkan garis bilangan seperti tangga ke bawah. Semakin ke bawah (kiri), semakin kecil angkanya. Jadi -7 lebih "dalam" daripada -2.', createdAt: Date.now() - 86400000 * 2 + 3600000 },
  { id: 'c2', postId: 'post-1', userId: 'siswa-3', userName: 'Citra Wijaya', userRole: 'siswa', userAvatar: '🧒', body: 'Aku juga pakai analogi suhu. -7°C lebih dingin daripada -2°C, berarti lebih kecil!', createdAt: Date.now() - 86400000 * 2 + 7200000 },
  { id: 'c3', postId: 'post-2', userId: 'guru-1', userName: 'Bu Rina Hartati', userRole: 'guru', userAvatar: '👩‍🏫', body: 'Merkurius ya, Budi! Dia planet terdekat dengan Matahari, kemudian baru Venus.', createdAt: Date.now() - 86400000 + 1800000 },
];
