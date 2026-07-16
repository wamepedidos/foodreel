import { CheckCircle2, X } from 'lucide-react';

export type MenuFilter = 'all' | 'available' | 'promo' | 'mostOrdered' | 'mostViewed' | 'mostLiked' | 'priceAsc' | 'priceDesc';

export const filterLabels: Record<MenuFilter, string> = {
  all: 'Todos',
  available: 'Disponibles',
  promo: 'Promociones',
  mostOrdered: 'Más pedidos',
  mostViewed: 'Más vistos',
  mostLiked: 'Mayor cantidad de me gusta',
  priceAsc: 'Precio menor a mayor',
  priceDesc: 'Precio mayor a menor'
};

const filterOptions = Object.entries(filterLabels) as Array<[MenuFilter, string]>;

export function FilterSheet({
  activeFilter,
  onChange,
  onClose,
  open
}: {
  activeFilter: MenuFilter;
  onChange: (filter: MenuFilter) => void;
  onClose: () => void;
  open: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] grid place-items-end bg-black/60 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[520px] rounded-[24px] border border-white/10 bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Filtros</h2>
            <p className="text-sm text-muted">Ordena y enfoca el mosaico.</p>
          </div>
          <button aria-label="Cerrar filtros" className="grid size-9 place-items-center rounded-full bg-white/5 text-muted" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-2">
          {filterOptions.map(([value, label]) => {
            const active = activeFilter === value;
            return (
              <button
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  active ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-surface text-muted'
                }`}
                key={value}
                onClick={() => {
                  onChange(value);
                  onClose();
                }}
                type="button"
              >
                <span>{label}</span>
                {active ? <CheckCircle2 className="size-5 text-accent" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
