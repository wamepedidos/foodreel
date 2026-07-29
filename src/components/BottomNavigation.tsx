import { CirclePlay, ShoppingBag, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useMenuStore } from '../store/useMenuStore';

const navItems = [
  { label: 'Momentos', icon: Sparkles, path: '/comunidad' },
  { label: 'Men\u00fa', icon: CirclePlay, path: '/demo' },
  { label: 'Pedido', icon: ShoppingBag, path: '/pedido' }
];

export function BottomNavigation() {
  const totalQuantity = useCartStore((state) => state.totalQuantity());
  const viewMode = useMenuStore((state) => state.viewMode);
  const setViewMode = useMenuStore((state) => state.setViewMode);
  const location = useLocation();
  const navigate = useNavigate();
  const cartBadgeLabel = totalQuantity > 99 ? '99+' : String(totalQuantity);

  return (
    <nav
      className="bottom-nav-shell fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] border-t px-8 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl md:absolute"
    >
      <div className="grid grid-cols-3 items-end gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path
            ? location.pathname === item.path ||
              (item.path === '/comunidad' && (location.pathname.startsWith('/experience') || location.pathname.startsWith('/comunidad')))
            : false;
          const ariaLabel = item.path === '/pedido' && totalQuantity > 0 ? `Pedido, ${totalQuantity} productos` : item.label;

          return (
            <button
              aria-label={ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-[34px] flex-col items-center justify-end gap-0.5 rounded-none border-0 bg-transparent px-1 shadow-none transition ${
                active ? 'bottom-nav-active' : 'text-white hover:text-accent'
              }`}
              key={item.label}
              onClick={() => {
                if (item.path) {
                  if (item.path === '/demo') {
                    setViewMode(location.pathname === '/demo' && viewMode === 'reel' ? 'grid' : 'reel');
                  }
                  navigate(item.path);
                }
              }}
              type="button"
            >
              <span
                className={`relative grid place-items-center ${
                  active ? 'bottom-nav-active size-6' : 'size-6 text-white'
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={1.8} />
                {item.path === '/pedido' && totalQuantity > 0 ? (
                  <span
                    aria-hidden="true"
                    className={`bottom-nav-badge absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full px-1 text-[9px] font-black leading-4 ${
                      active ? 'bg-white text-accent' : 'bg-accent text-white'
                    }`}
                  >
                    {cartBadgeLabel}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-normal leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
