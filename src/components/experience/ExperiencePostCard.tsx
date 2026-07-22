import { Flag, Utensils } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';
import type { ExperiencePost } from '../../types';
import { ExperienceSocialActions } from './ExperienceSocialActions';
import { ExperienceStatusBadge } from './ExperienceStatusBadge';

export function ExperiencePostCard({
  post,
  userId,
  onComments,
  onPostChange
}: {
  post: ExperiencePost;
  userId: string;
  onComments: () => void;
  onPostChange: (post: ExperiencePost) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-white/10 bg-card">
      <div className="flex items-center gap-3 p-4">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-sm font-black text-white">
          {post.userPhoto ? <img alt="" className="size-full object-cover" src={post.userPhoto} /> : post.userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white">{post.userName || 'Cliente'}</p>
          <p className="text-xs text-muted">Experiencia en Mesa {restaurantConfig.tableNumber} · Ahora</p>
        </div>
        <ExperienceStatusBadge status={post.status} />
      </div>

      {post.mediaUrl ? (
        <img alt="Experiencia publicada" className="aspect-[4/5] w-full object-cover md:aspect-[16/11]" src={post.mediaUrl} />
      ) : (
        <div className="grid aspect-[4/5] place-items-center bg-surface p-6 text-center md:aspect-[16/11]">
          <div>
            <Utensils className="mx-auto size-9 text-accent" />
            <p className="mt-2 text-sm font-bold text-white">Experiencia sin fotografia</p>
          </div>
        </div>
      )}

      <div className="space-y-3 p-4">
        {post.status === 'pending' ? (
          <div className="rounded-2xl border border-accent/25 bg-accent/10 p-3 text-sm font-bold text-accent">{'Tu publicaci\u00f3n est\u00e1 en revisi\u00f3n.'}</div>
        ) : null}
        {post.text ? <p className="whitespace-pre-wrap text-sm leading-6 text-white/85">{post.text}</p> : null}
        {post.dishId ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-surface p-3">
            {post.dishImage ? <img alt="" className="size-12 rounded-xl object-cover" src={post.dishImage} /> : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{post.dishName}</p>
              <button className="mt-1 text-xs font-bold text-accent" type="button">
                Ver plato
              </button>
            </div>
          </div>
        ) : null}
        <button className="inline-flex items-center gap-2 text-xs font-bold text-muted" type="button">
          <Flag className="size-4" />
          Reportar
        </button>
      </div>

      <ExperienceSocialActions onComments={onComments} onPostChange={onPostChange} post={post} userId={userId} />
    </article>
  );
}
