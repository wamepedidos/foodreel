import { Camera } from 'lucide-react';

export function ExperienceEmptyState({ message }: { message: string }) {
  return (
    <section className="grid min-h-[42dvh] place-items-center rounded-[20px] border border-white/10 bg-card p-6 text-center">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/15 text-accent">
          <Camera className="size-7" />
        </div>
        <p className="mt-4 text-sm leading-5 text-muted">{message}</p>
      </div>
    </section>
  );
}
