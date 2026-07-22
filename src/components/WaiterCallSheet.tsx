import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './Toast';
import { createWaiterCall } from '../services/waiterCallsService';
import type { WaiterCallType } from '../types/api';

const options: { label: string; type: WaiterCallType }[] = [
  { label: 'Necesito ayuda', type: 'help' },
  { label: 'Necesito cubiertos', type: 'cutlery' },
  { label: 'Quiero pedir', type: 'order' },
  { label: 'Traer bebida', type: 'drink' },
  { label: 'Solicitar la cuenta', type: 'account' }
];

export function WaiterCallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(options[0]);
  const [sending, setSending] = useState(false);
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
                selected.type === option.type ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-surface text-muted'
              }`}
              key={option.type}
              onClick={() => setSelected(option)}
              type="button"
            >
              <span>{option.label}</span>
              {selected.type === option.type ? <CheckCircle2 className="size-5 text-accent" /> : null}
            </button>
          ))}
        </div>
        <button
          className="mt-4 h-12 w-full rounded-2xl bg-accent font-bold text-white shadow-glow"
          disabled={sending}
          onClick={() => {
            setSending(true);
            void createWaiterCall({ message: selected.label, type: selected.type })
              .then(() => {
                showToast('Solicitud enviada al mesero');
                onClose();
              })
              .catch((error) => {
                showToast(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
              })
              .finally(() => setSending(false));
          }}
          type="button"
        >
          Confirmar solicitud
        </button>
      </div>
    </div>
  );
}
