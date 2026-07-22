import { UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readCustomerProfile, writeCustomerProfile, type CustomerProfile } from '../utils/customerProfile';

export function CustomerNameDialog({
  description,
  onClose,
  onConfirm,
  open,
  title
}: {
  description: string;
  onClose?: () => void;
  onConfirm?: (profile: CustomerProfile) => void;
  open: boolean;
  title: string;
}) {
  const [profile, setProfile] = useState<CustomerProfile>(() => readCustomerProfile());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setProfile(readCustomerProfile());
      setError('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const confirm = () => {
    const nextProfile = {
      ...profile,
      displayName: profile.displayName.replace(/\s+/g, ' ').trim()
    };

    if (!nextProfile.displayName) {
      setError('Escribe tu nombre para continuar.');
      return;
    }

    writeCustomerProfile(nextProfile);
    onConfirm?.(nextProfile);
    onClose?.();
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-[95] grid place-items-center bg-black/80 p-4 backdrop-blur" role="dialog">
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
              <UserRound className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">{title}</h2>
              <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
            </div>
          </div>
          {onClose ? (
            <button aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/5 text-muted" onClick={onClose} type="button">
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-bold text-muted">Nombre</span>
          <input
            autoFocus
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-base px-4 text-sm text-white outline-none transition placeholder:text-muted focus:border-accent/60"
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                confirm();
              }
            }}
            placeholder="Tu nombre"
            value={profile.displayName}
          />
        </label>
        {error ? <p className="mt-2 text-sm text-red-100">{error}</p> : null}

        <button className="mt-5 h-12 w-full rounded-2xl bg-accent text-sm font-black text-white shadow-glow" onClick={confirm} type="button">
          Confirmar
        </button>
      </div>
    </div>
  );
}
