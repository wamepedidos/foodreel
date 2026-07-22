import { Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createDishComment, mergeComments, subscribeToDishComments } from '../services/commentsService';
import type { Dish, ExperienceComment } from '../types';
import { readCustomerProfile } from '../utils/customerProfile';
import { getOrCreateCustomerSessionId } from '../utils/session';
import { useCustomerHasName } from '../utils/useCustomerHasName';
import { CustomerNameDialog } from './CustomerNameDialog';
import { useToast } from './Toast';

export function CommentsSheet({ dish, open, onClose }: { dish: Dish; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [draft, setDraft] = useState('');
  const [hasCustomerName, setHasCustomerName] = useCustomerHasName(open);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    return subscribeToDishComments(dish.id, (nextComments) => {
      setComments((current) => mergeComments(current, nextComments));
    });
  }, [dish.id, open]);

  if (!open) {
    return null;
  }

  const sendComment = () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!hasCustomerName) {
      setNameDialogOpen(true);
      return;
    }

    setSending(true);
    void createDishComment({
      dishId: dish.id,
      text,
      userId: getOrCreateCustomerSessionId(),
      userName: readCustomerProfile().displayName.trim() || 'Cliente'
    })
      .then((comment) => {
        setComments((current) => mergeComments(current, [comment]));
        setDraft('');
        showToast('Comentario enviado');
      })
      .catch((error) => showToast(error instanceof Error ? error.message : 'No se pudo comentar'))
      .finally(() => setSending(false));
  };

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
          {comments.length ? (
            comments.map((comment) => (
              <div className="rounded-2xl bg-surface p-3" key={comment.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{comment.userName}</span>
                  <span className="text-muted">
                    {new Date(comment.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-white/80">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-surface p-3 text-sm text-muted">Aun no hay comentarios aprobados.</p>
          )}
        </div>

        {hasCustomerName ? (
          <form
            className="m-5 mb-[calc(20px+env(safe-area-inset-bottom))] flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-surface p-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendComment();
            }}
          >
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-muted"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe un comentario..."
              value={draft}
            />
            <button
              aria-label="Enviar comentario"
              className="grid size-9 place-items-center rounded-full bg-accent text-white disabled:opacity-50"
              disabled={sending}
              type="submit"
            >
              <Send className="size-4" />
            </button>
          </form>
        ) : (
          <div className="m-5 mb-[calc(20px+env(safe-area-inset-bottom))] shrink-0">
            <button
              className="h-12 w-full rounded-2xl bg-accent px-4 text-sm font-normal text-white shadow-glow"
              onClick={() => setNameDialogOpen(true)}
              type="button"
            >
              Dinos tu nombre para enviar comentarios
            </button>
          </div>
        )}
      </div>
      <CustomerNameDialog
        description="Tu nombre aparecera junto a los comentarios que hagas en los platos."
        onClose={() => setNameDialogOpen(false)}
        onConfirm={() => setHasCustomerName(true)}
        open={nameDialogOpen}
        title="Dinos tu nombre"
      />
    </div>
  );
}
