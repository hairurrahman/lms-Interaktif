// Unified data layer. In production, calls go to Firestore.
// In DEMO_MODE, they hit in-memory mock data so the UI works offline.
//
// Replace the demo branches with production-ready Firestore calls as shown
// in the comments. Example signatures match `firebase/firestore` v10.

import { DEMO_MODE, db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  MOCK_BADGES,
  MOCK_CHAPTERS,
  MOCK_COMMENTS,
  MOCK_MATERIALS,
  MOCK_POSTS,
  MOCK_QUIZZES,
  MOCK_SCORES,
  MOCK_SUBJECTS,
  MOCK_USERS,
  type AppUser,
  type Badge,
  type Chapter,
  type Comment,
  type Material,
  type Post,
  type Quiz,
  type Score,
  type StudentAnswer,
  type Subject,
  type Subtopic,
  type Topic,
} from '@/lib/mockData';

// ---------- Mutable in-memory store (DEMO MODE) ----------
const store = {
  users: [...MOCK_USERS],
  subjects: [...MOCK_SUBJECTS],
  chapters: [...MOCK_CHAPTERS],
  materials: [...MOCK_MATERIALS],
  quizzes: [...MOCK_QUIZZES],
  scores: [...MOCK_SCORES],
  badges: [...MOCK_BADGES],
  posts: [...MOCK_POSTS],
  comments: [...MOCK_COMMENTS],
};

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((fn) => fn());
}
export function subscribe(fn: Listener): Unsubscribe {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Subjects ----------
export async function getSubjects(): Promise<Subject[]> {
  if (DEMO_MODE || !db) return [...store.subjects];
  const snap = await getDocs(collection(db, 'subjects'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Subject, 'id'>), id: d.id }));
}

export async function createSubject(data: Omit<Subject, 'id'>): Promise<Subject> {
  if (DEMO_MODE || !db) {
    const s: Subject = { ...data, id: uid() };
    store.subjects.push(s);
    notify();
    return s;
  }
  const ref = await addDoc(collection(db, 'subjects'), data);
  return { ...data, id: ref.id };
}

export async function updateSubject(id: string, data: Partial<Omit<Subject, 'id'>>): Promise<void> {
  if (DEMO_MODE || !db) {
    const idx = store.subjects.findIndex((s) => s.id === id);
    if (idx >= 0) store.subjects[idx] = { ...store.subjects[idx], ...data };
    notify();
    return;
  }
  await updateDoc(doc(db, 'subjects', id), data);
}

export async function deleteSubject(id: string): Promise<void> {
  if (DEMO_MODE || !db) {
    store.subjects = store.subjects.filter((s) => s.id !== id);
    store.chapters = store.chapters.filter((c) => c.subjectId !== id);
    store.materials = store.materials.filter((m) => m.subjectId !== id);
    notify();
    return;
  }
  await deleteDoc(doc(db, 'subjects', id));
}

// ---------- Chapters (nested) ----------
export async function getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
  if (DEMO_MODE || !db) {
    return store.chapters.filter((c) => c.subjectId === subjectId).sort((a, b) => a.order - b.order);
  }
  const q = query(collection(db, 'chapters'), where('subjectId', '==', subjectId));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ ...(d.data() as Omit<Chapter, 'id'>), id: d.id }));
  return data.sort((a, b) => a.order - b.order);
}

export async function getAllChapters(): Promise<Chapter[]> {
  if (DEMO_MODE || !db) return [...store.chapters];
  const snap = await getDocs(collection(db, 'chapters'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Chapter, 'id'>), id: d.id }));
}

export async function createChapter(data: Omit<Chapter, 'id' | 'topics'> & { topics?: Topic[] }): Promise<Chapter> {
  const chapter: Chapter = { ...data, id: uid(), topics: data.topics ?? [] };
  if (DEMO_MODE || !db) {
    store.chapters.push(chapter);
    notify();
    return chapter;
  }
  const ref = await addDoc(collection(db, 'chapters'), chapter);
  return { ...chapter, id: ref.id };
}

