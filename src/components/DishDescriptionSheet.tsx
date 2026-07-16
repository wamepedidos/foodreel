import { X } from 'lucide-react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';

export function DishDescriptionSheet({ dish, open, onClose }: { dish: Dish; open: boolean; onClose: () => void }) {
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
      <div className="flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-card shadow-2xl md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border md:border-white/10">
        <div className="relative h-[38dvh] min-h-[260px] max-h-[420px] shrink-0 bg-black">
          {dish.video ? (
            <video
              autoPlay
              className="h-full w-full object-cover"
              controls
              loop
              muted
              playsInline
              poster={dish.image}
              src={dish.video}
            />
          ) : (
            <img alt={dish.name} className="h-full w-full object-cover" src={dish.image} />
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
              <h2 className="dish-title text-3xl font-bold leading-tight">{dish.name}</h2>
              <p className="text-sm text-muted">{dish.category}</p>
            </div>
            <p className="shrink-0 text-lg font-black text-accent">{formatCurrency(dish.price)}</p>
          </div>

          <p className="mt-4 text-base font-semibold leading-7 text-white/90">{dish.description}</p>

          <h3 className="mt-5 text-sm font-bold text-white">Ingredientes</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {dish.ingredients.map((ingredient) => (
              <span
                className="rounded-full border border-white/10 bg-surface px-3 py-1 text-xs text-white/80"
                key={ingredient}
              >
                {ingredient}
              </span>
            ))}
          </div>

          <button
            className="mt-6 h-12 w-full rounded-2xl border border-white/10 bg-surface font-semibold text-white transition hover:border-accent/50"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
