import { Bookmark } from 'lucide-react';
import { useSavedStore } from '../store/useSavedStore';
import { useToast } from './Toast';

export function FavoriteButton({ dishId, variant = 'stack', tone = 'dark' }: { dishId: string; variant?: 'stack' | 'icon'; tone?: 'dark' | 'light' }) {
  const isSaved = useSavedStore((state) => state.isSaved(dishId));
  const toggleSaved = useSavedStore((state) => state.toggleSaved);
  const { showToast } = useToast();

  if (variant === 'icon') {
    return (
      <button
        aria-label={isSaved ? 'Quitar de guardados' : 'Guardar plato'}
        className={`grid size-9 place-items-center rounded-full transition ${
          tone === 'light' ? 'border border-neutral-200 bg-neutral-100 text-neutral-900 hover:bg-neutral-200' : 'bg-black/55 text-white backdrop-blur hover:bg-black/70'
        } ${
          isSaved ? 'text-accent' : ''
        }`}
        onClick={() => {
          toggleSaved(dishId);
          showToast(isSaved ? 'Quitado de guardados' : 'Guardado');
        }}
        type="button"
      >
        <Bookmark className="size-5" fill={isSaved ? 'currentColor' : 'none'} />
      </button>
    );
  }

  return (
    <button
      className="grid place-items-center gap-1 text-contrast"
      onClick={() => {
        toggleSaved(dishId);
        showToast(isSaved ? 'Quitado de guardados' : 'Guardado');
      }}
      type="button"
    >
      <span
        data-social-circle
        className={`grid size-10 place-items-center rounded-full border border-white/[0.12] bg-black/[0.42] backdrop-blur-xl ${
          isSaved ? 'text-accent' : ''
        }`}
      >
        <Bookmark className="size-[19px]" fill={isSaved ? 'currentColor' : 'none'} />
      </span>
      <span className="text-[0.63rem] font-medium leading-none">Guardar</span>
    </button>
  );
}

