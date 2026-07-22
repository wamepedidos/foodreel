import { Minus, Plus } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '../utils/format';

export function QuantitySelector({
  dishId,
  quantity,
  price,
  variant = 'compact'
}: {
  dishId: string;
  quantity: number;
  price: number;
  variant?: 'compact' | 'reel';
}) {
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);

  return (
    <div
      className={
        variant === 'reel'
          ? 'flex h-10 min-w-0 w-full items-center justify-between rounded-[16px] bg-accent px-2 text-xs font-bold text-white shadow-[0_14px_36px_rgba(252,45,4,0.30)]'
          : 'flex h-12 min-w-0 flex-1 items-center justify-between rounded-2xl bg-accent px-2 text-sm font-bold text-white'
      }
    >
      <div className="flex items-center gap-1">
        <button
          aria-label="Disminuir cantidad"
          className="grid size-7 place-items-center rounded-full bg-black/20"
          onClick={() => decrement(dishId)}
          type="button"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-4 text-center">{quantity}</span>
        <button
          aria-label="Aumentar cantidad"
          className="grid size-7 place-items-center rounded-full bg-black/20"
          onClick={() => increment(dishId)}
          type="button"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <span className="truncate pl-1 text-xs">{formatCurrency(price * quantity)}</span>
    </div>
  );
}
