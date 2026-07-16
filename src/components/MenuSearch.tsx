import { Search, X } from 'lucide-react';

export function MenuSearch({
  onChange,
  onClear,
  value
}: {
  onChange: (value: string) => void;
  onClear: () => void;
  value: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-surface px-3 text-white shadow-lg">
      <Search className="size-4 text-muted" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar en el menú"
        value={value}
      />
      {value ? (
        <button
          aria-label="Limpiar búsqueda"
          className="grid size-7 place-items-center rounded-full bg-white/5 text-muted transition hover:text-white"
          onClick={onClear}
          type="button"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </label>
  );
}
