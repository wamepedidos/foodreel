import { Construction } from 'lucide-react';

export function AdminPlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-card p-6 shadow-2xl shadow-black/20">
      <div className="grid size-12 place-items-center rounded-2xl bg-accent/12 text-accent">
        <Construction className="size-6" />
      </div>
      <h2 className="mt-5 text-2xl font-black">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
        Esta opcion queda preparada en la navegacion administrativa, pero no se desarrolla completamente en esta etapa.
      </p>
    </section>
  );
}

