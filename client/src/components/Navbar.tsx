import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfileSettings } from './ProfileSettings';

export function Navbar() {
  const { user, signOut, demoMode } = useAuth();
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  useEffect(() => {
    setSchoolLogo(localStorage.getItem('schoolLogo'));
  }, []);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" data-testid="link-home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-sunrise text-white shadow-playful overflow-hidden">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo Sekolah" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl">🎓</span>
            )}
          </div>
          <span className="hidden sm:inline">SekolahSeru</span>
        </Link>

        <div className="flex items-center gap-2">
          {demoMode && (
            <Badge variant="outline" className="hidden md:inline-flex border-warning text-warning-foreground bg-warning/20">
              Demo Mode
            </Badge>
          )}
          {user.role === 'siswa' && (
            <div className="hidden sm:flex items-center gap-1 rounded-full bg-warning/20 px-3 py-1.5 text-sm font-bold text-warning-foreground border border-warning/40" data-testid="text-user-points">
              ⭐ {user.points}
            </div>
          )}
          <ProfileSettings>
            <button className="flex items-center gap-2 rounded-full bg-card border border-border px-2 py-1.5 hover:bg-accent/50 transition-colors text-left" data-testid="user-chip">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center overflow-hidden rounded-full bg-muted">
                {user.avatar.startsWith('data:') ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl leading-none" aria-hidden>{user.avatar}</span>
                )}
              </div>
              <div className="hidden sm:block text-xs leading-tight pr-2">
                <div className="font-bold text-foreground">{user.name.split(' ')[0]}</div>
                <div className="text-muted-foreground">{user.role === 'guru' ? 'Guru' : `Kelas ${user.kelas ?? '-'}`}</div>
              </div>
            </button>
          </ProfileSettings>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            aria-label="Keluar"
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
