import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { WaiterCallSheet } from './WaiterCallSheet';

export function WaiterCallButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-accent px-3 text-xs font-bold text-white shadow-glow transition hover:brightness-110"
        onClick={() => setOpen(true)}
        type="button"
      >
        <BellRing className="size-4" />
        <span>Llamar mesero</span>
      </button>
      <WaiterCallSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
