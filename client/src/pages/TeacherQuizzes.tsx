import { useEffect, useState } from 'react';
import {
  getSubjects,
  getMaterialsBySubject,
  createQuiz,
  getQuizzesByMaterial,
  deleteQuiz,
  getChaptersBySubject,
} from '@/services/dataStore';
import type { Subject, Material, Quiz, QuizQuestion, QuestionType, TrueFalseStatement, Chapter } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Check, Sparkles, ClipboardList, CheckCheck, ListChecks, Image as ImageIcon, Bold, List, Calculator, ClipboardPaste, FileSpreadsheet, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LatexRenderer } from '@/components/LatexRenderer';

// ---- Draft types (memungkinkan editing offline sebelum save) ----
interface DraftOption {
  id: string;
  text: string;
}
interface DraftQ {
  id: string;
  type: QuestionType;
  question: string;
  points: number;
  explanation: string;
  // MCQ & MCQ-multi
  options: DraftOption[];
  correctOptionId: string; // for mcq
  correctOptionIds: string[]; // for mcq-multi
  // True-false
  statements: TrueFalseStatement[];
}

const uid = () => Math.random().toString(36).slice(2, 8);

const emptyQ = (type: QuestionType): DraftQ => {
  const base = {
    id: uid(),
    type,
    question: '',
    points: 10,
    explanation: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
    correctOptionId: 'a',
    correctOptionIds: [] as string[],
    statements: [
      { id: 's1', text: '', isTrue: true },
      { id: 's2', text: '', isTrue: false },
      { id: 's3', text: '', isTrue: true },
    ] as TrueFalseStatement[],
  };
  return base;
};

