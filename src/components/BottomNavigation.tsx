import { Heart, Home, Menu as MenuIcon, ShoppingBag, UserRound, UsersRound } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useToast } from './Toast';

const navItems = [
  { label: 'Comunidad', icon: UsersRound, active: false },
  { label: 'Guardados', icon: Heart, active: false },
  { label: 'Menú', icon: MenuIcon, active: true },
  { label: 'Carrito', icon: ShoppingBag, active: false, cart: true },
  { label: 'Perfil', icon: UserRound, active: false }
];

export function BottomNavigation() {
  const totalQuantity = useCartStore((state) => state.totalQuantity());
  const { showToast } = useToast();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] border-t border-white/10 bg-base/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:absolute md:rounded-b-[28px]">
      <div className="grid grid-cols-5 items-end gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              aria-current={item.active ? 'page' : undefined}
              className={`relative flex min-h-[54px] flex-col items-center justify-end gap-1 rounded-2xl px-1 text-[11px] transition ${
                item.active ? 'text-accent' : 'text-muted hover:text-white'
              }`}
              key={item.label}
              onClick={() => {
                if (!item.active) {
                  showToast(`${item.label} estará disponible próximamente`);
                }
              }}
              type="button"
            >
              <span
                className={`grid place-items-center ${
                  item.active
                    ? '-mt-6 size-14 rounded-full bg-accent text-white shadow-glow ring-8 ring-base'
                    : 'size-6'
                }`}
              >
                <Icon className={item.active ? 'size-7' : 'size-5'} />
              </span>
              <span className="leading-none">{item.label}</span>
              {item.cart && totalQuantity > 0 ? (
                <span className="absolute right-3 top-0 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
