import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { Dish } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { compactCount } from '../utils/format';
import { toggleDishLike } from '../services/dishesService';
import { getOrCreateCustomerSessionId } from '../utils/session';

export function LikeButton({ compact = false, dish, tone = 'dark' }: { compact?: boolean; dish: Dish; tone?: 'dark' | 'light' }) {
  const liked = useMenuStore((state) => state.isLiked(dish.id));
  const toggleLike = useMenuStore((state) => state.toggleLike);
  const [burst, setBurst] = useState(false);
  const count = dish.likesCount + (liked ? 1 : 0);
  const handleLike = () => {
    const nextLiked = !liked;
    toggleLike(dish.id);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 420);
    void toggleDishLike(dish.id, nextLiked, getOrCreateCustomerSessionId()).catch(() => {
      toggleLike(dish.id);
    });
  };

  if (compact) {
    const compactTone = tone === 'light' ? 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:text-neutral-950' : 'bg-black/20 text-white/70 hover:text-white';

    return (
      <button
        aria-label={liked ? `Quitar me gusta de ${dish.name}` : `Dar me gusta a ${dish.name}`}
        className={`relative inline-flex h-8 items-center gap-1 rounded-full px-2 transition ${compactTone} ${
          liked ? 'text-[#ff1717]' : ''
        }`}
        onClick={handleLike}
        type="button"
      >
        <Heart className="size-3.5" fill={liked ? 'currentColor' : 'none'} />
        <span>{compactCount(count)}</span>
        {burst ? <Heart className="pointer-events-none absolute -top-3 left-3 size-6 animate-like-burst text-[#ff1717]" fill="currentColor" /> : null}
      </button>
    );
  }

  return (
    <button
      aria-label={liked ? `Quitar me gusta de ${dish.name}` : `Dar me gusta a ${dish.name}`}
      className="relative grid place-items-center gap-1 text-contrast"
      onClick={handleLike}
      type="button"
    >
      <span
        data-social-circle
        className={`grid size-10 place-items-center rounded-full border border-white/[0.12] bg-black/[0.42] backdrop-blur-xl ${
          liked ? 'text-[#ff1717]' : ''
        }`}
      >
        <Heart className="size-[19px]" fill={liked ? 'currentColor' : 'none'} />
      </span>
      <span className="text-[0.63rem] font-medium leading-none">{compactCount(count)}</span>
      {burst ? <Heart className="pointer-events-none absolute -top-2 size-6 animate-like-burst text-[#ff1717]" fill="currentColor" /> : null}
    </button>
  );
}

