import { Camera, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantConfig } from '../../config/restaurant';
import { customerHasName } from '../../utils/customerProfile';
import { CustomerNameDialog } from '../CustomerNameDialog';
import { ExperienceEmptyState } from './ExperienceEmptyState';

export function CommunityPage() {
  const navigate = useNavigate();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  useEffect(() => {
    if (!customerHasName()) {
      setNameDialogOpen(true);
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto px-4 pb-[108px] pt-4">
      <div className="mx-auto max-w-[640px] space-y-4">
        <section className="rounded-[20px] border border-accent/25 bg-gradient-to-br from-accent/20 via-card to-surface p-5 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Comunidad · Mesa {restaurantConfig.tableNumber}</p>
          <h1 className="mt-2 text-2xl font-black text-white">Comparte lo mejor de tu visita</h1>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Crea una publicacion con foto, comentario o plato relacionado. Quedara en revision antes de mostrarse publicamente.
          </p>
          <button
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-black text-white shadow-glow"
            onClick={() => navigate('/experience/new')}
            type="button"
          >
            <Camera className="size-5" />
            Crear publicacion
          </button>
        </section>

        <ExperienceEmptyState message="El feed completo de Comunidad llegara despues. Por ahora puedes crear y revisar tu publicacion de experiencia." />
      </div>

      <button
        aria-label="Crear publicacion"
        className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-accent text-white shadow-glow md:absolute"
        onClick={() => navigate('/experience/new')}
        type="button"
      >
        <Plus className="size-7" />
      </button>

      <CustomerNameDialog
        description="Asi tus publicaciones aparecen con un nombre visible, sin crear una cuenta."
        onClose={() => setNameDialogOpen(false)}
        open={nameDialogOpen}
        title="Como quieres aparecer?"
      />
    </div>
  );
}
