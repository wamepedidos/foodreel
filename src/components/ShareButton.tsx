import { Send } from 'lucide-react';
import type { Dish } from '../types';
import { compactCount, formatCurrency } from '../utils/format';
import { useToast } from './Toast';
import { incrementDishShare } from '../services/dishesService';

export function ShareButton({ compact = false, dish, tone = 'dark' }: { compact?: boolean; dish: Dish; tone?: 'dark' | 'light' }) {
  const { showToast } = useToast();

  return (
    <button
      aria-label={`Compartir ${dish.name}`}
      className={
        compact
          ? tone === 'light'
            ? 'inline-flex h-8 items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 text-neutral-700 transition hover:text-neutral-950'
            : 'inline-flex h-8 items-center gap-1 rounded-full bg-black/20 px-2 text-white/70 transition hover:text-white'
          : 'grid place-items-center gap-1 text-contrast'
      }
      onClick={async () => {
        const url = window.location.href;
        const shareData = {
          title: dish.name,
          text: `${dish.name} por ${formatCurrency(dish.price)} en FoodReel.`,
          url
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
            void incrementDishShare(dish.id, 'nativeShare');
            showToast('Plato compartido');
          } else {
            await navigator.clipboard.writeText(url);
            void incrementDishShare(dish.id, 'copiedLink');
            showToast('Enlace copiado');
          }
        } catch {
          showToast('No se pudo compartir ahora');
        }
      }}
      type="button"
    >
      {compact ? (
        <>
          <Send className="size-3.5" />
          <span>{compactCount(dish.sharesCount ?? 0)}</span>
        </>
      ) : (
        <>
          <span data-social-circle className="grid size-10 place-items-center rounded-full border border-white/[0.12] bg-black/[0.42] backdrop-blur-xl">
            <Send className="size-[19px]" />
          </span>
          <span className="text-[0.63rem] font-medium leading-none">Compartir</span>
        </>
      )}
    </button>
  );
}