export async function updateChapter(id: string, data: Partial<Chapter>): Promise<void> {
  if (DEMO_MODE || !db) {
    const idx = store.chapters.findIndex((c) => c.id === id);
    if (idx >= 0) store.chapters[idx] = { ...store.chapters[idx], ...data };
    notify();
    return;
  }
  await updateDoc(doc(db, 'chapters', id), data);
}

export async function deleteChapter(id: string): Promise<void> {
  if (DEMO_MODE || !db) {
    store.chapters = store.chapters.filter((c) => c.id !== id);
    notify();
    return;
  }
  await deleteDoc(doc(db, 'chapters', id));
}

// ---------- Topics & Subtopics (nested inside chapters) ----------
export async function addTopic(chapterId: string, title: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (ch) ch.topics.push({ id: uid(), title, subtopics: [] });
    notify();
    return;
  }
  // Firestore: ambil, push, update
  const ref = doc(db, 'chapters', chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const chapter = snap.data() as Chapter;
  chapter.topics = [...(chapter.topics || []), { id: uid(), title, subtopics: [] }];
  await updateDoc(ref, { topics: chapter.topics });
}

export async function updateTopic(chapterId: string, topicId: string, title: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (ch) {
      const t = ch.topics.find((x) => x.id === topicId);
      if (t) t.title = title;
    }
    notify();
    return;
  }
  const ref = doc(db, 'chapters', chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const chapter = snap.data() as Chapter;
  chapter.topics = chapter.topics.map((t) => (t.id === topicId ? { ...t, title } : t));
  await updateDoc(ref, { topics: chapter.topics });
}

export async function deleteTopic(chapterId: string, topicId: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (ch) ch.topics = ch.topics.filter((t) => t.id !== topicId);
    notify();
    return;
  }
  const ref = doc(db, 'chapters', chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const chapter = snap.data() as Chapter;
  chapter.topics = chapter.topics.filter((t) => t.id !== topicId);
  await updateDoc(ref, { topics: chapter.topics });
}

export async function addSubtopic(chapterId: string, topicId: string, title: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (ch) {
      const t = ch.topics.find((x) => x.id === topicId);
      if (t) t.subtopics.push({ id: uid(), title });
    }
    notify();
    return;
  }
  const ref = doc(db, 'chapters', chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const chapter = snap.data() as Chapter;
  chapter.topics = chapter.topics.map((t) =>
    t.id === topicId ? { ...t, subtopics: [...t.subtopics, { id: uid(), title }] } : t,
  );
  await updateDoc(ref, { topics: chapter.topics });
}

export async function updateSubtopic(chapterId: string, topicId: string, subtopicId: string, title: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (ch) {
      const t = ch.topics.find((x) => x.id === topicId);
      if (t) {
        const s = t.subtopics.find((x) => x.id === subtopicId);
        if (s) s.title = title;
      }
    }
    notify();
    return;
  }
  const ref = doc(db, 'chapters', chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const chapter = snap.data() as Chapter;
  chapter.topics = chapter.topics.map((t) =>
    t.id === topicId
      ? { ...t, subtopics: t.subtopics.map((s) => (s.id === subtopicId ? { ...s, title } : s)) }
      : t,
  );
  await updateDoc(ref, { topics: chapter.topics });
}

export async function deleteSubtopic(chapterId: string, topicId: string, subtopicId: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (ch) {
      const t = ch.topics.find((x) => x.id === topicId);
      if (t) t.subtopics = t.subtopics.filter((s) => s.id !== subtopicId);
    }
    notify();
    return;
  }
  const ref = doc(db, 'chapters', chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const chapter = snap.data() as Chapter;
  chapter.topics = chapter.topics.map((t) =>
    t.id === topicId ? { ...t, subtopics: t.subtopics.filter((s) => s.id !== subtopicId) } : t,
  );
  await updateDoc(ref, { topics: chapter.topics });
}

