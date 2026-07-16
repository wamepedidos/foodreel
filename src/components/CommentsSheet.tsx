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
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/60 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Comentarios</h2>
            <p className="text-sm text-muted">{dish.name}</p>
          </div>
          <button aria-label="Cerrar comentarios" className="grid size-9 place-items-center rounded-full bg-white/5 text-muted" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
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
          className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-surface p-2"
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
