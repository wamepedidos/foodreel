import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { RestaurantConfig } from '../types';
import { BottomNavigation } from './BottomNavigation';
import { ConnectivityBanner } from './ConnectivityBanner';
import { RestaurantHeader } from './RestaurantHeader';
import { WaiterCallButton } from './WaiterCallButton';
import { useMenuStore } from '../store/useMenuStore';
import { useLocation, useNavigate } from 'react-router-dom';

export function AppLayout({ children, restaurant }: { children: ReactNode; restaurant: RestaurantConfig }) {
  const viewMode = useMenuStore((state) => state.viewMode);
  const location = useLocation();
  const orderRoute = location.pathname === '/pedido';
  const mockupRoute = location.pathname === '/comunidad/mockup';
  const expandedRoute = location.pathname.startsWith('/experience') || location.pathname === '/comunidad';
  const immersiveMenu = mockupRoute || (location.pathname === '/menu' && viewMode === 'reel');
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
        {immersiveMenu ? null : orderRoute ? <OrderHeader /> : <RestaurantHeader restaurant={restaurant} />}
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">{children}</main>
        <BottomNavigation />
      </div>
      <ConnectivityBanner />
    </div>
  );
}

function OrderHeader() {
  const navigate = useNavigate();

  return (
    <header className="relative z-40 flex items-center justify-between border-b border-black/5 bg-white px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))] text-[#252832] shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Volver al menu"
          className="grid size-11 shrink-0 place-items-center rounded-2xl border border-black/5 bg-white text-[#252832] shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:border-accent/40 hover:text-accent"
          onClick={() => navigate('/menu')}
          type="button"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-xl font-black leading-tight">Pedidos</h1>
      </div>
      <WaiterCallButton />
    </header>
  );
}
