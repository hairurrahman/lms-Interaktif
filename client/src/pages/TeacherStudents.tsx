import { useEffect, useMemo, useState } from 'react';
import { getAllUsers, getAllScores, getSubjects, getBadges, resetStudentProgress } from '@/services/dataStore';
import type { AppUser, Score, Subject, Badge as BadgeType } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, TrendingUp, Trophy, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function TeacherStudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<AppUser[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      let allUsers = await getAllUsers();
      let studs = allUsers.filter((u) => u.role === 'siswa');
      if (user?.role === 'guru' && user.sekolahId) {
        studs = studs.filter((u) => u.sekolahId === user.sekolahId);
      }
      setStudents(studs);
      
      let allScrs = await getAllScores();
      if (user?.role === 'guru' && user.sekolahId) {
        const studIds = new Set(studs.map(s => s.id));
        allScrs = allScrs.filter(s => studIds.has(s.userId));
      }
      setScores(allScrs);
      
      setSubjects(await getSubjects());
      setBadges(await getBadges());
    })();
  }, [user]);

  const handleReset = async (studentId: string, name: string) => {
    const ok = window.confirm(`Apakah Anda yakin ingin me-reset progres belajar untuk "${name}"?\n\nTindakan ini akan menghapus semua nilai kuis, poin, dan lencana (badge) siswa tersebut secara permanen.`);
    if (!ok) return;

    try {
      await resetStudentProgress(studentId);
      toast({ title: 'Progres Direset', description: `Progres belajar untuk "${name}" telah dibersihkan.` });
      
      const allUsers = await getAllUsers();
      let studs = allUsers.filter((u) => u.role === 'siswa');
      if (user?.role === 'guru' && user.sekolahId) {
        studs = studs.filter((u) => u.sekolahId === user.sekolahId);
      }
      setStudents(studs);
      
      let allScrs = await getAllScores();
      if (user?.role === 'guru' && user.sekolahId) {
        const studIds = new Set(studs.map(s => s.id));
        allScrs = allScrs.filter(s => studIds.has(s.userId));
      }
      setScores(allScrs);
    } catch (err: any) {
      toast({ title: 'Gagal Me-reset', description: err.message, variant: 'destructive' });
    }
  };

  const badgeMap = Object.fromEntries(badges.map((b) => [b.id, b]));

  const rows = useMemo(() => {
    return students
      .filter((s) => !filter || s.name.toLowerCase().includes(filter.toLowerCase()))
      .map((s) => {
        const sScores = scores.filter((x) => x.userId === s.id);
        const avg =
          sScores.length === 0
            ? 0
            : Math.round((sScores.reduce((a, x) => a + x.correct / x.total, 0) / sScores.length) * 100);
        const perSubject = subjects.map((sub) => {
          const sub_scores = sScores.filter((x) => x.subjectId === sub.id);
          const count = sub_scores.length;
          const avgSub =
            count === 0
              ? 0
              : Math.round((sub_scores.reduce((a, x) => a + x.correct / x.total, 0) / count) * 100);
          return { subject: sub, count, avg: avgSub };
        });
        return { student: s, avg, quizCount: sScores.length, perSubject };
      })
      .sort((a, b) => b.student.points - a.student.points);
  }, [students, scores, subjects, filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8 space-y-5">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Progres Siswa</h1>
        <p className="text-muted-foreground mt-1">
          Pantau kemajuan belajar setiap siswa di semua mata pelajaran.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama siswa..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
          data-testid="input-search-student"
        />
      </div>

      <div className="grid gap-3">
        {rows.map(({ student: s, avg, quizCount, perSubject }) => (
          <Card key={s.id} className="border-2 rounded-3xl" data-testid={`student-card-${s.id}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                  {s.avatar.startsWith('data:') ? <img src={s.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <div className="text-4xl">{s.avatar}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Kelas {s.kelas} • {s.email}
                  </div>
                </div>
                <StatPill icon={<Trophy className="h-4 w-4" />} value={s.points} label="Poin" />
                <StatPill icon={<TrendingUp className="h-4 w-4" />} value={`${avg}%`} label="Rata-rata" />
                <StatPill icon={<Users className="h-4 w-4" />} value={quizCount} label="Kuis" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset(s.id, s.name)}
                  className="rounded-2xl border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive flex items-center gap-1.5 h-12 px-4 shrink-0"
                  title="Reset Progres Belajar Siswa"
                  data-testid={`btn-reset-progress-${s.id}`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Progres
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {perSubject.map((p) => (
                  <div key={p.subject.id} className="rounded-2xl bg-muted/50 p-3">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>{p.subject.emoji} {p.subject.name}</span>
                      <span className={p.avg >= 80 ? 'text-secondary' : p.avg >= 60 ? 'text-warning-foreground' : 'text-muted-foreground'}>
                        {p.count === 0 ? '—' : `${p.avg}%`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${p.subject.color}`} style={{ width: `${p.avg}%` }} />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{p.count} kuis dikerjakan</div>
                  </div>
                ))}
              </div>
              {s.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.badges.map((bid) => (
                    <span
                      key={bid}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold"
                    >
                      <span>{badgeMap[bid]?.emoji}</span>
                      {badgeMap[bid]?.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
      <div className="text-primary">{icon}</div>
      <div>
        <div className="font-extrabold leading-tight">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
