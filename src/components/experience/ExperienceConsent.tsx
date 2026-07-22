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
    <div className="rounded-[20px] border border-white/10 bg-surface p-3">
      <label className="flex items-start gap-3">
        <input
          checked={accepted}
          className="mt-1 size-5 accent-accent"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm leading-5 text-white">
          {'Autorizo que esta fotograf\u00eda y comentario sean mostrados dentro de la plataforma del restaurante.'}
        </span>
      </label>
      <p className="mt-3 text-xs leading-5 text-muted">{'Evita publicar fotograf\u00edas de otras personas sin su autorizaci\u00f3n.'}</p>
      <button className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-accent" onClick={() => setModalOpen(true)} type="button">
        <ShieldCheck className="size-4" />
        Ver condiciones de publicacion
      </button>
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
