import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Clock3 } from 'lucide-react';
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
    <div className={`min-h-dvh w-full ${orderRoute ? 'bg-[#f7f7f6] text-[#252832]' : 'bg-base text-white'}`}>
      <div
        aria-label={`${restaurant.restaurantName} - Mesa ${restaurant.tableNumber}`}
        className={`relative mx-auto flex h-dvh w-full flex-col overflow-hidden shadow-2xl transition-[max-width] duration-300 ${
          orderRoute ? 'order-page-frame bg-[#f7f7f6]' : 'bg-base'
        } ${frameClass} ${maxWidthClass}`}
      >
        {immersiveMenu ? null : orderRoute ? <OrderHeader restaurant={restaurant} /> : <RestaurantHeader restaurant={restaurant} />}
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">{children}</main>
        <BottomNavigation />
      </div>
      <ConnectivityBanner />
    </div>
  );
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `00:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function OrderHeader({ restaurant }: { restaurant: RestaurantConfig }) {
  const navigate = useNavigate();
  const [elapsedSeconds, setElapsedSeconds] = useState(18 * 60 + 24);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="order-app-header relative z-40 flex flex-col gap-3 border-b border-black/5 bg-white px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))] text-[#252832] shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Volver al menu"
            className="order-back-button grid size-11 shrink-0 place-items-center rounded-2xl border border-black/5 bg-white text-[#252832] shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:border-accent/40 hover:text-accent"
            onClick={() => navigate('/menu')}
            type="button"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="truncate text-xl font-black leading-tight">Pedidos</h1>
        </div>
        <WaiterCallButton />
      </div>

      <div className="flex w-full items-end justify-between gap-3 pl-1">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase leading-none tracking-[0.16em] text-accent">Mesa {restaurant.tableNumber}</p>
          <h2 className="mt-1 truncate text-2xl font-black leading-7 text-[#252832]">Pedido</h2>
          <p className="text-xs font-medium leading-5 text-[#737987]">Administras este pedido</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[#e9f8e8] px-3 text-[11px] font-black text-[#14942d]">
            <span className="size-1.5 rounded-full bg-[#14942d]" />
            Mesa activa
          </span>
          <p className="mt-1.5 text-[11px] font-medium text-[#737987]">Tiempo en mesa</p>
          <p className="mt-0.5 whitespace-nowrap text-xs font-black text-accent">
            <Clock3 className="mr-1 inline size-3.5 align-[-2px]" />
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      </div>
    </header>
  );
}
