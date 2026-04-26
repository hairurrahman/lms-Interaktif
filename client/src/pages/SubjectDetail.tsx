import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import {
  getSubjects,
  getChaptersBySubject,
  getMaterialsBySubject,
  getScoresByUser,
} from '@/services/dataStore';
import type { Chapter, Material, Subject, Score } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Play, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SubjectDetailPage() {
  const [, params] = useRoute<{ id: string }>('/mapel/:id');
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const subs = await getSubjects();
      setSubject(subs.find((s) => s.id === params.id) ?? null);
      setChapters(await getChaptersBySubject(params.id));
      setMaterials(await getMaterialsBySubject(params.id));
      if (user) setScores(await getScoresByUser(user.id));
    })();
  }, [params?.id, user]);

  if (!subject) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-2">🔍</div>
        <div className="text-muted-foreground">Mata pelajaran tidak ditemukan.</div>
      </div>
    );
  }

  const completedMaterials = new Set(scores.filter((s) => s.subjectId === subject.id).map((s) => s.quizId));

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className={`${subject.color} rounded-3xl p-6 md:p-8 text-white shadow-playful relative overflow-hidden`}>
        <div className="absolute -right-4 -top-4 text-[10rem] opacity-20 select-none" aria-hidden>
          {subject.emoji}
        </div>
        <div className="relative">
          <nav className="text-sm opacity-90 mb-1">
            <Link href="/mapel" className="hover:underline" data-testid="link-back-subjects">Mapel</Link>
            <ChevronRight className="inline h-4 w-4 mx-1" />
            <span>{subject.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold">{subject.name}</h1>
          <p className="mt-2 opacity-95 max-w-2xl">{subject.description}</p>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-6">
        {chapters.map((chapter) => (
          <div key={chapter.id} data-testid={`chapter-${chapter.id}`}>
            <h2 className="text-xl md:text-2xl font-extrabold mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-black">
                {chapter.order}
              </span>
              {chapter.title.replace(/^Bab \d+ — /, '')}
            </h2>
            <div className="space-y-3 ml-1">
              {chapter.topics.map((topic) => {
                const topicMaterials = materials.filter((m) => m.topicId === topic.id);
                return (
                  <Card key={topic.id} className="border-2 rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="px-5 pt-4 pb-2 border-b border-border bg-muted/40">
                        <div className="font-bold text-foreground">📘 {topic.title}</div>
                      </div>
                      <div className="divide-y divide-border">
                        {topic.subtopics.map((subtopic) => {
                          const mat = topicMaterials.find((m) => m.subtopicId === subtopic.id);
                          const done = mat && scores.some((s) => s.quizId && completedMaterials.has(s.quizId) && s.subjectId === subject.id);
                          return mat ? (
                            <Link
                              key={subtopic.id}
                              href={`/materi/${mat.id}`}
                              data-testid={`link-material-${mat.id}`}
                              className="flex items-center gap-3 px-5 py-3.5 hover-elevate active-elevate-2 transition-colors"
                            >
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? 'bg-secondary text-secondary-foreground' : 'bg-primary/15 text-primary'}`}>
                                {done ? <CheckCircle2 className="h-5 w-5" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{subtopic.title}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <Clock className="h-3 w-3" /> Video + ringkasan + kuis
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </Link>
                          ) : (
                            <div
                              key={subtopic.id}
                              className="flex items-center gap-3 px-5 py-3.5 text-muted-foreground"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-dashed border-border">
                                <Clock className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{subtopic.title}</div>
                                <div className="text-xs">Segera hadir</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