// ---------- Materials ----------
export async function getMaterialsBySubject(subjectId: string): Promise<Material[]> {
  if (DEMO_MODE || !db) return store.materials.filter((m) => m.subjectId === subjectId);
  const q = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ ...(d.data() as Omit<Material, 'id'>), id: d.id }));
  return data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getMaterial(id: string): Promise<Material | null> {
  if (DEMO_MODE || !db) return store.materials.find((m) => m.id === id) ?? null;
  const snap = await getDoc(doc(db, 'materials', id));
  return snap.exists() ? ({ ...(snap.data() as Omit<Material, 'id'>), id: snap.id }) : null;
}

export async function getAllMaterials(): Promise<Material[]> {
  if (DEMO_MODE || !db) return [...store.materials];
  const snap = await getDocs(collection(db, 'materials'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Material, 'id'>), id: d.id }));
}

export async function createMaterial(data: Omit<Material, 'id' | 'createdAt'>): Promise<Material> {
  if (DEMO_MODE || !db) {
    const m: Material = { ...data, id: uid(), createdAt: Date.now() };
    store.materials.unshift(m);
    notify();
    return m;
  }
  const ref = await addDoc(collection(db, 'materials'), { ...data, createdAt: serverTimestamp() });
  return { ...data, id: ref.id, createdAt: Date.now() };
}

export async function updateMaterial(id: string, data: Partial<Omit<Material, 'id' | 'createdAt'>>): Promise<void> {
  if (DEMO_MODE || !db) {
    const idx = store.materials.findIndex((m) => m.id === id);
    if (idx >= 0) store.materials[idx] = { ...store.materials[idx], ...data };
    notify();
    return;
  }
  await updateDoc(doc(db, 'materials', id), data);
}

export async function deleteMaterial(id: string): Promise<void> {
  if (DEMO_MODE || !db) {
    store.materials = store.materials.filter((m) => m.id !== id);
    store.quizzes = store.quizzes.filter((q) => q.materialId !== id);
    notify();
    return;
  }
  await deleteDoc(doc(db, 'materials', id));
}

// ---------- Quizzes ----------
export async function getQuizzesByMaterial(materialId: string): Promise<Quiz[]> {
  if (DEMO_MODE || !db) return store.quizzes.filter((q) => q.materialId === materialId);
  const q = query(collection(db, 'quizzes'), where('materialId', '==', materialId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Quiz, 'id'>), id: d.id }));
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  if (DEMO_MODE || !db) return store.quizzes.find((q) => q.id === id) ?? null;
  const snap = await getDoc(doc(db, 'quizzes', id));
  return snap.exists() ? ({ ...(snap.data() as Omit<Quiz, 'id'>), id: snap.id }) : null;
}

export async function createQuiz(data: Omit<Quiz, 'id'>): Promise<Quiz> {
  if (DEMO_MODE || !db) {
    const q: Quiz = { ...data, id: uid() };
    store.quizzes.push(q);
    notify();
    return q;
  }
  const ref = await addDoc(collection(db, 'quizzes'), data);
  return { ...data, id: ref.id };
}

export async function updateQuiz(id: string, data: Partial<Omit<Quiz, 'id'>>): Promise<void> {
  if (DEMO_MODE || !db) {
    const idx = store.quizzes.findIndex((q) => q.id === id);
    if (idx >= 0) store.quizzes[idx] = { ...store.quizzes[idx], ...data } as Quiz;
    notify();
    return;
  }
  await updateDoc(doc(db, 'quizzes', id), data);
}

export async function deleteQuiz(id: string): Promise<void> {
  if (DEMO_MODE || !db) {
    store.quizzes = store.quizzes.filter((q) => q.id !== id);
    notify();
    return;
  }
  await deleteDoc(doc(db, 'quizzes', id));
}

