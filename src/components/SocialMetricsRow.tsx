import { Eye, MessageCircle } from 'lucide-react';
import type { Dish } from '../types';
import { compactCount } from '../utils/format';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';

export function SocialMetricsRow({
  dish,
  onComments,
  viewCount
}: {
  dish: Dish;
  onComments: () => void;
  viewCount: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-white/70">
      <LikeButton compact dish={dish} />
      <span className="inline-flex h-8 items-center gap-1 rounded-full bg-black/20 px-2">
        <Eye className="size-3.5" />
        {compactCount(viewCount)}
      </span>
      <button
        aria-label={`Abrir comentarios de ${dish.name}`}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-black/20 px-2 transition hover:text-white"
        onClick={onComments}
        type="button"
      >
        <MessageCircle className="size-3.5" />
        {compactCount(dish.commentsCount)}
      </button>
      <ShareButton compact dish={dish} />
    </div>
  );
}
