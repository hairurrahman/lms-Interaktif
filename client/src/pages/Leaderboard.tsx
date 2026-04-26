import { useEffect, useState } from 'react';
import { getLeaderboard, getBadges } from '@/services/dataStore';
import type { AppUser, Badge as BadgeType } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Crown, Medal, Award } from 'lucide-react';

export function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);

  useEffect(() => {
    getLeaderboard(50).then(setUsers);
    getBadges().then(setBadges);
  }, []);

  const badgeMap = Object.fromEntries(badges.map((b) => [b.id, b]));
  const podium = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Papan Peringkat</h1>
        <p className="text-muted-foreground mt-1">Siapa yang paling rajin belajar minggu ini?</p>
      </div>

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 md:gap-5 items-end max-w-2xl mx-auto">
          {[1, 0, 2].map((idx, pos) => {
            const u = podium[idx];
            if (!u) return <div key={pos} />;
            const heights = ['h-32 md:h-40', 'h-44 md:h-56', 'h-28 md:h-32'];
            const colors = [
              'bg-gradient-ocean',
              'bg-gradient-sunrise',
              'bg-gradient-forest',
            ];
            const icons = [<Medal key="2" />, <Crown key="1" />, <Award key="3" />];
            return (
              <div key={u.id} className="flex flex-col items-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center">
                  {u.avatar.startsWith('data:') ? <img src={u.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <div className="text-4xl md:text-5xl">{u.avatar}</div>}
                </div>
                <div className="font-bold text-sm md:text-base text-center truncate max-w-full">{u.name.split(' ')[0]}</div>
                <div className="text-xs text-muted-foreground mb-2">⭐ {u.points}</div>
                <div className={`${colors[idx]} ${heights[pos]} w-full rounded-t-3xl flex flex-col items-center justify-start pt-3 text-white relative shadow-playful`}>
                  <div className="text-white/90">{icons[idx]}</div>
                  <div className="text-4xl md:text-5xl font-extrabold mt-1">{idx + 1}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest */}
      <Card className="border-2 rounded-3xl">
        <CardContent className="p-4 md:p-5 space-y-1.5">
          {rest.map((u, i) => (
            <div
              key={u.id}
              data-testid={`leaderboard-row-${u.id}`}
              className={`flex items-center gap-3 rounded-2xl p-2.5 ${
                u.id === user?.id ? 'bg-primary/10 border-2 border-primary/40' : 'hover-elevate'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-extrabold text-sm">
                {i + 4}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                {u.avatar.startsWith('data:') ? <img src={u.avatar} className="h-full w-full rounded-full object-cover shadow-sm" alt="" /> : <span className="text-2xl">{u.avatar}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{u.name}</div>
                <div className="text-xs text-muted-foreground">Kelas {u.kelas}</div>
              </div>
              <div className="hidden sm:flex gap-1 items-center">
                {u.badges.slice(0, 3).map((bid) => (
                  <span key={bid} className="text-base" title={badgeMap[bid]?.name}>
                    {badgeMap[bid]?.emoji ?? '⭐'}
                  </span>
                ))}
              </div>
              <div className="text-sm font-extrabold text-primary whitespace-nowrap">⭐ {u.points}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
