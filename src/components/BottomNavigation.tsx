import { CirclePlay, ShoppingCart, Sparkles, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useMenuStore } from '../store/useMenuStore';
import { ThemeSettingsSheet } from '../theme/ThemeSettingsSheet';

const navItems = [
  { label: 'Momentos', icon: Sparkles, path: '/comunidad' },
  { label: 'Men\u00fa', icon: CirclePlay, path: '/menu' },
  { label: 'Perfil', icon: UserRound }
];

export function BottomNavigation() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const totalQuantity = useCartStore((state) => state.totalQuantity());
  const viewMode = useMenuStore((state) => state.viewMode);
  const setViewMode = useMenuStore((state) => state.setViewMode);
  const location = useLocation();
  const navigate = useNavigate();
  const onOrderPage = location.pathname === '/pedido';
  const mockupRoute = location.pathname === '/comunidad/mockup';
  const showFloatingCart = !mockupRoute && !onOrderPage && !(location.pathname === '/menu' && viewMode === 'reel');

  return (
    <nav
      className={`bottom-nav-shell fixed inset-x-0 bottom-0 z-50 mx-auto border-t px-8 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl md:absolute ${
        mockupRoute ? 'max-w-[520px]' : viewMode === 'grid' ? 'max-w-[1180px]' : 'max-w-[520px]'
      }`}
    >
      {showFloatingCart ? (
        <button
          aria-label="Ver carrito"
          className="absolute right-4 top-[-88px] grid size-[66px] place-items-center rounded-full border border-white/10 bg-black/[0.56] text-white shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl transition hover:border-accent/60"
          onClick={() => navigate('/pedido')}
          type="button"
        >
          <ShoppingCart className="size-8" strokeWidth={2.2} />
          {totalQuantity > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid min-w-7 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
              {totalQuantity}
            </span>
          ) : null}
        </button>
      ) : null}

      <div className="grid grid-cols-3 items-end gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path
            ? location.pathname === item.path ||
              (item.path === '/comunidad' && (location.pathname.startsWith('/experience') || location.pathname.startsWith('/comunidad')))
            : false;

          return (
            <button
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-[34px] flex-col items-center justify-end gap-0.5 px-1 transition ${
                active ? 'bottom-nav-active' : 'text-white hover:text-accent'
              }`}
              key={item.label}
              onClick={() => {
                if (item.path) {
                  if (item.path === '/menu') {
                    setViewMode(location.pathname === '/menu' && viewMode === 'reel' ? 'grid' : 'reel');
                  }
                  navigate(item.path);
                  return;
                }

                setSettingsOpen(true);
              }}
              type="button"
            >
              <span
                className={`grid place-items-center ${
                  active ? 'bottom-nav-active size-6 rounded-md border border-accent shadow-[0_0_12px_rgba(252,45,4,0.34)]' : 'size-6 text-white'
                }`}
              >
                <Icon className={active ? 'size-4' : 'size-[18px]'} strokeWidth={1.8} />
              </span>
              <span className="text-[10px] font-normal leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
      <ThemeSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </nav>
  );
}
