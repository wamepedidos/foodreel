import { CheckCircle2, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Dish } from '../../types';
import { formatCurrency } from '../../utils/format';
import { dishToSelection, type SelectedExperienceDish } from './experienceTypes';

export function MenuDishSelector({
  dishes,
  onSelect,
  open,
  selectedDish,
  onClose
}: {
  dishes: Dish[];
  onSelect: (dish: SelectedExperienceDish) => void;
  open: boolean;
  selectedDish: SelectedExperienceDish | null;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filteredDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return dishes;
    }
    return dishes.filter((dish) => `${dish.name} ${dish.category}`.toLowerCase().includes(normalizedQuery));
  }, [dishes, query]);

  if (!open) {
    return null;
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-[90] flex justify-center bg-black/80 backdrop-blur-sm md:items-center" role="dialog">
      <div className="flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-card md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border md:border-white/10">
        <div className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Elegir plato del menu</h2>
              <p className="text-xs text-muted">Selecciona maximo un plato para relacionarlo.</p>
            </div>
            <button aria-label="Cerrar selector" className="grid size-10 place-items-center rounded-2xl bg-white/5 text-white" onClick={onClose} type="button">
              <X className="size-5" />
            </button>
          </div>
          <label className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-base px-3">
            <Search className="size-4 text-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar plato"
              value={query}
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 pb-[calc(18px+env(safe-area-inset-bottom))]">
          {filteredDishes.map((dish) => {
            const active = selectedDish?.dishId === dish.id;
            return (
              <button
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  active ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-surface'
                }`}
                key={dish.id}
                onClick={() => {
                  onSelect(dishToSelection(dish));
                  onClose();
                }}
                type="button"
              >
                <img alt="" className="size-14 shrink-0 rounded-xl object-cover" src={dish.image} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-bold text-white">{dish.name}</span>
                  <span className="mt-1 block text-xs text-muted">{formatCurrency(dish.price)}</span>
                </span>
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${active ? 'bg-accent text-white' : 'bg-white/10 text-muted'}`}>
                  <CheckCircle2 className="size-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
