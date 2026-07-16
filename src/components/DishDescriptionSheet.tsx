import { X } from 'lucide-react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';

export function DishDescriptionSheet({ dish, open, onClose }: { dish: Dish; open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/60 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[82dvh] w-full max-w-[420px] overflow-hidden rounded-[24px] border border-white/10 bg-card shadow-2xl">
        <div className="relative h-48">
          <img alt={dish.name} className="h-full w-full object-cover" src={dish.image} />
          <button aria-label="Cerrar descripción" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[calc(82dvh-192px)] overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black leading-tight">{dish.name}</h2>
              <p className="text-sm text-muted">{dish.category}</p>
            </div>
            <p className="shrink-0 text-lg font-black text-accent">{formatCurrency(dish.price)}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/80">{dish.description}</p>
          <h3 className="mt-5 text-sm font-bold text-white">Ingredientes</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {dish.ingredients.map((ingredient) => (
              <span className="rounded-full border border-white/10 bg-surface px-3 py-1 text-xs text-white/80" key={ingredient}>
                {ingredient}
              </span>
            ))}
          </div>
          <button className="mt-6 h-12 w-full rounded-2xl border border-white/10 bg-surface font-semibold text-white" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
