import { ChevronDown, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';
import { AddToCartButton } from './AddToCartButton';
import { CommentsSheet } from './CommentsSheet';
import { DishDescriptionSheet } from './DishDescriptionSheet';
import { ReelMedia } from './ReelMedia';
import { SocialActions } from './SocialActions';
import { WhatsAppInstallButton } from './WhatsAppInstallButton';

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

  const mediaActive = active && !descriptionOpen && !commentsOpen;

  return (
    <section className="h-full snap-start px-3 py-4" data-dish-id={dish.id}>
      <article className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-card shadow-2xl">
        <ReelMedia active={mediaActive} dish={dish} />
        <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">
          <SocialActions dish={dish} viewCount={viewCount} onComments={() => setCommentsOpen(true)} />
        </div>
        <WhatsAppInstallButton />
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pr-[78px]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-black/45 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
            <Info className="size-3.5" />
            {dish.tag ?? dish.category}
          </div>
          <h1 className="dish-title text-[1.65rem] font-bold leading-tight tracking-normal">{dish.name}</h1>
          <p className="mt-2 text-lg font-bold text-white">{formatCurrency(dish.price)}</p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white/90">{dish.shortDescription}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/75">
            <span className="rounded-full bg-black/25 px-3 py-1 backdrop-blur">{dish.category}</span>
            <span
              className={`rounded-full px-3 py-1 backdrop-blur ${
                dish.available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
              }`}
            >
              {dish.available ? 'Disponible' : 'Agotado'}
            </span>
          </div>
          <div className="mt-4 flex items-stretch gap-2">
            <button
              className="flex h-12 min-w-0 flex-[0.95] items-center justify-center gap-1 rounded-2xl border border-white/15 bg-black/30 px-2 text-xs font-bold text-white backdrop-blur transition hover:border-accent/50"
              onClick={() => setDescriptionOpen(true)}
              type="button"
            >
              <span className="truncate">Ver descripción</span>
              <ChevronDown className="size-4 shrink-0" />
            </button>
            <AddToCartButton dish={dish} />
          </div>
        </div>
      </article>
      <DishDescriptionSheet dish={dish} open={descriptionOpen} onClose={() => setDescriptionOpen(false)} />
      <CommentsSheet dish={dish} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </section>
  );
}
