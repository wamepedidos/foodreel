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
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const poster = dish.image.includes('foodreel-logo') ? undefined : dish.image;

  const openDescription = () => {
    onFocus(dish.id);
    setDescriptionOpen(true);
  };

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/10 bg-card shadow-2xl shadow-black/25">
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {!mediaLoaded && !mediaFailed ? <div className="absolute inset-0 animate-pulse bg-white/10" /> : null}
        {mediaFailed ? (
          <div className="grid h-full place-items-center bg-gradient-to-br from-surface to-black text-xs font-bold text-muted">
            Video no disponible
          </div>
        ) : (
          <button aria-label={`Ver descripcion de ${dish.name}`} className="h-full w-full" onClick={openDescription} type="button">
            <video
              autoPlay
              className={`h-full w-full object-cover transition duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
              loop
              muted
              onCanPlay={() => setMediaLoaded(true)}
              onError={() => setMediaFailed(true)}
              playsInline
              poster={poster}
              preload="metadata"
              src={dish.video}
            />
          </button>
        )}
        <span className="absolute bottom-2 left-2 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
          <Play className="size-4" fill="currentColor" />
        </span>
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

      <div className="grid gap-2.5 p-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-black leading-5 text-white">{dish.name}</h3>
            <p className="shrink-0 text-sm font-black text-accent">{formatCurrency(dish.price)}</p>
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-white/72">{dish.shortDescription}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold text-muted">{dish.category}</span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              dish.available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
            }`}
          >
            {dish.available ? 'Disponible' : 'Agotado'}
          </span>
        </div>

        <SocialMetricsRow dish={dish} viewCount={dish.viewsCount} onComments={() => setCommentsOpen(true)} />

        <div className="grid gap-2">
          <button
            className="flex h-11 items-center justify-center gap-1 rounded-2xl border border-white/12 bg-black/20 px-3 text-xs font-bold text-white transition hover:border-accent/50"
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
