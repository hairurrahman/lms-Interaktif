import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getSubjects,
  getChaptersBySubject,
  getMaterialsBySubject,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '@/services/dataStore';
import type { Subject, Chapter, Material } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, BookOpen, Image as ImageIcon, FileText, Youtube, HardDrive, Film, Trash2, Eye, Code as CodeIcon, Type as TypeIcon } from 'lucide-react';
import { convertToEmbed, getVideoKindLabel } from '@/lib/videoEmbed';

export function TeacherMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryFormat, setSummaryFormat] = useState<'text' | 'html'>('text');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    getChaptersBySubject(subjectId).then(setChapters);
    getMaterialsBySubject(subjectId).then(setMaterials);
    setChapterId('');
    setTopicId('');
    setSubtopicId('');
    setEditingId(null);
    resetForm();
  }, [subjectId]);

  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const selectedTopic = selectedChapter?.topics.find((t) => t.id === topicId);

  // Sisipkan teks ke posisi cursor di textarea ringkasan
  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setSummary((s) => s + (s ? '\n' : '') + text);
      return;
    }
    const start = el.selectionStart ?? summary.length;
    const end = el.selectionEnd ?? summary.length;
    const newSummary = summary.slice(0, start) + text + summary.slice(end);
    setSummary(newSummary);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const promptInsertImage = () => {
    const url = window.prompt('Masukkan URL gambar (JPG/PNG/WebP):');
    if (!url) return;
    if (summaryFormat === 'html') {
      insertAtCursor(`<img src="${url}" alt="Gambar" style="max-width:100%;border-radius:12px;margin:8px 0" />`);
    } else {
      // Saat mode teks, otomatis ganti ke HTML supaya gambar bisa tampil
      setSummaryFormat('html');
      insertAtCursor(`<img src="${url}" alt="Gambar" style="max-width:100%;border-radius:12px;margin:8px 0" />`);
      toast({ title: 'Mode diubah ke HTML', description: 'Gambar otomatis disisipkan sebagai tag HTML.' });
    }
  };

  const promptInsertPdf = () => {
    const url = window.prompt('Masukkan URL PDF (mis. link Drive atau URL file .pdf):');
    if (!url) return;
    setPdfUrl(url);
    toast({ title: 'Tautan PDF tersimpan', description: 'PDF akan muncul di halaman materi siswa.' });
  };

  const promptInsertYoutube = () => {
    const url = window.prompt('Masukkan URL YouTube:');
    if (!url) return;
    setVideoUrl(url);
    toast({ title: 'Video YouTube tersimpan' });
  };

  const promptInsertDrive = () => {
    const url = window.prompt('Masukkan link Google Drive video:');
    if (!url) return;
    setVideoUrl(url);
    toast({ title: 'Video Drive tersimpan' });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setPdfUrl('');
    setSummary('');
    setSummaryFormat('text');
    setEditingId(null);
  };

  const handleEdit = (m: Material) => {
    setChapterId(m.chapterId);
    setTopicId(m.topicId);
    setSubtopicId(m.subtopicId || '');
    setTitle(m.title);
    setDescription(m.description);
    setVideoUrl(m.videoUrl || '');
    setPdfUrl(m.pdfUrl || '');
    setSummary(m.summary);
    setSummaryFormat(m.summaryFormat || 'text');
    setEditingId(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // Normalisasi URL video apapun ke embed
      const finalVideo = videoUrl ? convertToEmbed(videoUrl).embedUrl : '';
      const payload = {
        subjectId,
        chapterId,
        topicId,
        subtopicId,
        title: title.trim(),
        description: description.trim(),
        videoUrl: finalVideo,
        pdfUrl: pdfUrl.trim() || undefined,
        summary: summary.trim(),
        summaryFormat,
        createdBy: user.id,
      };

      if (editingId) {
        await updateMaterial(editingId, payload);
        toast({ title: 'Materi diperbarui', description: title });
      } else {
        await createMaterial(payload);
        toast({ title: 'Materi berhasil ditambahkan', description: title });
      }
      resetForm();
      setMaterials(await getMaterialsBySubject(subjectId));
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, t: string) => {
    if (!window.confirm(`Hapus materi "${t}"? Kuis terkait juga akan dihapus.`)) return;
    await deleteMaterial(id);
    setMaterials(await getMaterialsBySubject(subjectId));
    toast({ title: 'Materi dihapus' });
  };

  const videoPreview = videoUrl ? convertToEmbed(videoUrl) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Kelola Materi</h1>
        <p className="text-muted-foreground mt-1">
          Tambahkan materi baru lengkap dengan video multi-platform, PDF, dan ringkasan HTML.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="border-2 rounded-3xl lg:col-span-3">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between font-bold text-lg mb-2">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  {editingId ? 'Edit Materi' : 'Materi Baru'}
                </div>
                {editingId && (
                  <Button variant="ghost" size="sm" onClick={resetForm} type="button" className="text-muted-foreground h-8">
                    Batal Edit
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Mata Pelajaran</Label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger data-testid="select-subject"><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.emoji} {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bab</Label>
                  <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                    <SelectTrigger data-testid="select-chapter"><SelectValue placeholder="Pilih bab" /></SelectTrigger>
                    <SelectContent>
                      {chapters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Topik</Label>
                  <Select value={topicId} onValueChange={setTopicId} disabled={!selectedChapter}>
                    <SelectTrigger data-testid="select-topic"><SelectValue placeholder="Pilih topik" /></SelectTrigger>
                    <SelectContent>
                      {selectedChapter?.topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subtopik</Label>
                  <Select value={subtopicId} onValueChange={setSubtopicId} disabled={!selectedTopic}>
                    <SelectTrigger data-testid="select-subtopic"><SelectValue placeholder="Pilih subtopik" /></SelectTrigger>
                    <SelectContent>
                      {selectedTopic?.subtopics.map((st) => (
                        <SelectItem key={st.id} value={st.id}>{st.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Judul Materi</Label>
                <Input
                  id="title"
                  data-testid="input-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Mengenal Bilangan Bulat"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Deskripsi Singkat</Label>
                <Input
                  id="desc"
                  data-testid="input-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Satu kalimat menarik untuk siswa..."
                  required
                />
              </div>

              {/* Video + PDF */}
              <div className="space-y-2 rounded-2xl border border-dashed p-4">
                <div className="flex items-center justify-between">
                  <Label>Media Pendukung</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={promptInsertYoutube} data-testid="btn-insert-yt">
                      <Youtube className="h-3.5 w-3.5 mr-1" /> YouTube
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={promptInsertDrive} data-testid="btn-insert-drive">
                      <HardDrive className="h-3.5 w-3.5 mr-1" /> Drive
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={promptInsertPdf} data-testid="btn-insert-pdf">
                      <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="URL video (YouTube, Drive, Vimeo, .mp4)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  data-testid="input-video"
                />
                {videoPreview && videoPreview.embedUrl && (
                  <div className="text-xs text-muted-foreground">
                    Terdeteksi: <span className="font-semibold text-foreground">{getVideoKindLabel(videoPreview.kind)}</span>
                  </div>
                )}
                <Input
                  placeholder="URL PDF (opsional)"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  data-testid="input-pdf"
                />
              </div>

              {/* Ringkasan: Tabs Text / HTML / Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ringkasan Materi</Label>
                  <Button type="button" size="sm" variant="outline" onClick={promptInsertImage} data-testid="btn-insert-img">
                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Sisipkan Gambar
                  </Button>
                </div>
                <Tabs value={summaryFormat === 'html' ? 'html' : 'text'} onValueChange={(v) => setSummaryFormat(v === 'html' ? 'html' : 'text')}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="text" data-testid="tab-text"><TypeIcon className="h-3.5 w-3.5 mr-1.5" /> Text</TabsTrigger>
                    <TabsTrigger value="html" data-testid="tab-html"><CodeIcon className="h-3.5 w-3.5 mr-1.5" /> HTML</TabsTrigger>
                    <TabsTrigger value="preview" data-testid="tab-preview"><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="text" className="mt-2">
                    <Textarea
                      ref={textareaRef}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Tulis ringkasan dengan bahasa yang mudah dipahami siswa..."
                      rows={8}
                      data-testid="textarea-summary-text"
                    />
                  </TabsContent>
                  <TabsContent value="html" className="mt-2">
                    <Textarea
                      ref={summaryFormat === 'html' ? textareaRef : undefined}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="<h3>Judul</h3><p>Isi materi dengan <strong>format HTML</strong>...</p>"
                      rows={8}
                      className="font-mono text-sm"
                      data-testid="textarea-summary-html"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Tip: gunakan tag seperti &lt;h3&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;img&gt; agar tampilan menarik.
                    </p>
                  </TabsContent>
                  <TabsContent value="preview" className="mt-2">
                    <div className="rounded-xl border bg-card p-4 min-h-[200px]">
                      {summary ? (
                        summaryFormat === 'html' ? (
                          <div className="material-html" dangerouslySetInnerHTML={{ __html: summary }} />
                        ) : (
                          <p className="whitespace-pre-line">{summary}</p>
                        )
                      ) : (
                        <div className="text-sm text-muted-foreground italic">Preview kosong — tulis ringkasan dulu.</div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Button
                type="submit"
                disabled={saving || !subjectId || !chapterId || !topicId || !summary.trim()}
                className="w-full h-12 font-bold"
                data-testid="button-save-material"
              >
                {saving ? 'Menyimpan...' : editingId ? 'Perbarui Materi' : 'Simpan Materi'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing list */}
        <Card className="border-2 rounded-3xl lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 font-bold mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              Materi yang Sudah Ada
              {subjectId && <span className="text-xs text-muted-foreground font-normal">({materials.length})</span>}
            </div>
            {!subjectId ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Pilih mata pelajaran untuk melihat materi.
              </div>
            ) : materials.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Belum ada materi di mapel ini.
              </div>
            ) : (
              <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {materials.map((m) => (
                  <li key={m.id} className="rounded-2xl border border-border p-3 text-sm flex items-start justify-between gap-2" data-testid={`material-${m.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</div>
                      <div className="flex gap-1.5 mt-1.5 text-[10px]">
                        {m.videoUrl && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">🎬 Video</span>}
                        {m.pdfUrl && <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold">📄 PDF</span>}
                        {m.summaryFormat === 'html' && <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-bold">HTML</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(m)} data-testid={`edit-material-${m.id}`} className="h-8 w-8">
                        <CodeIcon className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id, m.title)} data-testid={`delete-material-${m.id}`} className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
