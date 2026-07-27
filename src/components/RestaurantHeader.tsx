import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RestaurantConfig } from '../types';
import { WaiterCallButton } from './WaiterCallButton';

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantConfig }) {
  const navigate = useNavigate();

  return (
    <header className="menu-app-header relative z-40 border-b border-black/5 bg-[#f7f7f6] px-4 pb-3 pt-[calc(18px+env(safe-area-inset-top))] text-[#252832]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            aria-label="Volver a momentos"
            className="menu-back-button grid size-10 shrink-0 place-items-center rounded-[16px] border border-[#e9e5e1] bg-white text-[#252832] shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition hover:border-accent/50 hover:text-accent"
            onClick={() => navigate('/comunidad')}
            type="button"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-normal text-[#252832]">Menú</h1>
            <p className="mt-1 truncate text-[0.68rem] font-medium leading-5 text-[#737987]">
              {restaurant.restaurantName} - Mesa {restaurant.tableNumber}
            </p>
          </div>
        </div>
        <WaiterCallButton />
      </div>
    </header>
  );
}
