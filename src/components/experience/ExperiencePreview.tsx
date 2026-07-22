import { Eye, MessageCircle, Send, Utensils } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';
import type { ExperienceMediaDraft, SelectedExperienceDish } from './experienceTypes';

export function ExperiencePreview({
  caption,
  media,
  selectedDish,
  userName
}: {
  caption: string;
  media: ExperienceMediaDraft | null;
  selectedDish: SelectedExperienceDish | null;
  userName: string;
}) {
  return (
    <section className="rounded-[20px] border border-white/10 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-white">Vista previa</h2>
        <span className="text-xs font-bold text-muted">Ahora</span>
      </div>
      <article className="overflow-hidden rounded-[20px] border border-white/10 bg-base">
        <div className="flex items-center gap-3 p-3">
          <div className="grid size-10 place-items-center rounded-full bg-accent text-sm font-black text-white">{(userName || 'Cliente').slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{userName || 'Cliente'}</p>
            <p className="text-xs text-muted">Experiencia en Mesa {restaurantConfig.tableNumber}</p>
          </div>
        </div>
        {media ? (
          <img alt="" className="aspect-[4/5] w-full object-cover md:aspect-[16/11]" src={media.previewUrl} />
        ) : (
          <div className="grid aspect-[4/5] place-items-center bg-surface p-6 text-center md:aspect-[16/11]">
            <div>
              <Utensils className="mx-auto size-9 text-accent" />
              <p className="mt-2 text-sm font-bold text-white">Tu momento se vera aqui</p>
            </div>
          </div>
        )}
        <div className="space-y-3 p-3">
          {caption.trim() ? <p className="whitespace-pre-wrap text-sm leading-5 text-white/85">{caption.trim()}</p> : <p className="text-sm text-muted">Tu comentario aparecera aqui.</p>}
          {selectedDish ? (
            <div className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-2">
              <img alt="" className="size-11 rounded-xl object-cover" src={selectedDish.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{selectedDish.name}</p>
                <button className="mt-1 text-xs font-bold text-accent" type="button">
                  Ver plato
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-around border-t border-white/10 pt-3 text-xs font-bold text-muted">
            <span className="inline-flex items-center gap-1"><Eye className="size-4" /> 0</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="size-4" /> 0</span>
            <span className="inline-flex items-center gap-1"><Send className="size-4" /> Compartir</span>
          </div>
        </div>
      </article>
    </section>
  );
}
