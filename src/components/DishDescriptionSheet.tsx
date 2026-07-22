import { X } from 'lucide-react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';
import { AddToCartButton } from './AddToCartButton';

export function DishDescriptionSheet({ dish, open, onClose }: { dish: Dish; open: boolean; onClose: () => void }) {
  const poster = dish.image.includes('foodreel-logo') ? undefined : dish.image;

  if (!open) {
    return null;
  }

  return (
    <div
      aria-label={`Descripción de ${dish.name}`}
      aria-modal="true"
      className="fixed inset-0 z-[80] flex justify-center bg-black/80 backdrop-blur-sm md:items-center"
      role="dialog"
    >
      <div className="flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-paper text-neutral-950 shadow-2xl md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border md:border-black/10">
        <div className="relative h-[38dvh] min-h-[260px] max-h-[420px] shrink-0 bg-black">
          {dish.video ? (
            <video
              autoPlay
              className="h-full w-full object-cover"
              controls
              loop
              muted
              playsInline
              poster={poster}
              src={dish.video}
            />
          ) : (
            poster ? (
              <img alt={dish.name} className="h-full w-full object-cover" src={poster} />
            ) : (
              <div className="h-full w-full bg-black" />
            )
          )}
          <button
            aria-label="Cerrar descripción"
            className="absolute right-4 top-[calc(14px+env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/80"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="dish-title text-2xl font-bold leading-tight text-neutral-950">{dish.name}</h2>
              <p className="text-sm font-semibold text-neutral-500">{dish.category}</p>
            </div>
            <p className="shrink-0 text-lg font-black text-accent">{formatCurrency(dish.price)}</p>
          </div>

          <p className="mt-4 text-base font-semibold leading-7 text-neutral-900">{dish.description}</p>

          <h3 className="mt-5 text-sm font-bold text-neutral-950">Ingredientes</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {dish.ingredients.map((ingredient) => (
              <span
                className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-800"
                key={ingredient}
              >
                {ingredient}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-stretch gap-2">
            <button
              className="h-12 flex-1 rounded-2xl border border-neutral-200 bg-neutral-100 font-semibold text-neutral-950 transition hover:border-accent/50"
              onClick={onClose}
              type="button"
            >
              Cerrar
            </button>
            <AddToCartButton dish={dish} />
          </div>
        </div>
      </div>
    </div>
  );
}
