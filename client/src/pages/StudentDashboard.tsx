import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import {
  getSubjects,
  getScoresByUser,
  getLeaderboard,
  getBadges,
} from '@/services/dataStore';
import type { Subject, Score, Badge as BadgeType, AppUser } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Star, TrendingUp, Trophy, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { MOCK_MATERIALS } from '@/lib/mockData';

export function StudentDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [leaderboard, setLeaderboard] = useState<AppUser[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);

  useEffect(() => {
    if (!user) return;
    getSubjects().then(setSubjects);
    getScoresByUser(user.id).then(setScores);
    getLeaderboard(5).then(setLeaderboard);
    getBadges().then(setBadges);
  }, [user]);

  if (!user) return null;

  // Progress per mapel = (# materi yang sudah dikerjakan kuisnya / total materi mapel) * 100
  const progressBySubject = subjects.map((s) => {
    const totalMaterials = MOCK_MATERIALS.filter((m) => m.subjectId === s.id).length;
    const completedMaterials = new Set(
      scores
        .filter((sc) => sc.subjectId === s.id)
        .map((sc) => {
          // find the material via quiz; we'll use a simple mapping through quizId prefix
          return sc.quizId;
        }),
    ).size;
    const pct = totalMaterials === 0 ? 0 : Math.min(100, Math.round((completedMaterials / totalMaterials) * 100));
    return { subject: s, completed: completedMaterials, total: totalMaterials, pct };
  });

  const userBadges = badges.filter((b) => user.badges.includes(b.id));
  const lockedBadges = badges.filter((b) => !user.badges.includes(b.id));
  const myRank = leaderboard.findIndex((u) => u.id === user.id) + 1;

  const recentActivity = scores.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-sunrise p-6 md:p-8 text-white shadow-playful">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -right-4 opacity-20 select-none" aria-hidden>
          {user.avatar.startsWith('data:') ? <img src={user.avatar} className="h-64 w-64 rounded-full object-cover" alt="" /> : <span className="text-9xl">{user.avatar}</span>}
        </div>
        <div className="relative">
          <div className="text-sm font-semibold opacity-90">Halo, {getTimeGreeting()}! 👋</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-extrabold" data-testid="text-welcome">
            {user.name.split(' ')[0]}, siap belajar hari ini?
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatChip icon={<Star className="h-5 w-5" />} value={user.points} label="Total Poin" />
            <StatChip icon={<Trophy className="h-5 w-5" />} value={userBadges.length} label="Badge" />
            <StatChip icon={<Flame className="h-5 w-5" />} value={`${user.streakDays} hari`} label="Streak" />
            {myRank > 0 && (
              <StatChip icon={<TrendingUp className="h-5 w-5" />} value={`#${myRank}`} label="Peringkat" />
            )}
          </div>
        </div>
      </div>

      {/* Subjects progress */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5 text-primary" />
          Progres Mata Pelajaran
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progressBySubject.map(({ subject, completed, total, pct }) => (
            <Link
              key={subject.id}
              href={`/mapel/${subject.id}`}
              data-testid={`card-subject-${subject.id}`}
              className="group"
            >
              <Card className="overflow-hidden border-2 rounded-3xl hover-elevate active-elevate-2 h-full transition-transform group-hover:-translate-y-1">
                <div className={`${subject.color} p-5 text-white relative`}>
                  <div className="flex items-center justify-between">
                    <span className="text-5xl" aria-hidden>{subject.emoji}</span>
                    <div className="text-right">
                      <div className="text-xs font-bold opacity-90">PROGRES</div>
                      <div className="text-2xl font-extrabold">{pct}%</div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <div className="font-bold text-lg">{subject.name}</div>
                    <div className="text-xs text-muted-foreground">{subject.description}</div>
                  </div>
                  <Progress value={pct} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{completed} dari {total} materi</span>
                    <span className="font-bold text-primary">Lanjutkan →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Badges */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            🏆 Koleksi Badge
          </h2>
          <Card className="border-2 rounded-3xl">
            <CardContent className="p-5">
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Telah Diperoleh ({userBadges.length})
                  </div>
                  {userBadges.length === 0 ? (
                    <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                      Belum ada badge. Selesaikan kuis untuk mendapatkan badge pertamamu! 🎯
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {userBadges.map((b) => (
                        <BadgeTile key={b.id} badge={b} earned />
                      ))}
                    </div>
                  )}
                </div>

                {lockedBadges.length > 0 && (
                  <div>
                    <div className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Belum Diperoleh ({lockedBadges.length})
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {lockedBadges.map((b) => (
                        <BadgeTile key={b.id} badge={b} earned={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            <Trophy className="h-5 w-5 text-warning-foreground" />
            Peringkat Kelas
          </h2>
          <Card className="border-2 rounded-3xl">
            <CardContent className="p-4 space-y-2">
              {leaderboard.map((u, i) => (
                <div
                  key={u.id}
                  data-testid={`row-leaderboard-${u.id}`}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 ${
                    u.id === user.id ? 'bg-primary/10 border-2 border-primary/30' : ''
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold text-white ${rankColor(i)}`}>
                    {i + 1}
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                    {u.avatar.startsWith('data:') ? <img src={u.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <span className="text-2xl">{u.avatar}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">Kelas {u.kelas}</div>
                  </div>
                  <div className="text-sm font-extrabold text-primary whitespace-nowrap">⭐ {u.points}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Hasil uraian & pending grading */}
      {scores.some((s) => s.hasPendingGrading || (s.manualPoints ?? 0) > 0 || s.answers?.some((a) => a.type === 'essay')) && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            <PenLineLike /> Hasil Uraian
          </h2>
          <Card className="border-2 rounded-3xl">
            <CardContent className="p-5 space-y-3">
              {scores
                .filter((s) => s.answers?.some((a) => a.type === 'essay'))
                .slice(0, 5)
                .map((s) => {
                  const subj = subjects.find((x) => x.id === s.subjectId);
                  const essays = s.answers?.filter((a) => a.type === 'essay') ?? [];
                  const graded = essays.filter((a) => a.manualScore !== null && a.manualScore !== undefined);
                  const pending = essays.length - graded.length;
                  return (
                    <div
                      key={s.id}
                      data-testid={`row-essay-${s.id}`}
                      className="flex items-start gap-3 rounded-2xl border-2 border-border/60 p-3"
                    >
                      <span className="text-3xl" aria-hidden>{subj?.emoji ?? '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{subj?.name ?? 'Kuis'}</div>
                        <div className="text-xs text-muted-foreground">
                          {relativeTime(s.completedAt)} • {essays.length} soal uraian
                        </div>
                        {graded.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {graded.map((a, i) => (
                              <div key={a.questionId} className="rounded-xl bg-secondary/10 border border-secondary/30 p-2 text-xs">
                                <div className="font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary-foreground" />
                                  Soal {i + 1} • Skor: {a.manualScore}
                                </div>
                                {a.teacherFeedback && (
                                  <div className="mt-1 text-muted-foreground italic">
                                    “{a.teacherFeedback}”
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {pending > 0 ? (
                          <div className="flex items-center gap-1.5 rounded-full bg-warning/20 border border-warning/40 px-2.5 py-1 text-xs font-bold text-warning-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {pending} menunggu
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-full bg-secondary/20 border border-secondary/40 px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Selesai dikoreksi
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent activity */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">📝 Aktivitas Terakhir</h2>
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-5">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada aktivitas. Mulai kerjakan kuis pertamamu!
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentActivity.map((s) => {
                  const subj = subjects.find((x) => x.id === s.subjectId);
                  const pct = Math.round((s.correct / s.total) * 100);
                  return (
                    <li key={s.id} className="flex items-center gap-3 py-3" data-testid={`row-activity-${s.id}`}>
                      <span className="text-2xl">{subj?.emoji ?? '📘'}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{subj?.name ?? 'Kuis'}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.correct}/{s.total} benar • {relativeTime(s.completedAt)}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-extrabold ${scoreTone(pct)}`}>
                        {pct}%
                      </div>
                      <div className="text-sm font-bold text-primary">+{s.points}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-3.5 py-2 border border-white/30">
      <div className="opacity-90">{icon}</div>
      <div>
        <div className="text-xl font-extrabold leading-none">{value}</div>
        <div className="text-xs opacity-80">{label}</div>
      </div>
    </div>
  );
}

function BadgeTile({ badge, earned }: { badge: BadgeType; earned: boolean }) {
  return (
    <div
      className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 p-2 text-center transition ${
        earned
          ? 'border-primary bg-primary/10 shadow-playful'
          : 'border-dashed border-border bg-muted grayscale opacity-60'
      }`}
      title={badge.description}
      data-testid={`badge-${badge.id}`}
    >
      <div className="text-3xl">{badge.emoji}</div>
      <div className="mt-1 text-[11px] font-bold leading-tight">{badge.name}</div>
    </div>
  );
}

function rankColor(i: number) {
  if (i === 0) return 'bg-gradient-sunrise';
  if (i === 1) return 'bg-gradient-ocean';
  if (i === 2) return 'bg-gradient-forest';
  return 'bg-muted-foreground';
}

function scoreTone(pct: number) {
  if (pct >= 80) return 'bg-secondary/20 text-secondary-foreground border border-secondary/40';
  if (pct >= 60) return 'bg-warning/20 text-warning-foreground border border-warning/40';
  return 'bg-destructive/15 text-destructive border border-destructive/30';
}

function PenLineLike() {
  return <span className="text-xl">✍️</span>;
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'selamat pagi';
  if (h < 15) return 'selamat siang';
  if (h < 18) return 'selamat sore';
  return 'selamat malam';
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}
