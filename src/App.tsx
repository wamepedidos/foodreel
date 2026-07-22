import { AppLayout } from './components/AppLayout';
import { MenuExperience } from './components/MenuExperience';
import { restaurantConfig } from './config/restaurant';
import { ToastProvider } from './components/Toast';
import { useEffect, useState } from 'react';
import type { Dish } from './types';
import { dishCommentsCountChangedEvent, getMenu } from './services/dishesService';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void getMenu()
      .then((menu) => {
        if (mounted) {
          setDishes(menu.dishes);
          setError('');
        }
      })
      .catch((caughtError) => {
        if (mounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'No pudimos cargar el menu.');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncDishCommentsCount = (event: Event) => {
      const detail = (event as CustomEvent<{ dishId?: string; delta?: number }>).detail;
      if (!detail?.dishId || !detail.delta) return;
      const delta = detail.delta;
      setDishes((current) =>
        current.map((dish) =>
          dish.id === detail.dishId ? { ...dish, commentsCount: Math.max(0, dish.commentsCount + delta) } : dish
        )
      );
    };

    window.addEventListener(dishCommentsCountChangedEvent, syncDishCommentsCount);
    return () => window.removeEventListener(dishCommentsCountChangedEvent, syncDishCommentsCount);
  }, []);

  return (
    <ToastProvider>
      <AppLayout restaurant={restaurantConfig}>
        {error ? (
          <div className="grid h-full place-items-center px-5 text-center">
            <div>
              <p className="text-lg font-black text-white">No pudimos cargar el menu</p>
              <p className="mt-2 text-sm leading-6 text-muted">{error}</p>
              <button
                className="mt-4 h-11 rounded-2xl bg-accent px-5 text-sm font-black text-white"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : dishes.length ? (
          <MenuExperience dishes={dishes} />
        ) : (
          <div className="h-full overflow-hidden pb-[84px]">
            <LoadingSkeleton />
          </div>
        )}
      </AppLayout>
    </ToastProvider>
  );
}
