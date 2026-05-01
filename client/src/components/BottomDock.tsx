import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Home, BookOpen, MessageSquare, Trophy, Sparkles, GraduationCap, Layers } from 'lucide-react';
import { ProfileSettings } from './ProfileSettings';

export function BottomDock() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const studentLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/mapel', label: 'Mapel', icon: BookOpen },
    { href: '/leaderboard', label: 'Peringkat', icon: Trophy },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
  ];
  const teacherLinks = [
    { href: '/', label: 'Dasbor', icon: Home },
    { href: '/guru/mapel', label: 'Mapel', icon: Layers },
    { href: '/guru/materi', label: 'Materi', icon: BookOpen },
    { href: '/guru/kuis', label: 'Kuis', icon: Sparkles },
    { href: '/guru/siswa', label: 'Siswa', icon: GraduationCap },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
  ];
  const links = user.role === 'guru' ? teacherLinks : studentLinks;

  return (
    <div className="fixed bottom-4 left-0 w-full flex justify-center z-[100] px-2 pointer-events-none">
      <nav className="flex items-center gap-1 sm:gap-2 p-2 rounded-full bg-background/80 backdrop-blur-xl border-2 border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] pointer-events-auto max-w-full overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {links.map((l) => {
          const active = location === l.href || (l.href !== '/' && location.startsWith(l.href));
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-playful -translate-y-1 scale-105'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          );
        })}
        
        <ProfileSettings>
          <button className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 text-muted-foreground hover:bg-accent/50 hover:text-foreground whitespace-nowrap shrink-0">
            <div className="flex h-5 w-5 sm:h-4 sm:w-4 items-center justify-center overflow-hidden rounded-full bg-muted">
              {user.avatar.startsWith('data:') ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm leading-none" aria-hidden>{user.avatar}</span>
              )}
            </div>
            <span className="hidden sm:inline">Profil</span>
          </button>
        </ProfileSettings>
      </nav>
    </div>
  );
}
