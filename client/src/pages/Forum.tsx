import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import {
  getSubjects,
  getPostsBySubject,
  createPost,
  deletePost,
  getComments,
  createComment,
  subscribe,
} from '@/services/dataStore';
import type { Subject, Post, Comment } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Trash2, ArrowLeft, Plus } from 'lucide-react';

/* ---------- FORUM INDEX (subject picker + posts) ---------- */
export function ForumPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('mtk');
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const p = await getPostsBySubject(activeSubjectId);
      if (mounted) setPosts(p);
    };
    load();
    const unsub = subscribe(load);
    return () => {
      mounted = false;
      unsub();
    };
  }, [activeSubjectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    await createPost({
      subjectId: activeSubjectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userAvatar: user.avatar,
      title: title.trim(),
      body: body.trim(),
    });
    setTitle('');
    setBody('');
    setComposeOpen(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Hapus pertanyaan ini?')) return;
    await deletePost(postId);
  };

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-8 space-y-5">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Forum Diskusi</h1>
        <p className="text-muted-foreground mt-1">
          Tempat bertanya dan berbagi. Ingat ya, tetap santun dan saling membantu!
        </p>
      </div>

      {/* Subject tabs */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSubjectId(s.id)}
            data-testid={`tab-subject-${s.id}`}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition border-2 ${
              activeSubjectId === s.id
                ? `${s.color} text-white border-transparent shadow-playful`
                : 'bg-card border-border hover-elevate'
            }`}
          >
            <span className="text-lg">{s.emoji}</span>
            {s.name}
          </button>
        ))}
      </div>

      {/* Compose */}
      {user && (
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-4">
            {!composeOpen ? (
              <button
                onClick={() => setComposeOpen(true)}
                data-testid="button-open-compose"
                className="flex w-full items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left hover-elevate text-muted-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-semibold">Punya pertanyaan tentang {activeSubject?.name}? Tanya di sini...</span>
              </button>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul pertanyaan..."
                  required
                  data-testid="input-post-title"
                  className="font-bold"
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Jelaskan lebih detail..."
                  required
                  rows={3}
                  data-testid="input-post-body"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setComposeOpen(false);
                      setTitle('');
                      setBody('');
                    }}
                    data-testid="button-cancel-post"
                  >
                    Batal
                  </Button>
                  <Button type="submit" data-testid="button-submit-post">
                    <Send className="h-4 w-4 mr-2" /> Kirim
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <div>Belum ada pertanyaan di mapel ini. Jadi yang pertama bertanya!</div>
          </div>
        ) : (
          posts.map((p) => (
            <Card key={p.id} className="border-2 rounded-3xl" data-testid={`post-${p.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    {p.userAvatar.startsWith('data:') ? <img src={p.userAvatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <div className="text-3xl">{p.userAvatar}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{p.userName}</span>
                      {p.userRole === 'guru' && (
                        <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                          Guru
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(p.createdAt)}
                      </span>
                    </div>
                    <Link
                      href={`/forum/${p.id}`}
                      className="block font-bold text-lg mt-1 hover:text-primary"
                      data-testid={`link-post-${p.id}`}
                    >
                      {p.title}
                    </Link>
                    <p className="text-sm text-foreground/80 mt-1 line-clamp-2">{p.body}</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <Link
                        href={`/forum/${p.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {p.commentCount} komentar
                      </Link>
                      {user?.role === 'guru' && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="flex items-center gap-1 text-xs font-bold text-destructive hover:underline"
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Moderasi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- FORUM POST DETAIL ---------- */
export function ForumPostPage() {
  const [, params] = useRoute<{ id: string }>('/forum/:id');
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!params?.id) return;
    let mounted = true;
    const load = async () => {
      // Find post via subject list (cheap in demo)
      const subs = await getSubjects();
      for (const s of subs) {
        const posts = await getPostsBySubject(s.id);
        const found = posts.find((p) => p.id === params.id);
        if (found) {
          if (mounted) setPost(found);
          break;
        }
      }
      const c = await getComments(params.id);
      if (mounted) setComments(c);
    };
    load();
    const unsub = subscribe(load);
    return () => {
      mounted = false;
      unsub();
    };
  }, [params?.id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !text.trim()) return;
    await createComment({
      postId: post.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userAvatar: user.avatar,
      body: text.trim(),
    });
    setText('');
  };

  if (!post) {
    return <div className="p-10 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-8 space-y-5">
      <Link
        href="/forum"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
        data-testid="link-back-forum"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Forum
      </Link>

      <Card className="border-2 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              {post.userAvatar.startsWith('data:') ? <img src={post.userAvatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <div className="text-4xl">{post.userAvatar}</div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">{post.userName}</span>
                {post.userRole === 'guru' && (
                  <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    Guru
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{relativeTime(post.createdAt)}</span>
              </div>
              <h1 className="text-2xl font-extrabold mt-1">{post.title}</h1>
              <p className="text-foreground/90 mt-3 whitespace-pre-line">{post.body}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="font-bold mb-3 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {comments.length} Jawaban
        </div>
        <div className="space-y-2">
          {comments.map((c) => (
            <Card
              key={c.id}
              className={`border-2 rounded-2xl ${c.userRole === 'guru' ? 'border-primary/40 bg-primary/5' : ''}`}
              data-testid={`comment-${c.id}`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  {c.userAvatar.startsWith('data:') ? <img src={c.userAvatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <div className="text-2xl">{c.userAvatar}</div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{c.userName}</span>
                    {c.userRole === 'guru' && (
                      <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        ⭐ Guru
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{relativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-1 whitespace-pre-line">{c.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {user && (
        <Card className="border-2 rounded-3xl">
          <CardContent className="p-4">
            <form onSubmit={handleComment} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center mt-1">
                {user.avatar.startsWith('data:') ? <img src={user.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <div className="text-2xl">{user.avatar}</div>}
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={user.role === 'guru' ? 'Bantu jawab pertanyaan siswa...' : 'Tulis jawaban atau komentar...'}
                  rows={2}
                  required
                  data-testid="input-comment"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" data-testid="button-submit-comment">
                    <Send className="h-3.5 w-3.5 mr-2" /> Kirim Jawaban
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
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
