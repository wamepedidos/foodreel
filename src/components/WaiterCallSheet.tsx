import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './Toast';

const options = ['Necesito ayuda', 'Necesito cubiertos', 'Quiero pedir', 'Solicitar la cuenta'];

export function WaiterCallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(options[0]);
  const { showToast } = useToast();

  if (!open) {
    return null;
  }

  return (
      <div className="fixed inset-0 z-[70] grid place-items-end bg-black/55 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Llamar mesero</h2>
            <p className="text-sm text-muted">Elige una opción para continuar.</p>
          </div>
          <button aria-label="Cerrar llamada al mesero" className="grid size-9 place-items-center rounded-full bg-white/5 text-muted" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-2">
          {options.map((option) => (
            <button
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                selected === option ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-surface text-muted'
              }`}
              key={option}
              onClick={() => setSelected(option)}
              type="button"
            >
              <span>{option}</span>
              {selected === option ? <CheckCircle2 className="size-5 text-accent" /> : null}
            </button>
          ))}
        </div>
        <button
          className="mt-4 h-12 w-full rounded-2xl bg-accent font-bold text-white shadow-glow"
          onClick={() => {
            showToast('Solicitud enviada al mesero');
            onClose();
          }}
          type="button"
        >
          Confirmar solicitud
        </button>
      </div>
    </div>
  );
}
