import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, adminChangeUserPassword, demoPasswordMap } from '@/services/dataStore';
import type { AppUser, Role } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Save, X, Users, Search, Building, KeyRound, Eye, EyeOff, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { getSchools, createSchool, updateSchool, deleteSchool } from '@/services/dataStore';
import type { School } from '@/lib/mockData';
import * as XLSX from 'xlsx';
import { DEMO_MODE } from '@/lib/firebase';

export function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filter, setFilter] = useState('');

  // add user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addUserPassword, setAddUserPassword] = useState('123456');
  const [addShowPassword, setAddShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<Role>('siswa');
  const [newKelas, setNewKelas] = useState('');
  const [newSekolahId, setNewSekolahId] = useState('');

  // edit user
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<Partial<AppUser>>({});

  // change password
  const [changingPasswordUserId, setChangingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // schools
  const [schools, setSchools] = useState<School[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editSchoolData, setEditSchoolData] = useState<Partial<School>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const processImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 400;
          if (width > height && width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
          else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas ctx null'));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleSchoolLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const webpDataUrl = await processImage(file);
      setEditSchoolData(d => ({ ...d, logo: webpDataUrl }));
      toast({ title: 'Berhasil', description: 'Logo sekolah siap disimpan' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memproses logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const refresh = async () => {
    const fetchedUsers = await getAllUsers();
    const fetchedSchools = await getSchools();
    setUsers(fetchedUsers);
    setSchools(fetchedSchools);
    if (fetchedSchools.length > 0 && !newSekolahId) {
      setNewSekolahId(fetchedSchools[0].id);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || (!newSekolahId && newRole !== 'administrator')) return;
    try {
      const created = await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        kelas: newRole === 'siswa' ? newKelas.trim() : undefined,
        sekolahId: newRole !== 'administrator' ? newSekolahId : undefined,
        avatar: newRole === 'administrator' ? '👨‍💼' : newRole === 'guru' ? '👩‍🏫' : '🙂',
      }, addUserPassword.trim());
      toast({ title: 'Pengguna ditambahkan', description: newName });
      setNewName(''); setNewEmail(''); setAddUserPassword('123456'); setNewRole('siswa'); setNewKelas('');
      refresh();
    } catch (e: any) {
      let msg = e.message;
      if (msg.includes('email-already-in-use')) {
        msg = 'Email ini sudah terdaftar di Firebase Authentication. Jika Anda baru saja menghapus pengguna ini, Anda juga harus menghapusnya secara manual di Firebase Console -> Authentication sebelum mendaftarkannya kembali.';
      }
      toast({ title: 'Gagal menambah pengguna', description: msg, variant: 'destructive' });
    }
  };

  const handleSaveEditUser = async (id: string) => {
    try {
      await updateUser(id, editUserData);
      toast({ title: 'Pengguna diperbarui' });
      setEditingUserId(null); setEditUserData({});
      refresh();
    } catch (e: any) {
      toast({ title: 'Gagal memperbarui pengguna', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Hapus pengguna "${name}"? Data yang terkait mungkin akan kehilangan referensi.`)) return;
    try {
      await deleteUser(id);
      if (DEMO_MODE) {
        toast({ title: 'Pengguna dihapus' });
      } else {
        toast({
          title: 'Pengguna dihapus dari database',
          description: `Catatan database berhasil dihapus. Agar pengguna tidak bisa login lagi, hapus akun autentikasinya secara manual di Firebase Console menggunakan UID berikut: ${id}`,
          duration: 10000,
        });
      }
      refresh();
    } catch (e: any) {
      toast({ title: 'Gagal menghapus pengguna', description: e.message, variant: 'destructive' });
    }
  };

  const handleChangePassword = async (user: AppUser) => {
    if (newPassword.length < 6) {
      toast({ title: 'Password terlalu pendek', description: 'Minimal 6 karakter.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Password tidak cocok', description: 'Pastikan konfirmasi password sama.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      const result = await adminChangeUserPassword(user.id, user.email, newPassword);
      if (result === 'demo_set') {
        toast({ title: 'Password Berhasil Diubah', description: `Password untuk "${user.name}" telah diperbarui (demo mode).` });
      } else {
        toast({ title: 'Email Reset Terkirim', description: `Link reset password telah dikirim ke ${user.email}.` });
      }
      setChangingPasswordUserId(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast({ title: 'Gagal Mengubah Password', description: e.message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddSchool = async () => {
    if (!newSchoolName.trim()) return;
    try {
      await createSchool({ name: newSchoolName.trim(), address: newSchoolAddress.trim() });
      toast({ title: 'Sekolah ditambahkan' });
      setNewSchoolName(''); setNewSchoolAddress('');
      refresh();
    } catch (e: any) {
      toast({ title: 'Gagal menambah sekolah', description: e.message, variant: 'destructive' });
    }
  };

  const handleSaveEditSchool = async (id: string) => {
    try {
      await updateSchool(id, editSchoolData);
      toast({ title: 'Sekolah diperbarui' });
      setEditingSchoolId(null); setEditSchoolData({});
      refresh();
    } catch (e: any) {
      toast({ title: 'Gagal memperbarui sekolah', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (!window.confirm(`Hapus sekolah "${name}"?`)) return;
    try {
      await deleteSchool(id);
      toast({ title: 'Sekolah dihapus' });
      refresh();
    } catch (e: any) {
      toast({ title: 'Gagal menghapus sekolah', description: e.message, variant: 'destructive' });
    }
  };

  // ---- Excel Template & Import ----
  const downloadUserTemplate = () => {
    const wb = XLSX.utils.book_new();

    const petunjukData = [
      ['PETUNJUK IMPOR PENGGUNA MASSAL'],
      [''],
      ['Kolom yang tersedia:'],
      ['- Nama Lengkap   : Wajib diisi'],
      ['- Email          : Wajib diisi, harus unik'],
      ['- Password       : Wajib diisi, minimal 6 karakter'],
      ['- Peran          : siswa / guru / administrator'],
      ['- Kelas          : Isi jika Peran = siswa (contoh: 6A)'],
      ['- Nama Sekolah   : Nama sekolah yang sudah ada di sistem (kosongkan untuk admin)'],
      [''],
      ['CONTOH DATA:'],
      ['Nama Lengkap', 'Email', 'Password', 'Peran', 'Kelas', 'Nama Sekolah'],
      ['Budi Santoso', 'budi@sekolah.id', 'budi1234', 'siswa', '6A', 'SDN 1 Bendang'],
      ['Siti Rahayu', 'siti@sekolah.id', 'siti5678', 'guru', '', 'SDN 1 Bendang'],
      ['Ahmad Fauzi', 'ahmad@sekolah.id', 'ahmad123', 'siswa', '6B', 'SDN 2 Pasean'],
    ];

    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
    wsPetunjuk['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 25 }
    ];

    const templateHeaders = [
      ['Nama Lengkap', 'Email', 'Password', 'Peran', 'Kelas', 'Nama Sekolah']
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateHeaders);
    wsTemplate['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk & Contoh');
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Pengguna');
    XLSX.writeFile(wb, 'Template_Impor_Pengguna_LMS.xlsx');
    toast({ title: 'Template Diunduh', description: 'Isi template lalu unggah kembali.' });
  };

  const handleUserFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames.find(
          n => n.toLowerCase().includes('template') || n.toLowerCase().includes('pengguna')
        ) || workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
        if (rows.length === 0) {
          toast({ title: 'File Kosong', description: 'Tidak ada data yang ditemukan.', variant: 'destructive' });
          return;
        }

        let successCount = 0;
        let failCount = 0;
        for (const row of rows) {
          const name = String(row['Nama Lengkap'] || '').trim();
          const email = String(row['Email'] || '').trim();
          const password = String(row['Password'] || '').trim();
          const roleRaw = String(row['Peran'] || 'siswa').trim().toLowerCase();
          const kelas = String(row['Kelas'] || '').trim();
          const namaSekolah = String(row['Nama Sekolah'] || '').trim();

          if (!name || !email) { failCount++; continue; }

          const role: Role = roleRaw === 'guru' ? 'guru' : roleRaw === 'administrator' || roleRaw === 'admin' ? 'administrator' : 'siswa';
          const sekolah = schools.find(s => s.name.toLowerCase() === namaSekolah.toLowerCase());
          const sekolahId = sekolah?.id;

          try {
            const created = await createUser({
              name,
              email,
              role,
              kelas: role === 'siswa' && kelas ? kelas : undefined,
              sekolahId: role !== 'administrator' && sekolahId ? sekolahId : undefined,
              avatar: role === 'administrator' ? '👨‍💼' : role === 'guru' ? '👩‍🏫' : '🙂',
            }, password);
            successCount++;
          } catch {
            failCount++;
          }
        }

        toast({
          title: 'Impor Selesai',
          description: `${successCount} pengguna berhasil, ${failCount} gagal/dilewati.`,
        });
        refresh();
      } catch (err: any) {
        toast({ title: 'Gagal Membaca Excel', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(filter.toLowerCase()) || u.email.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" /> Manajemen Sistem
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola data pengguna dan instansi sekolah.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="schools">Sekolah</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 mt-6">

      {/* Tambah Pengguna */}
      <Card className="border-2 rounded-3xl">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <Plus className="h-5 w-5 text-primary" /> Tambah Pengguna Baru
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Nama Lengkap</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama pengguna" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@sekolah.id" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  type={addShowPassword ? 'text' : 'password'}
                  value={addUserPassword}
                  onChange={(e) => setAddUserPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setAddShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {addShowPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Peran</Label>
              <Select value={newRole} onValueChange={(val: Role) => setNewRole(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="siswa">Siswa</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="administrator">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kelas (Siswa)</Label>
              <Input value={newKelas} onChange={(e) => setNewKelas(e.target.value)} placeholder="Misal: 6A" disabled={newRole !== 'siswa'} />
            </div>
            {newRole !== 'administrator' && (
              <div className="space-y-1">
                <Label className="text-xs">Sekolah</Label>
                <Select value={newSekolahId} onValueChange={setNewSekolahId}>
                  <SelectTrigger><SelectValue placeholder="Pilih sekolah" /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button
            onClick={handleAddUser}
            disabled={!newName.trim() || !newEmail.trim() || addUserPassword.length < 6 || (!newSekolahId && newRole !== 'administrator')}
            className="font-bold w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" /> Tambah Pengguna
          </Button>
        </CardContent>
      </Card>

      {/* Impor Massal via Excel */}
      <Card className="border-2 rounded-3xl bg-muted/20 border-dashed">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm">Impor Pengguna via Excel</h3>
                <p className="text-xs text-muted-foreground">Tambah banyak siswa atau guru sekaligus menggunakan template spreadsheet.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadUserTemplate}
              className="flex items-center gap-1 text-xs self-start sm:self-auto"
            >
              <Download className="h-3.5 w-3.5" /> Unduh Template
            </Button>
          </div>
          <div className="border border-dashed border-border rounded-2xl p-4 bg-background/50 flex flex-col items-center justify-center text-center gap-2 hover:bg-background transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleUserFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pilih atau Seret File Excel (xlsx)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mendukung format .xlsx atau .xls</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Daftar Pengguna */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((u) => {
          const isEditing = editingUserId === u.id;
          return (
            <Card key={u.id} className="border-2 rounded-3xl relative overflow-hidden hover-elevate transition-all">
              <div className={`absolute top-0 w-full h-2 ${u.role === 'administrator' ? 'bg-destructive' : u.role === 'guru' ? 'bg-warning' : 'bg-primary'}`} />
              <CardContent className="p-5 pt-6 space-y-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editUserData.name ?? u.name}
                      onChange={(e) => setEditUserData((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Nama Lengkap"
                    />
                    <Input
                      value={editUserData.email ?? u.email}
                      onChange={(e) => setEditUserData((d) => ({ ...d, email: e.target.value }))}
                      placeholder="Email"
                    />
                    <Select
                      value={editUserData.role ?? u.role}
                      onValueChange={(v: Role) => setEditUserData((d) => ({ ...d, role: v }))}
                    >
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siswa">Siswa</SelectItem>
                        <SelectItem value="guru">Guru</SelectItem>
                        <SelectItem value="administrator">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {(editUserData.role ?? u.role) === 'siswa' && (
                      <Input
                        value={editUserData.kelas ?? u.kelas ?? ''}
                        onChange={(e) => setEditUserData((d) => ({ ...d, kelas: e.target.value }))}
                        placeholder="Kelas"
                      />
                    )}
                    {(editUserData.role ?? u.role) !== 'administrator' && (
                      <Select
                        value={editUserData.sekolahId ?? u.sekolahId ?? ''}
                        onValueChange={(v: string) => setEditUserData((d) => ({ ...d, sekolahId: v }))}
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih Sekolah" /></SelectTrigger>
                        <SelectContent>
                          {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEditUser(u.id)} className="flex-1"><Save className="h-3.5 w-3.5 mr-1" /> Simpan</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingUserId(null); setEditUserData({}); }}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-2xl">
                      {u.avatar.startsWith('data:') ? <img src={u.avatar} className="h-full w-full rounded-xl object-cover shadow-sm" alt="" /> : u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate" title={u.name}>{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate" title={u.email}>{u.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded text-muted-foreground">{u.role}</span>
                        {u.role === 'siswa' && u.kelas && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">Kelas {u.kelas}</span>}
                        {u.role !== 'administrator' && u.sekolahId && (
                          <span className="text-[10px] truncate max-w-[120px] font-bold bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded">
                            {schools.find(s => s.id === u.sekolahId)?.name ?? 'Sekolah tidak diketahui'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {!isEditing && (
                  <div className="flex gap-2 pt-2 border-t mt-2 border-border/50">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setEditingUserId(u.id); setEditUserData({}); setChangingPasswordUserId(null); }}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                      onClick={() => {
                        if (changingPasswordUserId === u.id) {
                          setChangingPasswordUserId(null);
                          setNewPassword('');
                          setConfirmPassword('');
                        } else {
                          setChangingPasswordUserId(u.id);
                          setEditingUserId(null);
                          setNewPassword('');
                          setConfirmPassword('');
                        }
                      }}
                    >
                      <KeyRound className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.id, u.name)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Password change panel */}
                {!isEditing && changingPasswordUserId === u.id && (
                  <div className="mt-2 p-3 rounded-2xl bg-muted/50 border border-border space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <KeyRound className="h-3.5 w-3.5 text-primary" /> Ubah Password
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Password Baru (min. 6 karakter)</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Password baru..."
                          className="pr-9 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Konfirmasi Password</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru..."
                        className="text-sm"
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-destructive font-semibold">⚠ Password tidak cocok</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={savingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                        onClick={() => handleChangePassword(u)}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {savingPassword ? 'Menyimpan...' : 'Simpan Password'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => { setChangingPasswordUserId(null); setNewPassword(''); setConfirmPassword(''); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
        </TabsContent>

        <TabsContent value="schools" className="space-y-6 mt-6">
          <Card className="border-2 rounded-3xl">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <Building className="h-5 w-5 text-primary" /> Tambah Sekolah Baru
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Nama Sekolah</Label>
                  <Input value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="Contoh: SDN 1 Bendang" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alamat</Label>
                  <Input value={newSchoolAddress} onChange={(e) => setNewSchoolAddress(e.target.value)} placeholder="Alamat lengkap" />
                </div>
                <Button onClick={handleAddSchool} disabled={!newSchoolName.trim()} className="font-bold">
                  <Plus className="h-4 w-4 mr-1" /> Tambah
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schools.map((s) => {
              const isEditing = editingSchoolId === s.id;
              return (
                <Card key={s.id} className="border-2 rounded-3xl relative overflow-hidden">
                  <CardContent className="p-5 pt-6 space-y-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editSchoolData.name ?? s.name}
                          onChange={(e) => setEditSchoolData((d) => ({ ...d, name: e.target.value }))}
                          placeholder="Nama Sekolah"
                        />
                        <Input
                          value={editSchoolData.address ?? s.address}
                          onChange={(e) => setEditSchoolData((d) => ({ ...d, address: e.target.value }))}
                          placeholder="Alamat"
                        />
                        <div className="flex items-center gap-2">
                          <Input type="file" accept="image/*" onChange={handleSchoolLogoUpload} disabled={uploadingLogo} className="text-xs" />
                          {editSchoolData.logo && <div className="h-8 w-8 bg-muted rounded shrink-0 overflow-hidden"><img src={editSchoolData.logo} className="h-full w-full object-cover" alt="Logo" /></div>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEditSchool(s.id)} disabled={uploadingLogo} className="flex-1"><Save className="h-3.5 w-3.5 mr-1" /> Simpan</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingSchoolId(null); setEditSchoolData({}); }}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                          {s.logo ? <img src={s.logo} alt="Logo" className="h-full w-full object-cover" /> : <Building className="h-6 w-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate" title={s.name}>{s.name}</div>
                          <div className="text-xs text-muted-foreground truncate mt-1" title={s.address}>{s.address || 'Alamat belum diatur'}</div>
                        </div>
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="flex gap-2 pt-2 border-t mt-2 border-border/50">
                        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setEditingSchoolId(s.id); setEditSchoolData({}); }}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSchool(s.id, s.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
