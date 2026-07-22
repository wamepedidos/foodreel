import { Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createExperienceComment, mergeComments, subscribeToExperienceComments } from '../../services/commentsService';
import type { ExperienceComment, ExperiencePost } from '../../types';
import { readCustomerProfile } from '../../utils/customerProfile';
import { useCustomerHasName } from '../../utils/useCustomerHasName';
import { CustomerNameDialog } from '../CustomerNameDialog';
import { useToast } from '../Toast';

export function ExperienceCommentsSheet({
  open,
  post,
  userId,
  onClose
}: {
  open: boolean;
  post: ExperiencePost;
  userId: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [text, setText] = useState('');
  const [hasCustomerName, setHasCustomerName] = useCustomerHasName(open);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    return subscribeToExperienceComments(post.id, (nextComments) => {
      setComments((current) => mergeComments(current, nextComments));
    });
  }, [open, post.id]);

  if (!open) {
    return null;
  }

  const canComment = post.status === 'approved';

  return (
    <div aria-modal="true" className="fixed inset-0 z-[80] flex justify-center bg-black/80 backdrop-blur-sm md:items-center" role="dialog">
      <div className="flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-card shadow-2xl md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border md:border-white/10">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 pb-4 pt-[calc(18px+env(safe-area-inset-top))]">
          <div>
            <h2 className="text-lg font-bold">Comentarios</h2>
            <p className="text-sm text-muted">{canComment ? 'En tiempo real' : 'Disponibles cuando este aprobada'}</p>
          </div>
          <button aria-label="Cerrar comentarios" className="grid size-11 place-items-center rounded-full bg-white/5 text-muted transition hover:bg-white/10 hover:text-white" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {comments.length ? (
            comments.map((comment) => (
              <div className="rounded-2xl bg-surface p-3" key={comment.id}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-white">{comment.userName}</span>
                  <span className="text-muted">Ahora</span>
                </div>
                <p className="mt-2 text-sm leading-5 text-white/80">{comment.text}</p>
              </div>
            ))
          ) : (
            <div className="grid h-full min-h-40 place-items-center text-center text-sm text-muted">
              {canComment ? 'Aun no hay comentarios.' : 'Esta publicacion sigue en revision.'}
            </div>
          )}
        </div>

        <form
          className="m-5 mb-[calc(20px+env(safe-area-inset-bottom))] flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-surface p-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canComment) {
              showToast('Los comentarios se habilitan cuando la publicacion sea aprobada');
              return;
            }
            const trimmedText = text.replace(/\s+/g, ' ').trim();
            if (!trimmedText || sending) {
              return;
            }
            if (!hasCustomerName) {
              setNameDialogOpen(true);
              return;
            }
            setSending(true);
            try {
              const comment = await createExperienceComment({
                experiencePostId: post.id,
                text: trimmedText,
                userId,
                userName: readCustomerProfile().displayName.trim()
              });
              setComments((current) => mergeComments(current, [comment]));
              setText('');
            } catch {
              showToast('No se pudo enviar el comentario');
            } finally {
              setSending(false);
            }
          }}
        >
          {hasCustomerName ? (
            <>
              <input
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-muted disabled:opacity-50"
                disabled={!canComment || sending}
                onChange={(event) => setText(event.target.value)}
                placeholder="Escribe un comentario..."
                value={text}
              />
              <button aria-label="Enviar comentario" className="grid size-9 place-items-center rounded-full bg-accent text-white disabled:opacity-50" disabled={!canComment || sending} type="submit">
                <Send className="size-4" />
              </button>
            </>
          ) : (
            <button
              className="h-10 w-full rounded-2xl bg-accent px-4 text-sm font-normal text-white disabled:opacity-50"
              disabled={!canComment}
              onClick={() => setNameDialogOpen(true)}
              type="button"
            >
              Dinos tu nombre para enviar comentarios
            </button>
          )}
        </form>
      </div>
      <CustomerNameDialog
        description="Tu nombre aparecera junto a los comentarios que hagas."
        onClose={() => setNameDialogOpen(false)}
        onConfirm={() => setHasCustomerName(true)}
        open={nameDialogOpen}
        title="Dinos tu nombre"
      />
    </div>
  );
}
