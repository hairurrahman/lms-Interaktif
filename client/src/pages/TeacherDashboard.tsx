import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import {
  getSubjects,
  getMaterialsBySubject,
  getQuizzesByMaterial,
  getAllUsers,
  getAllScores,
} from '@/services/dataStore';
import type { Subject, Material, Quiz, AppUser, Score } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, PenSquare, Users, ClipboardList, Sparkles, TrendingUp } from 'lucide-react';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    (async () => {
      const subs = await getSubjects();
      setSubjects(subs);
      let mTotal = 0;
      let qTotal = 0;
      for (const s of subs) {
        const mats = await getMaterialsBySubject(s.id);
        mTotal += mats.length;
        for (const m of mats) {
          const qs = await getQuizzesByMaterial(m.id);
          qTotal += qs.length;
        }
      }
      setMaterialsCount(mTotal);
      setQuizzesCount(qTotal);
      const users = await getAllUsers();
      setStudents(users.filter((u) => u.role === 'siswa'));
      setScores(await getAllScores());
    })();
  }, []);

  if (!user) return null;

  const avgScore =
    scores.length === 0
      ? 0
      : Math.round(
          (scores.reduce((acc, s) => acc + s.correct / s.total, 0) / scores.length) * 100,
        );

  const recentScores = [...scores].sort((a, b) => b.completedAt - a.completedAt).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-ocean p-6 md:p-8 text-white shadow-playful">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-sm font-semibold opacity-90">Halo, Ibu/Bapak Guru</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-extrabold">
            {user.name}, mari siapkan pembelajaran!
          </h1>
          <div className="mt-4 flex flex-wrap gap-3">
            <StatChip icon={<BookOpen className="h-5 w-5" />} value={materialsCount} label="Materi" />
            <StatChip icon={<ClipboardList className="h-5 w-5" />} value={quizzesCount} label="Kuis" />
            <StatChip icon={<Users className="h-5 w-5" />} value={students.length} label="Siswa" />
            <StatChip icon={<TrendingUp className="h-5 w-5" />} value={`${avgScore}%`} label="Rata-rata" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction href="/guru/materi" icon={PenSquare} label="Tambah Materi" color="bg-gradient-sunrise" testId="card-add-material" />
        <QuickAction href="/guru/kuis" icon={Sparkles} label="Buat Kuis" color="bg-gradient-candy" testId="card-add-quiz" />
        <QuickAction href="/guru/siswa" icon={Users} label="Progres Siswa" color="bg-gradient-forest" testId="card-view-students" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-5">
            <h2 className="font-bold text-lg mb-3">Materi per Mata Pelajaran</h2>
            <SubjectBreakdown subjects={subjects} />
          </CardContent>
        </Card>

        <Card className="border-2 rounded-3xl">
          <CardContent className="p-5">
            <h2 className="font-bold text-lg mb-3">Aktivitas Kuis Terbaru</h2>
            {recentScores.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Belum ada kuis dikerjakan.
              </div>
            ) : (
              <ul className="space-y-2">
                {recentScores.map((s) => {
                  const student = students.find((u) => u.id === s.userId);
                  const subject = subjects.find((x) => x.id === s.subjectId);
                  const pct = Math.round((s.correct / s.total) * 100);
                  return (
                    <li key={s.id} className="flex items-center gap-3 rounded-2xl p-2.5 bg-muted/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        {(student?.avatar ?? '👤').startsWith('data:') ? <img src={student?.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <span className="text-2xl">{student?.avatar ?? '👤'}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{student?.name ?? 'Siswa'}</div>
                        <div className="text-xs text-muted-foreground">
                          {subject?.emoji} {subject?.name} • {s.correct}/{s.total}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-extrabold ${pct >= 80 ? 'bg-secondary/20 text-secondary-foreground' : pct >= 60 ? 'bg-warning/20 text-warning-foreground' : 'bg-destructive/15 text-destructive'}`}>
                        {pct}%
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-3.5 py-2 border border-white/30">
      {icon}
      <div>
        <div className="text-xl font-extrabold leading-none">{value}</div>
        <div className="text-xs opacity-80">{label}</div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color, testId }: { href: string; icon: any; label: string; color: string; testId: string }) {
  return (
    <Link href={href} data-testid={testId}>
      <Card className={`border-2 rounded-3xl overflow-hidden hover-elevate active-elevate-2 h-full`}>
        <CardContent className="p-0">
          <div className={`${color} p-5 text-white flex items-center gap-3`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-lg">{label}</div>
              <div className="text-xs opacity-90">Klik untuk mulai →</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SubjectBreakdown({ subjects }: { subjects: Subject[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      const c: Record<string, number> = {};
      for (const s of subjects) {
        const m = await getMaterialsBySubject(s.id);
        c[s.id] = m.length;
      }
      setCounts(c);
    })();
  }, [subjects]);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="space-y-3">
      {subjects.map((s) => {
        const c = counts[s.id] ?? 0;
        const pct = (c / max) * 100;
        return (
          <div key={s.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{s.emoji} {s.name}</span>
              <span className="text-muted-foreground">{c} materi</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${s.color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
