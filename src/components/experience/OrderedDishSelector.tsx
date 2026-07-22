import { CheckCircle2, ShoppingBag } from 'lucide-react';
import type { OrderRecord } from '../../types';
import { formatCurrency } from '../../utils/format';
import type { SelectedExperienceDish } from './experienceTypes';

export function OrderedDishSelector({
  orders,
  selectedDish,
  onSelect
}: {
  orders: OrderRecord[];
  selectedDish: SelectedExperienceDish | null;
  onSelect: (dish: SelectedExperienceDish) => void;
}) {
  const orderedDishes = orders.flatMap((order) =>
    order.items.map((item) => ({
      dishId: item.dishId,
      image: item.image,
      name: item.name,
      orderId: order.id,
      price: item.unitPrice,
      quantity: item.quantity
    }))
  );

  const mergedDishes = orderedDishes.reduce<SelectedExperienceDish[]>((accumulator, item) => {
    const existing = accumulator.find((dish) => dish.dishId === item.dishId);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + item.quantity;
      return accumulator;
    }
    accumulator.push(item);
    return accumulator;
  }, []);

  if (!mergedDishes.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-4 text-sm text-muted">
        Aun no encontramos platos pedidos en esta sesion. Puedes elegir otro plato del menu o publicar sin plato.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-black text-white">
        <ShoppingBag className="size-4 text-accent" />
        Platos que pediste
      </div>
      {mergedDishes.map((dish) => {
        const active = selectedDish?.dishId === dish.dishId && selectedDish.orderId === dish.orderId;
        return (
          <button
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
              active ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-surface'
            }`}
            key={`${dish.dishId}-${dish.orderId}`}
            onClick={() => onSelect(dish)}
            type="button"
          >
            <img alt="" className="size-14 shrink-0 rounded-xl object-cover" src={dish.image} />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-bold text-white">{dish.name}</span>
              <span className="mt-1 block text-xs text-muted">
                Cantidad {dish.quantity ?? 1} · {formatCurrency(dish.price)}
              </span>
            </span>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${active ? 'bg-accent text-white' : 'bg-white/10 text-muted'}`}>
              <CheckCircle2 className="size-4" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
