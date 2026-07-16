import { SearchX } from 'lucide-react';

export function EmptyMenuState({ onClear }: { onClear: () => void }) {
  return (
    <div className="grid min-h-[42dvh] place-items-center px-8 text-center">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-white/10 bg-surface text-muted">
          <SearchX className="size-7" />
        </div>
        <p className="mt-4 text-base font-bold">No encontramos platos con estos filtros</p>
        <button className="mt-4 h-10 rounded-full bg-accent px-5 text-sm font-bold text-white shadow-glow" onClick={onClear} type="button">
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
