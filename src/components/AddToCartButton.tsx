import { Plus } from 'lucide-react';
import type { Dish } from '../types';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '../utils/format';
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
      className="flex h-12 items-center justify-between rounded-2xl bg-accent px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!dish.available}
      onClick={() => {
        addDish(dish);
        showToast('Agregado al carrito');
      }}
      type="button"
    >
      <span>Agregar al carrito</span>
      <span className="flex items-center gap-3">
        {formatCurrency(dish.price)}
        <span className="grid size-8 place-items-center rounded-full bg-white/15">
          <Plus className="size-5" />
        </span>
      </span>
    </button>
  );
}
