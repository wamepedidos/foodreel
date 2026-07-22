import { Sparkles } from 'lucide-react';

export function ExperienceMessageCard() {
  return (
    <section className="rounded-[20px] border border-accent/25 bg-gradient-to-br from-accent/20 via-card to-surface p-4 shadow-glow">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-white">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-white">{'Por favor, crea una publicaci\u00f3n y ay\u00fadanos a crecer.'}</h2>
          <p className="mt-2 text-sm leading-5 text-white/75">
            {'Cu\u00e9ntales a otros clientes qu\u00e9 est\u00e1s disfrutando y comparte tu momento en el restaurante.'}
          </p>
        </div>
      </div>
    </section>
  );
}
