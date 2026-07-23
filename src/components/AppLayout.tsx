import type { ReactNode } from 'react';
import type { RestaurantConfig } from '../types';
import { BottomNavigation } from './BottomNavigation';
import { ConnectivityBanner } from './ConnectivityBanner';
import { RestaurantHeader } from './RestaurantHeader';
import { useMenuStore } from '../store/useMenuStore';
import { useLocation } from 'react-router-dom';

export function AppLayout({ children, restaurant }: { children: ReactNode; restaurant: RestaurantConfig }) {
  const viewMode = useMenuStore((state) => state.viewMode);
  const location = useLocation();
  const mockupRoute = location.pathname === '/comunidad/mockup';
  const orderRoute = location.pathname === '/pedido';
  const expandedRoute = location.pathname.startsWith('/experience') || location.pathname === '/comunidad';
  const immersiveMenu = mockupRoute || (location.pathname === '/menu' && viewMode === 'reel');
  const hideHeader = immersiveMenu || orderRoute;
  const maxWidthClass = mockupRoute ? 'max-w-[520px]' : expandedRoute || viewMode === 'grid' ? 'max-w-[1180px]' : 'max-w-[520px]';
  const frameClass = immersiveMenu
    ? 'border-0 md:my-0 md:h-dvh md:rounded-none'
    : 'border-x border-white/5 md:my-4 md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border';

  return (
    <div className="min-h-dvh w-full bg-base text-white">
      <div
        aria-label={`${restaurant.restaurantName} - Mesa ${restaurant.tableNumber}`}
        className={`relative mx-auto flex h-dvh w-full flex-col overflow-hidden bg-base shadow-2xl transition-[max-width] duration-300 ${frameClass} ${maxWidthClass}`}
      >
        {hideHeader ? null : <RestaurantHeader restaurant={restaurant} />}
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">{children}</main>
        <BottomNavigation />
      </div>
      <ConnectivityBanner />
    </div>
  );
}