export function TeacherQuizzesPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [existingQuizzes, setExistingQuizzes] = useState<Quiz[]>([]);

  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(120);
  const [questions, setQuestions] = useState<DraftQ[]>([emptyQ('mcq')]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      setMaterials([]);
      setChapterId('');
      setTopicId('');
      setSubtopicId('');
      setMaterialId('');
      return;
    }
    getChaptersBySubject(subjectId).then(setChapters);
    getMaterialsBySubject(subjectId).then(setMaterials);
    setChapterId('');
    setTopicId('');
    setSubtopicId('');
    setMaterialId('');
  }, [subjectId]);

  useEffect(() => {
    setTopicId('');
    setSubtopicId('');
    setMaterialId('');
  }, [chapterId]);

  useEffect(() => {
    setSubtopicId('');
    setMaterialId('');
  }, [topicId]);

  useEffect(() => {
    if (!subtopicId) {
      setMaterialId('');
      setQuizTitle('');
      return;
    }
    const mat = materials.find((m) => m.subtopicId === subtopicId);
    setMaterialId(mat ? mat.id : '');

    const selectedChapter = chapters.find((c) => c.id === chapterId);
    const selectedTopic = selectedChapter?.topics.find((t) => t.id === topicId);
    const selectedSubtopic = selectedTopic?.subtopics.find((st) => st.id === subtopicId);
    if (selectedSubtopic) {
      setQuizTitle(selectedSubtopic.title);
    } else {
      setQuizTitle('');
    }
  }, [subtopicId, materials, chapters, chapterId, topicId]);

  useEffect(() => {
    if (materialId) getQuizzesByMaterial(materialId).then(setExistingQuizzes);
    else setExistingQuizzes([]);
  }, [materialId]);

  const updateQ = (id: string, patch: Partial<DraftQ>) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const changeType = (id: string, type: QuestionType) => {
    if (type === 'essay') return; // Essay removed
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...emptyQ(type), id: q.id, question: q.question, points: q.points } : q)));
  };

  // ---- Toolbar Functions ----
  const insertImage = (id: string) => {
    const url = window.prompt('Masukkan URL gambar:');
    if (!url) return;
    updateQ(id, { question: questions.find(q=>q.id===id)!.question + `\n<img src="${url}" alt="Gambar Soal" style="max-width:100%; border-radius:8px; margin-top:8px;" />\n` });
  };
  const insertMath = (id: string) => {
    const math = window.prompt('Masukkan formula (misal: x^2 + y^2 = r^2):');
    if (!math) return;
    updateQ(id, { question: questions.find(q=>q.id===id)!.question + ` <span style="font-family: math; font-size: 1.1em; font-weight: bold;">${math}</span> ` });
  };
  const insertList = (id: string) => {
    updateQ(id, { question: questions.find(q=>q.id===id)!.question + `\n<ul style="list-style-type: disc; margin-left: 20px;">\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n` });
  };
  const insertBold = (id: string) => {
    updateQ(id, { question: questions.find(q=>q.id===id)!.question + ` <strong>teks tebal</strong> ` });
  };
  // ---- Paste Options Function ----
  const handlePasteOptions = (id: string) => {
    const text = window.prompt('Paste teks opsi (contoh:\nA. Jawaban 1\nB. Jawaban 2\nC. Jawaban 3\nD. Jawaban 4):');
    if (!text) return;
    
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const newOptions: DraftOption[] = [];
    
    for (const line of lines) {
      const match = line.match(/^([a-eA-E])[\.\)]\s*(.*)/);
      if (match) {
        newOptions.push({ id: match[1].toLowerCase(), text: match[2] });
      } else {
        if (newOptions.length > 0) {
          newOptions[newOptions.length - 1].text += ' ' + line;
        } else {
          newOptions.push({ id: String.fromCharCode(97 + newOptions.length), text: line });
        }
      }
    }
    
    if (newOptions.length > 0) {
      updateQ(id, { options: newOptions });
      toast({ title: 'Opsi berhasil dipaste', description: `${newOptions.length} opsi ditambahkan.` });
    } else {
      toast({ title: 'Format tidak dikenali', description: 'Pastikan teks dimulai dengan A., B., dll.', variant: 'destructive' });
    }
  };

  // ---- Excel Import & Export Functions ----
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Petunjuk Pengisian
    const petunjukData = [
      ['PETUNJUK PENGISIAN TEMPLATE SOAL KUIS'],
      [''],
      ['1. Kolom "Tipe Soal" wajib diisi dengan salah satu dari:'],
      ['   - Pilihan Ganda (atau "mcq")'],
      ['   - Pilihan Ganda Kompleks (atau "mcq-multi")'],
      ['   - Benar Salah (atau "true-false")'],
      ['2. Kolom "Pertanyaan" berisi teks soal (Mendukung tag HTML sederhana seperti <strong>tebal</strong> jika perlu).'],
      ['3. Kolom "Poin" berisi angka skor/poin untuk soal tersebut (contoh: 10).'],
      ['4. Kolom "Penjelasan" (opsional) berisi pembahasan soal setelah dijawab.'],
      ['5. Pengisian Pilihan Ganda (Biasa & Kompleks):'],
      ['   - Isi pilihan jawaban pada kolom "Opsi A / Pernyataan 1" sampai "Opsi D" (Opsi E bersifat opsional).'],
      ['   - Kunci Jawaban (Pilihan Ganda): Tulis satu huruf pilihan yang benar (A / B / C / D / E). Contoh: A'],
      ['   - Kunci Jawaban (PG Kompleks): Tulis huruf pilihan yang benar dipisahkan koma. Contoh: A, C'],
      ['6. Pengisian Benar Salah (Wajib 3 Pernyataan):'],
      ['   - Kolom "Opsi A / Pernyataan 1" diisi Pernyataan ke-1'],
      ['   - Kolom "Opsi B / Pernyataan 2" diisi Pernyataan ke-2'],
      ['   - Kolom "Opsi C / Pernyataan 3" diisi Pernyataan ke-3'],
      ['   - Kolom "Opsi D" dan "Opsi E" dikosongkan.'],
      ['   - Kunci Jawaban: Tulis status Benar/Salah untuk masing-masing pernyataan berurutan dipisahkan koma.'],
      ['     Contoh: Benar, Salah, Benar (atau B, S, B)'],
      [''],
      ['CONTOH DATA:'],
      ['Tipe Soal', 'Pertanyaan', 'Poin', 'Penjelasan', 'Opsi A / Pernyataan 1', 'Opsi B / Pernyataan 2', 'Opsi C / Pernyataan 3', 'Opsi D', 'Opsi E', 'Kunci Jawaban'],
      ['Pilihan Ganda', 'Manakah yang termasuk bilangan bulat negatif?', 10, 'Bilangan bulat negatif bernilai kurang dari 0.', '5', '0', '-3', '1/2', '', 'C'],
      ['Pilihan Ganda Kompleks', 'Pilih semua bilangan yang termasuk bilangan prima!', 15, 'Bilangan prima hanya memiliki faktor 1 dan dirinya sendiri.', '2', '4', '5', '9', '11', 'A, C, E'],
      ['Benar Salah', 'Tentukan kebenaran dari pernyataan berikut!', 20, 'Bumi adalah planet ketiga. Matahari adalah bintang. Bulan adalah satelit bumi.', 'Bumi adalah planet ketiga dari Matahari', 'Matahari adalah planet terbesar', 'Bulan adalah satelit alami Bumi', '', '', 'Benar, Salah, Benar']
    ];
    
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
    
    // Sheet 2: Template Kosong
    const templateHeaders = [
      ['Tipe Soal', 'Pertanyaan', 'Poin', 'Penjelasan', 'Opsi A / Pernyataan 1', 'Opsi B / Pernyataan 2', 'Opsi C / Pernyataan 3', 'Opsi D', 'Opsi E', 'Kunci Jawaban']
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateHeaders);
    
    // Set widths
    const colsWidth = [
      { wch: 22 }, // Tipe Soal
      { wch: 45 }, // Pertanyaan
      { wch: 8 },  // Poin
      { wch: 30 }, // Penjelasan
      { wch: 30 }, // Opsi A / Pernyataan 1
      { wch: 30 }, // Opsi B / Pernyataan 2
      { wch: 30 }, // Opsi C / Pernyataan 3
      { wch: 15 }, // Opsi D
      { wch: 15 }, // Opsi E
      { wch: 20 }  // Kunci Jawaban
    ];
    wsPetunjuk['!cols'] = colsWidth;
    wsTemplate['!cols'] = colsWidth;
    
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk & Contoh');
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Kuis');
    
    XLSX.writeFile(wb, 'Template_Impor_Kuis_LMS.xlsx');
    toast({ title: 'Template Diunduh', description: 'Silakan isi template tersebut dan unggah kembali.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'binary' });
        // Cari sheet template kuis atau fallback ke sheet pertama
        const sheetName = workbook.SheetNames.find(
          name => name.toLowerCase().includes('template') || name.toLowerCase().includes('kuis') || name.toLowerCase().includes('soal')
        ) || workbook.SheetNames[0];
        
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);
        
        if (rows.length === 0) {
          toast({ title: 'File Kosong', description: 'Tidak ada data soal yang ditemukan di sheet kuis.', variant: 'destructive' });
          return;
        }
        
        const parsedQuestions: DraftQ[] = [];
        for (const row of rows) {
          const tipeRaw = String(row['Tipe Soal'] || '').trim().toLowerCase();
          const question = String(row['Pertanyaan'] || '').trim();
          const points = Number(row['Poin'] || 10);
          const explanation = String(row['Penjelasan'] || '').trim();
          const optA = String(row['Opsi A / Pernyataan 1'] || '').trim();
          const optB = String(row['Opsi B / Pernyataan 2'] || '').trim();
          const optC = String(row['Opsi C / Pernyataan 3'] || '').trim();
          const optD = String(row['Opsi D'] || '').trim();
          const optE = String(row['Opsi E'] || '').trim();
          const kunciRaw = String(row['Kunci Jawaban'] || '').trim();
          
          if (!question && !tipeRaw) continue;
          
          let type: QuestionType = 'mcq';
          if (tipeRaw.includes('kompleks') || tipeRaw.includes('multi')) {
            type = 'mcq-multi';
          } else if (tipeRaw.includes('benar') || tipeRaw.includes('salah') || tipeRaw.includes('false') || tipeRaw.includes('tf')) {
            type = 'true-false';
          }
          
          const id = uid();
          const draftQ: DraftQ = {
            id,
            type,
            question,
            points: isNaN(points) || points <= 0 ? 10 : points,
            explanation,
            options: [],
            correctOptionId: 'a',
            correctOptionIds: [],
            statements: []
          };
          
          if (type === 'mcq' || type === 'mcq-multi') {
            const optionsList = [
              { id: 'a', text: optA },
              { id: 'b', text: optB },
              { id: 'c', text: optC }
            ];
            if (optD) optionsList.push({ id: 'd', text: optD });
            if (optE) optionsList.push({ id: 'e', text: optE });
            
            draftQ.options = optionsList;
            
            if (type === 'mcq') {
              draftQ.correctOptionId = kunciRaw.toLowerCase();
            } else {
              draftQ.correctOptionIds = kunciRaw.split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
            }
          } else if (type === 'true-false') {
            const keys = kunciRaw.split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
            const isTrue = (val: string) => {
              return val === 'benar' || val === 'b' || val === 'true' || val === 't' || val === '1';
            };
            
            draftQ.statements = [
              { id: 's1', text: optA, isTrue: keys[0] ? isTrue(keys[0]) : true },
              { id: 's2', text: optB, isTrue: keys[1] ? isTrue(keys[1]) : false },
              { id: 's3', text: optC, isTrue: keys[2] ? isTrue(keys[2]) : true }
            ];
          }
          
          parsedQuestions.push(draftQ);
        }
        
        if (parsedQuestions.length === 0) {
          toast({ title: 'Impor Gagal', description: 'Tidak ada baris soal yang valid.', variant: 'destructive' });
          return;
        }
        
        const replace = window.confirm(`Berhasil membaca ${parsedQuestions.length} soal.\n\nKlik OK untuk MENGGANTIKAN semua soal saat ini.\nKlik Batal / Cancel untuk MENAMBAHKAN di akhir soal saat ini.`);
        
        if (replace) {
          setQuestions(parsedQuestions);
          toast({ title: 'Impor Berhasil', description: `${parsedQuestions.length} soal diimpor (menggantikan soal lama).` });
        } else {
          setQuestions(prev => {
            // Jika soal pertama kosong, ganti saja
            if (prev.length === 1 && prev[0].question === '' && prev[0].options.every(o => o.text === '')) {
              return parsedQuestions;
            }
            return [...prev, ...parsedQuestions];
          });
          toast({ title: 'Impor Berhasil', description: `${parsedQuestions.length} soal ditambahkan ke daftar.` });
        }
      } catch (err: any) {
        toast({ title: 'Gagal Membaca Excel', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input agar bisa upload file yang sama
  };

  // Validasi draft → QuizQuestion
  const buildQuestion = (q: DraftQ): QuizQuestion | string => {
    if (!q.question.trim()) return 'Pertanyaan wajib diisi';
    if (q.type === 'mcq') {
      if (q.options.some((o) => !o.text.trim())) return 'Semua pilihan harus diisi';
      if (!q.options.find((o) => o.id === q.correctOptionId)) return 'Pilih jawaban benar';
      return {
        id: q.id,
        type: 'mcq',
        question: q.question.trim(),
        options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
        correctOptionId: q.correctOptionId,
        points: q.points,
        explanation: q.explanation.trim() || undefined,
      };
    }
    if (q.type === 'mcq-multi') {
      if (q.options.some((o) => !o.text.trim())) return 'Semua pilihan harus diisi';
      if (q.correctOptionIds.length === 0) return 'Pilih minimal satu jawaban benar';
      return {
        id: q.id,
        type: 'mcq-multi',
        question: q.question.trim(),
        options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
        correctOptionIds: q.correctOptionIds,
        points: q.points,
        explanation: q.explanation.trim() || undefined,
      };
    }
    if (q.type === 'true-false') {
      if (q.statements.some((s) => !s.text.trim())) return 'Semua pernyataan harus diisi';
      return {
        id: q.id,
        type: 'true-false',
        question: q.question.trim(),
        statements: q.statements.map((s) => ({ ...s, text: s.text.trim() })),
        points: q.points,
        explanation: q.explanation.trim() || undefined,
      };
    }
    return 'Tipe soal tidak valid';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtopicId) {
      toast({ title: 'Pilih Sub Topik', description: 'Silakan pilih sub topik terlebih dahulu.', variant: 'destructive' });
      return;
    }
    if (!materialId) {
      toast({ title: 'Materi Belum Dibuat', description: 'Silakan buat materi untuk subtopik ini terlebih dahulu di menu Kelola Materi.', variant: 'destructive' });
      return;
    }
    const built: QuizQuestion[] = [];
    for (const q of questions) {
      const r = buildQuestion(q);
      if (typeof r === 'string') {
        toast({ title: `Soal belum lengkap`, description: r, variant: 'destructive' });
        return;
      }
      built.push(r);
    }
    setSaving(true);
    try {
      const mat = materials.find((m) => m.id === materialId)!;
      await createQuiz({
        title: quizTitle.trim(),
        materialId,
        subjectId: mat.subjectId,
        timeLimitSec: timeLimit,
        questions: built,
      });
      toast({ title: 'Kuis tersimpan', description: `${built.length} soal` });
      setSubtopicId('');
      setQuestions([emptyQ('mcq')]);
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (id: string, title: string) => {
    if (!window.confirm(`Hapus kuis "${title}"?`)) return;
    await deleteQuiz(id);
    if (materialId) setExistingQuizzes(await getQuizzesByMaterial(materialId));
    toast({ title: 'Kuis dihapus' });
  };

  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const selectedTopic = selectedChapter?.topics.find((t) => t.id === topicId);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Buat Kuis Interaktif</h1>
        <p className="text-muted-foreground mt-1">
          Dukungan tipe soal: pilihan ganda, pilihan ganda kompleks, dan benar-salah. Tersedia format HTML untuk soal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Informasi Kuis
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Mata Pelajaran</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger data-testid="select-quiz-subject"><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.emoji} {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bab</Label>
                <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                  <SelectTrigger data-testid="select-quiz-chapter"><SelectValue placeholder="Pilih bab" /></SelectTrigger>
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
                  <SelectTrigger data-testid="select-quiz-topic"><SelectValue placeholder="Pilih topik" /></SelectTrigger>
                  <SelectContent>
                    {selectedChapter?.topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sub Topik</Label>
                <Select value={subtopicId} onValueChange={setSubtopicId} disabled={!selectedTopic}>
                  <SelectTrigger data-testid="select-quiz-subtopic"><SelectValue placeholder="Pilih subtopik" /></SelectTrigger>
                  <SelectContent>
                    {selectedTopic?.subtopics.map((st) => (
                      <SelectItem key={st.id} value={st.id}>{st.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Batas Waktu (detik) — 0 = tanpa batas</Label>
                <Input
                  type="number"
                  min={0}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  data-testid="input-time-limit"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-3xl bg-muted/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
              <FileSpreadsheet className="h-5 w-5" />
              Impor Soal dari Excel (XLSX)
            </div>
            <p className="text-sm text-muted-foreground">
              Membuat kuis lebih cepat menggunakan spreadsheet! Unduh template Excel kami, isi soal-soal Anda, lalu unggah kembali di sini.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                className="h-11 rounded-xl border-2 flex items-center justify-center gap-2 hover:bg-primary/5"
              >
                <Download className="h-4 w-4" />
                Unduh Template Excel
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full h-11 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary/80 hover:bg-primary/5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <label htmlFor="excel-upload-input">
                    <Upload className="h-4 w-4 text-primary" />
                    Pilih & Unggah File Excel
                  </label>
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground">💡 Ketentuan Pengisian Template:</span>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li><strong className="text-foreground">Pilihan Ganda:</strong> Isi Opsi A-D (Opsi E opsional). Kunci: huruf pilihan (contoh: <code className="bg-muted px-1 py-0.5 rounded text-foreground">A</code>)</li>
                <li><strong className="text-foreground">Pilihan Ganda Kompleks:</strong> Kunci: huruf-huruf pilihan dipisahkan koma (contoh: <code className="bg-muted px-1 py-0.5 rounded text-foreground">A, C</code>)</li>
                <li><strong className="text-foreground">Benar Salah:</strong> Isi 3 Pernyataan di Opsi A-C. Kunci: status dipisahkan koma (contoh: <code className="bg-muted px-1 py-0.5 rounded text-foreground">Benar, Salah, Benar</code> atau <code className="bg-muted px-1 py-0.5 rounded text-foreground">B, S, B</code>)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-lg">Soal ({questions.length})</h2>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ('mcq')])} data-testid="btn-add-mcq">
                <Plus className="h-3.5 w-3.5 mr-1" /> Pilihan Ganda
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ('mcq-multi')])} data-testid="btn-add-mcq-multi">
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> PG Kompleks
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ('true-false')])} data-testid="btn-add-tf">
                <ListChecks className="h-3.5 w-3.5 mr-1" /> Benar-Salah
              </Button>
            </div>
          </div>

          {questions.map((q, idx) => (
            <Card key={q.id} className="border-2 rounded-3xl" data-testid={`question-card-${idx}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-extrabold">
                      {idx + 1}
                    </span>
                    Soal #{idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={q.type} onValueChange={(v) => changeType(q.id, v as QuestionType)}>
                      <SelectTrigger className="w-[180px]" data-testid={`select-type-${idx}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Pilihan Ganda</SelectItem>
                        <SelectItem value="mcq-multi">PG Kompleks</SelectItem>
                        <SelectItem value="true-false">Benar-Salah</SelectItem>
                      </SelectContent>
                    </Select>
                    {questions.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} data-testid={`button-remove-question-${idx}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Toolbar for Question Textarea */}
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="secondary" className="h-8 px-2" onClick={() => insertImage(q.id)} title="Sisipkan Gambar">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="h-8 px-2" onClick={() => insertList(q.id)} title="Daftar (List)">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="h-8 px-2" onClick={() => insertBold(q.id)} title="Teks Tebal (Bold)">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="h-8 px-2" onClick={() => insertMath(q.id)} title="Formula Matematika">
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                   <Textarea
                    value={q.question}
                    onChange={(e) => updateQ(q.id, { question: e.target.value })}
                    placeholder="Tulis pertanyaan... (Mendukung format HTML dan LaTeX seperti $x^2$ atau $$x^2$$)"
                    required
                    rows={3}
                    data-testid={`input-question-${idx}`}
                  />
                  {q.question.trim() && (
                    <div className="mt-2.5 p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-primary">Pratinjau Soal (Live Render HTML & LaTeX):</div>
                      <LatexRenderer html={q.question} className="text-sm leading-relaxed text-foreground" />
                      
                      {/* Option previews */}
                      {q.type === 'mcq' && q.options.some(o => o.text.trim()) && (
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                          {q.options.filter(o => o.text.trim()).map((o, i) => (
                            <div key={o.id} className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border ${q.correctOptionId === o.id ? 'bg-secondary/10 border-secondary/30 text-secondary-foreground' : 'bg-background border-border'}`}>
                              <span className="font-extrabold text-primary">{String.fromCharCode(65 + i)}.</span>
                              <LatexRenderer html={o.text} className="flex-1 font-semibold" />
                              {q.correctOptionId === o.id && <span className="text-[10px] font-bold bg-secondary text-white px-1.5 py-0.5 rounded">Benar</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {q.type === 'mcq-multi' && q.options.some(o => o.text.trim()) && (
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                          {q.options.filter(o => o.text.trim()).map((o, i) => {
                            const isCorrect = q.correctOptionIds.includes(o.id);
                            return (
                              <div key={o.id} className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border ${isCorrect ? 'bg-secondary/10 border-secondary/30 text-secondary-foreground' : 'bg-background border-border'}`}>
                                <span className="font-extrabold text-primary">{String.fromCharCode(65 + i)}.</span>
                                <LatexRenderer html={o.text} className="flex-1 font-semibold" />
                                {isCorrect && <span className="text-[10px] font-bold bg-secondary text-white px-1.5 py-0.5 rounded">Benar</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'true-false' && q.statements.some(s => s.text.trim()) && (
                        <div className="space-y-1.5 mt-2">
                          {q.statements.filter(s => s.text.trim()).map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2.5 text-xs bg-background p-2.5 rounded-xl border border-border">
                              <span className="font-bold text-muted-foreground w-4">{i + 1}.</span>
                              <LatexRenderer html={s.text} className="flex-1 font-semibold" />
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.isTrue ? 'bg-secondary/20 text-secondary-foreground' : 'bg-destructive/20 text-destructive-foreground'}`}>
                                {s.isTrue ? 'Benar' : 'Salah'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* MCQ */}
                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold">Opsi Jawaban:</div>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePasteOptions(q.id)}>
                        <ClipboardPaste className="h-3 w-3 mr-1" /> Paste Opsi
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {q.options.map((o, i) => (
                        <div
                          key={o.id}
                          className={`flex items-center gap-2 rounded-xl border-2 p-2 ${q.correctOptionId === o.id ? 'border-secondary bg-secondary/5' : 'border-border'}`}
                        >
                          <button
                            type="button"
                            onClick={() => updateQ(q.id, { correctOptionId: o.id })}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm ${q.correctOptionId === o.id ? 'bg-secondary text-white' : 'bg-muted'}`}
                            data-testid={`button-correct-${idx}-${o.id}`}
                            title="Tandai sebagai jawaban benar"
                          >
                            {q.correctOptionId === o.id ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + i)}
                          </button>
                          <Input
                            value={o.text}
                            onChange={(e) => updateQ(q.id, { options: q.options.map((x) => x.id === o.id ? { ...x, text: e.target.value } : x) })}
                            placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                            className="border-0 bg-transparent focus-visible:ring-0 px-0"
                            data-testid={`input-option-${idx}-${o.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MCQ multi */}
                {q.type === 'mcq-multi' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Klik kotak untuk menandai pilihan benar (boleh lebih dari satu):</div>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePasteOptions(q.id)}>
                        <ClipboardPaste className="h-3 w-3 mr-1" /> Paste Opsi
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {q.options.map((o, i) => {
                        const checked = q.correctOptionIds.includes(o.id);
                        return (
                          <div
                            key={o.id}
                            className={`flex items-center gap-2 rounded-xl border-2 p-2 ${checked ? 'border-secondary bg-secondary/5' : 'border-border'}`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateQ(q.id, {
                                  correctOptionIds: checked
                                    ? q.correctOptionIds.filter((x) => x !== o.id)
                                    : [...q.correctOptionIds, o.id],
                                })
                              }
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 font-bold text-sm ${checked ? 'bg-secondary border-secondary text-white' : 'bg-muted border-border'}`}
                              data-testid={`button-correct-multi-${idx}-${o.id}`}
                            >
                              {checked ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + i)}
                            </button>
                            <Input
                              value={o.text}
                              onChange={(e) => updateQ(q.id, { options: q.options.map((x) => x.id === o.id ? { ...x, text: e.target.value } : x) })}
                              placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                              className="border-0 bg-transparent focus-visible:ring-0 px-0"
                              data-testid={`input-option-multi-${idx}-${o.id}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* True-False */}
                {q.type === 'true-false' && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Tambahkan beberapa pernyataan. Tandai mana yang benar / salah:
                    </div>
                    <div className="space-y-2">
                      {q.statements.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 rounded-xl border-2 border-border p-2">
                          <span className="text-xs font-bold text-muted-foreground w-6 text-center">{i + 1}.</span>
                          <Input
                            value={s.text}
                            onChange={(e) => updateQ(q.id, { statements: q.statements.map((x) => x.id === s.id ? { ...x, text: e.target.value } : x) })}
                            placeholder="Tuliskan pernyataan..."
                            className="border-0 bg-transparent focus-visible:ring-0 px-0 flex-1"
                            data-testid={`input-statement-${idx}-${s.id}`}
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => updateQ(q.id, { statements: q.statements.map((x) => x.id === s.id ? { ...x, isTrue: true } : x) })}
                              className={`h-8 px-3 rounded-md border-2 text-xs font-bold ${s.isTrue ? 'bg-secondary border-secondary text-white' : 'border-border bg-background'}`}
                              data-testid={`btn-tf-true-${idx}-${s.id}`}
                            >
                              Benar
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQ(q.id, { statements: q.statements.map((x) => x.id === s.id ? { ...x, isTrue: false } : x) })}
                              className={`h-8 px-3 rounded-md border-2 text-xs font-bold ${!s.isTrue ? 'bg-destructive border-destructive text-white' : 'border-border bg-background'}`}
                              data-testid={`btn-tf-false-${idx}-${s.id}`}
                            >
                              Salah
                            </button>
                          </div>
                          {q.statements.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateQ(q.id, { statements: q.statements.filter((x) => x.id !== s.id) })}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updateQ(q.id, { statements: [...q.statements, { id: uid(), text: '', isTrue: true }] })}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Pernyataan
                    </Button>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 mt-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Poin</Label>
                    <Input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQ(q.id, { points: Number(e.target.value) })}
                      data-testid={`input-points-${idx}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Penjelasan (opsional)</Label>
                    <Input
                      value={q.explanation}
                      onChange={(e) => updateQ(q.id, { explanation: e.target.value })}
                      placeholder="Tampil setelah siswa menjawab"
                      data-testid={`input-explanation-${idx}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full h-12 font-extrabold text-base"
          data-testid="button-save-quiz"
        >
          {saving ? 'Menyimpan...' : `Simpan Kuis (${questions.length} soal)`}
        </Button>
      </form>

      {existingQuizzes.length > 0 && (
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 font-bold mb-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              Kuis yang sudah ada di materi ini
            </div>
            <ul className="space-y-2">
              {existingQuizzes.map((q) => (
                <li key={q.id} className="rounded-2xl border border-border p-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold">{q.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.questions.length} soal • {q.timeLimitSec}s
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteQuiz(q.id, q.title)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
