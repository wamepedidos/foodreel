import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { Dish } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { compactCount } from '../utils/format';

export function LikeButton({ compact = false, dish }: { compact?: boolean; dish: Dish }) {
  const liked = useMenuStore((state) => state.isLiked(dish.id));
  const toggleLike = useMenuStore((state) => state.toggleLike);
  const [burst, setBurst] = useState(false);
  const count = dish.likesCount + (liked ? 1 : 0);

  if (compact) {
    return (
      <button
        aria-label={liked ? `Quitar me gusta de ${dish.name}` : `Dar me gusta a ${dish.name}`}
        className={`relative inline-flex h-8 items-center gap-1 rounded-full bg-black/20 px-2 transition hover:text-white ${
          liked ? 'text-red-400' : 'text-white/70'
        }`}
        onClick={() => {
          toggleLike(dish.id);
          setBurst(true);
          window.setTimeout(() => setBurst(false), 420);
        }}
        type="button"
      >
        <Heart className="size-3.5" fill={liked ? 'currentColor' : 'none'} />
        <span>{compactCount(count)}</span>
        {burst ? <Heart className="pointer-events-none absolute -top-3 left-3 size-6 animate-like-burst text-red-500" fill="currentColor" /> : null}
      </button>
    );
  }

  return (
    <button
      aria-label={liked ? `Quitar me gusta de ${dish.name}` : `Dar me gusta a ${dish.name}`}
      className="relative grid place-items-center gap-1 text-white"
      onClick={() => {
        toggleLike(dish.id);
        setBurst(true);
        window.setTimeout(() => setBurst(false), 420);
      }}
      type="button"
    >
      <span className={`grid size-11 place-items-center rounded-full bg-black/45 backdrop-blur ${liked ? 'text-red-500' : ''}`}>
        <Heart className="size-6" fill={liked ? 'currentColor' : 'none'} />
      </span>
      <span className="text-[11px] font-bold">{compactCount(count)}</span>
      {burst ? <Heart className="pointer-events-none absolute -top-3 size-8 animate-like-burst text-red-500" fill="currentColor" /> : null}
    </button>
  );
}
