import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { updateUser } from '@/services/dataStore';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProfileSettings({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!user) return <>{children}</>;

  const processImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIMENSION = 400;
          if (width > height && width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webpDataUrl = await processImage(file);
      await updateUser(user.id, { avatar: webpDataUrl });
      toast({ title: 'Berhasil', description: 'Foto profil diperbarui' });
      setTimeout(() => window.location.reload(), 500); 
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memproses gambar' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webpDataUrl = await processImage(file);
      localStorage.setItem('schoolLogo', webpDataUrl);
      toast({ title: 'Berhasil', description: 'Logo sekolah diperbarui' });
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memproses logo' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Pengaturan Profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-4 border-primary/20 flex items-center justify-center">
              {user.avatar.startsWith('data:') ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-5xl">{user.avatar}</span>
              )}
            </div>
            <div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} disabled={uploading} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline" size="sm" className="rounded-xl">
                <Camera className="mr-2 h-4 w-4" /> Ganti Foto (WebP)
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nama Lengkap</Label>
            <div className="font-bold">{user.name}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Peran</Label>
            <div className="font-bold capitalize">{user.role} {user.kelas ? `- Kelas ${user.kelas}` : ''}</div>
          </div>

          {user.role === 'guru' && (
            <div className="pt-4 border-t border-border space-y-3">
              <Label className="font-bold">Pengaturan Sekolah</Label>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="text-sm text-muted-foreground">Logo Sekolah</div>
                <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} disabled={uploading} />
                <Button onClick={() => logoInputRef.current?.click()} disabled={uploading} size="sm" className="rounded-xl">
                  Upload Logo
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
