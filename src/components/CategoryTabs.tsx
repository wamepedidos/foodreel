import { useMenuStore } from '../store/useMenuStore';

const categories = ['Todos', 'Hamburguesas', 'Pastas', 'Entradas', 'Bebidas', 'Postres'];

export function CategoryTabs() {
  const selectedCategory = useMenuStore((state) => state.selectedCategory);
  const setSelectedCategory = useMenuStore((state) => state.setSelectedCategory);

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {categories.map((category) => {
        const active = selectedCategory === category;
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
            {category}
          </button>
        );
      })}
    </div>
  );
}
