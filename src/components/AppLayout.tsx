import type { ReactNode } from 'react';
import type { RestaurantConfig } from '../types';
import { BottomNavigation } from './BottomNavigation';
import { ConnectivityBanner } from './ConnectivityBanner';
import { RestaurantHeader } from './RestaurantHeader';
import { useMenuStore } from '../store/useMenuStore';

export function AppLayout({ children, restaurant }: { children: ReactNode; restaurant: RestaurantConfig }) {
  const viewMode = useMenuStore((state) => state.viewMode);

  return (
    <div className="min-h-dvh w-full bg-base text-white">
      <div
        aria-label={`${restaurant.restaurantName} - Mesa ${restaurant.tableNumber}`}
        className={`relative mx-auto flex h-dvh w-full flex-col overflow-hidden border-x border-white/5 bg-base shadow-2xl transition-[max-width] duration-300 md:my-4 md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border ${
          viewMode === 'grid' ? 'max-w-[1180px]' : 'max-w-[520px]'
        }`}
      >
        <RestaurantHeader restaurant={restaurant} />
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">{children}</main>
        <BottomNavigation />
      </div>
      <ConnectivityBanner />
    </div>
  );
}
