import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export function ExperienceConsent({
  accepted,
  error,
  onChange
}: {
  accepted: boolean;
  error?: string;
  onChange: (accepted: boolean) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="rounded-[18px] border border-white/10 bg-surface p-2.5">
      <label className="flex items-start gap-3">
        <input
          checked={accepted}
          className="mt-0.5 size-5 accent-accent"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-xs font-medium leading-4 text-white">
          {'Autorizo que esta fotograf\u00eda y comentario sean mostrados dentro de la plataforma del restaurante.'}
        </span>
      </label>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[11px] leading-4 text-muted">{'Publica contenido propio y respetuoso.'}</p>
        <button className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-accent" onClick={() => setModalOpen(true)} type="button">
          <ShieldCheck className="size-4" />
          Condiciones
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-100">{error}</p> : null}

      {modalOpen ? (
        <div aria-modal="true" className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur" role="dialog">
          <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-card p-5">
            <h2 className="text-lg font-black text-white">Condiciones</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Publica contenido propio, respetuoso y relacionado con tu visita. El restaurante podra revisar la experiencia antes de mostrarla en Comunidad.
            </p>
            <button className="mt-5 h-11 w-full rounded-2xl bg-accent text-sm font-black text-white" onClick={() => setModalOpen(false)} type="button">
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
