import { Send, X } from 'lucide-react';
import type { Dish } from '../types';
import { useToast } from './Toast';

const comments = [
  { name: 'Sofi R.', time: 'Hace 2 h', text: 'Increíble combinación, la salsa está buenísima.' },
  { name: 'Juan P.', time: 'Hace 1 h', text: 'Se ve espectacular. La voy a pedir hoy.' },
  { name: 'Meli G.', time: 'Hace 45 min', text: 'La mejor opción para compartir en la mesa.' }
];

export function CommentsSheet({ dish, open, onClose }: { dish: Dish; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();

  if (!open) {
    return null;
  }

  return (
    <div
      aria-label={`Comentarios de ${dish.name}`}
      aria-modal="true"
      className="fixed inset-0 z-[80] flex justify-center bg-black/80 backdrop-blur-sm md:items-center"
      role="dialog"
    >
      <div className="flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-card shadow-2xl md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border md:border-white/10">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 pb-4 pt-[calc(18px+env(safe-area-inset-top))]">
          <div>
            <h2 className="text-lg font-bold">Comentarios</h2>
            <p className="text-sm text-muted">{dish.name}</p>
          </div>
          <button
            aria-label="Cerrar comentarios"
            className="grid size-11 place-items-center rounded-full bg-white/5 text-muted transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {comments.map((comment) => (
            <div className="rounded-2xl bg-surface p-3" key={`${comment.name}-${comment.time}`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{comment.name}</span>
                <span className="text-muted">{comment.time}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-white/80">{comment.text}</p>
            </div>
          ))}
        </div>

        <form
          className="m-5 mb-[calc(20px+env(safe-area-inset-bottom))] flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-surface p-2"
          onSubmit={(event) => {
            event.preventDefault();
            showToast('Los comentarios en línea se habilitarán próximamente');
          }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-muted"
            placeholder="Escribe un comentario..."
          />
          <button aria-label="Enviar comentario" className="grid size-9 place-items-center rounded-full bg-accent text-white" type="submit">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
