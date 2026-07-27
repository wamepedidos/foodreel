import type { ReactNode } from 'react';
import type { RestaurantConfig } from '../types';
import { BottomNavigation } from './BottomNavigation';
import { ConnectivityBanner } from './ConnectivityBanner';
import { RestaurantHeader } from './RestaurantHeader';
import { useMenuStore } from '../store/useMenuStore';
import { useLocation } from 'react-router-dom';

export function AppLayout({
  children,
  hideHeader = false,
  hideBottomNavigation = false,
  restaurant
}: {
  children: ReactNode;
  hideHeader?: boolean;
  hideBottomNavigation?: boolean;
  restaurant: RestaurantConfig;
}) {
  const viewMode = useMenuStore((state) => state.viewMode);
  const location = useLocation();
  const orderRoute = location.pathname === '/pedido';
  const experienceRoute = location.pathname.startsWith('/experience');
  const mockupRoute = location.pathname === '/comunidad/mockup';
  const momentosRoute = location.pathname === '/comunidad' || mockupRoute;
  const immersiveMenu = orderRoute || experienceRoute || momentosRoute || (location.pathname === '/menu' && viewMode === 'reel');
  const frameClass = 'border-0 md:my-0 md:h-dvh md:rounded-none';

  return (
    <div className={`min-h-dvh w-full ${orderRoute ? 'bg-[#f7f7f6] text-[#252832]' : 'bg-base text-white'}`}>
      <div
        aria-label={`${restaurant.restaurantName} - Mesa ${restaurant.tableNumber}`}
        className={`relative mx-auto flex h-dvh w-full flex-col overflow-hidden shadow-2xl transition-[max-width] duration-300 ${
          orderRoute ? 'order-page-frame bg-[#f7f7f6]' : 'bg-base'
        } ${frameClass} max-w-[520px]`}
      >
        {hideHeader || immersiveMenu ? null : <RestaurantHeader restaurant={restaurant} />}
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">{children}</main>
        {hideBottomNavigation ? null : <BottomNavigation />}
      </div>
      <ConnectivityBanner />
    </div>
  );
}
