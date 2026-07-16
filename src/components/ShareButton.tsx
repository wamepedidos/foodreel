import { Send } from 'lucide-react';
import type { Dish } from '../types';
import { formatCurrency } from '../utils/format';
import { useToast } from './Toast';

export function ShareButton({ dish }: { dish: Dish }) {
  const { showToast } = useToast();

  return (
    <button
      className="grid place-items-center gap-1 text-white"
      onClick={async () => {
        const url = window.location.href;
        const shareData = {
          title: dish.name,
          text: `${dish.name} por ${formatCurrency(dish.price)} en Saborea.`,
          url
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
            showToast('Plato compartido');
          } else {
            await navigator.clipboard.writeText(url);
            showToast('Enlace copiado');
          }
        } catch {
          showToast('No se pudo compartir ahora');
        }
      }}
      type="button"
    >
      <span className="grid size-11 place-items-center rounded-full bg-black/45 backdrop-blur">
        <Send className="size-6" />
      </span>
      <span className="text-[11px] font-bold">Enviar</span>
    </button>
  );
}
