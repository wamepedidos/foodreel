import { Bookmark } from 'lucide-react';
import { useSavedStore } from '../store/useSavedStore';
import { useToast } from './Toast';

export function FavoriteButton({ dishId }: { dishId: string }) {
  const isSaved = useSavedStore((state) => state.isSaved(dishId));
  const toggleSaved = useSavedStore((state) => state.toggleSaved);
  const { showToast } = useToast();

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
