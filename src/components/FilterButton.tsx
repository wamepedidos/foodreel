import { SlidersHorizontal } from 'lucide-react';
import type { MenuFilter } from './FilterSheet';

export function FilterButton({ activeFilter, onClick }: { activeFilter: MenuFilter; onClick: () => void }) {
  const active = activeFilter !== 'all';

  return (
    <button
      aria-label="Abrir filtros"
      className={`relative grid size-11 shrink-0 place-items-center rounded-2xl border transition ${
        active
          ? 'border-accent/60 bg-accent/15 text-accent'
          : 'border-white/10 bg-surface text-muted hover:border-accent/40 hover:text-white'
      }`}
      onClick={onClick}
      type="button"
    >
      <SlidersHorizontal className="size-5" />
      {active ? <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" /> : null}
    </button>
  );
}
