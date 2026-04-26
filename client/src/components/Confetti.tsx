import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const COLORS = ['#F58A30', '#2FB85C', '#8B5CF6', '#3B9FEA', '#EC4899', '#FACC15'];

export function Confetti({ show, count = 60, onDone }: { show: boolean; count?: number; onDone?: () => void }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!show) {
      setPieces([]);
      return;
    }
    const arr: Piece[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.5,
      duration: 2.5 + Math.random() * 1.5,
      size: 8 + Math.random() * 8,
    }));
    setPieces(arr);
    const t = setTimeout(() => {
      setPieces([]);
      onDone?.();
    }, 4500);
    return () => clearTimeout(t);
  }, [show, count, onDone]);

  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" data-testid="confetti">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '3px',
          }}
          className="absolute top-0 animate-[confetti-fall_2.5s_linear_forwards]"
        />
      ))}
    </div>
  );
}
