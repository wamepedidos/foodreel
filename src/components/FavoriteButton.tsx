import { Bookmark } from 'lucide-react';
import { useSavedStore } from '../store/useSavedStore';
import { useToast } from './Toast';

export function FavoriteButton({ dishId, variant = 'stack' }: { dishId: string; variant?: 'stack' | 'icon' }) {
  const isSaved = useSavedStore((state) => state.isSaved(dishId));
  const toggleSaved = useSavedStore((state) => state.toggleSaved);
  const { showToast } = useToast();

  if (variant === 'icon') {
    return (
      <button
        aria-label={isSaved ? 'Quitar de guardados' : 'Guardar plato'}
        className={`grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 ${
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
      className="grid place-items-center gap-1 text-white"
      onClick={() => {
        toggleSaved(dishId);
        showToast(isSaved ? 'Quitado de guardados' : 'Guardado');
      }}
      type="button"
    >
      <span className={`grid size-11 place-items-center rounded-full bg-black/45 backdrop-blur ${isSaved ? 'text-accent' : ''}`}>
        <Bookmark className="size-6" fill={isSaved ? 'currentColor' : 'none'} />
      </span>
      <span className="text-[11px] font-bold">Guardar</span>
    </button>
  );
}
