import { Grid2X2, Utensils } from 'lucide-react';
import type { RestaurantConfig } from '../types';
import { useToast } from './Toast';
import { WaiterCallButton } from './WaiterCallButton';

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantConfig }) {
  const { showToast } = useToast();

  return (
    <header className="relative z-40 flex items-center justify-between border-b border-white/10 bg-base/95 px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-2xl shadow-glow ${
            restaurant.logoSrc ? 'bg-white p-1' : 'bg-accent text-lg font-black text-white'
          }`}
        >
          {restaurant.logoSrc ? (
            <img alt={`${restaurant.brandName} logo`} className="size-full object-contain" src={restaurant.logoSrc} />
          ) : (
            restaurant.logoText || <Utensils className="size-6" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold leading-tight">{restaurant.brandName}</p>
          <p className="truncate text-xs text-muted">
            {restaurant.restaurantName} · Mesa {restaurant.tableNumber}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <WaiterCallButton />
        <button
          aria-label="Abrir vista mosaico"
          className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-surface text-accent transition hover:border-accent/50"
          onClick={() => showToast('Vista mosaico disponible en la próxima etapa')}
          type="button"
        >
          <Grid2X2 className="size-5" />
        </button>
      </div>
    </header>
  );
}
