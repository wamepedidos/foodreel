import { Eye, MessageCircle } from 'lucide-react';
import type { Dish } from '../types';
import { compactCount } from '../utils/format';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';

export function SocialMetricsRow({
  dish,
  onComments,
  tone = 'dark',
  viewCount
}: {
  dish: Dish;
  onComments: () => void;
  tone?: 'dark' | 'light';
  viewCount: number;
}) {
  const chipClass =
    tone === 'light'
      ? 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:text-neutral-950'
      : 'bg-black/20 text-white/70 hover:text-white';

  return (
    <div className={`no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs ${tone === 'light' ? 'text-neutral-700' : 'text-white/70'}`}>
      <LikeButton compact dish={dish} tone={tone} />
      <span className={`inline-flex h-8 items-center gap-1 rounded-full px-2 ${chipClass}`}>
        <Eye className="size-3.5" />
        {compactCount(viewCount)}
      </span>
      <button
        aria-label={`Abrir comentarios de ${dish.name}`}
        className={`inline-flex h-8 items-center gap-1 rounded-full px-2 transition ${chipClass}`}
        onClick={onComments}
        type="button"
      >
        <MessageCircle className="size-3.5" />
        {compactCount(dish.commentsCount)}
      </button>
      <ShareButton compact dish={dish} tone={tone} />
    </div>
  );
}
