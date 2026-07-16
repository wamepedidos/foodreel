import { MessageCircle, Send, Eye } from 'lucide-react';
import type { Dish } from '../types';
import { compactCount } from '../utils/format';
import { FavoriteButton } from './FavoriteButton';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';

export function SocialActions({
  dish,
  viewCount,
  onComments
}: {
  dish: Dish;
  viewCount: number;
  onComments: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <LikeButton dish={dish} />
      <ActionStat icon={<Eye className="size-6" />} label={compactCount(viewCount)} />
      <button className="grid place-items-center gap-1 text-white" onClick={onComments} type="button">
        <span className="grid size-11 place-items-center rounded-full bg-black/45 backdrop-blur">
          <MessageCircle className="size-6" />
        </span>
        <span className="text-[11px] font-bold">{compactCount(dish.commentsCount)}</span>
      </button>
      <ShareButton dish={dish} />
      <FavoriteButton dishId={dish.id} />
    </div>
  );
}

function ActionStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="grid place-items-center gap-1 text-white">
      <span className="grid size-11 place-items-center rounded-full bg-black/45 backdrop-blur">{icon}</span>
      <span className="text-[11px] font-bold">{label}</span>
    </div>
  );
}
