import { Plus } from 'lucide-react';
import type { Dish } from '../types';
import { useCartStore } from '../store/useCartStore';
import { QuantitySelector } from './QuantitySelector';
import { useToast } from './Toast';

export function AddToCartButton({ dish }: { dish: Dish }) {
  const quantity = useCartStore((state) => state.getQuantity(dish.id));
  const addDish = useCartStore((state) => state.addDish);
  const { showToast } = useToast();

  if (quantity > 0) {
    return <QuantitySelector dishId={dish.id} price={dish.price} quantity={quantity} />;
  }

  return (
    <button
      className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!dish.available}
      onClick={() => {
        addDish(dish);
        showToast('Agregado al carrito');
      }}
      type="button"
    >
      <span className="truncate">Agregar</span>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
        <Plus className="size-5" />
      </span>
    </button>
  );
}
