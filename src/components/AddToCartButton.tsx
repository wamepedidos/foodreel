import { Plus } from 'lucide-react';
import type { Dish } from '../types';
import { useCartStore } from '../store/useCartStore';
import { QuantitySelector } from './QuantitySelector';
import { useToast } from './Toast';
import { incrementDishAddedToOrder } from '../services/dishesService';
import { formatCurrency } from '../utils/format';

export function AddToCartButton({ dish, variant = 'compact' }: { dish: Dish; variant?: 'compact' | 'reel' }) {
  const quantity = useCartStore((state) => state.getQuantity(dish.id));
  const addDish = useCartStore((state) => state.addDish);
  const { showToast } = useToast();

  if (quantity > 0) {
    return <QuantitySelector dishId={dish.id} price={dish.price} quantity={quantity} variant={variant} />;
  }

  return (
    <button
      className={
        variant === 'reel'
          ? 'flex h-10 min-w-0 w-full items-center justify-center gap-1.5 rounded-[16px] bg-accent px-3 text-[0.78rem] font-bold text-white shadow-[0_14px_36px_rgba(252,45,4,0.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
          : 'flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
      }
      disabled={!dish.available}
      onClick={() => {
        addDish(dish);
        void incrementDishAddedToOrder(dish.id);
        showToast('Agregado al carrito');
      }}
      type="button"
    >
      {variant === 'reel' ? (
        <>
          <span className="truncate">Agregar</span>
          <span className="text-white/80">{'\u2022'}</span>
          <span className="truncate">{formatCurrency(dish.price)}</span>
        </>
      ) : (
        <>
          <span className="truncate">Agregar</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
            <Plus className="size-5" />
          </span>
        </>
      )}
    </button>
  );
}
