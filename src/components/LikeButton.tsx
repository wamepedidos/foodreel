import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { Dish } from '../types';
import { compactCount } from '../utils/format';

export function LikeButton({ dish }: { dish: Dish }) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);
  const count = dish.likesCount + (liked ? 1 : 0);

  return (
    <button
      className="relative grid place-items-center gap-1 text-white"
      onClick={() => {
        setLiked((value) => !value);
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
