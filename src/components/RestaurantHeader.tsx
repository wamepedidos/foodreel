import { Grid2X2, RectangleVertical, Utensils } from 'lucide-react';
import type { RestaurantConfig } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { WaiterCallButton } from './WaiterCallButton';

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantConfig }) {
  const viewMode = useMenuStore((state) => state.viewMode);
  const setViewMode = useMenuStore((state) => state.setViewMode);
  const setActiveDishId = useMenuStore((state) => state.setActiveDishId);
  const nextMode = viewMode === 'reel' ? 'grid' : 'reel';
  const toggleLabel = viewMode === 'reel' ? 'Abrir vista mosaico' : 'Volver a vista Reel';

  const handleToggleView = () => {
    if (viewMode === 'reel') {
      const reel = document.querySelector<HTMLElement>('.reel-viewport');
      const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-dish-id]'));
      const activeIndex = reel ? Math.round(reel.scrollTop / Math.max(reel.clientHeight, 1)) : 0;
      const activeDishId = cards[activeIndex]?.dataset.dishId;

      if (activeDishId) {
        setActiveDishId(activeDishId);
      }
    }

    setViewMode(nextMode);
  };

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
          aria-label={toggleLabel}
          className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-surface text-accent transition hover:border-accent/50"
          onClick={handleToggleView}
          title={toggleLabel}
          type="button"
        >
          {viewMode === 'reel' ? <Grid2X2 className="size-5" /> : <RectangleVertical className="size-5" />}
        </button>
      </div>
    </header>
  );
}
