import { useEffect, useRef, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { getQuiz, getMaterial, submitScore, awardBadge } from '@/services/dataStore';
import type { Quiz, Material, QuizQuestion, StudentAnswer } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Confetti } from '@/components/Confetti';
import { LatexRenderer } from '@/components/LatexRenderer';
import { Check, X, Clock, Sparkles, Home, RefreshCw, ArrowRight, Trophy, PenLine, HelpCircle } from 'lucide-react';

type AnswerMap = Record<string, string | string[] | Record<string, boolean>>;

function arraysEqualAsSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((x) => sa.has(x));
}

function computeAutoScore(q: QuizQuestion, response: string | string[] | Record<string, boolean> | undefined): { correct: boolean; points: number } {
  if (response === undefined) return { correct: false, points: 0 };
  if (q.type === 'mcq') {
    return { correct: response === q.correctOptionId, points: response === q.correctOptionId ? q.points : 0 };
  }
  if (q.type === 'mcq-multi') {
    const arr = Array.isArray(response) ? response : [];
    const ok = arraysEqualAsSet(arr, q.correctOptionIds);
    return { correct: ok, points: ok ? q.points : 0 };
  }
  if (q.type === 'true-false') {
    const resp = (response as Record<string, boolean>) || {};
    const correctCount = q.statements.filter((s) => resp[s.id] === s.isTrue).length;
    const allCorrect = correctCount === q.statements.length;
    const partial = Math.round((correctCount / q.statements.length) * q.points);
    return { correct: allCorrect, points: partial };
  }
  return { correct: false, points: 0 };
}

