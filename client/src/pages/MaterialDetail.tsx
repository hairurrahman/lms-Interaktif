import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { getMaterial, getQuizzesByMaterial, getSubjects } from '@/services/dataStore';
import type { Material, Quiz, Subject } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, ChevronRight, ArrowLeft, FileText, FileDown } from 'lucide-react';
import { convertToEmbed, getVideoKindLabel } from '@/lib/videoEmbed';

export function MaterialDetailPage() {
  const [, params] = useRoute<{ id: string }>('/materi/:id');
  const [material, setMaterial] = useState<Material | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const m = await getMaterial(params.id);
      setMaterial(m);
      if (m) {
        setQuizzes(await getQuizzesByMaterial(m.id));
        const subs = await getSubjects();
        setSubject(subs.find((s) => s.id === m.subjectId) ?? null);
      }
    })();
  }, [params?.id]);

  if (!material) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-2">🔍</div>
        <div className="text-muted-foreground">Materi tidak ditemukan.</div>
        <Link href="/mapel" className="text-primary font-bold mt-2 inline-block">Kembali ke mata pelajaran</Link>
      </div>
    );
  }

  const embed = material.videoUrl ? convertToEmbed(material.videoUrl) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Breadcrumb */}
      <Link
        href={subject ? `/mapel/${subject.id}` : '/mapel'}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        data-testid="link-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali {subject && `ke ${subject.name}`}
      </Link>

      {/* Header */}
      <div>
        {subject && (
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground mb-2">
            <span className="text-xl">{subject.emoji}</span>
            {subject.name}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold" data-testid="text-material-title">
          {material.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">{material.description}</p>
      </div>

      {/* Video (multi-platform) */}
      {embed && embed.embedUrl && (
        <Card className="border-2 rounded-3xl overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Video pembelajaran</span>
            <span className="px-2 py-0.5 rounded-full bg-muted">{getVideoKindLabel(embed.kind)}</span>
          </div>
          <div className="aspect-video bg-muted">
            {embed.isIframe ? (
              <iframe
                src={embed.embedUrl}
                title={material.title}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="h-full w-full border-0"
                data-testid="iframe-video"
              />
            ) : (
              <video
                src={embed.embedUrl}
                controls
                className="h-full w-full bg-black"
                data-testid="video-player"
              />
            )}
          </div>
        </Card>
      )}

      {/* PDF attachment */}
      {material.pdfUrl && (
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <FileDown className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Berkas PDF</div>
                <div className="text-xs text-muted-foreground">Buka di tab baru untuk dibaca</div>
              </div>
            </div>
            <a
              href={material.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-pdf"
            >
              <Button variant="outline" className="font-bold">Buka PDF</Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Ringkasan (text atau HTML) */}
      <Card className="border-2 rounded-3xl">
        <CardContent className="p-6 md:p-7">
          <div className="flex items-center gap-2 font-bold text-lg mb-3">
            <FileText className="h-5 w-5 text-primary" />
            Ringkasan Materi
          </div>
          {material.summaryFormat === 'html' ? (
            <div
              className="material-html leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ __html: material.summary }}
              data-testid="text-summary-html"
            />
          ) : (
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line" data-testid="text-summary">
              {material.summary}
            </p>
          )}
        </CardContent>
      </Card>

      {/* CTA: Quiz */}
      {quizzes.length > 0 && (
        <Card className="border-2 rounded-3xl bg-gradient-sunrise text-white overflow-hidden relative">
          <div className="absolute -right-6 -top-6 text-9xl opacity-20 select-none" aria-hidden>🎮</div>
          <CardContent className="p-6 md:p-7 relative">
            <div className="flex items-center gap-2 text-sm font-bold opacity-90 mb-1">
              <Sparkles className="h-4 w-4" /> SIAP DIUJI?
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Yuk, coba kuisnya!</h2>
            <p className="opacity-95 mb-4 max-w-lg">
              Selesaikan {quizzes[0].questions.length} soal dan kumpulkan poin. Nilai sempurna = badge
              baru untukmu! 🏆
            </p>
            <div className="flex flex-wrap gap-3">
              {quizzes.map((q) => (
                <Link key={q.id} href={`/kuis/${q.id}`} data-testid={`link-quiz-${q.id}`}>
                  <Button size="lg" variant="secondary" className="font-bold h-12 text-base shadow-playful">
                    <Play className="h-4 w-4 mr-2 fill-current" />
                    {q.title}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
