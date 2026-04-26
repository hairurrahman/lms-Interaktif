import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { getSubjects, getChaptersBySubject, getMaterialsBySubject } from '@/services/dataStore';
import type { Subject } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Layers } from 'lucide-react';

export function SubjectsListPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Record<string, { chapters: number; materials: number }>>({});

  useEffect(() => {
    (async () => {
      const subs = await getSubjects();
      setSubjects(subs);
      const s: Record<string, { chapters: number; materials: number }> = {};
      for (const sub of subs) {
        const [c, m] = await Promise.all([
          getChaptersBySubject(sub.id),
          getMaterialsBySubject(sub.id),
        ]);
        s[sub.id] = { chapters: c.length, materials: m.length };
      }
      setStats(s);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Pilih Mata Pelajaran</h1>
        <p className="text-muted-foreground mt-1">Mana yang ingin kamu pelajari hari ini?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {subjects.map((s) => {
          const stat = stats[s.id] ?? { chapters: 0, materials: 0 };
          return (
            <Link key={s.id} href={`/mapel/${s.id}`} data-testid={`link-subject-${s.id}`}>
              <Card className="overflow-hidden border-2 rounded-3xl hover-elevate active-elevate-2 transition-transform hover:-translate-y-1 h-full">
                <div className={`${s.color} relative flex h-40 items-center justify-center text-white`}>
                  <span className="text-8xl drop-shadow-lg" aria-hidden>{s.emoji}</span>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <div className="font-bold text-xl">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.description}</div>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-primary" /> {stat.chapters} Bab
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-accent" /> {stat.materials} Materi
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
