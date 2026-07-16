import { Minus, Plus } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '../utils/format';

export function QuantitySelector({ dishId, quantity, price }: { dishId: string; quantity: number; price: number }) {
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);

  return (
    <div className="flex h-12 items-center justify-between rounded-2xl bg-accent px-3 text-sm font-bold text-white shadow-glow">
      <div className="flex items-center gap-2">
        <button
          aria-label="Disminuir cantidad"
          className="grid size-8 place-items-center rounded-full bg-black/20"
          onClick={() => decrement(dishId)}
          type="button"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-5 text-center">{quantity}</span>
        <button
          aria-label="Aumentar cantidad"
          className="grid size-8 place-items-center rounded-full bg-black/20"
          onClick={() => increment(dishId)}
          type="button"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <span>{formatCurrency(price * quantity)}</span>
    </div>
  );
}