// ---------- Scores ----------
export async function submitScore(data: Omit<Score, 'id' | 'completedAt'>): Promise<Score> {
  const score: Score = { ...data, id: uid(), completedAt: Date.now() };
  if (DEMO_MODE || !db) {
    store.scores.unshift(score);
    // Add points to the user
    const user = store.users.find((u) => u.id === data.userId);
    if (user) user.points += data.points;
    notify();
    return score;
  }
  const ref = await addDoc(collection(db, 'scores'), { ...data, completedAt: serverTimestamp() });
  await updateDoc(doc(db, 'users', data.userId), { points: increment(data.points) });
  return { ...score, id: ref.id };
}

export async function getScoresByUser(userId: string): Promise<Score[]> {
  if (DEMO_MODE || !db) return store.scores.filter((s) => s.userId === userId);
  const q = query(collection(db, 'scores'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ ...(d.data() as Omit<Score, 'id'>), id: d.id }));
  return data.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
}

export async function getAllScores(): Promise<Score[]> {
  if (DEMO_MODE || !db) return [...store.scores];
  const snap = await getDocs(collection(db, 'scores'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Score, 'id'>), id: d.id }));
}

// ---------- Essay grading ----------
export async function getPendingEssayScores(): Promise<Score[]> {
  if (DEMO_MODE || !db) {
    return store.scores.filter((s) => s.hasPendingGrading);
  }
  const q = query(collection(db, 'scores'), where('hasPendingGrading', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Score, 'id'>), id: d.id }));
}

export async function gradeEssayAnswers(
  scoreId: string,
  grades: { questionId: string; manualScore: number; teacherFeedback?: string }[],
  teacherId: string,
): Promise<void> {
  if (DEMO_MODE || !db) {
    const sc = store.scores.find((s) => s.id === scoreId);
    if (!sc) return;
    let totalManual = 0;
    sc.answers = sc.answers.map((a) => {
      const g = grades.find((x) => x.questionId === a.questionId);
      if (g) {
        totalManual += g.manualScore;
        return {
          ...a,
          manualScore: g.manualScore,
          teacherFeedback: g.teacherFeedback,
          gradedAt: Date.now(),
          gradedBy: teacherId,
        };
      }
      return a;
    });
    sc.manualPoints = totalManual;
    sc.points = sc.autoPoints + totalManual;
    // masih ada essay yang belum dinilai?
    sc.hasPendingGrading = sc.answers.some((a) => a.type === 'essay' && (a.manualScore === null || a.manualScore === undefined));
    // Tambah selisih points ke user
    const user = store.users.find((u) => u.id === sc.userId);
    if (user) {
      user.points += totalManual;
    }
    notify();
    return;
  }
  // Firestore path
  const ref = doc(db, 'scores', scoreId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const sc = snap.data() as Score;
  let totalManual = 0;
  const newAnswers: StudentAnswer[] = sc.answers.map((a) => {
    const g = grades.find((x) => x.questionId === a.questionId);
    if (g) {
      totalManual += g.manualScore;
      return { ...a, manualScore: g.manualScore, teacherFeedback: g.teacherFeedback, gradedAt: Date.now(), gradedBy: teacherId };
    }
    return a;
  });
  const pending = newAnswers.some((a) => a.type === 'essay' && (a.manualScore === null || a.manualScore === undefined));
  await updateDoc(ref, {
    answers: newAnswers,
    manualPoints: totalManual,
    points: sc.autoPoints + totalManual,
    hasPendingGrading: pending,
  });
  await updateDoc(doc(db, 'users', sc.userId), { points: increment(totalManual) });
}

// ---------- Users / Leaderboard ----------
export async function getUser(id: string): Promise<AppUser | null> {
  if (DEMO_MODE || !db) return store.users.find((u) => u.id === id) ?? null;
  const snap = await getDoc(doc(db, 'users', id));
  return snap.exists() ? ({ ...(snap.data() as Omit<AppUser, 'id'>), id: snap.id }) : null;
}

export async function updateUser(id: string, data: Partial<Omit<AppUser, 'id'>>): Promise<void> {
  if (DEMO_MODE || !db) {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx >= 0) store.users[idx] = { ...store.users[idx], ...data } as AppUser;
    notify();
    return;
  }
  await updateDoc(doc(db, 'users', id), data);
}