export function QuizGamePage() {
  const [, params] = useRoute<{ id: string }>('/kuis/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);

  // State
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const q = await getQuiz(params.id);
      setQuiz(q);
      if (q) setMaterial(await getMaterial(q.materialId));
    })();
  }, [params?.id]);

  // Timer
  useEffect(() => {
    if (!started || !quiz || done) return;
    if (quiz.timeLimitSec === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, quiz, done]);

  // When done, submit score
  useEffect(() => {
    if (!done || submitted || !quiz || !user) return;
    setSubmitted(true);
    (async () => {
      const studentAnswers: StudentAnswer[] = quiz.questions.map((q) => {
        const resp = answers[q.id];
        const auto = computeAutoScore(q, resp);
        return {
          questionId: q.id,
          type: q.type,
          response: resp !== undefined ? resp : (q.type === 'mcq-multi' ? [] : q.type === 'true-false' ? {} : ''),
          autoScore: auto.points,
          manualScore: undefined,
        };
      });
      const autoPoints = studentAnswers.reduce((n, a) => n + (a.autoScore ?? 0), 0);
      const correctCount = quiz.questions.reduce((n, q) => {
        const resp = answers[q.id];
        const auto = computeAutoScore(q, resp);
        return n + (auto.correct ? 1 : 0);
      }, 0);
      const hasPending = false;

      await submitScore({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        quizId: quiz.id,
        quizTitle: quiz.title,
        subjectId: quiz.subjectId,
        correct: correctCount,
        total: quiz.questions.length,
        points: autoPoints,
        autoPoints,
        manualPoints: 0,
        hasPendingGrading: hasPending,
        answers: studentAnswers,
      });

      await awardBadge(user.id, 'first-quiz');
      const autoOnlyTotal = quiz.questions.length;
      if (autoOnlyTotal > 0 && correctCount === autoOnlyTotal) await awardBadge(user.id, 'perfect');
      if (quiz.subjectId === 'mtk' && autoOnlyTotal > 0 && correctCount / autoOnlyTotal >= 0.8)
        await awardBadge(user.id, 'math-master');
      if (quiz.subjectId === 'ipas') await awardBadge(user.id, 'scientist');
      if (quiz.subjectId === 'bindo') await awardBadge(user.id, 'reader');
    })();
  }, [done, submitted, quiz, user, answers]);

  const handleStart = () => {
    if (!quiz) return;
    setStarted(true);
    setTimeLeft(quiz.timeLimitSec);
  };

  const setAnswer = (qid: string, value: string | string[] | Record<string, boolean>) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (current >= quiz.questions.length - 1) {
      setDone(true);
      return;
    }
    setCurrent((c) => c + 1);
  };

  const handleRetry = () => {
    setStarted(false);
    setCurrent(0);
    setAnswers({});
    setDone(false);
    setSubmitted(false);
    setTimeLeft(quiz?.timeLimitSec ?? 0);
  };

  if (!quiz) {
    return <div className="p-10 text-center text-muted-foreground">Memuat kuis...</div>;
  }

  // ---- Intro screen ----
  if (!started && !done) {
    const maxPoints = quiz.questions.reduce((n, q) => n + q.points, 0);
    const typesCount = {
      mcq: quiz.questions.filter((q) => q.type === 'mcq').length,
      mm: quiz.questions.filter((q) => q.type === 'mcq-multi').length,
      tf: quiz.questions.filter((q) => q.type === 'true-false').length,
    };
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-12">
        <Card className="border-2 rounded-3xl overflow-hidden">
          <div className="bg-gradient-sunrise p-8 text-center text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-9xl opacity-20 select-none" aria-hidden>🎮</div>
            <div className="relative space-y-2">
              <div className="text-sm font-bold opacity-90">KUIS SERU</div>
              <h1 className="text-3xl md:text-4xl font-extrabold">{quiz.title}</h1>
              {material && <div className="opacity-90">Dari materi: {material.title}</div>}
            </div>
          </div>
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric icon="📝" label="Soal" value={quiz.questions.length} />
              <Metric icon="⏱️" label="Waktu" value={quiz.timeLimitSec ? `${Math.floor(quiz.timeLimitSec / 60)}m ${quiz.timeLimitSec % 60}s` : '∞'} />
              <Metric icon="⭐" label="Maks Poin" value={maxPoints} />
            </div>
            <div className="rounded-2xl bg-muted/60 p-4 text-sm space-y-2">
              <div className="font-bold">Ada berbagai jenis soal:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {typesCount.mcq > 0 && <li>{typesCount.mcq} pilihan ganda (satu jawaban)</li>}
                {typesCount.mm > 0 && <li>{typesCount.mm} pilihan ganda kompleks (pilih SEMUA)</li>}
                {typesCount.tf > 0 && <li>{typesCount.tf} benar-salah (pernyataan)</li>}
              </ul>
            </div>
            <Button
              className="w-full h-14 text-lg font-extrabold bg-gradient-sunrise hover:opacity-95 shadow-playful"
              onClick={handleStart}
              data-testid="button-start-quiz"
            >
              <Sparkles className="h-5 w-5 mr-2" /> Mulai Kuis!
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Results screen ----
  if (done) {
    const perQ = quiz.questions.map((q) => ({ q, auto: computeAutoScore(q, answers[q.id]) }));
    const autoPoints = perQ.reduce((n, x) => n + x.auto.points, 0);
    const autoOnlyCorrect = perQ.filter((x) => x.auto.correct).length;
    const autoOnlyTotal = perQ.length;
    const hasEssay = false;
    const pct = autoOnlyTotal > 0 ? Math.round((autoOnlyCorrect / autoOnlyTotal) * 100) : 0;
    const isGreat = pct >= 80 && !hasEssay;
    const isOk = pct >= 60;

    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-12">
        <Confetti show={isGreat} />
        <Card className="border-2 rounded-3xl overflow-hidden">
          <div className={`${isGreat ? 'bg-gradient-sunrise' : isOk ? 'bg-gradient-ocean' : 'bg-gradient-candy'} p-8 text-center text-white relative`}>
            <div className="text-7xl mb-3 animate-bounce-in">{isGreat ? '🏆' : isOk ? '👍' : '💪'}</div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              {hasEssay ? 'Selesai! Menunggu koreksi guru' : isGreat ? 'Luar biasa!' : isOk ? 'Kerja bagus!' : 'Tetap semangat!'}
            </h1>
            <p className="mt-1 opacity-95">
              {isGreat
                ? 'Kamu menguasai materi ini dengan baik.'
                : isOk
                ? 'Masih ada ruang untuk belajar lebih banyak.'
                : 'Ulangi lagi, kamu pasti bisa lebih baik!'}
            </p>
          </div>
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric icon="✅" label="Benar (otomatis)" value={autoOnlyTotal > 0 ? `${autoOnlyCorrect} / ${autoOnlyTotal}` : '—'} />
              <Metric icon="🎯" label="Skor" value={autoOnlyTotal > 0 ? `${pct}%` : '—'} />
              <Metric icon="⭐" label="Poin" value={`+${autoPoints}`} />
            </div>

            {/* Review */}
            <div className="space-y-2">
              <div className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Tinjauan jawaban</div>
              {quiz.questions.map((q, i) => {
                const auto = computeAutoScore(q, answers[q.id]);
                const isEssay = false;
                const correct = auto.correct;
                const borderCls = correct
                  ? 'border-secondary/50 bg-secondary/5'
                  : 'border-destructive/40 bg-destructive/5';
                return (
                  <div key={q.id} className={`rounded-2xl border-2 p-3 ${borderCls}`}>
                    <div className="flex items-start gap-2">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-xs font-black ${
                          correct ? 'bg-secondary' : 'bg-destructive'
                        }`}
                      >
                        {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-semibold">
                          {i + 1}.{' '}
                          <LatexRenderer
                            html={q.question}
                            className="inline"
                          />
                        </div>
                        {q.type === 'mcq' ? (
                          !correct && (
                            <div className="text-muted-foreground mt-1">
                              Jawaban benar: <span className="font-bold text-foreground">{q.options.find((o) => o.id === q.correctOptionId)?.text}</span>
                            </div>
                          )
                        ) : q.type === 'mcq-multi' ? (
                          <div className="text-muted-foreground mt-1">
                            Jawaban benar: <span className="font-bold text-foreground">{q.correctOptionIds.map((id) => q.options.find((o) => o.id === id)?.text).join(', ')}</span>
                          </div>
                        ) : q.type === 'true-false' ? (
                          <div className="text-muted-foreground mt-1">
                            Skor: {auto.points} / {q.points} poin
                          </div>
                        ) : null}
                        {q.explanation && <div className="mt-1.5 text-xs italic text-muted-foreground">💡 {q.explanation}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" className="flex-1 h-12 font-bold" onClick={handleRetry} data-testid="button-retry">
                <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
              </Button>
              <Button className="flex-1 h-12 font-bold" onClick={() => setLocation('/')} data-testid="button-home">
                <Home className="h-4 w-4 mr-2" /> Ke Dasbor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Playing ----
  const q = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Validasi apakah pertanyaan saat ini sudah dijawab (untuk enable tombol lanjut)
  const resp = answers[q.id];
  const canProceed =
    q.type === 'mcq'
      ? typeof resp === 'string' && resp.length > 0
      : q.type === 'mcq-multi'
      ? Array.isArray(resp) && resp.length > 0
      : q.type === 'true-false'
      ? resp && typeof resp === 'object' && Object.keys(resp).length === q.statements.length
      : false;

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span data-testid="text-progress">
            Soal {current + 1} <span className="text-muted-foreground">/ {quiz.questions.length}</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-warning/20 px-3 py-1 text-warning-foreground border border-warning/40" data-testid="text-current-points">
              <Trophy className="h-3.5 w-3.5" /> {q.points} pts
            </div>
            {quiz.timeLimitSec > 0 && (
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-1 border font-bold ${timeLeft < 15 ? 'bg-destructive/10 text-destructive border-destructive/40 animate-pop' : 'bg-muted border-border'}`}
                data-testid="text-timer"
              >
                <Clock className="h-3.5 w-3.5" /> {fmtTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {/* Question card */}
      <Card className="border-2 rounded-3xl overflow-hidden relative">
        <CardContent className="p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pertanyaan {current + 1}</div>
            <TypeBadge type={q.type} />
          </div>
          {/* Question text */}
          <LatexRenderer
            html={q.question}
            className="text-lg md:text-xl font-extrabold leading-snug"
            data-testid="text-question"
          />

          {/* MCQ */}
          {q.type === 'mcq' && (
            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                const isSelected = resp === opt.id;
                const letter = String.fromCharCode(65 + i);
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAnswer(q.id, opt.id)}
                    data-testid={`option-${opt.id}`}
                    className={`w-full text-left rounded-2xl border-2 p-3 md:p-4 flex items-center gap-3 transition-all hover-elevate active-elevate-2 ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm md:text-base ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {letter}
                    </div>
                    <LatexRenderer
                      html={opt.text}
                      className="font-semibold text-sm md:text-base flex-1"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* MCQ Multi */}
          {q.type === 'mcq-multi' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-semibold text-foreground">
                ✨ Pilih <strong>SEMUA</strong> jawaban yang benar (bisa lebih dari satu)
              </div>
              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const arr = Array.isArray(resp) ? (resp as string[]) : [];
                  const isChecked = arr.includes(opt.id);
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const newArr = isChecked ? arr.filter((x) => x !== opt.id) : [...arr, opt.id];
                        setAnswer(q.id, newArr);
                      }}
                      data-testid={`option-multi-${opt.id}`}
                      className={`w-full text-left rounded-2xl border-2 p-3 md:p-4 flex items-center gap-2 md:gap-3 transition-all hover-elevate active-elevate-2 ${
                        isChecked ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${isChecked ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
                        {isChecked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-extrabold text-sm ${isChecked ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
                        {letter}
                      </div>
                      <LatexRenderer
                        html={opt.text}
                        className="font-semibold text-sm md:text-base flex-1"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* True/False (table) */}
          {q.type === 'true-false' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-semibold">
                Tandai BENAR atau SALAH untuk setiap pernyataan:
              </div>
              <div className="overflow-x-auto rounded-2xl border-2">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 md:p-3 font-bold">Pernyataan</th>
                      <th className="w-14 md:w-20 p-2 text-center font-bold text-secondary">Benar</th>
                      <th className="w-14 md:w-20 p-2 text-center font-bold text-destructive">Salah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.statements.map((s, i) => {
                      const state = (resp as Record<string, boolean>) || {};
                      const val = state[s.id];
                      return (
                        <tr key={s.id} className="border-t">
                          <td className="p-2 md:p-3 align-top">
                            <div className="flex items-start gap-1.5 md:gap-2">
                              <span className="text-muted-foreground font-bold">{i + 1}.</span>
                              <LatexRenderer
                                html={s.text}
                                className="font-semibold flex-1"
                              />
                            </div>
                          </td>
                          <td className="p-2 text-center align-top">
                            <button
                              onClick={() => setAnswer(q.id, { ...state, [s.id]: true })}
                              data-testid={`tf-true-${s.id}`}
                              className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border-2 inline-flex items-center justify-center transition-all ${
                                val === true ? 'bg-secondary border-secondary text-white' : 'border-border bg-background hover:border-secondary/60'
                              }`}
                              aria-label="Benar"
                            >
                              <Check className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                          </td>
                          <td className="p-2 text-center align-top">
                            <button
                              onClick={() => setAnswer(q.id, { ...state, [s.id]: false })}
                              data-testid={`tf-false-${s.id}`}
                              className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl border-2 inline-flex items-center justify-center transition-all ${
                                val === false ? 'bg-destructive border-destructive text-white' : 'border-border bg-background hover:border-destructive/60'
                              }`}
                              aria-label="Salah"
                            >
                              <X className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          <Button
            className="w-full h-12 text-base font-extrabold"
            onClick={handleNext}
            disabled={!canProceed}
            data-testid="button-next"
          >
            {current >= quiz.questions.length - 1 ? 'Selesai' : 'Lanjut'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TypeBadge({ type }: { type: QuizQuestion['type'] }) {
  const map: Record<QuizQuestion['type'], { label: string; cls: string }> = {
    'mcq': { label: 'Pilihan Ganda', cls: 'bg-primary/15 text-primary border-primary/40' },
    'mcq-multi': { label: 'PG Kompleks', cls: 'bg-accent/15 text-accent border-accent/40' },
    'true-false': { label: 'Benar / Salah', cls: 'bg-secondary/15 text-secondary border-secondary/40' },
    'essay': { label: 'Esai', cls: 'bg-muted/15 text-muted-foreground border-muted/40' },
  };
  const m = map[type];
  return (
    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${m.cls}`}>{m.label}</span>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <div className="text-2xl mb-0.5">{icon}</div>
      <div className="text-xl font-extrabold leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
