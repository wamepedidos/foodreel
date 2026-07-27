import { useMenuStore } from '../store/useMenuStore';
import { formatMenuCategoryLabel, normalizeMenuCategory } from '../utils/menuOrdering';

export function CategoryTabs({ categories }: { categories: string[] }) {
  const selectedCategory = useMenuStore((state) => state.selectedCategory);
  const setSelectedCategory = useMenuStore((state) => state.setSelectedCategory);
  const items = ['Todos', ...categories];

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((category) => {
        const active = category === 'Todos' ? selectedCategory === 'Todos' : normalizeMenuCategory(selectedCategory) === normalizeMenuCategory(category);
        return (
          <button
            aria-pressed={active}
            className={`h-9 shrink-0 rounded-full px-4 text-xs font-bold transition ${
              active
                ? 'bg-accent text-white shadow-glow'
                : 'border border-white/10 bg-surface text-muted hover:border-accent/40 hover:text-white'
            }`}
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {category === 'Todos' ? category : formatMenuCategoryLabel(category)}
          </button>
        );
      })}
    </div>
  );
}
