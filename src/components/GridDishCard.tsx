import { ChevronDown, Play } from 'lucide-react';
import { useState } from 'react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';
import { AddToCartButton } from './AddToCartButton';
import { CommentsSheet } from './CommentsSheet';
import { DishDescriptionSheet } from './DishDescriptionSheet';
import { FavoriteButton } from './FavoriteButton';
import { SocialMetricsRow } from './SocialMetricsRow';

export function GridDishCard({ dish, onFocus }: { dish: Dish; onFocus: (dishId: string) => void }) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const poster = dish.image.includes('foodreel-logo') ? undefined : dish.image;

  const openDescription = () => {
    onFocus(dish.id);
    setDescriptionOpen(true);
  };

  return (
    <article className="flex min-h-[358px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-card shadow-2xl shadow-black/20">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-black">
        <button aria-label={`Ver descripcion de ${dish.name}`} className="h-full w-full" onClick={openDescription} type="button">
          {poster ? (
            <img alt={dish.name} className="h-full w-full object-cover" src={poster} />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-surface to-black text-xs font-bold text-muted">
              Sin portada
            </div>
          )}
        </button>
        {dish.video ? (
          <span className="absolute bottom-2 left-2 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
            <Play className="size-4" fill="currentColor" />
          </span>
        ) : null}
        {dish.tag ? (
          <span className="absolute left-2 top-2 rounded-full border border-accent/35 bg-black/55 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur">
            {dish.tag}
          </span>
        ) : null}
        <div className="absolute right-2 top-2">
          <FavoriteButton dishId={dish.id} variant="icon" />
        </div>
        {!dish.available ? (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-100 backdrop-blur">Agotado</span>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-white">{dish.name}</h3>
          <p className="mt-1 text-sm font-black leading-5 text-accent">{formatCurrency(dish.price)}</p>
          <p className="mt-1 line-clamp-2 min-h-9 text-xs font-medium leading-[1.15rem] text-white/72">{dish.shortDescription}</p>
        </div>

        <div className="flex min-h-7 items-center justify-between gap-1.5">
          <span className="min-w-0 truncate rounded-full bg-black/20 px-2 py-1 text-[10px] font-bold text-muted">{dish.category}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
              dish.available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
            }`}
          >
            {dish.available ? 'Disponible' : 'Agotado'}
          </span>
        </div>

        <SocialMetricsRow dish={dish} viewCount={dish.viewsCount} onComments={() => setCommentsOpen(true)} />

        <div className="mt-auto grid gap-2">
          <button
            className="flex h-10 items-center justify-center gap-1 rounded-[16px] border border-white/12 bg-black/20 px-2 text-xs font-bold text-white transition hover:border-accent/50"
            onClick={openDescription}
            type="button"
          >
            <span className="truncate">Ver descripcion</span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
          <AddToCartButton dish={dish} />
        </div>
      </div>

      <DishDescriptionSheet dish={dish} open={descriptionOpen} onClose={() => setDescriptionOpen(false)} />
      <CommentsSheet dish={dish} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </article>
  );
}
