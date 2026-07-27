import { AppLayout } from './components/AppLayout';
import { MenuExperience } from './components/MenuExperience';
import { restaurantConfig } from './config/restaurant';
import { ToastProvider } from './components/Toast';
import { useCallback, useEffect, useState } from 'react';
import type { Dish } from './types';
import { MENU_PAGE_SIZE, dishCommentsCountChangedEvent, getMenu } from './services/dishesService';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { compareMenuDishes } from './utils/menuOrdering';

let cachedMenuState: { dishes: Dish[]; hasMore: boolean; nextOffset: number } | null = null;

function mergeSortedDishes(current: Dish[], incoming: Dish[]) {
  const seenIds = new Set(current.map((dish) => dish.id));
  return [...current, ...incoming.filter((dish) => !seenIds.has(dish.id))].sort(compareMenuDishes);
}

async function loadRemainingMenuPages(startOffset: number, initialDishes: Dish[]) {
  let dishes = initialDishes;
  let nextOffset = startOffset;
  let hasMore = true;

  while (hasMore) {
    const menu = await getMenu({ limit: MENU_PAGE_SIZE, offset: nextOffset });
    dishes = mergeSortedDishes(dishes, menu.dishes);
    hasMore = Boolean(menu.pagination?.hasMore);

    const nextPageOffset = menu.pagination?.nextOffset ?? dishes.length;
    if (nextPageOffset <= nextOffset) {
      break;
    }
    nextOffset = nextPageOffset;
  }

  return { dishes, hasMore, nextOffset };
}

export default function App() {
  const [dishes, setDishes] = useState<Dish[]>(() => cachedMenuState?.dishes ?? []);
  const [hasMore, setHasMore] = useState(() => cachedMenuState?.hasMore ?? false);
  const [nextOffset, setNextOffset] = useState(() => cachedMenuState?.nextOffset ?? 0);
  const [initialMenuLoading, setInitialMenuLoading] = useState(() => !cachedMenuState);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void getMenu({ limit: MENU_PAGE_SIZE, offset: 0 })
      .then((menu) => {
        if (mounted) {
          const sortedDishes = [...menu.dishes].sort(compareMenuDishes);
          const nextState = {
            dishes: sortedDishes,
            hasMore: Boolean(menu.pagination?.hasMore),
            nextOffset: menu.pagination?.nextOffset ?? menu.dishes.length
          };
          cachedMenuState = nextState;
          setDishes(sortedDishes);
          setHasMore(nextState.hasMore);
          setNextOffset(nextState.nextOffset);
          setError('');
          setInitialMenuLoading(false);

          if (nextState.hasMore) {
            void loadRemainingMenuPages(nextState.nextOffset, nextState.dishes)
              .then((fullState) => {
                if (!mounted || fullState.dishes.length === nextState.dishes.length) return;
                cachedMenuState = fullState;
                setDishes(fullState.dishes);
                setHasMore(fullState.hasMore);
                setNextOffset(fullState.nextOffset);
              })
              .catch(() => undefined);
          }
        }
      })
      .catch((caughtError) => {
        if (mounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'No pudimos cargar el menu.');
          setInitialMenuLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadMoreDishes = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const menu = await getMenu({ limit: MENU_PAGE_SIZE, offset: nextOffset });
      const mergedDishes = mergeSortedDishes(dishes, menu.dishes);
      const nextState = {
        dishes: mergedDishes,
        hasMore: Boolean(menu.pagination?.hasMore),
        nextOffset: menu.pagination?.nextOffset ?? mergedDishes.length
      };

      cachedMenuState = nextState;
      setDishes(mergedDishes);
      setHasMore(nextState.hasMore);
      setNextOffset(nextState.nextOffset);
      setError('');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No pudimos cargar mas platos.');
    } finally {
      setLoadingMore(false);
    }
  }, [dishes, hasMore, loadingMore, nextOffset]);

  useEffect(() => {
    const syncDishCommentsCount = (event: Event) => {
      const detail = (event as CustomEvent<{ dishId?: string; delta?: number }>).detail;
      if (!detail?.dishId || !detail.delta) return;
      const delta = detail.delta;
      setDishes((current) => {
        const next = current.map((dish) =>
          dish.id === detail.dishId ? { ...dish, commentsCount: Math.max(0, dish.commentsCount + delta) } : dish
        );
        cachedMenuState = cachedMenuState ? { ...cachedMenuState, dishes: next } : null;
        return next;
      });
    };

    window.addEventListener(dishCommentsCountChangedEvent, syncDishCommentsCount);
    return () => window.removeEventListener(dishCommentsCountChangedEvent, syncDishCommentsCount);
  }, []);

  return (
    <ToastProvider>
      <AppLayout
        hideBottomNavigation={initialMenuLoading && !dishes.length}
        hideHeader={initialMenuLoading && !dishes.length}
        restaurant={restaurantConfig}
      >
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
          <MenuExperience dishes={dishes} hasMore={hasMore} loadingMore={loadingMore} onLoadMore={loadMoreDishes} />
        ) : (
          <div className="h-full overflow-hidden">
            <LoadingSkeleton />
          </div>
        )}
      </AppLayout>
    </ToastProvider>
  );
}
