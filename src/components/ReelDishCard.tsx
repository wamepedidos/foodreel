import { ChevronDown, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';
import { AddToCartButton } from './AddToCartButton';
import { CommentsSheet } from './CommentsSheet';
import { DishDescriptionSheet } from './DishDescriptionSheet';
import { ReelMedia } from './ReelMedia';
import { SocialActions } from './SocialActions';

export function ReelDishCard({ dish, active }: { dish: Dish; active: boolean }) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewCount, setViewCount] = useState(dish.viewsCount);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!active || viewedRef.current) {
      return undefined;
    }

    const key = `foodreel-viewed-${dish.id}`;
    if (sessionStorage.getItem(key)) {
      viewedRef.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(key, 'true');
      viewedRef.current = true;
      setViewCount((count) => count + 1);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [active, dish.id]);

  return (
    <section className="h-full snap-start px-3 py-4" data-dish-id={dish.id}>
      <article className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-card shadow-2xl">
        <ReelMedia active={active} dish={dish} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">
          <SocialActions
            dish={dish}
            viewCount={viewCount}
            onComments={() => setCommentsOpen(true)}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pr-[78px]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-black/55 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
            <Info className="size-3.5" />
            {dish.tag ?? dish.category}
          </div>
          <h1 className="text-3xl font-black leading-none tracking-normal">{dish.name}</h1>
          <p className="mt-2 text-lg font-bold text-white">{formatCurrency(dish.price)}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/80">{dish.shortDescription}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1">{dish.category}</span>
            <span className={`rounded-full px-3 py-1 ${dish.available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
              {dish.available ? 'Disponible' : 'Agotado'}
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            <AddToCartButton dish={dish} />
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/40 text-sm font-semibold text-white backdrop-blur transition hover:border-accent/50"
              onClick={() => setDescriptionOpen(true)}
              type="button"
            >
              Ver descripción
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      </article>
      <DishDescriptionSheet dish={dish} open={descriptionOpen} onClose={() => setDescriptionOpen(false)} />
      <CommentsSheet dish={dish} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </section>
  );
}
