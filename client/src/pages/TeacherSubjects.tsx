import { useEffect, useState } from 'react';
import {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getAllChapters, createChapter, updateChapter, deleteChapter,
  addTopic, updateTopic, deleteTopic,
  addSubtopic, updateSubtopic, deleteSubtopic,
} from '@/services/dataStore';
import type { Subject, Chapter } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Save, X, BookOpen, Layers, ChevronRight } from 'lucide-react';

const GRADIENT_OPTIONS = [
  { value: 'bg-gradient-ocean', label: 'Ocean' },
  { value: 'bg-gradient-sunrise', label: 'Sunrise' },
  { value: 'bg-gradient-candy', label: 'Candy' },
  { value: 'bg-gradient-forest', label: 'Forest' },
];

export function TeacherSubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // add subject form
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📘');
  const [newColor, setNewColor] = useState('bg-gradient-ocean');
  const [newDesc, setNewDesc] = useState('');

  // edit subject
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectData, setEditSubjectData] = useState<Partial<Subject>>({});

  // new chapter
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // new topic per chapter
  const [newTopicInput, setNewTopicInput] = useState<Record<string, string>>({});
  const [newSubtopicInput, setNewSubtopicInput] = useState<Record<string, string>>({});

  const refresh = async () => {
    const [s, c] = await Promise.all([getSubjects(), getAllChapters()]);
    setSubjects(s);
    setChapters(c);
    if (!selectedSubjectId && s.length > 0) setSelectedSubjectId(s[0].id);
  };

  useEffect(() => {
    refresh();
  }, []);

  const subjectChapters = chapters.filter((c) => c.subjectId === selectedSubjectId).sort((a, b) => a.order - b.order);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleAddSubject = async () => {
    if (!newName.trim()) return;
    await createSubject({
      name: newName.trim(),
      slug: slugify(newName.trim()),
      emoji: newEmoji || '📘',
      color: newColor,
      description: newDesc.trim(),
    });
    toast({ title: 'Mapel ditambahkan', description: newName });
    setNewName(''); setNewEmoji('📘'); setNewDesc(''); setNewColor('bg-gradient-ocean');
    refresh();
  };

  const handleSaveEditSubject = async (id: string) => {
    await updateSubject(id, editSubjectData);
    toast({ title: 'Mapel diperbarui' });
    setEditingSubjectId(null); setEditSubjectData({});
    refresh();
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Hapus mapel "${name}"? Semua bab, materi, kuis di dalamnya juga akan hilang.`)) return;
    await deleteSubject(id);
    toast({ title: 'Mapel dihapus' });
    if (selectedSubjectId === id) setSelectedSubjectId('');
    refresh();
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim() || !selectedSubjectId) return;
    const nextOrder = subjectChapters.length + 1;
    await createChapter({
      subjectId: selectedSubjectId,
      title: newChapterTitle.trim(),
      order: nextOrder,
    });
    toast({ title: 'Bab ditambahkan' });
    setNewChapterTitle('');
    refresh();
  };

  const handleRenameChapter = async (id: string, oldTitle: string) => {
    const title = window.prompt('Ubah judul bab:', oldTitle);
    if (!title) return;
    await updateChapter(id, { title });
    refresh();
  };

  const handleDeleteChapter = async (id: string, title: string) => {
    if (!window.confirm(`Hapus bab "${title}"?`)) return;
    await deleteChapter(id);
    toast({ title: 'Bab dihapus' });
    refresh();
  };

  const handleAddTopic = async (chapterId: string) => {
    try {
      const t = (newTopicInput[chapterId] || '').trim();
      if (!t) return;
      await addTopic(chapterId, t);
      setNewTopicInput((s) => ({ ...s, [chapterId]: '' }));
      refresh();
      toast({ title: 'Topik ditambahkan' });
    } catch (e: any) {
      toast({ title: 'Gagal menambah topik', description: e.message, variant: 'destructive' });
      console.error(e);
    }
  };

  const handleAddSubtopic = async (chapterId: string, topicId: string) => {
    try {
      const key = `${chapterId}:${topicId}`;
      const t = (newSubtopicInput[key] || '').trim();
      if (!t) return;
      await addSubtopic(chapterId, topicId, t);
      setNewSubtopicInput((s) => ({ ...s, [key]: '' }));
      refresh();
      toast({ title: 'Subtopik ditambahkan' });
    } catch (e: any) {
      toast({ title: 'Gagal menambah subtopik', description: e.message, variant: 'destructive' });
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Manajemen Mapel</h1>
        <p className="text-muted-foreground mt-1">
          Kelola mata pelajaran lengkap dengan bab, topik, dan subtopik.
        </p>
      </div>

      {/* Tambah Mapel */}
      <Card className="border-2 rounded-3xl">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <Plus className="h-5 w-5 text-primary" /> Tambah Mapel Baru
          </div>
          <div className="grid gap-3 md:grid-cols-[2fr_80px_1fr_2fr_auto] items-end">
            <div className="space-y-1">
              <Label className="text-xs">Nama Mapel</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Misal: Bahasa Inggris" data-testid="input-new-subject-name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Emoji</Label>
              <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="📘" className="text-xl text-center" data-testid="input-new-subject-emoji" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Warna</Label>
              <Select value={newColor} onValueChange={setNewColor}>
                <SelectTrigger data-testid="select-new-subject-color"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADIENT_OPTIONS.map((g) => (<SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deskripsi</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Deskripsi singkat" data-testid="input-new-subject-desc" />
            </div>
            <Button onClick={handleAddSubject} disabled={!newName.trim()} className="font-bold" data-testid="button-add-subject">
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Mapel */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => {
          const isEditing = editingSubjectId === s.id;
          return (
            <Card
              key={s.id}
              className={`border-2 rounded-3xl cursor-pointer transition-all ${selectedSubjectId === s.id ? 'ring-2 ring-primary ring-offset-2' : 'hover-elevate'}`}
              onClick={() => !isEditing && setSelectedSubjectId(s.id)}
              data-testid={`card-subject-${s.id}`}
            >
              <div className={`${s.color} h-16 flex items-center justify-center text-4xl relative`}>
                <span aria-hidden>{s.emoji}</span>
                {selectedSubjectId === s.id && (
                  <span className="absolute top-2 right-2 bg-white/90 text-primary text-[10px] font-bold rounded-full px-2 py-0.5">
                    DIPILIH
                  </span>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editSubjectData.name ?? s.name}
                      onChange={(e) => setEditSubjectData((d) => ({ ...d, name: e.target.value, slug: slugify(e.target.value) }))}
                    />
                    <div className="flex gap-2">
                      <Input
                        value={editSubjectData.emoji ?? s.emoji}
                        onChange={(e) => setEditSubjectData((d) => ({ ...d, emoji: e.target.value }))}
                        className="w-16 text-center text-xl"
                      />
                      <Select
                        value={editSubjectData.color ?? s.color}
                        onValueChange={(v) => setEditSubjectData((d) => ({ ...d, color: v }))}
                      >
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRADIENT_OPTIONS.map((g) => (<SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={editSubjectData.description ?? s.description}
                      onChange={(e) => setEditSubjectData((d) => ({ ...d, description: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEditSubject(s.id)} className="flex-1"><Save className="h-3.5 w-3.5 mr-1" /> Simpan</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingSubjectId(null); setEditSubjectData({}); }}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{s.description}</div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => { setEditingSubjectId(s.id); setEditSubjectData({}); }} data-testid={`btn-edit-subject-${s.id}`}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteSubject(s.id, s.name)} data-testid={`btn-delete-subject-${s.id}`}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chapters / Topics / Subtopics untuk subject terpilih */}
      {selectedSubject && (
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Bab, Topik, & Subtopik — {selectedSubject.name}
            </div>

            <div className="flex gap-2">
              <Input
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Judul bab baru (misal: Bab 3 — Geometri)"
                data-testid="input-new-chapter"
              />
              <Button onClick={handleAddChapter} disabled={!newChapterTitle.trim()} data-testid="button-add-chapter">
                <Plus className="h-4 w-4 mr-1" /> Tambah Bab
              </Button>
            </div>

            {subjectChapters.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Belum ada bab. Tambahkan bab pertama di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {subjectChapters.map((c) => (
                  <div key={c.id} className="rounded-2xl border-2 border-border p-4 space-y-3" data-testid={`chapter-${c.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-base flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        {c.title}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleRenameChapter(c.id, c.title)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteChapter(c.id, c.title)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="pl-4 border-l-2 border-border space-y-2">
                      {c.topics.map((t) => (
                        <div key={t.id} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-semibold flex-1">{t.title}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                              const nt = window.prompt('Ubah topik:', t.title);
                              if (nt) { await updateTopic(c.id, t.id, nt); refresh(); }
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                              if (window.confirm(`Hapus topik "${t.title}"?`)) { await deleteTopic(c.id, t.id); refresh(); }
                            }}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>

                          {/* Subtopics */}
                          <div className="pl-6 space-y-1">
                            {t.subtopics.map((st) => (
                              <div key={st.id} className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">•</span>
                                <span className="flex-1">{st.title}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={async () => {
                                  const ns = window.prompt('Ubah subtopik:', st.title);
                                  if (ns) { await updateSubtopic(c.id, t.id, st.id, ns); refresh(); }
                                }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={async () => {
                                  if (window.confirm(`Hapus subtopik "${st.title}"?`)) { await deleteSubtopic(c.id, t.id, st.id); refresh(); }
                                }}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-1 pt-1">
                              <Input
                                value={newSubtopicInput[`${c.id}:${t.id}`] || ''}
                                onChange={(e) => setNewSubtopicInput((s) => ({ ...s, [`${c.id}:${t.id}`]: e.target.value }))}
                                placeholder="Subtopik baru..."
                                className="h-8 text-sm"
                              />
                              <Button size="sm" variant="outline" className="h-8" onClick={() => handleAddSubtopic(c.id, t.id)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-1 pt-1">
                        <Input
                          value={newTopicInput[c.id] || ''}
                          onChange={(e) => setNewTopicInput((s) => ({ ...s, [c.id]: e.target.value }))}
                          placeholder="Topik baru..."
                          className="h-8 text-sm"
                        />
                        <Button size="sm" variant="outline" className="h-8" onClick={() => handleAddTopic(c.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Topik
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
