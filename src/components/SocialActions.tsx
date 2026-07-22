import { MessageCircle } from 'lucide-react';
import type { Dish } from '../types';
import { compactCount } from '../utils/format';
import { FavoriteButton } from './FavoriteButton';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';

export function SocialActions({
  commentsCount,
  dish,
  onComments
}: {
  commentsCount?: number;
  dish: Dish;
  onComments: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <LikeButton dish={dish} />
      <button className="grid place-items-center gap-1 text-contrast" onClick={onComments} type="button">
        <span data-social-circle className="grid size-10 place-items-center rounded-full border border-white/[0.12] bg-black/[0.42] backdrop-blur-xl">
          <MessageCircle className="size-[19px]" />
        </span>
        <span className="text-[0.63rem] font-medium leading-none">{compactCount(commentsCount ?? dish.commentsCount)}</span>
      </button>
      <ShareButton dish={dish} />
      <FavoriteButton dishId={dish.id} />
    </div>
  );
}

