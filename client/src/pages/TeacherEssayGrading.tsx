import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllScores, getQuiz, gradeEssayAnswers, getUser } from '@/services/dataStore';
import type { Score, Quiz, AppUser, EssayQuestion } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PenLine, CheckCircle2, Clock, User as UserIcon, Save } from 'lucide-react';

interface QuizMap { [quizId: string]: Quiz }
interface UserMap { [userId: string]: AppUser }

export function TeacherEssayGradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scores, setScores] = useState<Score[]>([]);
  const [quizMap, setQuizMap] = useState<QuizMap>({});
  const [userMap, setUserMap] = useState<UserMap>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'done'>('pending');

  // Draft grades per score+question: scoreId → { qid → { manualScore, teacherFeedback } }
  const [drafts, setDrafts] = useState<Record<string, Record<string, { manualScore: string; teacherFeedback: string }>>>({});

  const refresh = async () => {
    const all = await getAllScores();
    // Hanya yang ada soal uraian
    const withEssay: Score[] = [];
    const qmap: QuizMap = {};
    const umap: UserMap = {};
    for (const s of all) {
      if (!s.answers || s.answers.length === 0) continue;
      const hasEssay = s.answers.some((a) => a.type === 'essay');
      if (!hasEssay) continue;
      withEssay.push(s);
      if (!qmap[s.quizId]) {
        const q = await getQuiz(s.quizId);
        if (q) qmap[s.quizId] = q;
      }
      if (!umap[s.userId]) {
        const u = await getUser(s.userId);
        if (u) umap[s.userId] = u;
      }
    }
    setScores(withEssay);
    setQuizMap(qmap);
    setUserMap(umap);
  };

  useEffect(() => {
    refresh();
  }, []);

  const pendingScores = scores.filter((s) => s.hasPendingGrading);
  const doneScores = scores.filter((s) => !s.hasPendingGrading);
  const visible = activeTab === 'pending' ? pendingScores : doneScores;

  const getDraft = (scoreId: string, qid: string) => {
    return drafts[scoreId]?.[qid] || { manualScore: '', teacherFeedback: '' };
  };

  const setDraft = (scoreId: string, qid: string, patch: Partial<{ manualScore: string; teacherFeedback: string }>) => {
    setDrafts((d) => ({
      ...d,
      [scoreId]: {
        ...(d[scoreId] || {}),
        [qid]: { ...(d[scoreId]?.[qid] || { manualScore: '', teacherFeedback: '' }), ...patch },
      },
    }));
  };

  const handleSave = async (score: Score) => {
    if (!user) return;
    const quiz = quizMap[score.quizId];
    if (!quiz) return;
    const essayAnswers = score.answers.filter((a) => a.type === 'essay');
    const grades: { questionId: string; manualScore: number; teacherFeedback?: string }[] = [];
    for (const a of essayAnswers) {
      const d = getDraft(score.id, a.questionId);
      const q = quiz.questions.find((x) => x.id === a.questionId) as EssayQuestion | undefined;
      const max = q?.points ?? 0;
      if (d.manualScore === '' || isNaN(Number(d.manualScore))) {
        toast({ title: 'Lengkapi nilai semua soal uraian', variant: 'destructive' });
        return;
      }
      const n = Math.max(0, Math.min(Number(d.manualScore), max));
      grades.push({ questionId: a.questionId, manualScore: n, teacherFeedback: d.teacherFeedback || undefined });
    }
    await gradeEssayAnswers(score.id, grades, user.id);
    toast({ title: 'Nilai tersimpan', description: 'Siswa bisa langsung melihat hasilnya.' });
    // Clear drafts
    setDrafts((d) => {
      const next = { ...d }; delete next[score.id]; return next;
    });
    refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-5">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
          <PenLine className="h-8 w-8 text-primary" /> Koreksi Uraian
        </h1>
        <p className="text-muted-foreground mt-1">
          Nilai jawaban uraian siswa. Setelah disimpan, nilai & komentar langsung tampil di dasbor siswa.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          data-testid="tab-pending"
        >
          <Clock className="h-4 w-4 mr-2" /> Menunggu ({pendingScores.length})
        </Button>
        <Button
          variant={activeTab === 'done' ? 'default' : 'outline'}
          onClick={() => setActiveTab('done')}
          data-testid="tab-done"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" /> Sudah Dinilai ({doneScores.length})
        </Button>
      </div>

      {visible.length === 0 ? (
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">
            {activeTab === 'pending' ? '🎉 Tidak ada tugas uraian yang menunggu koreksi.' : 'Belum ada uraian yang sudah dinilai.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((score) => {
            const quiz = quizMap[score.quizId];
            const student = userMap[score.userId];
            const essayAnswers = score.answers.filter((a) => a.type === 'essay');
            if (!quiz) return null;

            return (
              <Card key={score.id} className="border-2 rounded-3xl" data-testid={`score-card-${score.id}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                          {(student?.avatar || '👤').startsWith('data:') ? <img src={student?.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <span className="text-2xl">{student?.avatar || '👤'}</span>}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{student?.name || score.userName || 'Siswa'}</div>
                          <div className="text-xs">Kelas {student?.kelas || '-'} · {new Date(score.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <div className="mt-2 font-bold">{quiz.title}</div>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div className="text-muted-foreground">Otomatis: <span className="font-bold text-foreground">{score.autoPoints} pts</span></div>
                      <div className="text-muted-foreground">Manual: <span className="font-bold text-foreground">{score.manualPoints} pts</span></div>
                      <div className="text-lg font-extrabold text-primary">Total: {score.points} pts</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {essayAnswers.map((a, i) => {
                      const q = quiz.questions.find((x) => x.id === a.questionId) as EssayQuestion | undefined;
                      if (!q) return null;
                      const draft = getDraft(score.id, a.questionId);
                      const alreadyGraded = a.manualScore !== null && a.manualScore !== undefined;
                      return (
                        <div key={a.questionId} className="rounded-2xl border-2 p-4 space-y-3 bg-muted/30">
                          <div>
                            <div className="text-xs font-bold text-muted-foreground">Pertanyaan {i + 1} · Maks {q.points} poin</div>
                            <div className="font-semibold mt-1">{q.question}</div>
                          </div>
                          <div className="rounded-xl bg-background border p-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Jawaban siswa</div>
                            <p className="whitespace-pre-line text-sm">{String(a.response || '— (kosong)')}</p>
                            <div className="text-xs text-muted-foreground mt-2">
                              {String(a.response).trim().split(/\s+/).filter(Boolean).length} kata
                            </div>
                          </div>
                          {q.sampleAnswer && (
                            <div className="rounded-xl bg-accent/10 border border-accent/30 p-3">
                              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Contoh Jawaban (panduan)</div>
                              <p className="text-sm whitespace-pre-line">{q.sampleAnswer}</p>
                            </div>
                          )}

                          {alreadyGraded ? (
                            <div className="rounded-xl bg-secondary/10 border border-secondary/40 p-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-secondary" />
                                <span className="font-bold">Nilai: {a.manualScore} / {q.points}</span>
                              </div>
                              {a.teacherFeedback && (
                                <div className="text-sm">
                                  <span className="font-semibold">Komentar guru:</span> {a.teacherFeedback}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                              <div className="space-y-1">
                                <Label className="text-xs">Nilai (0 - {q.points})</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={q.points}
                                  value={draft.manualScore}
                                  onChange={(e) => setDraft(score.id, a.questionId, { manualScore: e.target.value })}
                                  placeholder="0"
                                  data-testid={`input-grade-${score.id}-${a.questionId}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Komentar untuk siswa (opsional)</Label>
                                <Textarea
                                  rows={2}
                                  value={draft.teacherFeedback}
                                  onChange={(e) => setDraft(score.id, a.questionId, { teacherFeedback: e.target.value })}
                                  placeholder="Tulis apresiasi atau saran perbaikan..."
                                  data-testid={`input-feedback-${score.id}-${a.questionId}`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {score.hasPendingGrading && (
                    <div className="flex justify-end">
                      <Button onClick={() => handleSave(score)} className="font-bold" data-testid={`button-save-grade-${score.id}`}>
                        <Save className="h-4 w-4 mr-2" /> Simpan Nilai
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
