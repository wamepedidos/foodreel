import { X } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

export function ThemeSettingsSheet({ onClose, open }: { onClose: () => void; open: boolean }) {
  if (!open) {
    return null;
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-[75] grid place-items-end bg-black/60 px-3 pb-3 backdrop-blur-sm" role="dialog">
      <div className="w-full max-w-[520px] rounded-[24px] border border-white/10 bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Perfil</p>
            <h2 className="text-lg font-black">Configuracion</h2>
          </div>
          <button aria-label="Cerrar configuracion" className="grid size-9 place-items-center rounded-full bg-white/5 text-muted" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <ThemeSelector />
      </div>
    </div>
  );
}
