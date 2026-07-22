import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { WaiterCallSheet } from './WaiterCallSheet';

export function WaiterCallButton({ variant = 'solid' }: { variant?: 'solid' | 'reel' }) {
  const [open, setOpen] = useState(false);
  const reel = variant === 'reel';

  return (
    <>
      <button
        aria-label="Llamar mesero"
        className={
          reel
            ? 'inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-accent/80 bg-transparent px-2.5 text-xs font-normal text-paper transition hover:bg-accent/15'
            : 'inline-flex h-10 items-center gap-2 rounded-2xl bg-accent px-3 text-xs font-bold text-white shadow-glow transition hover:brightness-110'
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        <BellRing className={reel ? 'size-3.5' : 'size-4'} />
        <span>{reel ? 'Mesero' : 'Llamar mesero'}</span>
      </button>
      <WaiterCallSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
