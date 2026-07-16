import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Dish } from '../types';
import { CategoryTabs } from './CategoryTabs';
import { EmptyMenuState } from './EmptyMenuState';
import { FilterButton } from './FilterButton';
import { FilterSheet, type MenuFilter } from './FilterSheet';
import { GridDishCard } from './GridDishCard';
import { GridDishSkeleton } from './GridDishSkeleton';
import { MenuSearch } from './MenuSearch';
import { useMenuStore } from '../store/useMenuStore';

export function GridMenu({ dishes }: { dishes: Dish[] }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MenuFilter>('all');
  const query = useMenuStore((state) => state.searchQuery);
  const setQuery = useMenuStore((state) => state.setSearchQuery);
  const selectedCategory = useMenuStore((state) => state.selectedCategory);
  const setSelectedCategory = useMenuStore((state) => state.setSelectedCategory);
  const setActiveDishId = useMenuStore((state) => state.setActiveDishId);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = dishes.filter((dish) => {
      const matchesCategory = selectedCategory === 'Todos' || dish.category === selectedCategory;
      const searchable = [dish.name, dish.category, dish.description, dish.shortDescription, ...dish.ingredients]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const tag = dish.tag?.toLowerCase() ?? '';
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'available' && dish.available) ||
        (activeFilter === 'promo' && tag.includes('promoci')) ||
        !['available', 'promo'].includes(activeFilter);

      return matchesCategory && matchesQuery && matchesFilter;
    });

    return [...results].sort((a, b) => {
      if (activeFilter === 'priceAsc') {
        return a.price - b.price;
      }
      if (activeFilter === 'priceDesc') {
        return b.price - a.price;
      }
      if (activeFilter === 'mostViewed') {
        return b.viewsCount - a.viewsCount;
      }
      if (activeFilter === 'mostLiked') {
        return b.likesCount - a.likesCount;
      }
      if (activeFilter === 'mostOrdered') {
        const aBoost = a.tag?.toLowerCase().includes('pedido') ? 1 : 0;
        const bBoost = b.tag?.toLowerCase().includes('pedido') ? 1 : 0;
        return bBoost - aBoost || b.viewsCount - a.viewsCount;
      }
      return 0;
    });
  }, [activeFilter, dishes, query, selectedCategory]);

  const clearFilters = () => {
    setQuery('');
    setActiveFilter('all');
    setSelectedCategory('Todos');
  };

  const retry = () => {
    setError(false);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 420);
  };

  if (error) {
    return (
      <div className="h-full overflow-y-auto px-4 pb-[96px] pt-[calc(78px+env(safe-area-inset-top))]">
        <div className="grid min-h-[62dvh] place-items-center text-center">
          <div>
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-white/10 bg-surface text-accent">
              <AlertTriangle className="size-7" />
            </div>
            <p className="mt-4 text-base font-bold">No pudimos cargar el menú</p>
            <button className="mt-4 h-10 rounded-full bg-accent px-5 text-sm font-bold text-white shadow-glow" onClick={retry} type="button">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-3 pb-[96px] pt-3 md:px-5">
      <div className="mx-auto max-w-[1120px]">
        <div className="sticky top-0 z-20 -mx-3 bg-base/92 px-3 pb-3 pt-1 backdrop-blur md:-mx-5 md:px-5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <MenuSearch value={query} onChange={setQuery} onClear={() => setQuery('')} />
            </div>
            <FilterButton activeFilter={activeFilter} onClick={() => setFilterOpen(true)} />
          </div>
          <div className="mt-3">
            <CategoryTabs />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <GridDishSkeleton key={index} />
            ))}
          </div>
        ) : filteredDishes.length ? (
          <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredDishes.map((dish) => (
              <GridDishCard dish={dish} key={dish.id} onFocus={setActiveDishId} />
            ))}
          </div>
        ) : (
          <EmptyMenuState onClear={clearFilters} />
        )}
      </div>

      <FilterSheet
        activeFilter={activeFilter}
        onChange={setActiveFilter}
        onClose={() => setFilterOpen(false)}
        open={filterOpen}
      />
    </div>
  );
}