export async function getAllUsers(): Promise<AppUser[]> {
  if (DEMO_MODE || !db) return [...store.users];
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<AppUser, 'id'>), id: d.id }));
}

export async function getLeaderboard(limitCount = 10): Promise<AppUser[]> {
  if (DEMO_MODE || !db) {
    return store.users
      .filter((u) => u.role === 'siswa')
      .sort((a, b) => b.points - a.points)
      .slice(0, limitCount);
  }
  const q = query(collection(db, 'users'), where('role', '==', 'siswa'));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ ...(d.data() as Omit<AppUser, 'id'>), id: d.id }));
  return data.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, limitCount);
}

export async function awardBadge(userId: string, badgeId: string): Promise<void> {
  if (DEMO_MODE || !db) {
    const u = store.users.find((x) => x.id === userId);
    if (u && !u.badges.includes(badgeId)) {
      u.badges.push(badgeId);
      notify();
    }
    return;
  }
  await updateDoc(doc(db, 'users', userId), { badges: arrayUnion(badgeId) });
}

// ---------- Badges ----------
export async function getBadges(): Promise<Badge[]> {
  if (DEMO_MODE || !db) return [...store.badges];
  const snap = await getDocs(collection(db, 'badges'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Badge, 'id'>), id: d.id }));
}

// ---------- Discussions ----------
export async function getPostsBySubject(subjectId: string): Promise<Post[]> {
  if (DEMO_MODE || !db) {
    return store.posts
      .filter((p) => p.subjectId === subjectId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  const q = query(collection(db, 'discussions'), where('subjectId', '==', subjectId));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ ...(d.data() as Omit<Post, 'id'>), id: d.id }));
  return data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function createPost(data: Omit<Post, 'id' | 'createdAt' | 'commentCount'>): Promise<Post> {
  const post: Post = { ...data, id: uid(), createdAt: Date.now(), commentCount: 0 };
  if (DEMO_MODE || !db) {
    store.posts.unshift(post);
    notify();
    return post;
  }
  const ref = await addDoc(collection(db, 'discussions'), {
    ...data,
    createdAt: serverTimestamp(),
    commentCount: 0,
  });
  return { ...post, id: ref.id };
}

export async function deletePost(postId: string): Promise<void> {
  if (DEMO_MODE || !db) {
    store.posts = store.posts.filter((p) => p.id !== postId);
    store.comments = store.comments.filter((c) => c.postId !== postId);
    notify();
    return;
  }
  await deleteDoc(doc(db, 'discussions', postId));
}

export async function getComments(postId: string): Promise<Comment[]> {
  if (DEMO_MODE || !db) {
    return store.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  const q = query(
    collection(db, 'discussions', postId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Comment, 'id'>), id: d.id }));
}

export async function createComment(data: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
  const comment: Comment = { ...data, id: uid(), createdAt: Date.now() };
  if (DEMO_MODE || !db) {
    store.comments.push(comment);
    const post = store.posts.find((p) => p.id === data.postId);
    if (post) post.commentCount += 1;
    notify();
    return comment;
  }
  const ref = await addDoc(collection(db, 'discussions', data.postId, 'comments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'discussions', data.postId), { commentCount: increment(1) });
  return { ...comment, id: ref.id };
}

// ---------- Helpers ----------
export { DEMO_MODE };

// Example of a live Firestore subscription — used once you enable Firebase.
// Replace a get* call with this pattern when you want real-time updates.
export function subscribeLeaderboard(cb: (users: AppUser[]) => void, limitCount = 10): Unsubscribe {
  if (DEMO_MODE || !db) {
    cb(store.users.filter((u) => u.role === 'siswa').sort((a, b) => b.points - a.points).slice(0, limitCount));
    return subscribe(() =>
      cb(store.users.filter((u) => u.role === 'siswa').sort((a, b) => b.points - a.points).slice(0, limitCount)),
    );
  }
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'siswa'),
    orderBy('points', 'desc'),
    limit(limitCount),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as Omit<AppUser, 'id'>), id: d.id })));
  });
}
